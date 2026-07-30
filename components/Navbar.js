import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Navbar() {
  const router = useRouter()
  const path = router.pathname

  return (
    <>
      <style>{`
        nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          padding: 0 24px;
          box-shadow: 0 1px 8px rgba(0,0,0,0.06);
        }
        .nav-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 60px;
        }
        .logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700; font-size: 1.2rem;
          color: #0F1F2E; text-decoration: none;
        }
        .logo-icon {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #00A882, #0080FF);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .logo-text { color: #0F1F2E; }
        .logo-text span { color: #00A882; }
        .icar-pill {
          font-size: 0.7rem; font-weight: 600;
          color: #00A882; background: rgba(0,168,130,0.08);
          border: 1px solid rgba(0,168,130,0.2);
          padding: 3px 10px; border-radius: 20px;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.03em;
        }
        .nav-links { display: flex; gap: 2px; }
        .nav-link {
          padding: 7px 16px; border-radius: 7px;
          color: #4A6080; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
          text-decoration: none; font-family: 'Inter', sans-serif;
        }
        .nav-link:hover { color: #00A882; background: rgba(0,168,130,0.07); text-decoration: none; }
        .nav-link.active { color: #00A882; background: rgba(0,168,130,0.1); font-weight: 600; }
        @media (max-width: 600px) {
          .nav-link { padding: 6px 10px; font-size: 0.8rem; }
          .icar-pill { display: none; }
        }
      `}</style>
      <nav>
        <div className="nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" className="logo">
              <div className="logo-icon">🧬</div>
              <span className="logo-text">Pha<span>Genome</span></span>
            </Link>
            <span className="icar-pill">ICAR</span>
          </div>
          <div className="nav-links">
            <Link href="/" className={`nav-link ${path === '/' ? 'active' : ''}`}>Analyse</Link>
            <Link href="/benchmark" className={`nav-link ${path === '/benchmark' ? 'active' : ''}`}>Benchmark</Link>
            <Link href="/about" className={`nav-link ${path === '/about' ? 'active' : ''}`}>About</Link>
            <Link href="/docs" className={`nav-link ${path === '/docs' ? 'active' : ''}`}>Docs</Link>
          </div>
        </div>
      </nav>
    </>
  )
}
