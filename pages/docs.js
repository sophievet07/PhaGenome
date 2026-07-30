import Head from 'next/head'
import Navbar from '../components/Navbar'

export default function Docs() {
  return (
    <>
      <Head>
        <title>PhaGenome — Documentation</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap" rel="stylesheet" />
      </Head>
      <Navbar />
      <style>{`
        .page { max-width:900px; margin:0 auto; padding:48px 24px 80px; font-family:'Inter',sans-serif; }
        .page-title { font-family:'Space Grotesk',sans-serif; font-size:1.8rem; font-weight:700; margin-bottom:8px; }
        .page-sub { color:#8DA4BF; font-size:0.9rem; margin-bottom:36px; }
        .card { background:#0F2040; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:24px; margin-bottom:16px; }
        .card-title { font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:600; margin-bottom:14px; display:flex;align-items:center;gap:8px; }
        .card-icon { width:30px;height:30px;border-radius:7px;background:rgba(0,212,170,0.1);border:1px solid rgba(0,212,170,0.18);display:flex;align-items:center;justify-content:center;font-size:14px; }
        ul { padding-left:20px; }
        li { font-size:0.86rem; color:#8DA4BF; line-height:2.1; }
        li strong { color:#F0F4F8; }
        .code-block { font-family:'JetBrains Mono',monospace; font-size:0.78rem; background:#0A1628; padding:16px 20px; border-radius:8px; color:#8DA4BF; line-height:1.8; margin-top:12px; border:1px solid rgba(255,255,255,0.05); overflow-x:auto; }
        .faq-item { border-bottom:1px solid rgba(255,255,255,0.05); padding:16px 0; }
        .faq-item:last-child { border-bottom:none; }
        .faq-q { font-size:0.88rem; font-weight:600; color:#F0F4F8; margin-bottom:6px; }
        .faq-a { font-size:0.82rem; color:#8DA4BF; line-height:1.7; }
        .tag { display:inline-block;padding:2px 10px;border-radius:12px;font-size:0.72rem;font-weight:600; }
        .tag-green { background:rgba(104,211,145,0.12);color:#68D391; }
        .tag-blue { background:rgba(99,179,237,0.12);color:#63B3ED; }
      `}</style>

      <div className="page">
        <div className="page-title">Documentation</div>
        <div className="page-sub">Everything you need to use PhaGenome effectively</div>

        <div className="card">
          <div className="card-title"><div className="card-icon">📋</div>Input Requirements</div>
          <ul>
            <li>Standard FASTA format with header line starting with <strong>&gt;</strong></li>
            <li>DNA sequences only — bases A, T, G, C, N (ambiguous codes also accepted)</li>
            <li>Minimum length: <strong>10,000 bp (10 kb)</strong> — smaller sequences are not phage genomes</li>
            <li>Maximum length: <strong>800,000 bp (800 kb)</strong> — jumbo phage upper limit</li>
            <li>Multiple sequences supported — paste multiple FASTA entries or upload a multi-FASTA file</li>
            <li>Accepted file formats: <strong>.fasta, .fa, .fna, .txt</strong></li>
            <li>Sequences are not permanently stored — privacy by design</li>
          </ul>
          <div className="code-block">
{`>Phage_isolate_1 Staphylococcus phage, complete genome
ATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGC
ATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGC
...`}
          </div>
        </div>

        <div className="card">
          <div className="card-title"><div className="card-icon">⚙</div>Analysis Modules</div>
          <ul>
            <li><strong>NCBI BLAST</strong> — Identifies your phage against 50,000+ RefSeq phage genomes. Returns top hits with identity, coverage, E-value, and NCBI links.</li>
            <li><strong>PHASTER</strong> — Predicts lytic vs lysogenic lifestyle by detecting integrase, CI repressor, holin, and endolysin genes.</li>
            <li><strong>Pharokka (via Galaxy Europe)</strong> — Predicts all ORFs using PHANOTATE and assigns functions using the PHROG database. Publication-grade annotation.</li>
            <li><strong>tRNAscan-SE (via Galaxy Europe)</strong> — Detects tRNA genes, identifies anticodons, and provides biological significance interpretation.</li>
            <li><strong>ABRICATE — CARD</strong> — Screens all ORFs against 2,793 antimicrobial resistance genes at ≥80% identity threshold.</li>
            <li><strong>ABRICATE — VFDB</strong> — Screens against 847 virulence and toxin genes including Shiga toxins, enterotoxins, superantigens.</li>
            <li><strong>IQ-TREE (via Galaxy Europe)</strong> — Builds maximum likelihood phylogenetic tree using GTR+G model.</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-title"><div className="card-icon">📊</div>Output Files</div>
          <ul>
            <li><strong>Full Report (.txt)</strong> — Complete analysis summary with all results in plain text format</li>
            <li><strong>Safety Certificate (.txt)</strong> — AMR and toxin screening results with database versions and date</li>
            <li><strong>GenBank File (.gb)</strong> — Standard GenBank format annotation file for submission or downstream analysis</li>
            <li><strong>Circular Genome Map (.svg)</strong> — Publication-ready SVG figure, scalable to any size</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-title"><div className="card-icon">⏱</div>Processing Times</div>
          <ul>
            <li><strong>BLAST identification</strong> — 30–120 seconds (NCBI queue dependent)</li>
            <li><strong>PHASTER lifestyle</strong> — 1–5 minutes</li>
            <li><strong>Pharokka annotation</strong> — 5–30 minutes (Galaxy Europe queue dependent)</li>
            <li><strong>tRNAscan-SE</strong> — 2–10 minutes</li>
            <li><strong>Safety screening</strong> — 3–15 minutes</li>
            <li><strong>IQ-TREE phylogeny</strong> — 15–45 minutes</li>
            <li>Keep your browser tab open during analysis. Job status is tracked automatically.</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-title"><div className="card-icon">❓</div>Frequently Asked Questions</div>

          {[
            { q: 'Can I analyse RNA phage genomes?', a: 'PhaGenome currently supports DNA phage genomes only. RNA phage analysis (e.g., MS2, Qβ) requires different tools and is planned for a future update.' },
            { q: 'Is my sequence data stored?', a: 'No. Sequences are processed in memory and transmitted to external APIs (NCBI, PHASTER, Galaxy Europe) for analysis. They are not stored in PhaGenome databases. Job metadata (length, GC%, results) is stored anonymously for performance tracking.' },
            { q: 'Why does the analysis take so long?', a: 'Galaxy Europe is a shared public compute cluster. Queue times vary depending on global demand. BLAST and PHASTER are typically faster. You can safely keep the tab open and wait — or return later.' },
            { q: 'Can I analyse multiple phages at once?', a: 'Yes — paste multiple FASTA sequences in one input. PhaGenome processes each sequence through the full pipeline and generates comparative results.' },
            { q: 'What databases are used for safety screening?', a: 'AMR genes: CARD (Comprehensive Antibiotic Resistance Database) v3.2.6. Toxin/virulence genes: VFDB (Virulence Factor Database) 2024 edition. Threshold: ≥80% nucleotide identity, ≥60% coverage.' },
            { q: 'Can I use PhaGenome results in a publication?', a: 'Yes. Please cite PhaGenome as indicated on the About page. Also cite the individual tools used (NCBI BLAST, PHASTER, Pharokka, tRNAscan-SE, CARD, VFDB, IQ-TREE) as listed in your Methods section.' },
            { q: 'Is the safety report a regulatory approval?', a: 'No. The safety certificate is a research tool to assist initial screening. Regulatory approval for biocontrol or therapeutic use requires additional validation per FSSAI, CDSCO, EMA, or FDA guidelines.' },
          ].map((faq, i) => (
            <div key={i} className="faq-item">
              <div className="faq-q">Q: {faq.q}</div>
              <div className="faq-a">A: {faq.a}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title"><div className="card-icon">📄</div>Methods Section Template</div>
          <div style={{fontSize:'0.82rem',color:'#8DA4BF',marginBottom:12}}>Copy this into your manuscript Methods section:</div>
          <div className="code-block">
{`Phage genome analysis was performed using PhaGenome (ICAR-NMRI, Hyderabad).
Sequences were submitted in FASTA format and processed through the integrated
pipeline. Genome identification was performed using NCBI BLAST against the
RefSeq nucleotide database. Lifestyle prediction was performed using PHASTER.
Genome annotation was carried out using Pharokka v1.4.1 with the PHROG
database. Transfer RNA genes were detected using tRNAscan-SE v2.0.9.
Antimicrobial resistance genes were screened against CARD v3.2.6 and
virulence genes against VFDB (2024) using ABRICATE v1.0.1 with ≥80%
identity and ≥60% coverage thresholds. Phylogenetic analysis was performed
using IQ-TREE v2.1.4 with GTR+G substitution model via Galaxy Europe.
Circular genome maps were generated using the PhaGenome visualization module.`}
          </div>
        </div>
      </div>
    </>
  )
}
