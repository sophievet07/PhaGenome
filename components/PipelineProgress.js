export default function PipelineProgress({ steps, jobId }) {
  return (
    <>
      <style>{`
        .pp-card { background:#fff; border:1px solid rgba(0,0,0,0.1); border-radius:14px; padding:28px; box-shadow:0 2px 16px rgba(0,0,0,0.07); margin-top:32px; }
        .pp-title { font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:600; color:#0F1F2E; margin-bottom:22px; display:flex;align-items:center;gap:10px; }
        .spinner { width:18px;height:18px;border:2px solid #E5EDF3;border-top-color:#00A882;border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0; }
        @keyframes spin{to{transform:rotate(360deg)}}
        .step-row { display:flex;align-items:center;gap:14px;padding:13px 16px;border-radius:8px;border:1px solid rgba(0,0,0,0.07);background:#FAFBFC;margin-bottom:8px;transition:all 0.3s; }
        .step-row.running { border-color:rgba(0,168,130,0.3);background:rgba(0,168,130,0.04); }
        .step-row.done { border-color:rgba(5,150,105,0.2);background:rgba(5,150,105,0.03); }
        .step-row.error { border-color:rgba(220,38,38,0.2);background:rgba(220,38,38,0.03); }
        .step-row.waiting { opacity:0.45; }
        .step-icon { font-size:1.1rem;width:26px;text-align:center;flex-shrink:0; }
        .step-body { flex:1;min-width:0; }
        .step-name { font-size:0.86rem;font-weight:500;color:#0F1F2E; }
        .step-detail { font-size:0.73rem;color:#8DA4BF;margin-top:2px; }
        .step-st { font-size:0.76rem;font-weight:600;white-space:nowrap;display:flex;align-items:center;gap:5px; }
        .step-st.running{color:#00A882;}
        .step-st.done{color:#059669;}
        .step-st.error{color:#DC2626;}
        .step-st.waiting{color:#B0C4D8;}
        .info-box { margin-top:18px;padding:12px 16px;background:#F0FAF7;border:1px solid rgba(0,168,130,0.2);border-radius:8px;font-size:0.8rem;color:#059669;font-family:'Inter',sans-serif; }
      `}</style>
      <div className="pp-card">
        <div className="pp-title"><div className="spinner"/>Analysis in Progress</div>
        {steps.map(s => (
          <div key={s.id} className={`step-row ${s.status}`}>
            <div className="step-icon">{s.icon}</div>
            <div className="step-body">
              <div className="step-name">{s.name}</div>
              <div className="step-detail">{s.detail}</div>
            </div>
            <div className={`step-st ${s.status}`}>
              {s.status==='running'&&<><div className="spinner" style={{width:13,height:13}}/>Running</>}
              {s.status==='done'&&'✓ Complete'}
              {s.status==='error'&&'⚠ '+( s.error||'Failed')}
              {s.status==='waiting'&&'Waiting'}
            </div>
          </div>
        ))}
        <div className="info-box">
          ℹ <strong>NCBI BLAST</strong> takes 3–15 minutes for phage genomes — this is normal.
          Keep this tab open. The pipeline continues automatically.
          {jobId&&<> · Job ID: <strong>{jobId}</strong></>}
        </div>
        <div style={{marginTop:10,padding:'10px 14px',background:'#FFF8E1',border:'1px solid #FFE082',borderRadius:8,fontSize:'0.78rem',color:'#795548',fontFamily:'Inter,sans-serif'}}>
          ⏱ Typical times: BLAST 3–15 min · PHASTER 2–5 min · Pharokka 10–25 min · tRNAscan 2–5 min
        </div>
      </div>
    </>
  )
}
