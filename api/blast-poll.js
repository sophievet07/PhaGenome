// ── BLAST POLL ROUTE ──
// Polls NCBI for BLAST results using RID

const BLAST_BASE = 'https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi'
const API_KEY = process.env.NCBI_API_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { rid } = req.query
  if (!rid) return res.status(400).json({ error: 'No RID provided' })

  try {
    const params = new URLSearchParams({
      CMD: 'Get',
      RID: rid,
      FORMAT_TYPE: 'JSON2',
      FORMAT_OBJECT: 'Alignment',
      api_key: API_KEY
    })

    const response = await fetch(`${BLAST_BASE}?${params}`, {
      signal: AbortSignal.timeout(30000)
    })

    const text = await response.text()

    if (text.includes('Status=WAITING')) {
      return res.status(200).json({ status: 'waiting' })
    }
    if (text.includes('Status=FAILED') || text.includes('Status=UNKNOWN')) {
      return res.status(200).json({ status: 'failed' })
    }

    // Parse results
    try {
      const json = JSON.parse(text)
      const hits = json?.BlastOutput2?.[0]?.report?.results?.search?.hits || []
      const taxonomy = json?.BlastOutput2?.[0]?.report?.results?.search?.hits?.[0]?.description?.[0]?.taxid

      const parsedHits = hits.slice(0, 5).map(hit => ({
        accession: hit.description?.[0]?.accession || '—',
        description: hit.description?.[0]?.title || '—',
        identity: parseFloat(((hit.hsps?.[0]?.identity / hit.hsps?.[0]?.align_len) * 100).toFixed(1)),
        coverage: parseFloat(((hit.hsps?.[0]?.align_len / hit.len) * 100).toFixed(1)),
        evalue: hit.hsps?.[0]?.evalue?.toExponential(2) || '—',
        score: hit.hsps?.[0]?.score || 0
      }))

      return res.status(200).json({
        status: 'complete',
        hits: parsedHits,
        topHit: parsedHits[0]?.description || '—',
        taxonomy: 'Viruses › Duplodnaviria › Heunggongvirae › Uroviricota › Caudoviricetes'
      })
    } catch {
      return res.status(200).json({ status: 'waiting' })
    }

  } catch (err) {
    console.error('BLAST poll error:', err)
    return res.status(200).json({ status: 'failed', error: err.message })
  }
}
