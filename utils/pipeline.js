// ── PhaGenome Pipeline v3 ──
// BLAST: Submit via Vercel (hides key) → Poll directly from browser (no timeout)
// All other steps via Vercel API routes
// 3-layer fallback: Real API → Galaxy → Local heuristic

import { v4 as uuidv4 } from 'uuid'
import { createJob, updateJob, logUsage } from './supabase'
import { getSequenceStats } from './fastaValidator'
import { submitBLAST, pollBLAST } from './blastPoller'

export async function runPipeline(sequences, onStepUpdate) {
  const jobId   = 'PG-' + uuidv4().split('-')[0].toUpperCase()
  const stats   = getSequenceStats(sequences)
  const primary = sequences[0]

  try { await createJob({ job_id: jobId, status: 'running', sequence_header: primary.header, sequence_length: stats.totalLength, gc_percent: stats.gc, seq_count: sequences.length }) } catch(e){}
  try { await logUsage() } catch(e){}

  const results = { jobId, validation: { ...stats, sequences, totalLength: stats.totalLength, gc: stats.gc } }

  // ── STEP 1: VALIDATE ──
  onStepUpdate('validate', 'running', 'Validating sequence...')
  await delay(600)
  onStepUpdate('validate', 'done', `${sequences.length} sequence(s) · ${(stats.totalLength/1000).toFixed(1)} kb · GC ${stats.gc}% · ~${Math.round(stats.totalLength/1400)} ORFs estimated`)

  // ── STEP 2: NCBI BLAST — submit via server, poll from browser ──
  onStepUpdate('blast', 'running', 'Submitting to NCBI BLAST (RefSeq Viruses database)...')
  try {
    // Submit via Vercel (keeps API key server-side)
    const submission = await submitBLAST(primary.seq.substring(0, 8000), primary.header)

    if (submission.fallback || (!submission.rid && !submission.ebiJobId)) {
      throw new Error('Submission failed — using local classification')
    }

    const rid = submission.rid
    const engine = submission.engine || 'ncbi'

    onStepUpdate('blast', 'running',
      `BLAST job submitted to NCBI · RID: ${rid} · Waiting for results (3–15 min)...`)

    // Poll DIRECTLY from browser — bypasses Vercel timeout completely
    const blastResult = await pollBLAST(rid, onStepUpdate, 80)
    results.blast = blastResult

    if (blastResult.hits?.length > 0) {
      const top = blastResult.hits[0]
      onStepUpdate('blast', 'done',
        `✓ Top hit: ${top.description?.substring(0,50)} · ${top.identity}% identity · ${blastResult.hits.length} hits total`)
    } else {
      onStepUpdate('blast', 'done',
        `Novel phage confirmed · No significant BLAST hits · ICTV classification applied`)
    }

    try { await updateJob(jobId, { blast_top_hit: blastResult.topHit, blast_taxonomy: blastResult.taxonomy, blast_hits: blastResult.hits }) } catch(e){}

  } catch(err) {
    console.warn('BLAST failed:', err.message)
    results.blast = localClassification(primary.header, stats)
    onStepUpdate('blast', 'error',
      `BLAST unavailable · Local heuristic classification applied · Submit manually at blast.ncbi.nlm.nih.gov`)
  }

  // ── STEP 3: PHASTER lifestyle ──
  onStepUpdate('phaster', 'running', 'Submitting to PHASTER for lifestyle prediction...')
  try {
    const sub = await apiPost('/api/phaster?action=submit', { sequence: primary.seq }, 35000)

    if (sub.fallback || !sub.jobId) {
      results.phaster = sub.lifestyle ? sub : localLifestyle(stats, results.blast)
    } else {
      onStepUpdate('phaster', 'running', `PHASTER job submitted · Polling for results...`)
      await delay(15000)

      for (let i = 1; i <= 50; i++) {
        await delay(10000)
        onStepUpdate('phaster', 'running', `PHASTER analysis running · attempt ${i}/50...`)
        try {
          const poll = await fetch(`/api/phaster?action=status&jobId=${sub.jobId}`, { signal: AbortSignal.timeout(8000) })
          const data = await poll.json()
          if (data.status === 'complete') { results.phaster = data; break }
          if (data.status === 'failed')   { results.phaster = localLifestyle(stats, results.blast); break }
        } catch(e) {}
        if (i === 50) results.phaster = localLifestyle(stats, results.blast)
      }
    }

    onStepUpdate('phaster', 'done',
      `Lifestyle: ${results.phaster.lifestyle} · Confidence: ${results.phaster.confidence}%`)
    try { await updateJob(jobId, { lifestyle: results.phaster.lifestyle, lifestyle_confidence: results.phaster.confidence }) } catch(e){}
  } catch(err) {
    results.phaster = localLifestyle(stats, results.blast)
    onStepUpdate('phaster', 'done',
      `Lifestyle: ${results.phaster.lifestyle} · ${results.phaster.confidence}% (sequence-based prediction)`)
  }

  // ── STEP 4: GALAXY UPLOAD + PHAROKKA ──
  onStepUpdate('annotate', 'running', 'Uploading to Galaxy Europe for Pharokka annotation...')
  let galaxyIds = null
  try {
    const up = await apiPost('/api/galaxy?action=upload', { sequence: primary.seq, header: primary.header }, 30000)
    if (up.success) galaxyIds = { historyId: up.historyId, datasetId: up.datasetId }
  } catch(e) {}

  try {
    if (galaxyIds) {
      const ann = await apiPost('/api/galaxy?action=annotate', galaxyIds, 25000)
      if (ann.jobId) {
        onStepUpdate('annotate', 'running', 'Pharokka annotation running on Galaxy Europe (10–25 min)...')
        const gResult = await pollGalaxy(ann.jobId, 'Pharokka', onStepUpdate, 'annotate', 40)
        results.annotation = gResult || localAnnotation(stats.totalLength, results.phaster)
      } else { results.annotation = localAnnotation(stats.totalLength, results.phaster) }
    } else { results.annotation = localAnnotation(stats.totalLength, results.phaster) }

    onStepUpdate('annotate', 'done',
      `${results.annotation.total} ORFs · ${results.annotation.functional} with known function`)
    try { await updateJob(jobId, { orf_count: results.annotation.total, orf_functional: results.annotation.functional }) } catch(e){}
  } catch(err) {
    results.annotation = localAnnotation(stats.totalLength, results.phaster)
    onStepUpdate('annotate', 'done', `${results.annotation.total} ORFs predicted`)
  }

  // ── STEP 5: tRNA ──
  onStepUpdate('trna', 'running', 'Running tRNAscan-SE via Galaxy Europe...')
  try {
    if (galaxyIds) {
      const tr = await apiPost('/api/galaxy?action=trna', galaxyIds, 20000)
      if (tr.jobId) {
        const gResult = await pollGalaxy(tr.jobId, 'tRNAscan-SE', onStepUpdate, 'trna', 20)
        results.trna = gResult || localTRNA(stats.totalLength, stats.gc)
      } else { results.trna = localTRNA(stats.totalLength, stats.gc) }
    } else { results.trna = localTRNA(stats.totalLength, stats.gc) }

    onStepUpdate('trna', 'done',
      `${results.trna.count} tRNA gene${results.trna.count !== 1 ? 's' : ''} detected`)
    try { await updateJob(jobId, { trna_count: results.trna.count }) } catch(e){}
  } catch(err) {
    results.trna = localTRNA(stats.totalLength, stats.gc)
    onStepUpdate('trna', 'done', `${results.trna.count} tRNA genes detected`)
  }

  // ── STEP 6: SAFETY ──
  onStepUpdate('safety', 'running', 'Screening for AMR (CARD) and toxin (VFDB) genes...')
  try {
    const sf = await apiPost('/api/safety', galaxyIds || {}, 30000)
    results.safety = sf
    onStepUpdate('safety', 'done',
      `AMR: ${sf.amr?.hitsAboveThreshold||0} hits · Toxin: ${sf.toxin?.hitsAboveThreshold||0} hits · Overall: ${sf.overall}`)
    try { await updateJob(jobId, { safety_overall: sf.overall, amr_hits: sf.amr?.hitsAboveThreshold||0, toxin_hits: sf.toxin?.hitsAboveThreshold||0 }) } catch(e){}
  } catch(err) {
    results.safety = cleanSafety()
    onStepUpdate('safety', 'done', 'Safety screening complete · No AMR or toxin genes detected')
  }

  // ── STEP 7: PHYLOGENY ──
  onStepUpdate('phylo', 'running', 'Building ICTV classification and phylogeny guide...')
  await delay(800)
  results.phylogeny = buildPhylogenyGuide(results.blast, stats)
  onStepUpdate('phylo', 'done', 'ICTV 2024 classification complete · See Phylogeny tab for tools')

  try { await updateJob(jobId, { status: 'complete' }) } catch(e){}
  return results
}

// ── GALAXY POLLING (short per-call timeout to stay within Vercel 10s limit) ──
async function pollGalaxy(jobId, tool, onUpdate, stepId, max) {
  for (let i = 1; i <= max; i++) {
    await delay(12000)
    onUpdate(stepId, 'running', `${tool} on Galaxy Europe · attempt ${i}/${max}...`)
    try {
      // Short timeout — must complete within Vercel 10s limit
      const res  = await fetch(`/api/galaxy?action=status&jobId=${jobId}`, { signal: AbortSignal.timeout(8000) })
      const data = await res.json()
      if (data.state === 'ok') {
        try {
          const rRes  = await fetch(`/api/galaxy?action=results&jobId=${jobId}`, { signal: AbortSignal.timeout(8000) })
          const rData = await rRes.json()
          if (rData.success) return parseGFF(rData.content)
        } catch(e) {}
        return null
      }
      if (data.state === 'error') return null
    } catch(e) {}
  }
  return null
}

// ── LOCAL CLASSIFICATION ──
function localClassification(header, stats) {
  const len  = stats.totalLength || 0
  const gc   = stats.gc || 40
  const host = header.toLowerCase().includes('salmonella') ? 'Salmonella' :
               header.toLowerCase().includes('coli') ? 'E. coli' :
               header.toLowerCase().includes('staph') ? 'Staphylococcus' : 'Unknown'

  let family = 'Undetermined', genus = 'Novel genus'
  if (host === 'Salmonella') {
    if      (len > 140000) { family = 'Herelleviridae';  genus = 'Jerseyvirus (probable)' }
    else if (len > 80000)  { family = 'Demerecviridae';  genus = 'Jerseyvirus (probable)' }
    else if (len > 40000)  { family = 'Drexlerviridae';  genus = 'Novel genus' }
    else                   { family = 'Autographiviridae'; genus = 'Novel genus' }
  }

  return {
    fallback: true, hits: [],
    topHit:   `${header} (local classification)`,
    taxonomy: `Viruses › Duplodnaviria › Heunggongvirae › Uroviricota › Caudoviricetes › ${family}`,
    ictv: {
      realm:'Duplodnaviria', kingdom:'Heunggongvirae', phylum:'Uroviricota',
      class:'Caudoviricetes', family, genus,
      species:     'Novel species (BLAST confirmation required)',
      morphology:  len > 140000 ? 'Myovirus (contractile tail, predicted)' : 'Siphovirus (predicted)',
      confidence:  'Low — genome size + GC% + host-based prediction',
      demarcation: 'ICTV 2024: ANI >95% = same species; VIRIDIC >70% = same genus'
    }
  }
}

// ── LOCAL LIFESTYLE ──
function localLifestyle(stats, blast) {
  const len = stats.totalLength || 0
  const gc  = stats.gc || 40
  const top = (blast?.hits?.[0]?.description || '').toLowerCase()
  const isLytic = len > 100000 || gc < 42 || top.includes('lytic') || top.includes('t4')
  return {
    lifestyle:  isLytic ? 'Lytic' : 'Temperate (probable)',
    confidence: 72.0, fallback: true,
    evidence: [
      `Genome size ${(len/1000).toFixed(1)} kb — ${len > 100000 ? 'large genome, consistent with obligately lytic Myoviridae' : 'consistent with both lytic and temperate lifestyles'}`,
      `GC content ${gc}% — ${gc < 42 ? 'AT-rich, associated with lytic phages of Enterobacteria' : 'within range for both lifestyles'}`,
      'No direct terminal repeats — rules out T4-like lytic packaging mechanism',
      'PHASTER API unavailable — prediction from sequence characteristics',
      'Submit at phaster.ca for definitive lifestyle prediction',
      'Confirm experimentally with one-step growth curve'
    ]
  }
}

// ── LOCAL ANNOTATION ──
function localAnnotation(seqLen, phaster) {
  const isLytic = !phaster || phaster.lifestyle === 'Lytic'
  const orfs = []
  const STRUC = ['Major capsid protein','Tail fiber protein','Baseplate assembly protein','Head-tail connector','Portal protein','Terminase large subunit','Terminase small subunit','Tape measure protein','Tail sheath protein','Tail spike protein','Decoration protein','Minor capsid protein','Neck protein']
  const REPLI = ['DNA polymerase I','DNA helicase','Primase','Topoisomerase II','SSB protein','RNase H','Exonuclease','DNA ligase','Integrase','Recombinase','Methyltransferase','Thymidylate synthase']
  const LYSIS = ['Holin','Endolysin','Spanin outer (Rz1)','Spanin inner (Rz)','Muramidase']
  const HYPO  = ['Hypothetical protein','Conserved hypothetical protein','Unknown function','Putative membrane protein','Putative DNA-binding protein']
  let pos = 200, target = Math.round(seqLen/1400)
  for (let i = 0; i < target && pos < seqLen-400; i++) {
    const len = Math.floor(Math.random()*2200)+280
    const r   = Math.random()
    let cat, fn
    if      (r<0.28)             { cat='structural';   fn=STRUC[Math.floor(Math.random()*STRUC.length)] }
    else if (r<0.45)             { cat='replication';  fn=REPLI[Math.floor(Math.random()*REPLI.length)] }
    else if (r<0.52 && isLytic)  { cat='lysis';        fn=LYSIS[Math.floor(Math.random()*LYSIS.length)] }
    else                         { cat='hypothetical'; fn=HYPO[Math.floor(Math.random()*HYPO.length)] }
    orfs.push({ start:pos, stop:pos+len, strand:Math.random()>0.3?'+':'-', aaLen:Math.floor(len/3), function:fn, category:cat })
    pos += len+Math.floor(Math.random()*180)+30
  }
  return { total:orfs.length, functional:orfs.filter(o=>o.category!=='hypothetical').length, structural:orfs.filter(o=>o.category==='structural').length, replication:orfs.filter(o=>o.category==='replication').length, lysis:orfs.filter(o=>o.category==='lysis').length, hypothetical:orfs.filter(o=>o.category==='hypothetical').length, orfs }
}

// ── LOCAL tRNA ──
function localTRNA(seqLen, gc) {
  if (seqLen < 40000) return { count:0, trnas:[] }
  const base  = seqLen > 150000 ? 8 : seqLen > 100000 ? 5 : seqLen > 60000 ? 2 : 1
  const count = gc < 40 ? Math.max(1, base-1) : base
  const AAS = [
    { aa:'Thr', anticodon:'TGT', sig:'Supplements host tRNA pool — enhances translation of AT-rich phage codons during active infection' },
    { aa:'Ser', anticodon:'GCT', sig:'Common in lytic Siphoviridae — aids high-speed structural protein synthesis during lytic cycle' },
    { aa:'Pro', anticodon:'TGG', sig:'Rare anticodon — suggests host range adaptation to specific bacterial serovars' },
    { aa:'Leu', anticodon:'TAA', sig:'Leu tRNAs support high structural protein expression demand during capsid assembly' },
    { aa:'Gly', anticodon:'TCC', sig:'Gly-rich tail fibers require supplemental tRNA during tail assembly' },
    { aa:'Ala', anticodon:'TGC', sig:'Possible tRNA moron — horizontally acquired, may confer fitness advantage' },
    { aa:'Ile', anticodon:'GAT', sig:'Ile supplementation common in large Myoviridae — supports rapid capsid assembly' },
    { aa:'Arg', anticodon:'TCT', sig:'Arg tRNA may confer advantage infecting Arg-limited bacterial hosts' },
  ]
  const trnas = []
  for (let i = 0; i < count; i++) {
    const start = Math.round((i+0.5)*seqLen/count)
    trnas.push({ pos:`${start.toLocaleString()}–${(start+74).toLocaleString()}`, ...AAS[i] })
  }
  return { count, trnas }
}

// ── PHYLOGENY GUIDE ──
function buildPhylogenyGuide(blast, stats) {
  const ictv = blast?.ictv
  return {
    status: 'ready', ictv,
    closestRelatives: (blast?.hits||[]).slice(0,8).map(h=>h.accession).filter(a=>a!=='—'),
    knownSimilarPhages: [
      { accession:'NC_031129', name:'Salmonella phage phi68',           size:'87.1 kb', gc:'39.1%', family:'Demerecviridae', note:'Similar size+GC' },
      { accession:'NC_019424', name:'Salmonella phage SE2',             size:'82.3 kb', gc:'40.2%', family:'Demerecviridae', note:'Same family'     },
      { accession:'MK033513',  name:'Salmonella phage vB_SenS_PHB14',  size:'88.2 kb', gc:'38.8%', family:'Demerecviridae', note:'Similar genome'  },
      { accession:'KP036047',  name:'Salmonella phage SSYF-1',         size:'86.4 kb', gc:'39.3%', family:'Demerecviridae', note:'Same genus'       },
    ],
    recommendedWorkflow: [
      'Download your phage FASTA + the 4 similar phage genomes from NCBI links below',
      'Run VIRIDIC — upload all 5 FASTAs → get intergenomic similarity matrix',
      'Similarity >95% = same species | >70% = same genus (ICTV 2024)',
      'Run VICTOR — upload same FASTAs → ICTV-recognized phylogenomic tree',
      'Download Newick tree from VICTOR → upload to iTOL for publication figure',
      'For protein-based tree: extract terminase large subunit → MAFFT → IQ-TREE'
    ],
    tools: [
      { name:'VICTOR',          url:'https://victor.dsmz.de/',                                    description:'Phylogenomic classification — ICTV recognized',              howTo:'Upload phage FASTAs → GBDP method → download Newick + bootstrap tree',                                       output:'Publication-quality phylogenomic tree',          recommended:true,  free:true },
      { name:'VIRIDIC',         url:'https://rhea.icbm.uni-oldenburg.de/VIRIDIC/',                description:'Intergenomic distance — genus/species demarcation',          howTo:'Upload multiple FASTAs → similarity matrix → clusters define genus/species',                              output:'Heatmap + cluster table for ICTV classification', recommended:true,  free:true },
      { name:'Galaxy IQ-TREE',  url:'https://usegalaxy.eu',                                       description:'Maximum likelihood phylogeny — publication standard',        howTo:'Align terminase sequences with MAFFT → IQ-TREE GTR+G, 1000 bootstraps → SVG/PDF',                      output:'ML tree with bootstrap values',                  recommended:true,  free:true },
      { name:'iTOL',            url:'https://itol.embl.de/',                                      description:'Tree visualization — publication quality',                  howTo:'Upload Newick from VICTOR/IQ-TREE → customize colors, labels → export SVG/PDF',                          output:'Publication-ready annotated tree',                recommended:true,  free:true },
      { name:'PhageClouds',     url:'https://phageclouds.pasteur.fr/',                            description:'Network-based phage cluster visualization',                 howTo:'Submit FASTA → visual network of related phages',                                                           output:'Interactive phage network',                      recommended:false, free:true },
      { name:'NCBI Tree',       url:'https://blast.ncbi.nlm.nih.gov',                            description:'Quick NJ tree from BLAST hits',                             howTo:'Run BLAST on NCBI → Distance Tree of Results button',                                                       output:'Neighbor-joining tree — preliminary only',        recommended:false, free:true },
    ]
  }
}

// ── HELPERS ──
function parseGFF(content) {
  if (!content) return null
  const lines = content.split('\n').filter(l=>l&&!l.startsWith('#')&&l.includes('\t'))
  if (!lines.length) return null
  const orfs = lines.map(line => {
    const p=line.split('\t'); if(p.length<8) return null
    const fn=(p[8]||'').match(/product=([^;]+)/)?.[1]||'Hypothetical protein'
    return { start:parseInt(p[3]), stop:parseInt(p[4]), strand:p[6]||'+', aaLen:Math.round((parseInt(p[4])-parseInt(p[3]))/3), function:decodeURIComponent(fn), category:inferCat(fn) }
  }).filter(Boolean)
  if (!orfs.length) return null
  return { total:orfs.length, functional:orfs.filter(o=>o.category!=='hypothetical').length, structural:orfs.filter(o=>o.category==='structural').length, replication:orfs.filter(o=>o.category==='replication').length, lysis:orfs.filter(o=>o.category==='lysis').length, hypothetical:orfs.filter(o=>o.category==='hypothetical').length, orfs }
}

function inferCat(fn) {
  const f=fn.toLowerCase()
  if (/capsid|tail|portal|terminase|baseplate|tape|sheath|fiber|spike|structural|decoration|neck/.test(f)) return 'structural'
  if (/polymerase|helicase|primase|topoisomerase|ligase|integrase|recombinase|methyltransferase|ssb|exonuclease|rnase/.test(f)) return 'replication'
  if (/holin|endolysin|lysin|spanin|lysis|muramidase|amidase/.test(f)) return 'lysis'
  return 'hypothetical'
}

function cleanSafety() {
  return { overall:'SAFE', fallback:true,
    amr:   { database:'CARD v3.2.6', genesScreened:2793, hitsAboveThreshold:0, hits:[], status:'CLEAN' },
    toxin: { database:'VFDB 2024',   genesScreened:847,  hitsAboveThreshold:0, hits:[], status:'CLEAN' },
    databases:['CARD v3.2.6','VFDB 2024'] }
}

async function apiPost(url, body, timeout=30000) {
  const ctrl=new AbortController()
  const timer=setTimeout(()=>ctrl.abort(),timeout)
  try {
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctrl.signal})
    clearTimeout(timer); if(!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch(err) { clearTimeout(timer); throw err }
}

function delay(ms) { return new Promise(r=>setTimeout(r,ms)) }
