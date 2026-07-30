import { useState, useRef } from 'react'
import { validateFasta, getSequenceStats } from '../utils/fastaValidator'

const DEMOS = {
  t4: `>NC_000866.4 Enterobacteria phage T4 complete genome (demo)
ATGTTTAAAGTTTTTATTTTAGTTTTAATTTTTTTTAGTATCTTTATTTTTTTATATTTTTCAATGTTTATTATTTAC
ATAAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTT
ATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTAT
AATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTATAATTTTT
AATTTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTATAATTTTTAAT
TTTTATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTATAATTTTTAATTTTT
ATAATTTTTAATTTTTATAATTTTTAATTTTTATAATTTTTAATATAAATTTTTAATTTTTATAATTTTTAATTTTTATA`,
  lambda: `>NC_001416.1 Enterobacteria phage lambda (demo)
GGGCGGCGACCTCGCGGGTTTTCGCTATTTATGAAAATTTTCCGGTTTAAGGCGTTTCCGTTCTTCTTCGTCATAAC
TTAATGTTTTTATTTAAAATACCCTCTGAAAAGAAAGGAAACGACATTTAAGAATCTGATGGCCTCATACACTTTTAA
AAGAAAAGGGGGGACTGGAAGGGCTAATTCACTCCCAAAGAAGACAAGATATCCTTGATCTGTGGATCTACCACAGAC
AAGGAGAAGAGCTCGGCGGATGCAAGAAATCTTGTCCCAGCCTCACCCTCCAAGTTGGGGCATGGACAGGGACAGCAG
AGATCCAGCTATGACCGAGATCGAAACCCGGTCACCAAATACTGTTCTTCGCCCCGAACCGGGACTTGAACCCGCACG
CCGCGTGAGGGATGACGGCCCGGGCGGGATCTTCGTACTCGGACTACTACCCGGCGGCTTCCCAGCGCCTCCAGTTCG`,
  p22: `>NC_002371.2 Salmonella phage P22 (demo)
ATGGATATTAATACAACCACAAATCCAATGGAAACTCTAAATCAAATCAGTGCAAAAGGTTTTGATCGAGCAGTCATC
GAAGCAATGCAAGAAGCCTTTGAAGGAATTGATAATGATAATGATCAAACAATCAGCAAAGTTGATATTGACGCGGTA
GATGCAGATCAGTTAATTAAAGATAATGAAGAAGATAATGATGATGATAATGATGATGATAATGATAATGATGATGAT
AATAATGATAATGATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATAATA
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
    if (result.sequences.length > 0) setStats(getSequenceStats(result.sequences))
    else setStats(null)
  }

  function loadDemo(key) { handleChange(DEMOS[key]) }

  function loadFile(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => handleChange(ev.target.result)
    reader.readAsText(file)
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
        .fi-card {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 14px; padding: 28px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
          margin-top: 32px;
        }
        .fi-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1rem; font-weight: 600;
          color: #0F1F2E; margin-bottom: 18px;
          display: flex; align-items: center; gap: 8px;
        }
        .upload-zone {
          border: 2px dashed rgba(0,0,0,0.12);
          border-radius: 8px; padding: 16px;
          text-align: center; cursor: pointer;
          transition: all 0.2s; margin-bottom: 14px;
          background: #FAFBFC;
        }
        .upload-zone:hover {
          border-color: #00A882;
          background: rgba(0,168,130,0.03);
        }
        .upload-zone p { font-size: 0.8rem; color: #8DA4BF; margin-top: 6px; }
        .fasta-area {
          width: 100%; min-height: 200px;
          background: #FAFBFC;
          border: 1.5px solid rgba(0,0,0,0.1);
          border-radius: 8px; padding: 16px;
          color: #0F1F2E;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.78rem; line-height: 1.7;
          resize: vertical; outline: none;
          transition: border-color 0.2s;
        }
        .fasta-area:focus { border-color: #00A882; box-shadow: 0 0 0 3px rgba(0,168,130,0.08); }
        .fasta-area.valid { border-color: #059669; }
        .fasta-area.error { border-color: #DC2626; }
        .fasta-area::placeholder { color: #B0C4D8; }
        .checks-row { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px; }
        .check { display: flex; align-items: center; gap: 5px; font-size: 0.76rem; color: #B0C4D8; font-family: 'Inter', sans-serif; }
        .check.pass { color: #059669; }
        .check.fail { color: #DC2626; }
        .seq-meta { display: flex; gap: 20px; flex-wrap: wrap; margin-top: 10px; }
        .seq-meta-item { font-size: 0.75rem; color: #8DA4BF; font-family: 'JetBrains Mono', monospace; }
        .seq-meta-item span { color: #00A882; font-weight: 600; }
        .alert-box { padding: 10px 14px; border-radius: 7px; font-size: 0.8rem; margin-top: 10px; display: flex; gap: 8px; font-family: 'Inter', sans-serif; }
        .alert-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; }
        .alert-warn { background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; }
        .demo-section { margin-top: 20px; }
        .demo-label { font-size: 0.76rem; color: #8DA4BF; margin-bottom: 8px; font-family: 'Inter', sans-serif; }
        .demo-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .demo-chip {
          padding: 6px 14px; border-radius: 20px;
          background: #F8FAFB; border: 1px solid rgba(0,0,0,0.1);
          font-size: 0.75rem; color: #4A6080; cursor: pointer;
          transition: all 0.2s; font-family: 'Inter', sans-serif;
        }
        .demo-chip:hover { border-color: #00A882; color: #00A882; background: rgba(0,168,130,0.05); }
        .action-row { display: flex; justify-content: space-between; align-items: center; margin-top: 22px; flex-wrap: wrap; gap: 12px; }
        .btn-clear { background: none; border: 1px solid rgba(0,0,0,0.1); color: #8DA4BF; font-size: 0.82rem; cursor: pointer; padding: 8px 16px; font-family: 'Inter', sans-serif; transition: all 0.2s; border-radius: 7px; }
        .btn-clear:hover { color: #DC2626; border-color: #DC2626; }
        .btn-analyse {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 26px; border-radius: 8px;
          background: #00A882; color: #fff;
          font-weight: 600; font-size: 0.92rem;
          border: none; cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,168,130,0.3);
        }
        .btn-analyse:hover:not(:disabled) { background: #007A60; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,168,130,0.35); }
        .btn-analyse:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
        .divider { height: 1px; background: rgba(0,0,0,0.07); margin: 20px 0; }
      `}</style>

      <div className="fi-card">
        <div className="fi-title">📋 Paste your phage FASTA sequence</div>

        <div className="upload-zone" onClick={() => fileRef.current?.click()}>
          <div style={{ fontSize: '1.3rem' }}>📁</div>
          <p>Drop a .fasta / .fa / .fna file here, or click to browse</p>
        </div>
        <input ref={fileRef} type="file" accept=".fasta,.fa,.fna,.txt" style={{ display: 'none' }} onChange={loadFile} />

        <textarea
          className={`fasta-area ${validation?.valid ? 'valid' : validation && !validation.valid ? 'error' : ''}`}
          value={text}
          onChange={e => handleChange(e.target.value)}
          placeholder={`>Phage_genome_1\nATGCATGCATGCATGC...\n\nPaste one or multiple phage FASTA sequences here.\nMinimum size: 10,000 bp`}
          rows={10}
        />

        <div className="checks-row">
          {checks.map(c => (
            <div key={c.id} className={`check ${validation ? (c.pass ? 'pass' : 'fail') : ''}`}>
              {validation ? (c.pass ? '✅' : '❌') : '⬜'} {c.label}
            </div>
          ))}
        </div>

        {stats && (
          <div className="seq-meta">
            <div className="seq-meta-item">Sequences: <span>{stats.count}</span></div>
            <div className="seq-meta-item">Length: <span>{stats.totalLength.toLocaleString()} bp</span></div>
            <div className="seq-meta-item">GC%: <span>{stats.gc}%</span></div>
          </div>
        )}

        {validation?.errors?.map((err, i) => <div key={i} className="alert-box alert-error">⚠ {err}</div>)}
        {validation?.warnings?.map((w, i) => <div key={i} className="alert-box alert-warn">⚠ {w}</div>)}

        <div className="divider" />

        <div className="demo-section">
          <div className="demo-label">Try a demo sequence:</div>
          <div className="demo-row">
            <button className="demo-chip" onClick={() => loadDemo('t4')}>🦠 T4 Phage (E. coli)</button>
            <button className="demo-chip" onClick={() => loadDemo('lambda')}>λ Lambda Phage</button>
            <button className="demo-chip" onClick={() => loadDemo('p22')}>P22 (Salmonella)</button>
          </div>
        </div>

        <div className="action-row">
          <button className="btn-clear" onClick={() => handleChange('')}>✕ Clear</button>
          <button className="btn-analyse" disabled={!validation?.valid} onClick={() => onAnalyse(validation.sequences)}>
            Analyse Genome →
          </button>
        </div>
      </div>
    </>
  )
}
