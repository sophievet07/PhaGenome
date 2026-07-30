import { useEffect, useRef } from 'react'

const COLORS = {
  structural: '#00D4AA',
  replication: '#63B3ED',
  lysis: '#FC8181',
  tRNA: '#F6AD55',
  hypothetical: '#4A5568',
  other: '#805AD5'
}

export default function GenomeMap({ annotation, trna, validation }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!annotation || !svgRef.current) return
    drawMap()
  }, [annotation, trna, validation])

  function drawMap() {
    const svg = svgRef.current
    while (svg.firstChild) svg.removeChild(svg.firstChild)

    const w = 420, h = 420, cx = 210, cy = 210
    const outerR = 170, innerR = 125
    const seqLen = validation?.totalLength || 168903
    const orfs = annotation?.orfs || []

    const ns = 'http://www.w3.org/2000/svg'

    // Defs — gradient
    const defs = document.createElementNS(ns, 'defs')
    const grad = document.createElementNS(ns, 'linearGradient')
    grad.setAttribute('id', 'bgGrad')
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%')
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%')
    const s1 = document.createElementNS(ns, 'stop')
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#00D4AA'); s1.setAttribute('stop-opacity', '0.05')
    const s2 = document.createElementNS(ns, 'stop')
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#0080FF'); s2.setAttribute('stop-opacity', '0.05')
    grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad)
    svg.appendChild(defs)

    // Outer glow ring
    appendCircle(svg, ns, cx, cy, outerR + 12, 'none', 'rgba(0,212,170,0.06)', 24)
    // Backbone ring
    appendCircle(svg, ns, cx, cy, (outerR + innerR) / 2, 'none', 'rgba(255,255,255,0.04)', outerR - innerR)

    // Tick marks (12 positions like clock)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * 2 * Math.PI - Math.PI / 2
      const x1 = cx + (innerR - 4) * Math.cos(angle)
      const y1 = cy + (innerR - 4) * Math.sin(angle)
      const x2 = cx + (innerR - 14) * Math.cos(angle)
      const y2 = cy + (innerR - 14) * Math.sin(angle)
      const line = document.createElementNS(ns, 'line')
      line.setAttribute('x1', x1); line.setAttribute('y1', y1)
      line.setAttribute('x2', x2); line.setAttribute('y2', y2)
      line.setAttribute('stroke', 'rgba(255,255,255,0.1)'); line.setAttribute('stroke-width', '1.5')
      svg.appendChild(line)
    }

    // ORF arcs
    orfs.forEach(orf => {
      const startAngle = (orf.start / seqLen) * 2 * Math.PI - Math.PI / 2
      const endAngle = (orf.stop / seqLen) * 2 * Math.PI - Math.PI / 2
      const isPlus = orf.strand === '+'
      const r1 = isPlus ? outerR : innerR + 18
      const r2 = isPlus ? outerR - 22 : innerR + 2
      const color = COLORS[orf.category] || COLORS.other

      const pathD = describeArc(cx, cy, r1, r2, startAngle, endAngle)
      const path = document.createElementNS(ns, 'path')
      path.setAttribute('d', pathD)
      path.setAttribute('fill', color)
      path.setAttribute('opacity', '0.82')
      const title = document.createElementNS(ns, 'title')
      title.textContent = `${orf.function} (${orf.start.toLocaleString()}–${orf.stop.toLocaleString()})`
      path.appendChild(title)
      svg.appendChild(path)
    })

    // tRNA markers
    if (trna?.trnas) {
      trna.trnas.forEach(t => {
        const posMatch = t.pos.match(/[\d,]+/)
        if (!posMatch) return
        const pos = parseInt(posMatch[0].replace(/,/g, ''))
        const angle = (pos / seqLen) * 2 * Math.PI - Math.PI / 2
        const markerR = outerR + 22
        const x = cx + markerR * Math.cos(angle)
        const y = cy + markerR * Math.sin(angle)
        const circle = document.createElementNS(ns, 'circle')
        circle.setAttribute('cx', x); circle.setAttribute('cy', y); circle.setAttribute('r', 5)
        circle.setAttribute('fill', '#F6AD55')
        circle.setAttribute('stroke', '#0A1628'); circle.setAttribute('stroke-width', '1.5')
        const title = document.createElementNS(ns, 'title')
        title.textContent = `tRNA-${t.aa} at ${t.pos}`
        circle.appendChild(title)
        svg.appendChild(circle)
      })
    }

    // Center text
    appendText(svg, ns, cx, cy - 14, (seqLen / 1000).toFixed(1) + ' kb', '#F0F4F8', 14, 600, 'Space Grotesk, sans-serif')
    appendText(svg, ns, cx, cy + 6, (validation?.gc || 0) + '% GC', '#8DA4BF', 10, 400)
    appendText(svg, ns, cx, cy + 20, (annotation?.total || 0) + ' ORFs', '#8DA4BF', 10, 400)
  }

  return (
    <>
      <style>{`
        .map-wrap {
          background: #0A1628; border-radius: 8px;
          padding: 16px; display: flex;
          flex-direction: column; align-items: center; gap: 16px;
        }
        .map-legend {
          display: flex; gap: 16px; flex-wrap: wrap;
          justify-content: center;
        }
        .legend-item {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.75rem; color: #8DA4BF;
        }
        .legend-dot {
          width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0;
        }
        .map-actions { display: flex; gap: 8px; margin-top: 8px; }
        .btn-dl {
          padding: 7px 14px; border-radius: 6px;
          background: #162847; border: 1px solid rgba(255,255,255,0.07);
          color: #8DA4BF; font-size: 0.78rem; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .btn-dl:hover { border-color: #00D4AA; color: #00D4AA; }
      `}</style>

      <div className="map-wrap">
        <svg ref={svgRef} width={420} height={420} viewBox="0 0 420 420" />
        <div className="map-legend">
          {Object.entries(COLORS).map(([cat, color]) => (
            <div key={cat} className="legend-item">
              <div className="legend-dot" style={{ background: color }} />
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </div>
          ))}
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#F6AD55', borderRadius: '50%' }} />
            tRNA
          </div>
        </div>
        <div className="map-actions">
          <button className="btn-dl" onClick={downloadSVG}>⬇ Download SVG</button>
        </div>
      </div>
    </>
  )

  function downloadSVG() {
    const svgEl = svgRef.current
    if (!svgEl) return
    const data = new XMLSerializer().serializeToString(svgEl)
    const blob = new Blob([data], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'phagenome_circular_map.svg'; a.click()
    URL.revokeObjectURL(url)
  }
}

// ── SVG HELPERS ──
function appendCircle(svg, ns, cx, cy, r, fill, stroke, sw) {
  const el = document.createElementNS(ns, 'circle')
  el.setAttribute('cx', cx); el.setAttribute('cy', cy); el.setAttribute('r', r)
  el.setAttribute('fill', fill); el.setAttribute('stroke', stroke); el.setAttribute('stroke-width', sw)
  svg.appendChild(el)
}

function appendText(svg, ns, x, y, text, fill, size, weight = 400, font = 'Inter, sans-serif') {
  const el = document.createElementNS(ns, 'text')
  el.setAttribute('x', x); el.setAttribute('y', y)
  el.setAttribute('text-anchor', 'middle')
  el.setAttribute('fill', fill)
  el.setAttribute('font-size', size)
  el.setAttribute('font-weight', weight)
  el.setAttribute('font-family', font)
  el.textContent = text
  svg.appendChild(el)
}

function describeArc(cx, cy, outerR, innerR, startAngle, endAngle) {
  if (endAngle <= startAngle) endAngle = startAngle + 0.01
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  const ox1 = cx + outerR * Math.cos(startAngle)
  const oy1 = cy + outerR * Math.sin(startAngle)
  const ox2 = cx + outerR * Math.cos(endAngle)
  const oy2 = cy + outerR * Math.sin(endAngle)
  const ix1 = cx + innerR * Math.cos(endAngle)
  const iy1 = cy + innerR * Math.sin(endAngle)
  const ix2 = cx + innerR * Math.cos(startAngle)
  const iy2 = cy + innerR * Math.sin(startAngle)
  return `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`
}
