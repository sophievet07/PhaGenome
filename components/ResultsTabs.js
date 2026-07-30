import { useState } from 'react'
import GenomeMap from './GenomeMap'

export default function ResultsTabs({ results }) {
  const [tab, setTab] = useState('overview')
  const { blast, phaster, annotation, trna, safety, validation, phylogeny } = results

  return (
    <>
      <style>{`
        .results-card {
          background: #0F2040; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 28px;
        }
        .summary-banner {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px; margin-bottom: 28px;
          padding: 18px 22px; border-radius: 10px;
          background: rgba(0,212,170,0.05);
          border: 1px solid rgba(0,212,170,0.2);
        }
        .phage-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.15rem; font-weight: 700;
        }
        .phage-tax { font-size: 0.78rem; color: #8DA4BF; margin-top: 3px; }
        .tag {
          display: inline-block; padding: 4px 12px; border-radius: 20px;
          font-size: 0.75rem; font-weight: 700;
        }
        .tag-lytic { background: rgba(252,129,129,0.15); color: #FC8181; }
        .tag-lysogenic { background: rgba(246,173,85,0.15); color: #F6AD55; }
        .tag-icar {
          background: rgba(0,212,170,0.1); color: #00D4AA;
          border: 1px solid rgba(0,212,170,0.2); font-weight: 500;
        }
        .tabs-row {
          display: flex; gap: 2px; margin-bottom: 24px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          overflow-x: auto; padding-bottom: 0;
        }
        .tab-btn {
          padding: 10px 18px; font-size: 0.85rem; font-weight: 500;
          color: #4A6080; cursor: pointer; border: none; background: none;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: all 0.2s; font-family: 'Inter', sans-serif;
          white-space: nowrap;
        }
        .tab-btn.active { color: #00D4AA; border-bottom-color: #00D4AA; }
        .tab-btn:hover:not(.active) { color: #F0F4F8; }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .stat-item {
          background: #162847; border-radius: 8px; padding: 14px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .stat-label {
          font-size: 0.7rem; color: #4A6080;
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;
        }
        .stat-value {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.05rem; font-weight: 600;
        }
        .stat-value.accent { color: #00D4AA; }
        .stat-value.success { color: #68D391; }
        .stat-value.danger { color: #FC8181; }
        .stat-value.warn { color: #F6AD55; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 700px) { .two-col { grid-template-columns: 1fr; } }
        .sub-card {
          background: #0A1628; border-radius: 10px; padding: 20px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .sub-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.9rem; font-weight: 600; margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
        th {
          text-align: left; padding: 9px 12px;
          color: #4A6080; font-weight: 500; font-size: 0.7rem;
          text-transform: uppercase; letter-spacing: 0.04em;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        td { padding: 9px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: rgba(255,255,255,0.02); }
        a.acc-link { color: #00D4AA; text-decoration: none; }
        a.acc-link:hover { text-decoration: underline; }
        .orf-tag {
          display: inline-block; padding: 2px 8px; border-radius: 10px;
          font-size: 0.68rem; font-weight: 600;
        }
        .orf-structural { background: rgba(0,212,170,0.12); color: #00D4AA; }
        .orf-replication { background: rgba(99,179,237,0.12); color: #63B3ED; }
        .orf-lysis { background: rgba(252,129,129,0.12); color: #FC8181; }
        .orf-hypothetical { background: rgba(255,255,255,0.05); color: #4A6080; }
        .orf-other { background: rgba(128,90,213,0.12); color: #805AD5; }
        .trna-item {
          display: flex; gap: 14px; padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          align-items: flex-start;
        }
        .trna-item:last-child { border-bottom: none; }
        .trna-pos {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem; color: #00D4AA; min-width: 90px; flex-shrink: 0;
          margin-top: 2px;
        }
        .trna-name { font-size: 0.85rem; font-weight: 500; }
        .trna-sig { font-size: 0.76rem; color: #8DA4BF; margin-top: 4px; line-height: 1.5; }
        .safety-panel {
          border-radius: 10px; padding: 20px; border: 2px solid; margin-bottom: 20px;
        }
        .safety-panel.safe { border-color: #68D391; background: rgba(104,211,145,0.04); }
        .safety-panel.caution { border-color: #F6AD55; background: rgba(246,173,85,0.04); }
        .safety-panel.unsafe { border-color: #FC8181; background: rgba(252,129,129,0.04); }
        .safety-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: 6px; }
        .safety-panel.safe .safety-title { color: #68D391; }
        .safety-panel.caution .safety-title { color: #F6AD55; }
        .safety-panel.unsafe .safety-title { color: #FC8181; }
        .disclaimer {
          font-size: 0.74rem; color: #4A6080; margin-top: 16px;
          padding: 12px 16px; background: #162847; border-radius: 8px;
          line-height: 1.6;
        }
        .download-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 28px; }
        .btn-dl {
          padding: 10px 18px; border-radius: 8px;
          background: #162847; border: 1px solid rgba(255,255,255,0.07);
          color: #8DA4BF; font-size: 0.82rem; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.2s;
          display: flex; align-items: center; gap: 6px;
        }
        .btn-dl:hover { border-color: #00D4AA; color: #00D4AA; }
        .btn-new {
          padding: 10px 20px; border-radius: 8px;
          background: linear-gradient(135deg, #00D4AA, #00A882);
          color: #0A1628; font-size: 0.82rem; font-weight: 700;
          border: none; cursor: pointer;
          font-family: 'Inter', sans-serif;
        }
        .lifestyle-result {
          display: flex; gap: 20px; align-items: flex-start;
          flex-wrap: wrap; margin-bottom: 16px;
        }
        .lifestyle-badge {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2rem; font-weight: 700;
        }
        .evidence-list {
          list-style: none; padding: 0;
          font-size: 0.82rem; color: #8DA4BF; line-height: 2;
        }
        .evidence-list li::before { content: '• '; color: #00D4AA; }
        .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; }
      `}</style>

      <div className="results-card">
        {/* Summary banner */}
        <div className="summary-banner">
          <div>
            <div className="phage-name">{blast?.topHit || validation?.sequences?.[0]?.header || 'Unknown Phage'}</div>
            <div className="phage-tax">{blast?.taxonomy || 'Taxonomy pending'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className={`tag ${phaster?.lifestyle === 'Lytic' ? 'tag-lytic' : 'tag-lysogenic'}`}>
              {phaster?.lifestyle || '—'}
            </span>
            <span className="tag tag-icar">PhaGenome · ICAR-NMRI</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-row">
          {['overview','annotation','tRNA','safety','phylogeny','genome map'].map(t => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'safety' ? '🛡 Safety' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <div>
            <div className="two-col" style={{ marginBottom: 20 }}>
              <div className="sub-card">
                <div className="sub-title">📊 Genome Statistics</div>
                <div className="stat-grid">
                  <div className="stat-item">
                    <div className="stat-label">Genome Size</div>
                    <div className="stat-value accent">{(validation?.totalLength || 0).toLocaleString()} bp</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">GC Content</div>
                    <div className="stat-value">{validation?.gc || 0}%</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Total ORFs</div>
                    <div className="stat-value accent">{annotation?.total || '—'}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Functional ORFs</div>
                    <div className="stat-value success">{annotation?.functional || '—'}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">tRNA Genes</div>
                    <div className="stat-value accent">{trna?.count || 0}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Safety Status</div>
                    <div className={`stat-value ${safety?.overall === 'SAFE' ? 'success' : 'danger'}`}>
                      {safety?.overall || '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="sub-card">
                <div className="sub-title">🔍 NCBI BLAST — Top Hits</div>
                <table>
                  <thead>
                    <tr><th>Accession</th><th>Identity</th><th>E-value</th></tr>
                  </thead>
                  <tbody>
                    {(blast?.hits || []).map((h, i) => (
                      <tr key={i}>
                        <td>
                          <a className="acc-link" href={`https://www.ncbi.nlm.nih.gov/nuccore/${h.accession}`} target="_blank" rel="noreferrer">
                            {h.accession}
                          </a>
                          <div style={{ fontSize: '0.7rem', color: '#4A6080', marginTop: 2 }}>{h.description?.substring(0, 45)}...</div>
                        </td>
                        <td className="mono">{h.identity}%</td>
                        <td className="mono">{h.evalue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lifestyle */}
            <div className="sub-card">
              <div className="sub-title">🧫 Lifestyle Prediction (PHASTER)</div>
              <div className="lifestyle-result">
                <div>
                  <div className={`lifestyle-badge ${phaster?.lifestyle === 'Lytic' ? '' : ''}`}
                    style={{ color: phaster?.lifestyle === 'Lytic' ? '#FC8181' : '#F6AD55' }}>
                    {phaster?.lifestyle || '—'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#4A6080', marginTop: 4 }}>
                    Confidence: {phaster?.confidence || 0}%
                  </div>
                </div>
                <ul className="evidence-list">
                  {(phaster?.evidence || []).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── ANNOTATION TAB ── */}
        {tab === 'annotation' && (
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { label: `Total: ${annotation?.total}`, cls: '' },
                { label: `Structural: ${annotation?.structural}`, cls: 'orf-structural' },
                { label: `Replication: ${annotation?.replication}`, cls: 'orf-replication' },
                { label: `Lysis: ${annotation?.lysis}`, cls: 'orf-lysis' },
                { label: `Hypothetical: ${annotation?.hypothetical}`, cls: 'orf-hypothetical' },
              ].map((b, i) => (
                <span key={i} className={`orf-tag ${b.cls}`} style={{ padding: '5px 14px', fontSize: '0.8rem' }}>
                  {b.label}
                </span>
              ))}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>ORF</th><th>Start</th><th>Stop</th>
                    <th>Strand</th><th>Length</th><th>Function</th><th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {(annotation?.orfs || []).slice(0, 60).map((o, i) => (
                    <tr key={i}>
                      <td className="mono">ORF{String(i + 1).padStart(3, '0')}</td>
                      <td className="mono">{o.start?.toLocaleString()}</td>
                      <td className="mono">{o.stop?.toLocaleString()}</td>
                      <td style={{ color: o.strand === '+' ? '#00D4AA' : '#63B3ED' }}>{o.strand}</td>
                      <td className="mono">{o.aaLen} aa</td>
                      <td style={{ fontSize: '0.76rem' }}>{o.function}</td>
                      <td><span className={`orf-tag orf-${o.category}`}>{o.category}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── tRNA TAB ── */}
        {tab === 'tRNA' && (
          <div>
            {(!trna?.count || trna.count === 0) ? (
              <div style={{ padding: '20px', background: 'rgba(99,179,237,0.06)', borderRadius: 8, border: '1px solid rgba(99,179,237,0.2)', color: '#63B3ED', fontSize: '0.85rem' }}>
                ℹ No tRNA genes detected. Common in small phages that rely entirely on host tRNA machinery.
              </div>
            ) : (
              <>
                <div style={{ padding: '12px 16px', background: 'rgba(104,211,145,0.06)', borderRadius: 8, border: '1px solid rgba(104,211,145,0.2)', color: '#68D391', fontSize: '0.85rem', marginBottom: 20 }}>
                  ✅ {trna.count} tRNA gene{trna.count > 1 ? 's' : ''} detected — indicates enhanced translational capacity
                </div>
                {(trna.trnas || []).map((t, i) => (
                  <div key={i} className="trna-item">
                    <div className="trna-pos">{t.pos}</div>
                    <div>
                      <div className="trna-name">
                        tRNA-<strong>{t.aa}</strong>
                        <span style={{ marginLeft: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#00D4AA' }}>
                          anticodon: {t.anticodon}
                        </span>
                      </div>
                      <div className="trna-sig">💡 {t.significance}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── SAFETY TAB ── */}
        {tab === 'safety' && (
          <div>
            <div className={`safety-panel ${safety?.overall === 'SAFE' ? 'safe' : safety?.overall === 'CAUTION' ? 'caution' : 'unsafe'}`}>
              <div className="safety-title">
                {safety?.overall === 'SAFE' ? '✅ SAFE — No AMR or Toxin Genes Detected'
                  : safety?.overall === 'CAUTION' ? '⚠️ CAUTION — Low-level hits detected'
                  : '🚨 UNSAFE — Significant resistance/toxin genes found'}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#8DA4BF' }}>
                {safety?.overall === 'SAFE'
                  ? 'No antimicrobial resistance or toxin genes detected above significance threshold. This phage may be suitable for further biocontrol or therapeutic evaluation.'
                  : 'One or more concerning genes detected. Detailed review required before any application.'}
              </div>
            </div>

            <div className="two-col">
              <div className="sub-card">
                <div className="sub-title">🦠 AMR Gene Screening</div>
                <div className="stat-grid">
                  <div className="stat-item"><div className="stat-label">Database</div><div className="stat-value" style={{ fontSize: '0.85rem' }}>CARD v3.2.6</div></div>
                  <div className="stat-item"><div className="stat-label">Genes Screened</div><div className="stat-value">{(safety?.amr?.genesScreened || 0).toLocaleString()}</div></div>
                  <div className="stat-item"><div className="stat-label">Hits (≥80% ID)</div><div className={`stat-value ${safety?.amr?.hitsAboveThreshold > 0 ? 'danger' : 'success'}`}>{safety?.amr?.hitsAboveThreshold || 0}</div></div>
                  <div className="stat-item"><div className="stat-label">Status</div><div className="stat-value success">{safety?.amr?.status || 'CLEAN'}</div></div>
                </div>
              </div>
              <div className="sub-card">
                <div className="sub-title">☣️ Toxin Gene Screening</div>
                <div className="stat-grid">
                  <div className="stat-item"><div className="stat-label">Database</div><div className="stat-value" style={{ fontSize: '0.85rem' }}>VFDB 2024</div></div>
                  <div className="stat-item"><div className="stat-label">Genes Screened</div><div className="stat-value">{(safety?.toxin?.genesScreened || 0).toLocaleString()}</div></div>
                  <div className="stat-item"><div className="stat-label">Hits (≥80% ID)</div><div className={`stat-value ${safety?.toxin?.hitsAboveThreshold > 0 ? 'danger' : 'success'}`}>{safety?.toxin?.hitsAboveThreshold || 0}</div></div>
                  <div className="stat-item"><div className="stat-label">Status</div><div className="stat-value success">{safety?.toxin?.status || 'CLEAN'}</div></div>
                </div>
              </div>
            </div>

            <div className="disclaimer">
              ⚠ This safety report is generated for research purposes only. Regulatory approval
              for biocontrol or therapeutic applications requires additional validation as per
              applicable guidelines (FSSAI, CDSCO, EMA, FDA). Databases: {(safety?.databases || []).join(' · ')}
            </div>
          </div>
        )}

        {/* ── PHYLOGENY TAB ── */}
        {tab === 'phylogeny' && (
          <PhylogenyTab phylogeny={phylogeny} blast={blast} />
        )}

        {/* ── GENOME MAP TAB ── */}
        {tab === 'genome map' && (
          <GenomeMap
            annotation={annotation}
            trna={trna}
            validation={validation}
            phageName={blast?.topHit}
          />
        )}

        {/* Download row */}
        <div className="download-row">
          <button className="btn-dl" onClick={() => downloadReport(results)}>⬇ Full Report</button>
          <button className="btn-dl" onClick={() => downloadSafety(results)}>⬇ Safety Certificate</button>
          <button className="btn-dl" onClick={() => downloadGenBank(results)}>⬇ GenBank File</button>
          <button className="btn-new" onClick={() => window.location.reload()}>+ New Analysis</button>
        </div>
      </div>
    </>
  )
}

// ── PHYLOGENY TAB COMPONENT ──
function PhylogenyTab({ phylogeny, blast }) {
  if (!phylogeny) return (
    <div style={{padding:'24px',background:'#F8FAFB',borderRadius:'10px',color:'#8DA4BF',textAlign:'center'}}>
      Analysis in progress — phylogeny data not yet available
    </div>
  )

  const ictv = phylogeny.ictv || blast?.ictv

  return (
    <div>
      <style>{`
        .ictv-card {background:#F0FAF7;border:2px solid rgba(0,168,130,0.25);border-radius:10px;padding:20px;margin-bottom:20px;}
        .ictv-title {font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:1rem;color:#00A882;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
        .ictv-grid {display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .ictv-item {background:#fff;border-radius:7px;padding:12px;border:1px solid rgba(0,0,0,0.07);}
        .ictv-label {font-size:0.68rem;color:#8DA4BF;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;font-family:'Inter',sans-serif;}
        .ictv-value {font-size:0.88rem;font-weight:600;color:#0F1F2E;font-family:'Inter',sans-serif;}
        .ictv-value.accent {color:#00A882;}
        .ictv-value.warn {color:#D97706;}
        .tool-card {background:#fff;border:1px solid rgba(0,0,0,0.09);border-radius:10px;padding:18px;margin-bottom:12px;transition:border-color 0.2s;}
        .tool-card:hover {border-color:#00A882;}
        .tool-card.recommended {border-color:rgba(0,168,130,0.3);background:#FAFFFE;}
        .tool-name {font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:0.95rem;color:#0F1F2E;margin-bottom:4px;display:flex;align-items:center;gap:8px;}
        .tool-badge {font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:10px;background:rgba(0,168,130,0.1);color:#00A882;}
        .tool-desc {font-size:0.8rem;color:#4A6080;margin-bottom:8px;line-height:1.5;}
        .tool-howto {font-size:0.76rem;color:#8DA4BF;background:#F8FAFB;padding:10px 12px;border-radius:6px;border-left:3px solid #00A882;line-height:1.6;}
        .workflow-list {counter-reset:wf;list-style:none;padding:0;}
        .workflow-list li {counter-increment:wf;display:flex;gap:10px;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.06);font-size:0.84rem;color:#4A6080;font-family:'Inter',sans-serif;}
        .workflow-list li::before {content:counter(wf);min-width:24px;height:24px;background:#00A882;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;flex-shrink:0;}
        .workflow-list li:last-child {border-bottom:none;}
        .note-box {background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:14px 16px;font-size:0.8rem;color:#92400E;margin-top:16px;line-height:1.6;}
        .acc-chips {display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;}
        .acc-chip {padding:4px 12px;border-radius:20px;background:#F0F4F7;border:1px solid rgba(0,0,0,0.1);font-size:0.74rem;font-family:'JetBrains Mono',monospace;color:#4A6080;}
        .section-title {font-family:'Space Grotesk',sans-serif;font-size:1rem;font-weight:700;color:#0F1F2E;margin:24px 0 14px;display:flex;align-items:center;gap:8px;}
      `}</style>

      {/* ICTV Classification */}
      {ictv && (
        <div className="ictv-card">
          <div className="ictv-title">🏷 ICTV 2024 Classification (Predicted)</div>
          <div className="ictv-grid">
            {[
              { label:'Realm',    val:ictv.realm    || 'Duplodnaviria',   cls:'' },
              { label:'Kingdom',  val:ictv.kingdom  || 'Heunggongvirae',  cls:'' },
              { label:'Phylum',   val:ictv.phylum   || 'Uroviricota',     cls:'' },
              { label:'Class',    val:ictv.class    || 'Caudoviricetes',  cls:'' },
              { label:'Family',   val:ictv.family   || 'Undetermined',    cls:'accent' },
              { label:'Genus',    val:ictv.genus    || 'Undetermined',    cls:'accent' },
              { label:'Species',  val:ictv.species  || 'Novel species',   cls:'warn' },
              { label:'Confidence', val:ictv.confidence || 'Low',         cls:'' },
            ].map((item,i) => (
              <div key={i} className="ictv-item">
                <div className="ictv-label">{item.label}</div>
                <div className={`ictv-value ${item.cls}`}>{item.val}</div>
              </div>
            ))}
          </div>
          {ictv.demarcation && (
            <div style={{marginTop:12,fontSize:'0.75rem',color:'#8DA4BF',fontFamily:'Inter,sans-serif'}}>
              ℹ {ictv.demarcation}
            </div>
          )}
        </div>
      )}

      {/* Closest relatives */}
      {phylogeny.closestRelatives?.length > 0 && (
        <div>
          <div className="section-title">🔗 Closest Relatives (for phylogeny)</div>
          <div style={{fontSize:'0.82rem',color:'#4A6080',marginBottom:8,fontFamily:'Inter,sans-serif'}}>
            Download these accessions from NCBI and include in your phylogenetic analysis:
          </div>
          <div className="acc-chips">
            {phylogeny.closestRelatives.map((acc,i) => (
              <a key={i} className="acc-chip" href={`https://www.ncbi.nlm.nih.gov/nuccore/${acc}`} target="_blank" rel="noreferrer">
                {acc}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Recommended workflow */}
      {phylogeny.recommendedWorkflow && (
        <div>
          <div className="section-title">📋 Recommended Phylogeny Workflow</div>
          <ul className="workflow-list">
            {phylogeny.recommendedWorkflow.map((step,i) => (
              <li key={i}>{step.replace(/^\d+\. /, '')}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Free tools */}
      <div className="section-title">🛠 Free Phylogeny Tools</div>
      {(phylogeny.tools || []).map((tool,i) => (
        <div key={i} className={`tool-card ${tool.recommended ? 'recommended' : ''}`}>
          <div className="tool-name">
            <a href={tool.url} target="_blank" rel="noreferrer" style={{color:'#0F1F2E',textDecoration:'none'}}>{tool.name}</a>
            {tool.recommended && <span className="tool-badge">★ Recommended</span>}
            <span style={{fontSize:'0.7rem',color:'#059669',marginLeft:'auto'}}>Free</span>
          </div>
          <div className="tool-desc">{tool.description}</div>
          <div className="tool-howto">
            <strong>How to use:</strong> {tool.howTo}<br/>
            <strong>Output:</strong> {tool.output}
          </div>
        </div>
      ))}

      <div className="note-box">
        ⚠ <strong>Important:</strong> For ICTV-compliant species and genus demarcation, use VIRIDIC (intergenomic similarity) and VICTOR (phylogenomic distance). These are the tools recognized by ICTV for formal taxonomic proposals. Submit to ICTV Study Groups for official classification.
      </div>
    </div>
  )
}

// ── DOWNLOAD HELPERS ──
function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function downloadReport(r) {
  const sep = '='.repeat(70)
  const div = '-'.repeat(50)
  let txt = `PHAGENOME ANALYSIS REPORT\n${sep}\n`
  txt += `Generated   : ${new Date().toLocaleString()}\n`
  txt += `Job ID      : ${r.jobId || '—'}\n`
  txt += `Platform    : PhaGenome — ICAR-National Meat Research Institute, Hyderabad\n\n`

  txt += `GENOME IDENTIFICATION\n${div}\n`
  txt += `Phage name  : ${r.blast?.topHit || r.validation?.sequences?.[0]?.header || 'Novel phage'}\n`
  txt += `Taxonomy    : ${r.blast?.taxonomy || 'Viruses > Caudoviricetes'}\n`
  txt += `Genome size : ${(r.validation?.totalLength || 0).toLocaleString()} bp (${((r.validation?.totalLength||0)/1000).toFixed(2)} kb)\n`
  txt += `GC content  : ${r.validation?.gc || 0}%\n`
  txt += `Sequences   : ${r.validation?.sequences?.length || 1}\n\n`

  txt += `NCBI BLAST TOP HITS\n${div}\n`
  if (r.blast?.hits?.length > 0) {
    r.blast.hits.forEach((h,i) => {
      txt += `  ${i+1}. ${h.accession} — ${h.description}\n`
      txt += `     Identity: ${h.identity}% | Coverage: ${h.coverage}% | E-value: ${h.evalue}\n`
    })
  } else { txt += `  No significant hits found — likely novel phage\n` }
  txt += `\n`

  txt += `LIFESTYLE PREDICTION (PHASTER)\n${div}\n`
  txt += `Lifestyle   : ${r.phaster?.lifestyle || '—'}\n`
  txt += `Confidence  : ${r.phaster?.confidence || 0}%\n`
  txt += `Evidence:\n`
  ;(r.phaster?.evidence || []).forEach(e => { txt += `  • ${e}\n` })
  txt += `\n`

  txt += `GENOME ANNOTATION\n${div}\n`
  txt += `Total ORFs           : ${r.annotation?.total || 0}\n`
  txt += `Functional ORFs      : ${r.annotation?.functional || 0}\n`
  txt += `Structural proteins  : ${r.annotation?.structural || 0}\n`
  txt += `Replication proteins : ${r.annotation?.replication || 0}\n`
  txt += `Lysis proteins       : ${r.annotation?.lysis || 0}\n`
  txt += `Hypothetical proteins: ${r.annotation?.hypothetical || 0}\n\n`

  txt += `tRNA GENES (tRNAscan-SE)\n${div}\n`
  txt += `Total tRNA genes: ${r.trna?.count || 0}\n`
  if (r.trna?.trnas?.length > 0) {
    r.trna.trnas.forEach(t => {
      txt += `  tRNA-${t.aa} | anticodon: ${t.anticodon} | position: ${t.pos}\n`
      txt += `    Significance: ${t.significance || t.sig || 'Supplements host tRNA machinery — improves phage translational efficiency'}\n`
    })
  }
  txt += `\n`

  txt += `SAFETY SCREENING\n${div}\n`
  txt += `Overall status  : ${r.safety?.overall || 'SAFE'}\n`
  txt += `AMR genes (CARD): ${r.safety?.amr?.hitsAboveThreshold || 0} hits above threshold\n`
  txt += `Toxin genes (VFDB): ${r.safety?.toxin?.hitsAboveThreshold || 0} hits above threshold\n`
  txt += `Databases used  : ${(r.safety?.databases || ['CARD v3.2.6','VFDB 2024']).join(', ')}\n\n`

  // ICTV classification
  const ictv = r.blast?.ictv || r.phylogeny?.ictv
  if (ictv) {
    txt += `ICTV 2024 TAXONOMIC CLASSIFICATION\n${div}\n`
    txt += `Realm    : ${ictv.realm    || 'Duplodnaviria'}\n`
    txt += `Kingdom  : ${ictv.kingdom  || 'Heunggongvirae'}\n`
    txt += `Phylum   : ${ictv.phylum   || 'Uroviricota'}\n`
    txt += `Class    : ${ictv.class    || 'Caudoviricetes'}\n`
    txt += `Family   : ${ictv.family   || 'Undetermined — VIRIDIC analysis required'}\n`
    txt += `Genus    : ${ictv.genus    || 'Undetermined'}\n`
    txt += `Species  : ${ictv.species  || 'Novel species'}\n`
    txt += `Confidence: ${ictv.confidence || 'Low'}\n`
    txt += `Demarcation: ${ictv.demarcation || 'ANI >95% = same species (ICTV 2024)'}\n\n`
  }

  txt += `PHYLOGENETIC ANALYSIS TOOLS\n${div}\n`
  txt += `Recommended tools for publication-quality phylogeny:\n`
  txt += `  1. VICTOR   — https://victor.dsmz.de/ (ICTV-recommended genome phylogeny)\n`
  txt += `  2. VIRIDIC  — https://rhea.icbm.uni-oldenburg.de/VIRIDIC/ (genus/species demarcation)\n`
  txt += `  3. IQ-TREE  — https://usegalaxy.eu (maximum likelihood phylogeny)\n`
  txt += `  4. iTOL     — https://itol.embl.de/ (publication-quality tree visualization)\n\n`

  txt += `SUGGESTED METHODS CITATION\n${div}\n`
  txt += `Phage genome analysis was performed using PhaGenome (ICAR-NMRI, Hyderabad).\n`
  txt += `Identification: NCBI BLAST (RefSeq nt database).\n`
  txt += `Lifestyle: PHASTER. Annotation: Pharokka v1.4.1 / PHROG database.\n`
  txt += `tRNA: tRNAscan-SE v2.0.9 via Galaxy Europe.\n`
  txt += `Safety: ABRICATE v1.0.1 against CARD v3.2.6 and VFDB (2024).\n\n`

  txt += `${sep}\n`
  txt += `PhaGenome — ICAR-National Meat Research Institute, Hyderabad, India\n`
  txt += `Free & Open Access · https://phagenome.vercel.app\n`
  txt += `⚠ This report is for research purposes. Regulatory approval requires further testing.\n`
  downloadText(txt, 'phagenome_analysis_report.txt')
}

function downloadSafety(r) {
  let txt = `PHAGENOME SAFETY CERTIFICATE\n${'═'.repeat(60)}\n`
  txt += `Phage: ${r.blast?.topHit || 'Unknown'}\n`
  txt += `Date: ${new Date().toLocaleString()}\n\n`
  txt += `AMR SCREENING (CARD v3.2.6)\nStatus: ${r.safety?.amr?.status}\nHits: ${r.safety?.amr?.hitsAboveThreshold || 0}\n\n`
  txt += `TOXIN SCREENING (VFDB 2024)\nStatus: ${r.safety?.toxin?.status}\nHits: ${r.safety?.toxin?.hitsAboveThreshold || 0}\n\n`
  txt += `OVERALL: ${r.safety?.overall}\n\n`
  txt += `For research purposes only.\nPhaGenome — ICAR-NMRI, Hyderabad\n`
  downloadText(txt, 'phagenome_safety_certificate.txt')
}

function downloadGenBank(r) {
  const len = r.validation?.totalLength || 0
  let gb = `LOCUS       PHAGENOME    ${len} bp    DNA\n`
  gb += `DEFINITION  ${r.blast?.topHit || 'Unknown phage'} — Annotated by PhaGenome\n`
  gb += `SOURCE      Bacteriophage\nCOMMENT     ICAR-NMRI, Hyderabad\nFEATURES\n`
  if (r.annotation?.orfs) {
    r.annotation.orfs.forEach((o, i) => {
      const loc = o.strand === '+' ? `${o.start}..${o.stop}` : `complement(${o.start}..${o.stop})`
      gb += `     CDS    ${loc}\n                     /product="${o.function}"\n`
    })
  }
  gb += `ORIGIN\n//\n`
  downloadText(gb, 'phagenome_annotation.gb')
}
