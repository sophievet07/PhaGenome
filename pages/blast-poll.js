// ── BLAST POLL — called repeatedly until results ready ──
// Separated from submit for clean polling architecture

const BLAST_BASE = 'https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi'
const API_KEY    = process.env.NCBI_API_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { rid } = req.query
  if (!rid) return res.status(400).json({ error: 'No RID' })

  try {
    const params = new URLSearchParams({
      CMD: 'Get', RID: rid,
      FORMAT_TYPE: 'JSON2',
      FORMAT_OBJECT: 'Alignment',
      api_key: API_KEY || ''
    })

    const pollRes = await fetch(`${BLAST_BASE}?${params}`, {
      headers: { 'User-Agent': 'PhaGenome/1.0 (ICAR-NMRI; research)' },
      signal: AbortSignal.timeout(30000)
    })

    if (!pollRes.ok) return res.status(200).json({ status: 'waiting' })

    const text = await pollRes.text()

    if (text.includes('Status=WAITING')) return res.status(200).json({ status: 'waiting' })
    if (text.includes('Status=FAILED'))  return res.status(200).json({ status: 'failed' })

    try {
      const json   = JSON.parse(text)
      const search = json?.BlastOutput2?.[0]?.report?.results?.search
      const hits   = search?.hits || []

      const parsed = hits.slice(0, 10).map(hit => {
        const hsp  = hit.hsps?.[0] || {}
        const desc = hit.description?.[0] || {}
        return {
          accession:   desc.accession || '—',
          description: desc.title     || '—',
          identity:    hsp.align_len  ? parseFloat(((hsp.identity/hsp.align_len)*100).toFixed(1)) : 0,
          coverage:    hit.len        ? parseFloat(((hsp.align_len/hit.len)*100).toFixed(1))        : 0,
          evalue:      hsp.evalue != null ? hsp.evalue.toExponential(2) : '—',
          score:       hsp.score || 0,
          taxid:       desc.taxid || null,
          sciname:     desc.sciname || null
        }
      })

      const topDesc  = parsed[0]?.description || ''
      const topIdent = parsed[0]?.identity    || 0

      return res.status(200).json({
        status:   'complete',
        hits:     parsed,
        topHit:   topDesc.replace(/,.*/, '').trim() || 'Novel phage',
        taxonomy: buildTaxonomyString(topDesc),
        ictv:     predictICTV(topDesc, topIdent, search?.query_len || 0),
        database: 'NCBI RefSeq Viruses'
      })
    } catch {
      return res.status(200).json({ status: 'waiting' })
    }
  } catch (err) {
    return res.status(200).json({ status: 'waiting', error: err.message })
  }
}

function buildTaxonomyString(desc) {
  const d = desc.toLowerCase()
  let fam = 'Caudoviricetes'
  if (d.includes('herelleviridae') || d.includes('myovir'))       fam = 'Caudoviricetes > Herelleviridae'
  else if (d.includes('drexlerviridae') || d.includes('siphovir')) fam = 'Caudoviricetes > Drexlerviridae'
  else if (d.includes('autograph') || d.includes('podovir'))       fam = 'Caudoviricetes > Autographiviridae'
  else if (d.includes('demere') || d.includes('p22'))              fam = 'Caudoviricetes > Demerecviridae'
  return `Viruses › Duplodnaviria › Heunggongvirae › Uroviricota › ${fam}`
}

function predictICTV(description, identity, genomeLen) {
  const id = parseFloat(identity) || 0
  let family = 'Undetermined', genus = 'Undetermined', species = 'Novel species'
  const d = (description || '').toLowerCase()

  // Family from known phage names
  if (d.includes('salmonella')) {
    if (genomeLen > 140000)      family = 'Herelleviridae'
    else if (genomeLen > 80000)  family = 'Demerecviridae'
    else if (genomeLen > 40000)  family = 'Drexlerviridae'
    else                         family = 'Autographiviridae'
  }

  // Species demarcation (ICTV 2024)
  if      (id >= 95) species = `${description.replace(/,.*/, '').trim()} (same species, >95% identity)`
  else if (id >= 70) species = 'Novel species in known genus (70–95% identity)'
  else if (id >= 50) species = 'Novel species, possible novel genus (50–70%)'
  else               species = 'Novel species and genus (<50% identity)'

  return {
    realm:      'Duplodnaviria',
    kingdom:    'Heunggongvirae',
    phylum:     'Uroviricota',
    class:      'Caudoviricetes',
    family,
    genus:      id >= 70 ? 'Confirm by VIRIDIC clustering' : 'Novel genus',
    species,
    demarcation: 'ICTV 2024: ANI >95% = same species; VIRIDIC <70% = same genus',
    confidence:  id >= 90 ? 'High' : id >= 70 ? 'Moderate' : 'Low — novel phage'
  }
}
