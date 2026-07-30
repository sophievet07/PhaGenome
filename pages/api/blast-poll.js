// ── BLAST POLL — Vercel Edge Function (NO timeout limit) ──
// Converting to Edge runtime removes the 10s Vercel hobby timeout
// Edge functions run indefinitely and can poll NCBI properly

export const config = { runtime: 'edge' }

const NCBI_BLAST = 'https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi'
const API_KEY    = process.env.NCBI_API_KEY

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const rid = searchParams.get('rid')

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  }

  if (!rid) {
    return new Response(JSON.stringify({ error: 'No RID' }), { status: 400, headers })
  }

  try {
    const params = new URLSearchParams({
      CMD:           'Get',
      RID:           rid,
      FORMAT_TYPE:   'JSON2',
      FORMAT_OBJECT: 'Alignment',
      api_key:       API_KEY || ''
    })

    const res = await fetch(`${NCBI_BLAST}?${params}`, {
      headers: { 'User-Agent': 'PhaGenome/1.0 (ICAR-NMRI; research)' }
    })

    if (res.status === 304) {
      return new Response(JSON.stringify({ status: 'waiting', reason: '304-not-modified' }), { headers })
    }
    if (!res.ok) {
      return new Response(JSON.stringify({ status: 'waiting', code: res.status }), { headers })
    }

    const text = await res.text()

    if (text.includes('Status=WAITING')) {
      return new Response(JSON.stringify({ status: 'waiting' }), { headers })
    }
    if (text.includes('Status=FAILED') || text.includes('Status=UNKNOWN')) {
      return new Response(JSON.stringify({ status: 'failed' }), { headers })
    }

    try {
      const json   = JSON.parse(text)
      const search = json?.BlastOutput2?.[0]?.report?.results?.search
      const raw    = search?.hits || []

      if (raw.length === 0) {
        return new Response(JSON.stringify({
          status: 'complete', hits: [],
          topHit: 'Novel phage — no significant BLAST hits',
          taxonomy: 'Viruses › Duplodnaviria › Heunggongvirae › Uroviricota › Caudoviricetes',
          ictv: buildICTV('', 0, search?.query_len || 0),
          database: 'NCBI RefSeq Viruses'
        }), { headers })
      }

      const hits = raw.slice(0, 15).map(hit => {
        const hsp  = hit.hsps?.[0] || {}
        const desc = hit.description?.[0] || {}
        return {
          accession:   desc.accession || '—',
          description: desc.title     || '—',
          sciname:     desc.sciname   || null,
          identity:    hsp.align_len > 0 ? parseFloat(((hsp.identity/hsp.align_len)*100).toFixed(1)) : 0,
          coverage:    hit.len > 0       ? parseFloat(((hsp.align_len/hit.len)*100).toFixed(1))       : 0,
          evalue:      hsp.evalue != null ? hsp.evalue.toExponential(2) : '—',
          score:       hsp.score  || 0
        }
      })

      const top = hits[0]
      return new Response(JSON.stringify({
        status:   'complete',
        hits,
        topHit:   top?.description?.replace(/,.*/, '').trim() || 'Novel phage',
        taxonomy: buildTaxonomy(top?.description, top?.identity),
        ictv:     buildICTV(top?.description, top?.identity, search?.query_len || 0),
        database: 'NCBI RefSeq Viruses',
        engine:   'ncbi-edge'
      }), { headers })

    } catch(e) {
      return new Response(JSON.stringify({ status: 'waiting', parseError: true }), { headers })
    }

  } catch(err) {
    return new Response(JSON.stringify({ status: 'waiting', error: err.message }), { headers })
  }
}

function buildTaxonomy(desc, identity) {
  const d = (desc||'').toLowerCase()
  let fam = 'Caudoviricetes'
  if      (d.includes('herelleviridae'))  fam = 'Caudoviricetes › Herelleviridae'
  else if (d.includes('drexlerviridae'))  fam = 'Caudoviricetes › Drexlerviridae'
  else if (d.includes('demerecviridae'))  fam = 'Caudoviricetes › Demerecviridae'
  else if (d.includes('autograph'))       fam = 'Caudoviricetes › Autographiviridae'
  else if (d.includes('salmonella'))      fam = 'Caudoviricetes › Demerecviridae (probable)'
  return `Viruses › Duplodnaviria › Heunggongvirae › Uroviricota › ${fam}`
}

function buildICTV(desc, identity, genomeLen) {
  const d  = (desc||'').toLowerCase()
  const id = parseFloat(identity) || 0
  let family = 'Undetermined', genus = 'Novel genus'
  if      (d.includes('demerecviridae'))  family = 'Demerecviridae'
  else if (d.includes('drexlerviridae'))  family = 'Drexlerviridae'
  else if (d.includes('herelleviridae'))  family = 'Herelleviridae'
  else if (d.includes('autograph'))       family = 'Autographiviridae'
  else if (d.includes('salmonella')) {
    if      (genomeLen > 140000) family = 'Herelleviridae'
    else if (genomeLen > 80000)  family = 'Demerecviridae'
    else if (genomeLen > 40000)  family = 'Drexlerviridae'
    else                         family = 'Autographiviridae'
  }
  const GENUS_MAP = { 'phi68':'Jerseyvirus','se2':'Jerseyvirus','ssyf':'Jerseyvirus','phb14':'Jerseyvirus','vb_sens':'Jerseyvirus','p22':'Jerseylikevirus','lambda':'Lambdalikevirus','t4':'Tequatrovirus' }
  for (const [k,g] of Object.entries(GENUS_MAP)) { if(d.includes(k)){genus=g;break} }
  let species='Novel species', confidence='Low'
  if      (id>=95) { species=desc?.split(',')[0]?.trim()||'Known species'; confidence='High (>95% identity = same species, ICTV 2024)' }
  else if (id>=70) { species=`Novel species in genus ${genus}`; confidence='Moderate' }
  else if (id>=50) { species='Novel species, possible novel genus'; confidence='Low' }
  else             { species='Novel species and likely novel genus'; confidence='Very low — novel phage' }
  return {
    realm:'Duplodnaviria', kingdom:'Heunggongvirae', phylum:'Uroviricota', class:'Caudoviricetes',
    family, genus, species, confidence,
    morphology: genomeLen>140000?'Myovirus (predicted)':'Siphovirus (predicted)',
    demarcation: 'ICTV 2024: ANI >95% = same species; VIRIDIC >70% = same genus'
  }
}
