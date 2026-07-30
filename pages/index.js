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
  const [view, setView] = useState('input') // input | progress | results
  const [steps, setSteps] = useState(INITIAL_STEPS)
  const [results, setResults] = useState(null)
  const [jobId, setJobId] = useState(null)

  function updateStep(id, status, detail) {
    setSteps(prev => prev.map(s =>
      s.id === id ? { ...s, status, detail: detail || s.detail } : s
    ))
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
        <meta name="description" content="Free, integrated phage genome analysis platform. Paste FASTA, get annotation, genome maps, tRNA, AMR screening, and phylogeny. ICAR-NMRI, Hyderabad." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <Navbar />

      <style>{`
        .bg-glow {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 800px 600px at 15% 15%, rgba(0,212,170,0.04) 0%, transparent 70%),
            radial-gradient(ellipse 600px 800px at 85% 85%, rgba(0,100,200,0.05) 0%, transparent 70%);
        }
        .page { position: relative; z-index: 1; padding-bottom: 80px; }
        .hero { padding: 64px 0 48px; text-align: center; }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(0,212,170,0.08); border: 1px solid rgba(0,212,170,0.18);
          border-radius: 20px; padding: 6px 18px; margin-bottom: 24px;
          font-size: 0.78rem; font-weight: 500; color: #00D4AA;
          letter-spacing: 0.05em; text-transform: uppercase;
          font-family: 'Inter', sans-serif;
        }
        .hero-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 700; line-height: 1.15; margin-bottom: 18px;
          letter-spacing: -0.02em;
        }
        .hero-title .hl {
          background: linear-gradient(135deg, #00D4AA, #63B3ED);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: 1rem; color: #8DA4BF;
          max-width: 580px; margin: 0 auto 36px; line-height: 1.7;
          font-family: 'Inter', sans-serif;
        }
        .hero-stats {
          display: flex; justify-content: center; gap: 40px;
          flex-wrap: wrap; margin-bottom: 48px;
        }
        .stat { text-align: center; }
        .stat-num {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.6rem; font-weight: 700; color: #00D4AA; display: block;
        }
        .stat-label {
          font-size: 0.72rem; color: #4A6080;
          text-transform: uppercase; letter-spacing: 0.06em;
          font-family: 'Inter', sans-serif;
        }
        .helix {
          display: flex; justify-content: center; margin-bottom: 40px;
        }
        .main-content { max-width: 900px; margin: 0 auto; padding: 0 24px; }
        footer {
          margin-top: 80px; padding: 28px 24px;
          border-top: 1px solid rgba(255,255,255,0.06);
          text-align: center; color: #4A6080; font-size: 0.78rem;
          font-family: 'Inter', sans-serif;
        }
        footer a { color: #00D4AA; }
        .powered-by { margin-top: 8px; font-size: 0.7rem; }
      `}</style>

      <div className="bg-glow" />
      <div className="page">

        {/* Hero — only show on input view */}
        {view === 'input' && (
          <div className="hero container">
            <div className="hero-eyebrow">
              🔬 ICAR–National Meat Research Institute, Hyderabad
            </div>
            <h1 className="hero-title">
              Complete Phage Genome<br />
              <span className="hl">Analysis in One Place</span>
            </h1>
            <p className="hero-sub">
              Paste your raw FASTA sequence and get publication-ready genome maps,
              annotation, tRNA analysis, AMR screening, and phylogeny —
              free, open-access, built exclusively for bacteriophage research.
            </p>

            {/* Animated helix */}
            <div className="helix">
              <svg width="200" height="60" viewBox="0 0 200 60">
                <defs>
                  <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#00D4AA" stopOpacity="1" />
                    <stop offset="100%" stopColor="#0080FF" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <path d="M0,30 Q25,5 50,30 Q75,55 100,30 Q125,5 150,30 Q175,55 200,30"
                  fill="none" stroke="url(#hg)" strokeWidth="2.5">
                  <animate attributeName="d"
                    values="M0,30 Q25,5 50,30 Q75,55 100,30 Q125,5 150,30 Q175,55 200,30;M0,30 Q25,55 50,30 Q75,5 100,30 Q125,55 150,30 Q175,5 200,30;M0,30 Q25,5 50,30 Q75,55 100,30 Q125,5 150,30 Q175,55 200,30"
                    dur="3s" repeatCount="indefinite" />
                </path>
                <path d="M0,30 Q25,55 50,30 Q75,5 100,30 Q125,55 150,30 Q175,5 200,30"
                  fill="none" stroke="url(#hg)" strokeWidth="2.5" opacity="0.4">
                  <animate attributeName="d"
                    values="M0,30 Q25,55 50,30 Q75,5 100,30 Q125,55 150,30 Q175,5 200,30;M0,30 Q25,5 50,30 Q75,55 100,30 Q125,5 150,30 Q175,55 200,30;M0,30 Q25,55 50,30 Q75,5 100,30 Q125,55 150,30 Q175,5 200,30"
                    dur="3s" repeatCount="indefinite" />
                </path>
              </svg>
            </div>

            <div className="hero-stats">
              <div className="stat"><span className="stat-num">9</span><span className="stat-label">Analysis Modules</span></div>
              <div className="stat"><span className="stat-num">1,000+</span><span className="stat-label">Validated Genomes</span></div>
              <div className="stat"><span className="stat-num">Free</span><span className="stat-label">Open Access</span></div>
              <div className="stat"><span className="stat-num">NCBI</span><span className="stat-label">Powered</span></div>
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="main-content">
          {view === 'input' && (
            <FastaInput onAnalyse={handleAnalyse} />
          )}
          {view === 'progress' && (
            <PipelineProgress steps={steps} jobId={jobId} />
          )}
          {view === 'results' && results && (
            <ResultsTabs results={results} />
          )}
        </div>
      </div>

      <footer>
        <div>
          <strong style={{ color: '#8DA4BF' }}>PhaGenome</strong> — Developed at{' '}
          <a href="https://www.icar.org.in" target="_blank" rel="noreferrer">
            ICAR–National Meat Research Institute
          </a>, Hyderabad, India
        </div>
        <div className="powered-by">
          Powered by NCBI BLAST · PHASTER · Galaxy Europe · Pharokka · CARD · VFDB · tRNAscan-SE · IQ-TREE
        </div>
      </footer>
    </>
  )
}
