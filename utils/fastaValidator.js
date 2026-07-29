// ── FASTA VALIDATOR ──
// Comprehensive validation before any API call is made

export function parseFasta(text) {
  const lines = text.trim().split('\n')
  const sequences = []
  let current = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('>')) {
      if (current) sequences.push(current)
      current = { header: trimmed.slice(1).trim(), seq: '' }
    } else if (current) {
      current.seq += trimmed.toUpperCase().replace(/\s/g, '')
    }
  }
  if (current) sequences.push(current)
  return sequences
}

export function validateFasta(text) {
  const errors = []
  const warnings = []

  if (!text || !text.trim()) {
    return { valid: false, errors: ['No sequence provided'], warnings: [], sequences: [] }
  }

  const sequences = parseFasta(text)

  // Check 1: FASTA format
  if (sequences.length === 0) {
    errors.push('Invalid FASTA format. Each sequence must start with a > header line.')
    return { valid: false, errors, warnings, sequences: [] }
  }

  // Check 2: Each sequence
  for (let i = 0; i < sequences.length; i++) {
    const s = sequences[i]
    const label = sequences.length > 1 ? `Sequence ${i + 1} (${s.header})` : 'Sequence'

    // Empty sequence
    if (!s.seq || s.seq.length === 0) {
      errors.push(`${label}: No nucleotide sequence found after header.`)
      continue
    }

    // Valid DNA characters
    const invalidChars = s.seq.match(/[^ATGCNRYSWKMBDHV]/g)
    if (invalidChars) {
      const unique = [...new Set(invalidChars)].join(', ')
      errors.push(`${label}: Invalid characters detected: ${unique}. Only DNA bases (A,T,G,C,N) allowed.`)
    }

    // Minimum length
    if (s.seq.length < 10000) {
      errors.push(`${label}: Too short (${s.seq.length.toLocaleString()} bp). Minimum phage genome size is 10,000 bp.`)
    }

    // Maximum length
    if (s.seq.length > 800000) {
      errors.push(`${label}: Too large (${s.seq.length.toLocaleString()} bp). Maximum supported size is 800,000 bp.`)
    }

    // Phage size warning
    if (s.seq.length >= 10000 && s.seq.length < 15000) {
      warnings.push(`${label}: Very small genome (${s.seq.length.toLocaleString()} bp). Confirm this is a complete phage genome.`)
    }

    // Repetitive sequence warning
    const uniqueBases = new Set(s.seq).size
    if (uniqueBases < 3) {
      warnings.push(`${label}: Very low sequence complexity detected. Please verify this is a real phage genome.`)
    }

    // GC% extremes
    const gc = calculateGC(s.seq)
    if (gc < 20 || gc > 75) {
      warnings.push(`${label}: Unusual GC content (${gc}%). Please verify sequence integrity.`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sequences
  }
}

export function calculateGC(seq) {
  const clean = seq.toUpperCase().replace(/[^ATGCN]/g, '')
  if (!clean.length) return 0
  const gc = (clean.match(/[GC]/g) || []).length
  return parseFloat(((gc / clean.length) * 100).toFixed(1))
}

export function getSequenceStats(sequences) {
  if (!sequences || sequences.length === 0) return null
  const totalLen = sequences.reduce((a, s) => a + s.seq.length, 0)
  const gc = calculateGC(sequences.map(s => s.seq).join(''))
  return {
    count: sequences.length,
    totalLength: totalLen,
    avgLength: Math.round(totalLen / sequences.length),
    gc,
    largestSeq: Math.max(...sequences.map(s => s.seq.length)),
    smallestSeq: Math.min(...sequences.map(s => s.seq.length))
  }
}
