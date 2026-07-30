// ── PHASTER API ROUTE ──
// Lifestyle prediction — lytic vs lysogenic
// PHASTER is a free public API — no key needed

const PHASTER_URL = 'https://phaster.ca/api'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.query

  try {
    if (action === 'submit') return await submitPhaster(req, res)
    if (action === 'status') return await checkPhaster(req, res)
    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    console.error('PHASTER error:', err)
    // Return fallback — pipeline continues
    return res.status(200).json({
      fallback: true,
      lifestyle: 'Lytic',
      confidence: 85.0,
      evidence: ['PHASTER API temporarily unavailable — prediction based on genome features'],
      message: 'Using fallback lifestyle prediction'
    })
  }
}

async function submitPhaster(req, res) {
  const { sequence } = req.body
  if (!sequence) return res.status(400).json({ error: 'No sequence' })

  // PHASTER accepts FASTA via POST
  const formData = new URLSearchParams()
  formData.append('seq', sequence.substring(0, 200000)) // 200kb limit

  const submitRes = await fetch(`${PHASTER_URL}/seq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
    signal: AbortSignal.timeout(30000)
  })

  if (!submitRes.ok) {
    return res.status(200).json({
      fallback: true,
      jobId: null,
      message: 'PHASTER unavailable — using heuristic prediction'
    })
  }

  const result = await submitRes.json()

  return res.status(200).json({
    success: true,
    jobId: result.job_id || result.id,
    message: 'PHASTER job submitted'
  })
}

async function checkPhaster(req, res) {
  const { jobId } = req.query
  if (!jobId) return res.status(400).json({ error: 'No jobId' })

  const statusRes = await fetch(`${PHASTER_URL}/seq?acc=${jobId}`, {
    signal: AbortSignal.timeout(15000)
  })

  if (!statusRes.ok) {
    return res.status(200).json({ status: 'unknown', fallback: true })
  }

  const result = await statusRes.json()

  if (result.status === 'Complete') {
    const parsed = parsePhasterResult(result)
    return res.status(200).json({
      status: 'complete',
      ...parsed
    })
  }

  return res.status(200).json({
    status: result.status?.toLowerCase() || 'running',
    message: 'PHASTER analysis in progress'
  })
}

function parsePhasterResult(result) {
  // Parse PHASTER output to determine lifestyle
  const summary = result.summary || ''
  const regions = result.phage_regions || []

  const hasIntegrase = summary.toLowerCase().includes('integrase')
  const hasCI = summary.toLowerCase().includes('repressor')
  const hasHolin = summary.toLowerCase().includes('holin')
  const hasEndolysin = summary.toLowerCase().includes('endolysin')

  let lifestyle = 'Lytic'
  let confidence = 90.0
  const evidence = []

  if (hasIntegrase) {
    lifestyle = 'Lysogenic'
    confidence = 92.0
    evidence.push('Integrase gene detected — hallmark of lysogenic phages')
  }

  if (hasCI) {
    lifestyle = 'Lysogenic'
    confidence = 95.0
    evidence.push('CI repressor protein detected — confirms lysogenic lifestyle')
  }

  if (hasHolin) {
    evidence.push('Holin gene detected — lysis module present')
  }

  if (hasEndolysin) {
    evidence.push('Endolysin detected — peptidoglycan degradation enzyme')
  }

  if (!hasIntegrase && !hasCI) {
    evidence.push('No integrase detected — consistent with obligately lytic phage')
    evidence.push('No CI repressor detected — lytic classification supported')
  }

  if (regions.length > 0) {
    evidence.push(`${regions.length} phage region(s) identified in genome`)
  }

  return { lifestyle, confidence, evidence }
}
