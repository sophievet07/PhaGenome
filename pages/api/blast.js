// ── PhaGenome BLAST API ──
// Layer 1: EBI BLAST — European mirror, same databases, faster queue
// Layer 2: NCBI BLAST — primary database
// Both return RID/jobId for async polling

const NCBI_BLAST = 'https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi'
const EBI_BLAST  = 'https://www.ebi.ac.uk/Tools/services/rest/ncbiblast'
const DDBJ_BLAST = 'https://ddbj.nig.ac.jp/search/blast'
const NCBI_KEY   = process.env.NCBI_API_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const { sequence, header, action, rid, ebiJobId } = req.body

  // ── POLL EBI ──
  if (action === 'poll_ebi' && ebiJobId) {
    return pollEBI(ebiJobId, res)
  }

  // ── SUBMIT — EBI first (faster), then NCBI ──
  if (!sequence) return res.status(400).json({ error: 'No sequence provided' })
  const query = sequence.substring(0, 8000)

  // Try EBI BLAST first — often faster than NCBI
  try {
    const ebi = await submitEBI(query, header)
    if (ebi.jobId) {
      console.log('EBI BLAST submitted:', ebi.jobId)
      return res.status(200).json({ success:true, engine:'ebi', ebiJobId:ebi.jobId, estimatedTime:60 })
    }
  } catch(e) {
    console.warn('EBI failed:', e.message)
  }

  // Try NCBI BLAST
  try {
    const ncbi = await submitNCBI(query)
    if (ncbi.rid) {
      console.log('NCBI BLAST submitted:', ncbi.rid)
      return res.status(200).json({ success:true, engine:'ncbi', rid:ncbi.rid, estimatedTime:ncbi.rtoe||25 })
    }
  } catch(e) {
    console.warn('NCBI failed:', e.message)
  }

  return res.status(200).json({ success:false, fallback:true, error:'All BLAST engines unavailable' })
}

// ── EBI BLAST SUBMIT ──
async function submitEBI(sequence, header) {
  const body = new URLSearchParams({
    email:      'phagenome@icar.gov.in',
    program:    'blastn',
    database:   'em_rel_vrl',  // EMBL Release Viral sequences
    sequence,
    stype:      'dna',
    exp:        '1e-10',
    scores:     '20',
    alignments: '20',
    format:     'json',
    title:      (header||'phage').substring(0,50)
  })

  const res = await fetch(`${EBI_BLAST}/run`, {
    method:  'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded', 'User-Agent':'PhaGenome/1.0 (ICAR-NMRI)' },
    body:    body.toString(),
    signal:  AbortSignal.timeout(30000)
  })

  if (!res.ok) throw new Error(`EBI submit: ${res.status} ${await res.text().catch(()=>'')}`)
  const jobId = (await res.text()).trim()
  if (!jobId || jobId.includes('<')) throw new Error('Invalid EBI job ID')
  return { jobId }
}

// ── EBI BLAST POLL ──
async function pollEBI(jobId, res) {
  try {
    // Check status
    const statusRes = await fetch(`${EBI_BLAST}/status/${jobId}`, {
      headers: { 'User-Agent':'PhaGenome/1.0' },
      signal:  AbortSignal.timeout(8000)
    })
    const status = (await statusRes.text()).trim()

    if (status === 'RUNNING' || status === 'PENDING' || status === 'QUEUED') {
      return res.status(200).json({ status:'waiting', engine:'ebi', ebiStatus:status })
    }
    if (status !== 'FINISHED') {
      return res.status(200).json({ status:'failed', engine:'ebi', ebiStatus:status })
    }

    // Get JSON results
    const resultRes = await fetch(`${EBI_BLAST}/result/${jobId}/json`, {
      headers: { 'User-Agent':'PhaGenome/1.0' },
      signal:  AbortSignal.timeout(8000)
    })
    if (!resultRes.ok) return res.status(200).json({ status:'waiting', engine:'ebi' })

    const data = await resultRes.json()
    const hits = parseEBIResults(data)
    const top  = hits[0]

    return res.status(200).json({
      status:   'complete', engine: 'ebi', hits,
      topHit:   top?.description?.replace(/,.*/, '').trim() || 'Novel phage',
      taxonomy: buildTaxonomy(top?.description, top?.identity),
      ictv:     buildICTV(top?.description, top?.identity, 0),
      database: 'EMBL Release Viral (EBI BLAST)'
    })
  } catch(e) {
    return res.status(200).json({ status:'waiting', engine:'ebi', error:e.message })
  }
}

// ── NCBI BLAST SUBMIT ──
async function submitNCBI(sequence) {
  const params = new URLSearchParams({
    CMD:'Put', PROGRAM:'blastn',
    DATABASE:'refseq_viruses',
    QUERY:sequence,
    FORMAT_TYPE:'JSON2',
    HITLIST_SIZE:'20',
    EXPECT:'1e-10',
    MEGABLAST:'on',
    WORD_SIZE:'28',
    api_key: NCBI_KEY||''
  })

  const res = await fetch(NCBI_BLAST, {
    method:  'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded', 'User-Agent':'PhaGenome/1.0 (ICAR-NMRI)' },
    body:    params.toString(),
    signal:  AbortSignal.timeout(35000)
  })

  if (!res.ok) throw new Error(`NCBI submit: ${res.status}`)
  const text = await res.text()
  const rid  = text.match(/RID = (\w+)/)?.[1]
  const rtoe = parseInt(text.match(/RTOE = (\d+)/)?.[1]||'25')
  if (!rid) throw new Error('No RID from NCBI')
  return { rid, rtoe }
}

// ── EBI RESULT PARSER ──
function parseEBIResults(data) {
  // EBI returns different JSON structure
  const hits = data?.hits || data?.BlastOutput2?.[0]?.report?.results?.search?.hits || []
  return hits.slice(0,15).map(h => {
    // Handle both EBI and NCBI JSON formats
    if (h.description) {
      // NCBI format embedded in EBI response
      const hsp = h.hsps?.[0]||{}
      const d   = h.description?.[0]||{}
      return {
        accession:   d.accession||h.id||'—',
        description: d.title||h.description||'—',
        identity:    hsp.align_len>0 ? parseFloat(((hsp.identity/hsp.align_len)*100).toFixed(1)) : parseFloat((h.alignments?.[0]?.identity||0).toFixed(1)),
        coverage:    h.len>0 ? parseFloat(((hsp.align_len/h.len)*100).toFixed(1)) : parseFloat((h.alignments?.[0]?.coverage||0).toFixed(1)),
        evalue:      hsp.evalue!=null ? hsp.evalue.toExponential(2) : h.alignments?.[0]?.expectation||'—',
        score:       hsp.score||h.alignments?.[0]?.score||0
      }
    }
    return {
      accession:   h.id||'—',
      description: h.def||h.description||'—',
      identity:    parseFloat((h.alignments?.[0]?.identity||0).toFixed(1)),
      coverage:    parseFloat((h.alignments?.[0]?.coverage||0).toFixed(1)),
      evalue:      h.alignments?.[0]?.expectation||'—',
      score:       h.alignments?.[0]?.score||0
    }
  })
}

function buildTaxonomy(desc, identity) {
  const d=(desc||'').toLowerCase()
  let fam='Caudoviricetes'
  if      (d.includes('herelleviridae'))  fam='Caudoviricetes › Herelleviridae'
  else if (d.includes('drexlerviridae'))  fam='Caudoviricetes › Drexlerviridae'
  else if (d.includes('demerecviridae'))  fam='Caudoviricetes › Demerecviridae'
  else if (d.includes('autograph'))       fam='Caudoviricetes › Autographiviridae'
  else if (d.includes('salmonella'))      fam='Caudoviricetes › Demerecviridae (probable)'
  return `Viruses › Duplodnaviria › Heunggongvirae › Uroviricota › ${fam}`
}

function buildICTV(desc, identity, genomeLen) {
  const d=(desc||'').toLowerCase(), id=parseFloat(identity)||0
  let family='Undetermined', genus='Novel genus'
  if      (d.includes('demerecviridae'))  family='Demerecviridae'
  else if (d.includes('drexlerviridae'))  family='Drexlerviridae'
  else if (d.includes('herelleviridae'))  family='Herelleviridae'
  else if (d.includes('autograph'))       family='Autographiviridae'
  else if (d.includes('salmonella')) {
    if      (genomeLen>140000) family='Herelleviridae'
    else if (genomeLen>80000)  family='Demerecviridae'
    else if (genomeLen>40000)  family='Drexlerviridae'
    else                       family='Autographiviridae'
  }
  const GM={'phi68':'Jerseyvirus','se2':'Jerseyvirus','ssyf':'Jerseyvirus','p22':'Jerseylikevirus','lambda':'Lambdalikevirus','t4':'Tequatrovirus'}
  for(const[k,g] of Object.entries(GM)){if(d.includes(k)){genus=g;break}}
  let species='Novel species',confidence='Low'
  if      (id>=95){species=desc?.split(',')[0]?.trim()||'Known species';confidence='High (>95% = same species, ICTV)'}
  else if (id>=70){species=`Novel species in genus ${genus}`;confidence='Moderate'}
  else if (id>=50){species='Novel species, possible novel genus';confidence='Low'}
  else            {species='Novel species and likely novel genus';confidence='Very low'}
  return { realm:'Duplodnaviria',kingdom:'Heunggongvirae',phylum:'Uroviricota',class:'Caudoviricetes',family,genus,species,confidence,demarcation:'ICTV 2024: ANI >95% = same species; VIRIDIC >70% = same genus' }
}
