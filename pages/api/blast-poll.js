// ── BLAST POLL — handles NCBI polling correctly ──
// 304 = Not Modified = still running (not an error)
// 200 with Status=WAITING = still running
// 200 with results = complete

const BLAST_BASE = 'https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi'
const API_KEY    = process.env.NCBI_API_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { rid } = req.query
  if (!rid) return res.status(400).json({ error: 'No RID provided' })

  try {
    const params = new URLSearchParams({
      CMD:           'Get',
      RID:           rid,
      FORMAT_TYPE:   'JSON2',
      FORMAT_OBJECT: 'Alignment',
      api_key:       API_KEY || ''
    })

    // Important: use redirect:'follow' to handle any redirects
    const pollRes = await fetch(`${BLAST_BASE}?${params}`, {
      method:  'GET',
      headers: {
        'User-Agent': 'PhaGenome/1.0 (ICAR-NMRI; research)',
        'Accept':     'application/json, text/plain, */*'
      },
      redirect: 'follow',
      signal:   AbortSignal.timeout(30000)
    })

    // 304 = still running — return waiting status
    if (pollRes.status === 304) {
      return res.status(200).json({ status: 'waiting', code: 304, message: 'NCBI still processing' })
    }

    if (!pollRes.ok) {
      return res.status(200).json({ status: 'waiting', code: pollRes.status })
    }

    const text = await pollRes.text()

    // Check status strings
    if (text.includes('Status=WAITING') || text.includes('"status":"WAITING"')) {
      return res.status(200).json({ status: 'waiting', message: 'NCBI BLAST still running' })
    }
    if (text.includes('Status=FAILED') || text.includes('"status":"FAILED"')) {
      return res.status(200).json({ status: 'failed', message: 'BLAST job failed on NCBI' })
    }
    if (text.includes('Status=UNKNOWN')) {
      return res.status(200).json({ status: 'failed', message: 'RID expired or unknown' })
    }

    // Try to parse JSON results
    try {
      const json   = JSON.parse(text)
      const search = json?.BlastOutput2?.[0]?.report?.results?.search
      const rawHits = search?.hits || []

      if (rawHits.length === 0) {
        // Check if this means no hits or still running
        if (text.includes('"hits":[]') || text.includes('"hits": []')) {
          return res.status(200).json({
            status:   'complete',
            hits:     [],
            topHit:   'No close relatives found — novel phage',
            taxonomy: 'Viruses › Duplodnaviria › Heunggongvirae › Uroviricota › Caudoviricetes',
            ictv:     novelPhageICTV(search?.query_len || 87534),
            database: 'NCBI RefSeq Viruses',
            message:  'No significant similarity found — this appears to be a novel phage'
          })
        }
        return res.status(200).json({ status: 'waiting' })
      }

      // Parse hits
      const hits = rawHits.slice(0, 15).map(hit => {
        const hsp  = hit.hsps?.[0] || {}
        const desc = hit.description?.[0] || {}
        const identPct = hsp.align_len > 0 ? parseFloat(((hsp.identity / hsp.align_len) * 100).toFixed(1)) : 0
        const covPct   = hit.len > 0        ? parseFloat(((hsp.align_len / hit.len) * 100).toFixed(1))       : 0
        return {
          accession:   desc.accession || '—',
          description: desc.title     || '—',
          sciname:     desc.sciname   || null,
          identity:    identPct,
          coverage:    covPct,
          evalue:      hsp.evalue != null ? hsp.evalue.toExponential(2) : '—',
          score:       hsp.score  || 0,
          length:      hit.len    || 0
        }
      })

      const top = hits[0]
      const taxonomy = buildTaxonomy(top?.description, top?.identity)
      const ictv     = buildICTV(top?.description, top?.identity, search?.query_len || 0)
      const topHit   = top?.description?.replace(/,.*/, '').trim() || 'Novel phage'

      return res.status(200).json({
        status:   'complete',
        hits,
        topHit,
        taxonomy,
        ictv,
        queryLen: search?.query_len,
        database: 'NCBI RefSeq Viruses',
        engine:   'ncbi'
      })

    } catch(parseErr) {
      // JSON parse failed — likely still waiting
      if (text.includes('BLAST') && text.length < 5000) {
        return res.status(200).json({ status: 'waiting', message: 'Waiting for NCBI results' })
      }
      return res.status(200).json({ status: 'waiting' })
    }

  } catch (err) {
    console.error('blast-poll error:', err.message)
    return res.status(200).json({ status: 'waiting', error: err.message })
  }
}

// ── TAXONOMY STRING ──
function buildTaxonomy(desc, identity) {
  const d = (desc || '').toLowerCase()
  let family = 'Caudoviricetes'
  if      (d.includes('herelleviridae'))  family = 'Caudoviricetes › Herelleviridae'
  else if (d.includes('drexlerviridae'))  family = 'Caudoviricetes › Drexlerviridae'
  else if (d.includes('demerecviridae'))  family = 'Caudoviricetes › Demerecviridae'
  else if (d.includes('autograph'))       family = 'Caudoviricetes › Autographiviridae'
  else if (d.includes('salmonella'))      family = 'Caudoviricetes › Demerecviridae (probable)'
  else if (d.includes('escherichia') || d.includes('coli')) family = 'Caudoviricetes › Drexlerviridae (probable)'
  return `Viruses › Duplodnaviria › Heunggongvirae › Uroviricota › ${family}`
}

// ── ICTV 2024 CLASSIFICATION ──
function buildICTV(desc, identity, genomeLen) {
  const d  = (desc || '').toLowerCase()
  const id = parseFloat(identity) || 0

  // Determine family
  let family = 'Undetermined', genus = 'Novel genus'

  if      (d.includes('demerecviridae'))  { family = 'Demerecviridae' }
  else if (d.includes('drexlerviridae'))  { family = 'Drexlerviridae' }
  else if (d.includes('herelleviridae'))  { family = 'Herelleviridae' }
  else if (d.includes('autograph'))       { family = 'Autographiviridae' }
  else if (d.includes('salmonella')) {
    if      (genomeLen > 140000) family = 'Herelleviridae'
    else if (genomeLen > 80000)  family = 'Demerecviridae'
    else if (genomeLen > 40000)  family = 'Drexlerviridae'
    else                         family = 'Autographiviridae'
  }

  // Determine genus from known phage names
  const GENUS_MAP = {
    'jerseyvirus':    'Jerseyvirus',
    'phi68':          'Jerseyvirus',
    'se2':            'Jerseyvirus',
    'ssyf':           'Jerseyvirus',
    'phb14':          'Jerseyvirus',
    'epsilon34':      'Jerseylikevirus',
    'p22':            'Jerseylikevirus',
    'gifsy':          'Lambdalikevirus',
    'lambda':         'Lambdalikevirus',
    'gifsy-1':        'Lambdalikevirus',
    't4':             'Tequatrovirus',
    'phieco32':       'Kayfunavirus',
    'sp6':            'Sp6virus',
    'vb_sens':        'Jerseyvirus',
    'salmonella phage se': 'Jerseyvirus',
  }
  for (const [key, g] of Object.entries(GENUS_MAP)) {
    if (d.includes(key)) { genus = g; break }
  }

  // Species demarcation per ICTV 2024
  let species = 'Novel species', confidence = 'Low', morphology = 'Siphovirus (predicted)'
  if      (id >= 95) { species = desc?.split(',')[0]?.trim() || 'Known species'; confidence = 'High — same species (>95% identity, ICTV)' }
  else if (id >= 70) { species = `Novel species in genus ${genus} (70–95% identity)`; confidence = 'Moderate' }
  else if (id >= 50) { species = 'Novel species, possible novel genus (50–70%)'; confidence = 'Low' }
  else               { species = 'Novel species and likely novel genus (<50%)'; confidence = 'Very low — novel phage' }

  if (genomeLen > 140000) morphology = 'Myovirus (contractile tail — predicted from genome size)'
  else if (genomeLen > 80000) morphology = 'Siphovirus (long non-contractile tail — predicted)'
  else if (genomeLen < 45000) morphology = 'Podovirus (short non-contractile tail — predicted)'

  return {
    realm: 'Duplodnaviria', kingdom: 'Heunggongvirae',
    phylum: 'Uroviricota', class: 'Caudoviricetes',
    family, genus, species, morphology, confidence,
    demarcation: 'ICTV 2024: ANI >95% same species; VIRIDIC >70% same genus'
  }
}

function novelPhageICTV(genomeLen) {
  let family = 'Undetermined'
  if      (genomeLen > 140000) family = 'Herelleviridae (probable)'
  else if (genomeLen > 80000)  family = 'Demerecviridae (probable)'
  else if (genomeLen > 40000)  family = 'Drexlerviridae (probable)'
  else                         family = 'Autographiviridae (probable)'
  return {
    realm: 'Duplodnaviria', kingdom: 'Heunggongvirae',
    phylum: 'Uroviricota', class: 'Caudoviricetes',
    family, genus: 'Novel genus (VIRIDIC required)',
    species: 'Novel species — no close NCBI relatives',
    morphology: 'Siphovirus (predicted from genome size)',
    confidence: 'Low — novel phage with no close database relatives',
    demarcation: 'ICTV 2024: ANI >95% same species; VIRIDIC >70% same genus'
  }
}
