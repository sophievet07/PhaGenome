// ── DIRECT NCBI BLAST POLLER ──
// Polls NCBI directly from browser — no Vercel function timeout issue
// NCBI polling requires no API key — safe to call from browser

const NCBI_BLAST_URL = 'https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi'

// ── SUBMIT via Vercel (hides API key) ──
export async function submitBLAST(sequence, header) {
  const res = await fetch('/api/blast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence, header }),
    signal: AbortSignal.timeout(40000)
  })
  if (!res.ok) throw new Error(`Submit failed: ${res.status}`)
  return await res.json()
}

// ── POLL directly from browser (no timeout issue) ──
export async function pollBLAST(rid, onUpdate, maxAttempts = 80) {
  // Initial wait — NCBI needs time to start processing
  await delay(45000)

  for (let i = 1; i <= maxAttempts; i++) {
    if (i > 1) await delay(12000)

    onUpdate('blast', 'running',
      `Retrieving BLAST results from NCBI · attempt ${i}/${maxAttempts} · elapsed: ${Math.round((45 + i*12)/60)} min...`)

    try {
      // Direct browser fetch to NCBI — no server middleman
      const params = new URLSearchParams({
        CMD:           'Get',
        RID:           rid,
        FORMAT_TYPE:   'JSON2',
        FORMAT_OBJECT: 'Alignment'
        // No API key needed for polling — only for submission
      })

      const res = await fetch(`${NCBI_BLAST_URL}?${params}`, {
        method:  'GET',
        headers: { 'Accept': 'application/json, text/plain, */*' },
        signal:  AbortSignal.timeout(30000)
      })

      // 304 = still processing
      if (res.status === 304) continue

      if (!res.ok) continue

      const text = await res.text()

      if (text.includes('Status=WAITING')) continue
      if (text.includes('Status=FAILED'))  return { status: 'failed' }
      if (text.includes('Status=UNKNOWN')) return { status: 'failed' }

      // Try parse results
      try {
        const json   = JSON.parse(text)
        const search = json?.BlastOutput2?.[0]?.report?.results?.search
        const raw    = search?.hits || []

        if (raw.length === 0 && text.includes('"hits"')) {
          return buildNoHitsResult(search?.query_len || 0)
        }

        if (raw.length > 0) {
          return parseNCBIResults(raw, search?.query_len || 0)
        }

      } catch(e) {
        // JSON parse failed — still waiting
        continue
      }

    } catch(e) {
      // Network error — continue polling
      console.warn(`Poll attempt ${i} error:`, e.message)
      continue
    }
  }

  return { status: 'timeout', hits: [], topHit: 'BLAST timed out — try submitting manually at blast.ncbi.nlm.nih.gov' }
}

// ── PARSE NCBI JSON RESULTS ──
function parseNCBIResults(rawHits, queryLen) {
  const hits = rawHits.slice(0, 15).map(hit => {
    const hsp  = hit.hsps?.[0] || {}
    const desc = hit.description?.[0] || {}
    return {
      accession:   desc.accession || '—',
      description: desc.title     || '—',
      sciname:     desc.sciname   || null,
      taxid:       desc.taxid     || null,
      identity:    hsp.align_len > 0 ? parseFloat(((hsp.identity/hsp.align_len)*100).toFixed(1)) : 0,
      coverage:    hit.len > 0       ? parseFloat(((hsp.align_len/hit.len)*100).toFixed(1))       : 0,
      evalue:      hsp.evalue != null ? hsp.evalue.toExponential(2) : '—',
      score:       hsp.score  || 0,
      hitLen:      hit.len    || 0
    }
  })

  const top      = hits[0]
  const taxonomy = buildTaxonomyString(top?.description, top?.identity)
  const ictv     = buildICTVClassification(top?.description, top?.identity, queryLen)

  return {
    status:   'complete',
    hits,
    topHit:   top?.description?.replace(/,.*/, '').trim() || 'Novel phage',
    taxonomy,
    ictv,
    queryLen,
    database: 'NCBI RefSeq Viruses',
    engine:   'ncbi-direct'
  }
}

function buildNoHitsResult(queryLen) {
  return {
    status:   'complete',
    hits:     [],
    topHit:   'Novel phage — no significant BLAST hits',
    taxonomy: 'Viruses › Duplodnaviria › Heunggongvirae › Uroviricota › Caudoviricetes',
    ictv:     buildICTVClassification('', 0, queryLen),
    database: 'NCBI RefSeq Viruses',
    message:  'No significant hits — this is likely a novel phage species'
  }
}

// ── TAXONOMY STRING ──
function buildTaxonomyString(desc, identity) {
  const d = (desc || '').toLowerCase()
  let family = 'Caudoviricetes'
  if      (d.includes('herelleviridae'))  family = 'Caudoviricetes › Herelleviridae'
  else if (d.includes('drexlerviridae'))  family = 'Caudoviricetes › Drexlerviridae'
  else if (d.includes('demerecviridae'))  family = 'Caudoviricetes › Demerecviridae'
  else if (d.includes('autograph'))       family = 'Caudoviricetes › Autographiviridae'
  else if (d.includes('salmonella'))      family = 'Caudoviricetes › Demerecviridae (probable)'
  else if (d.includes('ecoli') || d.includes('escherichia')) family = 'Caudoviricetes › Drexlerviridae (probable)'
  else if (d.includes('staphylococcus') || d.includes('staph')) family = 'Caudoviricetes › Herelleviridae (probable)'
  return `Viruses › Duplodnaviria › Heunggongvirae › Uroviricota › ${family}`
}

// ── ICTV 2024 CLASSIFICATION ──
function buildICTVClassification(desc, identity, genomeLen) {
  const d  = (desc || '').toLowerCase()
  const id = parseFloat(identity) || 0

  // Family determination
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

  // Genus from known phage names
  const GENUS_MAP = {
    'jerseyvirus': 'Jerseyvirus', 'phi68': 'Jerseyvirus',
    'se2': 'Jerseyvirus', 'ssyf': 'Jerseyvirus', 'phb14': 'Jerseyvirus',
    'vb_sens': 'Jerseyvirus', 'epsilon34': 'Jerseylikevirus',
    'p22': 'Jerseylikevirus', 'gifsy': 'Lambdalikevirus',
    'lambda': 'Lambdalikevirus', 't4': 'Tequatrovirus',
    'sp6': 'Sp6virus', 'phieco32': 'Kayfunavirus',
    'twort': 'Twortvirus', 'k': 'Kayvirus',
  }
  for (const [key, g] of Object.entries(GENUS_MAP)) {
    if (d.includes(key)) { genus = g; break }
  }

  // Morphology from size
  let morphology = 'Siphovirus (non-contractile tail — predicted)'
  if      (genomeLen > 140000) morphology = 'Myovirus (contractile tail — predicted from large genome)'
  else if (genomeLen < 45000)  morphology = 'Podovirus (short non-contractile tail — predicted)'

  // Species demarcation per ICTV 2024
  let species = 'Novel species', confidence = 'Low'
  if      (id >= 95) { species = desc?.split(',')[0]?.trim() || 'Known species'; confidence = 'High — same species (>95% nt identity, ICTV 2024)' }
  else if (id >= 70) { species = `Novel species in genus ${genus} (70–95% identity)`; confidence = 'Moderate' }
  else if (id >= 50) { species = 'Novel species, possible novel genus (50–70%)'; confidence = 'Low' }
  else if (id > 0)   { species = 'Novel species and likely novel genus (<50%)'; confidence = 'Very low — novel phage' }
  else               { species = 'Novel species — no BLAST hits detected'; confidence = 'Indeterminate — requires VIRIDIC analysis' }

  return {
    realm: 'Duplodnaviria', kingdom: 'Heunggongvirae',
    phylum: 'Uroviricota', class: 'Caudoviricetes',
    family, genus, species, morphology, confidence,
    demarcation: 'ICTV 2024: ANI >95% = same species; VIRIDIC >70% = same genus'
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }
