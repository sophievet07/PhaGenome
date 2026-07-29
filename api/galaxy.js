// ── GALAXY EUROPE API ROUTE ──
// Submits jobs to Galaxy Europe for Pharokka, tRNAscan-SE, IQ-TREE
// Galaxy API key hidden server-side — never exposed to browser

const GALAXY_URL = process.env.GALAXY_URL || 'https://usegalaxy.eu'
const GALAXY_KEY = process.env.GALAXY_API_KEY

// Tool IDs on Galaxy Europe
const TOOLS = {
  pharokka: 'toolshed.g2.bx.psu.edu/repos/iuc/pharokka/pharokka/1.4.1',
  trnascan: 'toolshed.g2.bx.psu.edu/repos/bgruening/trna_prediction/trnascan/2.0.9',
  iqtree: 'toolshed.g2.bx.psu.edu/repos/iuc/iqtree/iqtree/2.1.4'
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.query

  try {
    switch (action) {
      case 'upload':   return await uploadSequence(req, res)
      case 'annotate': return await submitPharokka(req, res)
      case 'trna':     return await submitTRNAscan(req, res)
      case 'status':   return await checkJobStatus(req, res)
      case 'results':  return await getJobResults(req, res)
      default:         return res.status(400).json({ error: 'Unknown action' })
    }
  } catch (err) {
    console.error('Galaxy API error:', err)
    return res.status(500).json({ error: err.message, fallback: true })
  }
}

// ── STEP 1: Upload FASTA to Galaxy history ──
async function uploadSequence(req, res) {
  const { sequence, header } = req.body
  if (!sequence) return res.status(400).json({ error: 'No sequence' })

  // Create a new Galaxy history for this job
  const historyRes = await galaxyRequest('POST', '/api/histories', {
    name: `PhaGenome_${Date.now()}`
  })

  if (!historyRes.ok) {
    return res.status(200).json({ fallback: true, historyId: null })
  }

  const history = await historyRes.json()
  const historyId = history.id

  // Upload FASTA to history
  const fastaContent = `>${header || 'phage_genome'}\n${sequence}`

  const uploadRes = await galaxyRequest('POST', '/api/tools', {
    tool_id: 'upload1',
    history_id: historyId,
    inputs: {
      'files_0|url_paste': fastaContent,
      'files_0|type': 'upload_dataset',
      file_type: 'fasta',
      dbkey: 'phage'
    }
  })

  if (!uploadRes.ok) {
    return res.status(200).json({ fallback: true, historyId: null })
  }

  const upload = await uploadRes.json()
  const datasetId = upload.outputs?.[0]?.id

  return res.status(200).json({
    success: true,
    historyId,
    datasetId,
    message: 'Sequence uploaded to Galaxy Europe'
  })
}

// ── STEP 2: Submit Pharokka annotation job ──
async function submitPharokka(req, res) {
  const { historyId, datasetId } = req.body

  if (!historyId || !datasetId) {
    return res.status(200).json({ fallback: true, jobId: null })
  }

  const jobRes = await galaxyRequest('POST', '/api/tools', {
    tool_id: TOOLS.pharokka,
    history_id: historyId,
    inputs: {
      'input': { src: 'hda', id: datasetId },
      'database': 'pharokka_db',
      'meta_prefix': 'phagenome',
      'gene_predictor': 'phanotate',
      'trna_tool': 'minced',
      'dnaapler': true
    }
  })

  if (!jobRes.ok) {
    return res.status(200).json({ fallback: true, jobId: null })
  }

  const job = await jobRes.json()
  const jobId = job.jobs?.[0]?.id

  return res.status(200).json({
    success: true,
    jobId,
    historyId,
    message: 'Pharokka annotation job submitted'
  })
}

// ── STEP 3: Submit tRNAscan-SE job ──
async function submitTRNAscan(req, res) {
  const { historyId, datasetId } = req.body

  if (!historyId || !datasetId) {
    return res.status(200).json({ fallback: true, jobId: null })
  }

  const jobRes = await galaxyRequest('POST', '/api/tools', {
    tool_id: TOOLS.trnascan,
    history_id: historyId,
    inputs: {
      'input': { src: 'hda', id: datasetId },
      'source': 'B', // Bacteria mode
      'output_format': 'tabular'
    }
  })

  if (!jobRes.ok) {
    return res.status(200).json({ fallback: true, jobId: null })
  }

  const job = await jobRes.json()

  return res.status(200).json({
    success: true,
    jobId: job.jobs?.[0]?.id,
    message: 'tRNAscan-SE job submitted'
  })
}

// ── STEP 4: Check job status ──
async function checkJobStatus(req, res) {
  const { jobId } = req.query

  if (!jobId) return res.status(400).json({ error: 'No jobId' })

  const statusRes = await galaxyRequest('GET', `/api/jobs/${jobId}`)

  if (!statusRes.ok) {
    return res.status(200).json({ state: 'unknown', fallback: true })
  }

  const job = await statusRes.json()

  return res.status(200).json({
    state: job.state, // queued, running, ok, error
    jobId,
    message: getStateMessage(job.state)
  })
}

// ── STEP 5: Get job results ──
async function getJobResults(req, res) {
  const { jobId, historyId } = req.query

  if (!jobId || !historyId) {
    return res.status(200).json({ fallback: true })
  }

  // Get outputs of job
  const jobRes = await galaxyRequest('GET', `/api/jobs/${jobId}?full=true`)
  if (!jobRes.ok) return res.status(200).json({ fallback: true })

  const job = await jobRes.json()
  const outputDatasetId = job.outputs?.out_file1?.id

  if (!outputDatasetId) return res.status(200).json({ fallback: true })

  // Download result content
  const contentRes = await galaxyRequest('GET',
    `/api/histories/${historyId}/contents/${outputDatasetId}/display`
  )

  if (!contentRes.ok) return res.status(200).json({ fallback: true })

  const content = await contentRes.text()

  return res.status(200).json({
    success: true,
    content,
    format: 'gff3'
  })
}

// ── GALAXY REQUEST HELPER ──
async function galaxyRequest(method, path, body = null) {
  const url = `${GALAXY_URL}${path}${path.includes('?') ? '&' : '?'}key=${GALAXY_KEY}`

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(30000)
  }

  if (body) options.body = JSON.stringify(body)

  try {
    return await fetch(url, options)
  } catch (err) {
    console.error('Galaxy request failed:', path, err.message)
    throw err
  }
}

function getStateMessage(state) {
  const messages = {
    queued: 'Job queued — waiting for Galaxy Europe compute nodes',
    running: 'Analysis running on Galaxy Europe servers',
    ok: 'Analysis complete',
    error: 'Galaxy job failed — using fallback annotation',
    paused: 'Job paused',
    deleted: 'Job deleted'
  }
  return messages[state] || 'Unknown state'
}
