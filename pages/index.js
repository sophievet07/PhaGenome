import Head from 'next/head'
import { useState } from 'react'
import Navbar from '../components/Navbar'
import FastaInput from '../components/FastaInput'
import PipelineProgress from '../components/PipelineProgress'
import ResultsTabs from '../components/ResultsTabs'
import { runPipeline } from '../utils/pipeline'

const INITIAL_STEPS = [
  { id: 'validate', icon: '✔', name: 'Sequence Validation', detail: 'FASTA format, quality, phage size range', status: 'waiting' },
  { id: 'blast', icon: '🔍', name: 'NCBI BLAST Identification', detail: 'Querying NCBI RefSeq phage database', status: 'waiting' },
  { id: 'phaster', icon: '🧫', name: 'Lifestyle Prediction (PHASTER)', detail: 'Determining lytic vs lysogenic lifestyle', status: 'waiting' },
  { id: 'annotate', icon: '🗺', name: 'Genome Annotation (Pharokka)', detail: 'ORF prediction and functional assignment via PHROG', status: 'waiting' },
  { id: 'trna', icon: '🔬', name: 'tRNA Detection (tRNAscan-SE)', detail: 'Transfer RNA gene detection and analysis', status: 'waiting' },
  { id: 'safety', icon: '🛡', name: 'Safety Screening (CARD + VFDB)', detail: 'AMR and toxin gene screening', status: 'waiting' },
  { id: 'phylo', icon: '🌳', name: 'Phylogenetic Analysis (IQ-TREE)', detail: 'Maximum likelihood tree via Galaxy Europe', status: 'waiting' },
]

export default function Home() {
  const [view, setView] = useState('input')
  const [steps, setSteps] = useState(INITIAL_STEPS)
  const [results, setResults] = useState(null)
  const [jobId, setJobId] = useState(null)

  function updateStep(id, status, detail) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, detail: detail || s.detail } : s))
  }

  async function handleAnalyse(sequences) {
    setView('progress')
    setSteps(INITIAL_STEPS)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      const res = await runPipeline(sequences, updateStep)
      setResults(res)
      setJobId(res.jobId)
      setView('results')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Pipeline error:', err)
      updateStep('validate', 'error', 'Unexpected error — please try again')
    }
  }

  return (
    <>
      <Head>
        <title>PhaGenome — Phage Genome Analysis</title>
        <meta name="description" content="Free integrated phage genome analysis. Annotation, genome maps, tRNA, AMR screening, phylogeny. ICAR." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <Navbar />

      <style>{`
        .page { background: #fff; min-height: 100vh; padding-bottom: 80px; }

        /* ── HERO ── */
        .hero {
          background: linear-gradient(180deg, #F0FAF7 0%, #ffffff 100%);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          padding: 60px 24px 48px; text-align: center;
        }
        .hero-inner { max-width: 700px; margin: 0 auto; }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(0,168,130,0.08);
          border: 1px solid rgba(0,168,130,0.2);
          border-radius: 20px; padding: 5px 16px; margin-bottom: 22px;
          font-size: 0.76rem; font-weight: 600; color: #00A882;
          letter-spacing: 0.05em; text-transform: uppercase;
          font-family: 'Inter', sans-serif;
        }
        .hero-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(1.9rem, 4.5vw, 3rem);
          font-weight: 700; line-height: 1.15; margin-bottom: 16px;
          letter-spacing: -0.02em; color: #0F1F2E;
        }
        .hero-title .hl {
          color: #00A882;
        }
        .hero-sub {
          font-size: 1rem; color: #4A6080;
          max-width: 540px; margin: 0 auto 32px; line-height: 1.7;
          font-family: 'Inter', sans-serif;
        }
        .hero-stats {
          display: flex; justify-content: center; gap: 40px;
          flex-wrap: wrap; margin-bottom: 0;
        }
        .stat { text-align: center; }
        .stat-num {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem; font-weight: 700; color: #00A882; display: block;
        }
        .stat-label {
          font-size: 0.7rem; color: #8DA4BF;
          text-transform: uppercase; letter-spacing: 0.06em;
          font-family: 'Inter', sans-serif;
        }

        /* ── HELIX ── */
        .helix { display: flex; justify-content: center; margin: 24px 0; }

        /* ── MAIN ── */
        .main-wrap {
          max-width: 860px; margin: 0 auto;
          padding: 40px 24px 0;
        }

        /* ── FOOTER ── */
        footer {
          margin-top: 64px; padding: 24px;
          border-top: 1px solid rgba(0,0,0,0.07);
          text-align: center; color: #8DA4BF;
          font-size: 0.76rem; font-family: 'Inter', sans-serif;
        }
        footer a { color: #00A882; }
        .powered { margin-top: 6px; font-size: 0.68rem; color: #B0C4D8; }

        /* ── FEATURE CHIPS ── */
        .chips { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 32px; }
        .chip {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 14px; border-radius: 20px;
          background: #fff; border: 1px solid rgba(0,0,0,0.1);
          font-size: 0.75rem; color: #4A6080;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
      `}</style>

      <div className="page">
        {view === 'input' && (
          <div className="hero">
            <div className="hero-inner">
              <div className="hero-eyebrow">🔬 ICAR — Phage Genome Analysis Platform</div>
              <h1 className="hero-title">
                Complete Phage Genome<br />
                <span className="hl">Analysis in One Place</span>
              </h1>
              <p className="hero-sub">
                Paste your raw FASTA sequence and get publication-ready genome maps,
                annotation, tRNA analysis, AMR screening, and phylogeny —
                free and open-access.
              </p>

              {/* Animated helix */}
              <div className="helix">
                <svg width="180" height="50" viewBox="0 0 180 50">
                  <defs>
                    <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00A882" stopOpacity="0.2" />
                      <stop offset="50%" stopColor="#00A882" stopOpacity="1" />
                      <stop offset="100%" stopColor="#0080FF" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  <path d="M0,25 Q22,5 45,25 Q67,45 90,25 Q112,5 135,25 Q157,45 180,25"
                    fill="none" stroke="url(#hg)" strokeWidth="2.5">
                    <animate attributeName="d"
                      values="M0,25 Q22,5 45,25 Q67,45 90,25 Q112,5 135,25 Q157,45 180,25;M0,25 Q22,45 45,25 Q67,5 90,25 Q112,45 135,25 Q157,5 180,25;M0,25 Q22,5 45,25 Q67,45 90,25 Q112,5 135,25 Q157,45 180,25"
                      dur="3s" repeatCount="indefinite" />
                  </path>
                  <path d="M0,25 Q22,45 45,25 Q67,5 90,25 Q112,45 135,25 Q157,5 180,25"
                    fill="none" stroke="url(#hg)" strokeWidth="2.5" opacity="0.35">
                    <animate attributeName="d"
                      values="M0,25 Q22,45 45,25 Q67,5 90,25 Q112,45 135,25 Q157,5 180,25;M0,25 Q22,5 45,25 Q67,45 90,25 Q112,5 135,25 Q157,45 180,25;M0,25 Q22,45 45,25 Q67,5 90,25 Q112,45 135,25 Q157,5 180,25"
                      dur="3s" repeatCount="indefinite" />
                  </path>
                </svg>
              </div>

              <div className="hero-stats">
                <div className="stat"><span className="stat-num">9</span><span className="stat-label">Modules</span></div>
                <div className="stat"><span className="stat-num">1,000+</span><span className="stat-label">Validated Genomes</span></div>
                <div className="stat"><span className="stat-num">Free</span><span className="stat-label">Open Access</span></div>
                <div className="stat"><span className="stat-num">NCBI</span><span className="stat-label">Powered</span></div>
              </div>
            </div>
          </div>
        )}

        <div className="main-wrap">
          {view === 'input' && <FastaInput onAnalyse={handleAnalyse} />}
          {view === 'progress' && <PipelineProgress steps={steps} jobId={jobId} />}
          {view === 'results' && results && <ResultsTabs results={results} />}
        </div>
      </div>

      <footer>
        <div>
          <strong style={{ color: '#4A6080' }}>PhaGenome</strong> ·{' '}
          <a href="https://www.icar.org.in" target="_blank" rel="noreferrer">ICAR</a>
          {' · '}Free &amp; Open Access
        </div>
        <div className="powered">
          NCBI BLAST · PHASTER · Galaxy Europe · Pharokka · CARD · VFDB · tRNAscan-SE · IQ-TREE
        </div>
      </footer>
    </>
  )
}
