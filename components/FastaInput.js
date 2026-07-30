import { useState, useRef } from 'react'
import { validateFasta, getSequenceStats } from '../utils/fastaValidator'

const DEMOS = {
  t4: `>NC_000866.4 Enterobacteria phage T4 complete genome (demo)
ATGTTTAAAGTTTTTATTTTAGTTTTAATTTTTTTTAGTATCTTTATTTTTTTATATTTTTCAATGTTTATTATTTAC
ATAAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTT
ATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTA
TAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTAT
AATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTATA
ATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTATAATTTTT
AATTTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTATAATTTTTAAT
TTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTATAATTTTTAATTTTT
ATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTATAATTTTTAATTTTTATA
ATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTT
AATTTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTATAATTTTTAAT
TTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTATAATTTTTAATTTTTATA`,
  lambda: `>NC_001416.1 Enterobacteria phage lambda (demo)
GGGCGGCGACCTCGCGGGTTTTCGCTATTTATGAAAATTTTCCGGTTTAAGGCGTTTCCGTTCTTCTTCGTCATAAC
TTAATGTTTTTATTTAAAATACCCTCTGAAAAGAAAGGAAACGACATTTAAGAATCTGATGGCCTCATACACTTTTAA
AAGAAAAGGGGGGACTGGAAGGGCTAATTCACTCCCAAAGAAGACAAGATATCCTTGATCTGTGGATCTACCACAGAC
AAGGAGAAGAGCTCGGCGGATGCAAGAAATCTTGTCCCAGCCTCACCCTCCAAGTTGGGGCATGGACAGGGACAGCAG
AGATCCAGCTATGACCGAGATCGAAACCCGGTCACCAAATACTGTTCTTCGCCCCGAACCGGGACTTGAACCCGCACG
CCGCGTGAGGGATGACGGCCCGGGCGGGATCTTCGTACTCGGACTACTACCCGGCGGCTTCCCAGCGCCTCCAGTTCG
AAAAAGCGGACTTCAAATTTGAGAAGGTGTCACTCTGCGTAAAGCTGTGCATGAACGTGGTTTCTTCATGCCGGACAT`,
  p22: `>NC_002371.2 Salmonella phage P22 (demo)
ATGGATATTAATACAACCACAAATCCAATGGAAACTCTAAATCAAATCAGTGCAAAAGGTTTTGATCGAGCAGTCATC
GAAGCAATGCAAGAAGCCTTTGAAGGAATTGATAATGATAATGATCAAACAATCAGCAAAGTTGATATTGACGCGGTA
GATGCAGATCAGTTAATTAAAGATAATGAAGAAGATAATGATGATGATAATGATGATGATAATGATAATGATGATGAT
AATAATGATAATGATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATA
ATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATA
ATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATA
ATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATA
ATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATA
ATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATA
ATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATA
ATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATA
ATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATA
ATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATA`,
}

export default function FastaInput({ onAnalyse }) {
  const [text, setText] = useState('')
  const [validation, setValidation] = useState(null)
  const [stats, setStats] = useState(null)
  const fileRef = useRef(null)

  function handleChange(val) {
    setText(val)
    if (!val.trim()) { setValidation(null); setStats(null); return }
    const result = validateFasta(val)
    setValidation(result)
    if (result.sequences.length > 0) {
      setStats(getSequenceStats(result.sequences))
    } else {
      setStats(null)
    }
  }

  function loadDemo(key) {
    handleChange(DEMOS[key])
  }

  function loadFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => handleChange(ev.target.result)
    reader.readAsText(file)
  }

  function handleAnalyse() {
    if (!validation?.valid) return
    onAnalyse(validation.sequences, text)
  }

  const checks = [
    { id: 'format', label: 'FASTA format', pass: validation?.sequences?.length > 0 },
    { id: 'dna', label: 'DNA sequence', pass: validation?.valid && !validation?.errors?.some(e => e.includes('character')) },
    { id: 'length', label: 'Length ≥10kb', pass: validation?.valid && stats?.totalLength >= 10000 },
    { id: 'phage', label: 'Phage-sized', pass: validation?.valid },
  ]

  return (
    <>
      <style>{`
        .fasta-card {
          background: #0F2040; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 28px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
        }
        .card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.1rem; font-weight: 600;
          margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .card-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(0,212,170,0.12);
          border: 1px solid rgba(0,212,170,0.18);
          display: flex; align-items: center; justify-content: center;
        }
        .upload-zone {
          border: 2px dashed rgba(255,255,255,0.1);
          border-radius: 8px; padding: 16px;
          text-align: center; cursor: pointer;
          transition: all 0.2s; margin-bottom: 14px;
        }
        .upload-zone:hover {
          border-color: #00D4AA;
          background: rgba(0,212,170,0.05);
        }
        .upload-zone p { font-size: 0.82rem; color: #8DA4BF; margin-top: 6px; }
        .fasta-area {
          width: 100%; min-height: 200px;
          background: #0A1628;
          border: 1.5px solid rgba(255,255,255,0.07);
          border-radius: 8px; padding: 16px;
          color: #F0F4F8;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.78rem; line-height: 1.7;
          resize: vertical; outline: none;
          transition: border-color 0.2s;
        }
        .fasta-area:focus { border-color: #00D4AA; box-shadow: 0 0 0 3px rgba(0,212,170,0.1); }
        .fasta-area.valid { border-color: #68D391; }
        .fasta-area.error { border-color: #FC8181; }
        .fasta-area::placeholder { color: #4A6080; }
        .checks-row { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 12px; }
        .check {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.76rem; color: #4A6080;
        }
        .check.pass { color: #68D391; }
        .check.fail { color: #FC8181; }
        .seq-meta { display: flex; gap: 20px; flex-wrap: wrap; margin-top: 10px; }
        .seq-meta-item {
          font-size: 0.76rem; color: #4A6080;
          font-family: 'JetBrains Mono', monospace;
        }
        .seq-meta-item span { color: #00D4AA; font-weight: 600; }
        .alert-box {
          padding: 12px 16px; border-radius: 8px;
          font-size: 0.82rem; margin-top: 12px;
          display: flex; gap: 8px; align-items: flex-start;
        }
        .alert-error {
          background: rgba(252,129,129,0.08);
          border: 1px solid rgba(252,129,129,0.25);
          color: #FC8181;
        }
        .alert-warn {
          background: rgba(246,173,85,0.08);
          border: 1px solid rgba(246,173,85,0.25);
          color: #F6AD55;
        }
        .demo-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 18px; }
        .demo-label { font-size: 0.78rem; color: #4A6080; margin-bottom: 8px; }
        .demo-chip {
          padding: 6px 14px; border-radius: 20px;
          background: #162847;
          border: 1px solid rgba(255,255,255,0.07);
          font-size: 0.76rem; color: #8DA4BF;
          cursor: pointer; transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .demo-chip:hover {
          border-color: #00D4AA; color: #00D4AA;
          background: rgba(0,212,170,0.08);
        }
        .action-row {
          display: flex; justify-content: space-between;
          align-items: center; margin-top: 24px; flex-wrap: wrap; gap: 12px;
        }
        .btn-clear {
          background: none; border: none;
          color: #4A6080; font-size: 0.85rem;
          cursor: pointer; padding: 8px 12px;
          font-family: 'Inter', sans-serif;
          transition: color 0.2s; border-radius: 6px;
        }
        .btn-clear:hover { color: #FC8181; }
        .btn-analyse {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 28px; border-radius: 8px;
          background: linear-gradient(135deg, #00D4AA, #00A882);
          color: #0A1628; font-weight: 700; font-size: 0.95rem;
          border: none; cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
        }
        .btn-analyse:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 24px rgba(0,212,170,0.3);
        }
        .btn-analyse:disabled {
          opacity: 0.35; cursor: not-allowed; transform: none;
        }
      `}</style>

      <div className="fasta-card">
        <div className="card-title">
          <div className="card-icon">📋</div>
          Paste your phage FASTA sequence
        </div>

        {/* File upload */}
        <div className="upload-zone" onClick={() => fileRef.current?.click()}>
          <div style={{ fontSize: '1.4rem' }}>📁</div>
          <p>Drop a .fasta / .fa / .fna file here, or click to browse</p>
        </div>
        <input
          ref={fileRef} type="file"
          accept=".fasta,.fa,.fna,.txt"
          style={{ display: 'none' }}
          onChange={loadFile}
        />

        {/* FASTA textarea */}
        <textarea
          className={`fasta-area ${validation?.valid ? 'valid' : validation && !validation.valid ? 'error' : ''}`}
          value={text}
          onChange={e => handleChange(e.target.value)}
          placeholder={`>Phage_genome_1\nATGCATGCATGCATGC...\n\nPaste one or multiple phage FASTA sequences here.\nMinimum size: 10,000 bp`}
          rows={10}
        />

        {/* Validation checks */}
        <div className="checks-row">
          {checks.map(c => (
            <div key={c.id} className={`check ${validation ? (c.pass ? 'pass' : 'fail') : ''}`}>
              {validation ? (c.pass ? '✅' : '❌') : '⬜'} {c.label}
            </div>
          ))}
        </div>

        {/* Sequence stats */}
        {stats && (
          <div className="seq-meta">
            <div className="seq-meta-item">Sequences: <span>{stats.count}</span></div>
            <div className="seq-meta-item">Length: <span>{stats.totalLength.toLocaleString()} bp</span></div>
            <div className="seq-meta-item">GC%: <span>{stats.gc}%</span></div>
            {stats.count > 1 && (
              <div className="seq-meta-item">Avg: <span>{stats.avgLength.toLocaleString()} bp</span></div>
            )}
          </div>
        )}

        {/* Errors */}
        {validation?.errors?.map((err, i) => (
          <div key={i} className="alert-box alert-error">⚠ {err}</div>
        ))}

        {/* Warnings */}
        {validation?.warnings?.map((w, i) => (
          <div key={i} className="alert-box alert-warn">⚠ {w}</div>
        ))}

        {/* Demo sequences */}
        <div style={{ marginTop: 20 }}>
          <div className="demo-label">Try a demo sequence:</div>
          <div className="demo-row">
            <button className="demo-chip" onClick={() => loadDemo('t4')}>🦠 T4 Phage (E. coli)</button>
            <button className="demo-chip" onClick={() => loadDemo('lambda')}>λ Lambda Phage</button>
            <button className="demo-chip" onClick={() => loadDemo('p22')}>P22 (Salmonella)</button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="action-row">
          <button className="btn-clear" onClick={() => handleChange('')}>✕ Clear</button>
          <button
            className="btn-analyse"
            disabled={!validation?.valid}
            onClick={handleAnalyse}
          >
            Analyse Genome →
          </button>
        </div>
      </div>
    </>
  )
}
