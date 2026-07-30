export default function PipelineProgress({ steps, jobId }) {
  return (
    <>
      <style>{`
        .progress-card {
          background: #0F2040; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 28px;
        }
        .progress-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.1rem; font-weight: 600;
          margin-bottom: 24px;
          display: flex; align-items: center; gap: 12px;
        }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: #00D4AA;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .steps-list { display: flex; flex-direction: column; gap: 10px; }
        .step-row {
          display: flex; align-items: center; gap: 16px;
          padding: 14px 18px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.05);
          background: #162847; transition: all 0.3s;
        }
        .step-row.running {
          border-color: rgba(0,212,170,0.3);
          background: rgba(0,212,170,0.06);
        }
        .step-row.done {
          border-color: rgba(104,211,145,0.2);
          background: rgba(104,211,145,0.04);
        }
        .step-row.error {
          border-color: rgba(252,129,129,0.2);
          background: rgba(252,129,129,0.04);
        }
        .step-row.waiting { opacity: 0.4; }
        .step-icon { font-size: 1.2rem; width: 28px; text-align: center; flex-shrink: 0; }
        .step-body { flex: 1; min-width: 0; }
        .step-name { font-size: 0.88rem; font-weight: 500; }
        .step-detail { font-size: 0.75rem; color: #8DA4BF; margin-top: 3px; }
        .step-status { font-size: 0.78rem; font-weight: 600; white-space: nowrap; }
        .step-status.running { color: #00D4AA; display: flex; align-items: center; gap: 6px; }
        .step-status.done { color: #68D391; }
        .step-status.error { color: #FC8181; }
        .step-status.waiting { color: #4A6080; }
        .job-info {
          margin-top: 20px; padding: 14px 18px;
          background: rgba(99,179,237,0.06);
          border: 1px solid rgba(99,179,237,0.2);
          border-radius: 8px; font-size: 0.82rem; color: #63B3ED;
        }
      `}</style>

      <div className="progress-card">
        <div className="progress-title">
          <div className="spinner" />
          Analysis in Progress
        </div>

        <div className="steps-list">
          {steps.map(step => (
            <div key={step.id} className={`step-row ${step.status}`}>
              <div className="step-icon">{step.icon}</div>
              <div className="step-body">
                <div className="step-name">{step.name}</div>
                <div className="step-detail">{step.detail}</div>
              </div>
              <div className={`step-status ${step.status}`}>
                {step.status === 'running' && (
                  <><div className="spinner" style={{ width: 14, height: 14 }} /> Running</>
                )}
                {step.status === 'done' && '✓ Complete'}
                {step.status === 'error' && '⚠ ' + (step.error || 'Failed')}
                {step.status === 'waiting' && 'Waiting'}
              </div>
            </div>
          ))}
        </div>

        <div className="job-info">
          ℹ Galaxy Europe analysis may take 5–30 minutes depending on queue.
          Your browser tab can remain open safely.
          {jobId && <> Job ID: <strong>{jobId}</strong></>}
        </div>
      </div>
    </>
  )
}
