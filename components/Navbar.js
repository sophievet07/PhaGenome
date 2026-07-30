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
          background: rgba(10,22,40,0.95);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 0 24px;
        }
        .nav-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px;
        }
        .logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700; font-size: 1.25rem;
          color: #F0F4F8; text-decoration: none;
        }
        .logo-icon {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #00D4AA, #0080FF);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .logo span { color: #00D4AA; }
        .nav-links { display: flex; gap: 4px; }
        .nav-link {
          padding: 7px 16px; border-radius: 7px;
          color: #8DA4BF; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
          text-decoration: none; font-family: 'Inter', sans-serif;
        }
        .nav-link:hover { color: #00D4AA; background: rgba(0,212,170,0.08); text-decoration: none; }
        .nav-link.active { color: #00D4AA; background: rgba(0,212,170,0.12); }
        .nav-badge {
          background: #00D4AA; color: #0A1628;
          font-size: 0.62rem; font-weight: 700;
          padding: 2px 6px; border-radius: 20px; margin-left: 4px;
          vertical-align: middle;
        }
        .icar-badge {
          font-size: 0.72rem; color: #4A6080;
          font-family: 'Inter', sans-serif;
          display: none;
        }
        @media (min-width: 800px) { .icar-badge { display: block; } }
        @media (max-width: 600px) {
          .nav-link { padding: 6px 10px; font-size: 0.8rem; }
        }
      `}</style>
      <nav>
        <div className="nav-inner">
          <Link href="/" className="logo">
            <div className="logo-icon">🧬</div>
            Pha<span>Genome</span>
          </Link>
          <div className="icar-badge">ICAR–NMRI, Hyderabad</div>
          <div className="nav-links">
            <Link href="/" className={`nav-link ${path === '/' ? 'active' : ''}`}>
              Analyse
            </Link>
            <Link href="/benchmark" className={`nav-link ${path === '/benchmark' ? 'active' : ''}`}>
              Benchmark
            </Link>
            <Link href="/about" className={`nav-link ${path === '/about' ? 'active' : ''}`}>
              About
            </Link>
            <Link href="/docs" className={`nav-link ${path === '/docs' ? 'active' : ''}`}>
              Docs
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
