import Head from 'next/head'
import Navbar from '../components/Navbar'

const FEATURES = [
  { icon: '🧬', title: 'End-to-End Analysis', desc: 'From raw FASTA to publication-ready figures — no switching between multiple tools or command lines.' },
  { icon: '🛡', title: 'Regulatory Safety Screening', desc: 'Automated AMR and toxin gene detection against CARD v3.2.6 and VFDB 2024 databases with safety certificate.' },
  { icon: '🗺', title: 'Publication-Ready Maps', desc: 'Circular and linear genome maps exportable as SVG — formatted for direct journal figure submission.' },
  { icon: '🌳', title: 'Phylogenetic Trees', desc: 'Maximum likelihood phylogeny via IQ-TREE on Galaxy Europe for evolutionary context and classification.' },
  { icon: '🔬', title: 'tRNA Significance', desc: 'Detected tRNAs interpreted for biological significance — host range, fitness advantage, moron elements.' },
  { icon: '📚', title: 'Student Friendly', desc: 'Step-by-step guided interface with plain-language explanations of every result — designed for learning.' },
  { icon: '⚡', title: 'Free & Open Access', desc: 'No registration required. No usage limits. Free for all researchers globally — always.' },
  { icon: '🔒', title: 'Secure Architecture', desc: 'API keys hidden server-side. Your sequences are not stored permanently. Privacy by design.' },
]

const PIPELINE = [
  { step: 1, tool: 'NCBI BLAST', desc: 'Identification against RefSeq phage database', db: 'NCBI nt' },
  { step: 2, tool: 'PHASTER', desc: 'Lifestyle prediction — lytic vs lysogenic', db: 'PHASTER DB' },
  { step: 3, tool: 'Pharokka', desc: 'ORF prediction and functional annotation', db: 'PHROG DB' },
  { step: 4, tool: 'tRNAscan-SE', desc: 'Transfer RNA gene detection', db: 'Rfam' },
  { step: 5, tool: 'ABRICATE', desc: 'AMR gene screening', db: 'CARD v3.2.6' },
  { step: 6, tool: 'ABRICATE', desc: 'Toxin/virulence gene screening', db: 'VFDB 2024' },
  { step: 7, tool: 'IQ-TREE', desc: 'Maximum likelihood phylogenetic tree', db: 'Galaxy Europe' },
]

export default function About() {
  return (
    <>
      <Head>
        <title>PhaGenome — About</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <Navbar />
      <style>{`
        .page { max-width:1100px; margin:0 auto; padding:48px 24px 80px; font-family:'Inter',sans-serif; }
        .page-title { font-family:'Space Grotesk',sans-serif; font-size:1.8rem; font-weight:700; margin-bottom:8px; }
        .page-sub { color:#8DA4BF; font-size:0.9rem; margin-bottom:36px; }
        .feature-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:14px; margin-bottom:32px; }
        .feature-card { background:#0F2040; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:20px; transition:border-color 0.2s; }
        .feature-card:hover { border-color:rgba(0,212,170,0.3); }
        .f-icon { font-size:1.5rem; margin-bottom:10px; }
        .f-title { font-family:'Space Grotesk',sans-serif; font-size:0.9rem; font-weight:600; margin-bottom:6px; }
        .f-desc { font-size:0.8rem; color:#8DA4BF; line-height:1.6; }
        .card { background:#0F2040; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:24px; margin-bottom:20px; }
        .card-title { font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:600; margin-bottom:16px; display:flex;align-items:center;gap:8px; }
        table { width:100%; border-collapse:collapse; font-size:0.8rem; }
        th { text-align:left; padding:9px 12px; color:#4A6080; font-weight:500; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.04em; border-bottom:1px solid rgba(255,255,255,0.07); }
        td { padding:9px 12px; border-bottom:1px solid rgba(255,255,255,0.04); }
        tr:last-child td { border-bottom:none; }
        .step-num { display:inline-flex;align-items:center;justify-content:center; width:22px;height:22px; background:#00D4AA; color:#0A1628; border-radius:50%; font-size:0.7rem; font-weight:700; }
        .inst-block { padding:20px; background:#0A1628; border-radius:10px; border-left:3px solid #00D4AA; }
        .inst-block p { font-size:0.88rem; color:#8DA4BF; line-height:1.8; }
        .inst-block strong { color:#F0F4F8; }
        .mono { font-family:'JetBrains Mono',monospace; font-size:0.78rem; background:#162847; padding:14px 18px; border-radius:8px; color:#8DA4BF; line-height:1.8; margin-top:12px; }
      `}</style>

      <div className="page">
        <div className="page-title">About PhaGenome</div>
        <div className="page-sub">An integrated phage genome analysis platform — free, open-access, built exclusively for bacteriophage research</div>

        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="f-icon">{f.icon}</div>
              <div className="f-title">{f.title}</div>
              <div className="f-desc">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">⚙ Analysis Pipeline</div>
          <table>
            <thead><tr><th>Step</th><th>Tool</th><th>Description</th><th>Database</th></tr></thead>
            <tbody>
              {PIPELINE.map(p => (
                <tr key={p.step}>
                  <td><span className="step-num">{p.step}</span></td>
                  <td style={{fontWeight:600,color:'#00D4AA'}}>{p.tool}</td>
                  <td style={{color:'#8DA4BF'}}>{p.desc}</td>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.74rem',color:'#4A6080'}}>{p.db}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title">🏛 Developed at</div>
          <div className="inst-block">
            <p>
              <strong>ICAR–National Meat Research Institute (ICAR-NMRI)</strong><br />
              Chengicherla, Hyderabad, Telangana, India<br />
              Department of Agricultural Research and Education (DARE)<br /><br />
              PhaGenome is developed as a free academic tool for the global phage research community.
              The platform supports research in phage biocontrol, food safety, and phage therapy.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-title">📄 How to Cite</div>
          <div className="mono">
            [Author]. PhaGenome: An integrated web platform for bacteriophage genome analysis,
            annotation, safety screening, and visualization.
            ICAR–National Meat Research Institute, Hyderabad (2026).
            Available at: https://phagenome.vercel.app
          </div>
        </div>

        <div className="card">
          <div className="card-title">🤝 Collaborations & Contact</div>
          <div className="inst-block">
            <p>
              PhaGenome welcomes collaborations with phage research groups globally.
              For hosting partnerships, co-development, or research collaborations,
              please contact the Principal Investigator at ICAR-NMRI, Hyderabad.<br /><br />
              <strong>For tool-related issues:</strong> Please use the GitHub repository issue tracker.<br />
              <strong>For research enquiries:</strong> Contact ICAR-NMRI directly.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
