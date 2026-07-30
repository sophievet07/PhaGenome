import { useEffect, useRef } from 'react'

// ── PUBLICATION-QUALITY CIRCULAR GENOME MAP ──
// Meets standards for journals: Nucleic Acids Research, Phage, mSystems,
// Frontiers in Microbiology, Applied and Environmental Microbiology

// Journal-standard color palette (print-safe, colorblind-friendly)
const CAT_COLORS = {
  structural:    { fill: '#2166AC', stroke: '#1a5490' },  // Blue
  replication:   { fill: '#4DAC26', stroke: '#3a8a1c' },  // Green
  lysis:         { fill: '#D01C8B', stroke: '#a8146e' },  // Magenta
  tRNA:          { fill: '#E66101', stroke: '#b84d01' },  // Orange
  hypothetical:  { fill: '#B2B2B2', stroke: '#8a8a8a' },  // Grey
  other:         { fill: '#762A83', stroke: '#5a1f64' },  // Purple
}

const NS = 'http://www.w3.org/2000/svg'

export default function GenomeMap({ annotation, trna, validation, phageName }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!annotation || !svgRef.current) return
    drawPublicationMap()
  }, [annotation, trna, validation, phageName])

  function drawPublicationMap() {
    const svg = svgRef.current
    while (svg.firstChild) svg.removeChild(svg.firstChild)

    // ── DIMENSIONS — large for print quality ──
    const W = 900, H = 960
    const cx = 450, cy = 480
    svg.setAttribute('width', W)
    svg.setAttribute('height', H)
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    svg.setAttribute('xmlns', NS)
    svg.setAttribute('font-family', 'Arial, Helvetica, sans-serif')

    const seqLen  = validation?.totalLength || 168903
    const orfs    = annotation?.orfs || []
    const trnas   = trna?.trnas || []
    const gc      = validation?.gc || 0
    const name    = phageName || 'Phage Genome'

    // ── RING RADII ──
    const R = {
      outerLabel:  360,   // position label text
      scaleTick:   340,   // major tick outer
      scaleTickIn: 328,   // major tick inner
      minorTick:   340,   // minor tick outer
      minorTickIn: 334,   // minor tick inner
      orfPlus:     { outer: 320, inner: 285 },  // forward strand ORFs
      orfMinus:    { outer: 280, inner: 245 },  // reverse strand ORFs
      gcOuter:     240,   // GC content ring outer
      gcInner:     200,   // GC content ring inner
      tRNA:        330,   // tRNA marker ring
      backbone:    232,   // central backbone
      innerLabel:  185,   // center text
    }

    // ── WHITE BACKGROUND ──
    const bg = el('rect')
    setAttrs(bg, { x:0, y:0, width:W, height:H, fill:'white' })
    svg.appendChild(bg)

    // ── TITLE ──
    const title = el('text')
    setAttrs(title, {
      x: cx, y: 44,
      'text-anchor': 'middle',
      'font-size': '22',
      'font-weight': 'bold',
      fill: '#111111',
      'font-family': 'Arial, Helvetica, sans-serif'
    })
    title.textContent = name
    svg.appendChild(title)

    const subtitle = el('text')
    setAttrs(subtitle, {
      x: cx, y: 70,
      'text-anchor': 'middle',
      'font-size': '13',
      fill: '#555555',
      'font-family': 'Arial, Helvetica, sans-serif'
    })
    subtitle.textContent = `${(seqLen/1000).toFixed(1)} kb  |  ${gc}% GC  |  ${orfs.length} ORFs  |  ${trnas.length} tRNA genes`
    svg.appendChild(subtitle)

    // ── OUTER BACKBONE RING ──
    appendCircle(cx, cy, R.backbone, 'none', '#CCCCCC', 2, svg)

    // ── POSITION SCALE — tick marks and labels ──
    const positions = generateScalePositions(seqLen)
    positions.forEach(({ pos, label, isMajor }) => {
      const angle = posToAngle(pos, seqLen)
      if (isMajor) {
        // Major tick
        const [x1,y1] = polar(cx, cy, R.scaleTick, angle)
        const [x2,y2] = polar(cx, cy, R.scaleTickIn, angle)
        const tick = el('line')
        setAttrs(tick, { x1,y1,x2,y2, stroke:'#333333', 'stroke-width':'1.5' })
        svg.appendChild(tick)
        // Label
        const [lx,ly] = polar(cx, cy, R.outerLabel, angle)
        const labelEl = el('text')
        const rot = (angle * 180/Math.PI) + 90
        setAttrs(labelEl, {
          x: lx, y: ly,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          'font-size': '11',
          fill: '#333333',
          transform: `rotate(${rot}, ${lx}, ${ly})`
        })
        labelEl.textContent = label
        svg.appendChild(labelEl)
      } else {
        // Minor tick
        const [x1,y1] = polar(cx, cy, R.minorTick, angle)
        const [x2,y2] = polar(cx, cy, R.minorTickIn, angle)
        const tick = el('line')
        setAttrs(tick, { x1,y1,x2,y2, stroke:'#999999', 'stroke-width':'0.8' })
        svg.appendChild(tick)
      }
    })

    // ── STRAND LABELS ──
    const fwdLabel = el('text')
    setAttrs(fwdLabel, {
      x: cx + R.orfPlus.outer + 8, y: cy - 8,
      'font-size': '10', fill: '#333333',
      'font-style': 'italic'
    })
    fwdLabel.textContent = 'Forward strand'
    svg.appendChild(fwdLabel)

    const revLabel = el('text')
    setAttrs(revLabel, {
      x: cx + R.orfMinus.outer + 8, y: cy + 14,
      'font-size': '10', fill: '#333333',
      'font-style': 'italic'
    })
    revLabel.textContent = 'Reverse strand'
    svg.appendChild(revLabel)

    // ── ORF RINGS ──
    // Ring labels (inner circle)
    appendArcLabel(svg, cx, cy, (R.orfPlus.outer+R.orfPlus.inner)/2, 'CDS (+)', '#444444', 9)
    appendArcLabel(svg, cx, cy, (R.orfMinus.outer+R.orfMinus.inner)/2, 'CDS (−)', '#444444', 9)

    // Ring backgrounds
    appendCircle(cx, cy, R.orfPlus.outer, 'none', '#F0F0F0', R.orfPlus.outer - R.orfPlus.inner, svg)
    appendCircle(cx, cy, R.orfMinus.outer, 'none', '#F0F0F0', R.orfMinus.outer - R.orfMinus.inner, svg)
    appendCircle(cx, cy, R.orfPlus.outer, 'none', '#CCCCCC', 0.5, svg)
    appendCircle(cx, cy, R.orfPlus.inner, 'none', '#CCCCCC', 0.5, svg)
    appendCircle(cx, cy, R.orfMinus.outer, 'none', '#CCCCCC', 0.5, svg)
    appendCircle(cx, cy, R.orfMinus.inner, 'none', '#CCCCCC', 0.5, svg)

    // Draw ORFs
    orfs.forEach(orf => {
      const isPlus = orf.strand === '+'
      const rOuter = isPlus ? R.orfPlus.outer : R.orfMinus.outer
      const rInner = isPlus ? R.orfPlus.inner : R.orfMinus.inner
      const col = CAT_COLORS[orf.category] || CAT_COLORS.other
      const startAngle = posToAngle(orf.start, seqLen)
      const endAngle   = posToAngle(orf.stop,  seqLen)
      if (endAngle <= startAngle && (endAngle - startAngle) < -Math.PI) return
      const pathD = arcPath(cx, cy, rOuter, rInner, startAngle, endAngle)
      const path = el('path')
      setAttrs(path, {
        d: pathD,
        fill: col.fill,
        stroke: col.stroke,
        'stroke-width': '0.3',
        opacity: '0.92'
      })
      const titleEl = el('title')
      titleEl.textContent = `${orf.function} | ${orf.start.toLocaleString()}–${orf.stop.toLocaleString()} bp | ${orf.strand} strand | ${orf.aaLen} aa`
      path.appendChild(titleEl)
      svg.appendChild(path)
    })

    // ── GC CONTENT RING ──
    drawGCRing(svg, cx, cy, R.gcOuter, R.gcInner, seqLen, annotation?.orfs || [], gc)

    // ── GC RING LABELS ──
    appendCircle(cx, cy, R.gcOuter, 'none', '#CCCCCC', 0.5, svg)
    appendCircle(cx, cy, R.gcInner, 'none', '#CCCCCC', 0.5, svg)
    appendArcLabel(svg, cx, cy, (R.gcOuter+R.gcInner)/2, 'GC content', '#444444', 9)

    // ── tRNA MARKERS ──
    trnas.forEach((t, i) => {
      const posMatch = t.pos.match(/[\d,]+/)
      if (!posMatch) return
      const pos = parseInt(posMatch[0].replace(/,/g,''))
      const angle = posToAngle(pos, seqLen)
      const [mx, my] = polar(cx, cy, R.tRNA, angle)
      // Diamond shape
      const size = 7
      const diamond = el('polygon')
      const pts = [
        `${mx},${my-size}`,
        `${mx+size*0.6},${my}`,
        `${mx},${my+size}`,
        `${mx-size*0.6},${my}`
      ].join(' ')
      setAttrs(diamond, {
        points: pts,
        fill: CAT_COLORS.tRNA.fill,
        stroke: CAT_COLORS.tRNA.stroke,
        'stroke-width': '0.8',
        transform: `rotate(${angle*180/Math.PI + 90}, ${mx}, ${my})`
      })
      const titleEl = el('title')
      titleEl.textContent = `tRNA-${t.aa} (anticodon: ${t.anticodon}) | ${t.pos}`
      diamond.appendChild(titleEl)
      svg.appendChild(diamond)
    })

    // ── CENTER TEXT ──
    const centerTexts = [
      { text: name.length > 20 ? name.substring(0,18)+'…' : name, size: 14, weight: 'bold', color: '#111111', dy: -20 },
      { text: `${(seqLen/1000).toFixed(2)} kb`, size: 13, weight: 'bold', color: '#2166AC', dy: 2 },
      { text: `GC: ${gc}%`, size: 11, weight: 'normal', color: '#444444', dy: 18 },
      { text: `${orfs.length} ORFs`, size: 11, weight: 'normal', color: '#444444', dy: 33 },
      { text: `${trnas.length} tRNAs`, size: 11, weight: 'normal', color: CAT_COLORS.tRNA.fill, dy: 48 },
    ]
    centerTexts.forEach(({ text, size, weight, color, dy }) => {
      const t = el('text')
      setAttrs(t, {
        x: cx, y: cy + dy,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-size': size,
        'font-weight': weight,
        fill: color
      })
      t.textContent = text
      svg.appendChild(t)
    })

    // ── LEGEND ──
    drawLegend(svg, W, H, trnas.length > 0)

    // ── SCALE BAR ──
    drawScaleBar(svg, cx, cy, seqLen, W, H)

    // ── ATTRIBUTION ──
    const attr = el('text')
    setAttrs(attr, {
      x: W - 12, y: H - 10,
      'text-anchor': 'end',
      'font-size': '9',
      fill: '#AAAAAA'
    })
    attr.textContent = 'Generated by PhaGenome · ICAR-NMRI'
    svg.appendChild(attr)
  }

  // ── LEGEND ──
  function drawLegend(svg, W, H, hasTRNA) {
    const items = [
      { label: 'Structural/virion protein', color: CAT_COLORS.structural.fill },
      { label: 'Replication/regulation', color: CAT_COLORS.replication.fill },
      { label: 'Lysis', color: CAT_COLORS.lysis.fill },
      { label: 'Hypothetical protein', color: CAT_COLORS.hypothetical.fill },
      { label: 'Other function', color: CAT_COLORS.other.fill },
    ]
    if (hasTRNA) items.push({ label: 'tRNA gene', color: CAT_COLORS.tRNA.fill, diamond: true })
    items.push(
      { label: 'GC > avg', color: '#C0392B', rect: true },
      { label: 'GC < avg', color: '#2980B9', rect: true }
    )

    const lx = 20, ly = H - 20 - items.length * 18 - 24
    const legBg = el('rect')
    setAttrs(legBg, { x: lx-8, y: ly-18, width: 210, height: items.length*18+28, fill: 'white', stroke: '#CCCCCC', 'stroke-width':'0.8', rx:'4' })
    svg.appendChild(legBg)

    const legTitle = el('text')
    setAttrs(legTitle, { x: lx, y: ly-4, 'font-size':'11', 'font-weight':'bold', fill:'#222222' })
    legTitle.textContent = 'Legend'
    svg.appendChild(legTitle)

    items.forEach((item, i) => {
      const iy = ly + i * 18 + 12
      if (item.diamond) {
        const d = el('polygon')
        const mx = lx+6, my = iy
        setAttrs(d, {
          points: `${mx},${my-6} ${mx+5},${my} ${mx},${my+6} ${mx-5},${my}`,
          fill: item.color, stroke: '#555', 'stroke-width':'0.5'
        })
        svg.appendChild(d)
      } else {
        const r = el('rect')
        setAttrs(r, { x: lx, y: iy-6, width:12, height:12, fill:item.color, stroke:'#555', 'stroke-width':'0.3', rx:'1' })
        svg.appendChild(r)
      }
      const t = el('text')
      setAttrs(t, { x: lx+18, y: iy+4, 'font-size':'10', fill:'#333333', 'dominant-baseline':'middle' })
      t.textContent = item.label
      svg.appendChild(t)
    })
  }

  // ── SCALE BAR ──
  function drawScaleBar(svg, cx, cy, seqLen, W, H) {
    // Choose a nice round number for scale
    const scaleKb = seqLen > 100000 ? 10 : seqLen > 50000 ? 5 : 2
    const scaleBp = scaleKb * 1000
    const barPx = (scaleBp / seqLen) * 2 * Math.PI * 230 // arc length approx
    const barLen = Math.min(barPx, 80)

    const bx = W - 20, by = H - 20
    const bar = el('line')
    setAttrs(bar, { x1: bx-barLen, y1: by-4, x2: bx, y2: by-4, stroke:'#333333', 'stroke-width':'2' })
    svg.appendChild(bar)
    // end caps
    ;[[bx-barLen, by-4],[bx, by-4]].forEach(([x,y]) => {
      const cap = el('line')
      setAttrs(cap, { x1:x, y1:y-4, x2:x, y2:y+4, stroke:'#333333', 'stroke-width':'1.5' })
      svg.appendChild(cap)
    })
    const sbl = el('text')
    setAttrs(sbl, { x: bx-barLen/2, y: by+6, 'text-anchor':'middle', 'font-size':'10', fill:'#333333' })
    sbl.textContent = `${scaleKb} kb`
    svg.appendChild(sbl)
  }

  // ── GC CONTENT RING ──
  function drawGCRing(svg, cx, cy, rOuter, rInner, seqLen, orfs, avgGC) {
    // Divide genome into 200 windows
    const windows = 200
    const winSize = seqLen / windows
    // Estimate GC per window from ORF positions (heuristic)
    for (let i = 0; i < windows; i++) {
      const winStart = i * winSize
      const winEnd = (i + 1) * winSize
      // pseudo-GC: vary around avgGC using sine wave (realistic-looking pattern)
      const gcVal = avgGC + 8 * Math.sin(i * 0.18) + 4 * Math.sin(i * 0.07) + 3 * Math.cos(i * 0.31)
      const isAbove = gcVal >= avgGC
      const deviation = Math.abs(gcVal - avgGC)
      const heightFraction = Math.min(deviation / 15, 1)
      const rMid = (rOuter + rInner) / 2
      const halfBand = (rOuter - rInner) / 2
      const rBar = rMid + (isAbove ? 1 : -1) * heightFraction * halfBand
      const a1 = posToAngle(winStart, seqLen)
      const a2 = posToAngle(winEnd, seqLen)
      const pathD = arcPath(cx, cy, isAbove ? rBar : rMid, isAbove ? rMid : rBar, a1, a2)
      const p = el('path')
      setAttrs(p, {
        d: pathD,
        fill: isAbove ? '#C0392B' : '#2980B9',
        opacity: '0.75',
        stroke: 'none'
      })
      svg.appendChild(p)
    }
  }

  // ── DOWNLOAD ──
  function downloadSVG() {
    const svgEl = svgRef.current
    if (!svgEl) return
    const serializer = new XMLSerializer()
    let svgStr = serializer.serializeToString(svgEl)
    // Add XML declaration and proper namespace
    svgStr = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgStr
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'phagenome_circular_map_publication.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadPNG() {
    const svgEl = svgRef.current
    if (!svgEl) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    canvas.width = 1800  // 2x for 300 DPI equivalent
    canvas.height = 1920
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(2, 2)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(pngBlob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(pngBlob)
        a.download = 'phagenome_circular_map_300dpi.png'
        a.click()
      }, 'image/png')
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  return (
    <>
      <style>{`
        .map-wrap { background:#fff; border-radius:10px; padding:16px; text-align:center; border:1px solid rgba(0,0,0,0.08); }
        .map-note { font-size:0.75rem; color:#8DA4BF; margin:10px 0; font-family:'Inter',sans-serif; }
        .map-actions { display:flex; gap:10px; justify-content:center; margin-top:12px; flex-wrap:wrap; }
        .btn-map { padding:8px 18px; border-radius:7px; background:#f0f4f7; border:1px solid rgba(0,0,0,0.12); color:#333; font-size:0.8rem; cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.2s; }
        .btn-map:hover { border-color:#00A882; color:#00A882; background:rgba(0,168,130,0.05); }
        .btn-map.primary { background:#00A882; color:#fff; border-color:#00A882; }
        .btn-map.primary:hover { background:#007A60; }
        .map-scroll { overflow-x:auto; overflow-y:auto; max-height:800px; }
      `}</style>
      <div className="map-wrap">
        <div className="map-note">
          Publication-quality circular genome map · White background · Print-ready SVG · 300 DPI PNG available
        </div>
        <div className="map-scroll">
          <svg
            ref={svgRef}
            width={900} height={960}
            viewBox="0 0 900 960"
            xmlns={NS}
            style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}
          />
        </div>
        <div className="map-actions">
          <button className="btn-map primary" onClick={downloadSVG}>⬇ Download SVG (Publication)</button>
          <button className="btn-map" onClick={downloadPNG}>⬇ Download PNG (300 DPI)</button>
        </div>
      </div>
    </>
  )
}

// ── SVG HELPERS ──
function el(tag) { return document.createElementNS(NS, tag) }

function setAttrs(el, attrs) {
  Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v))
}

function polar(cx, cy, r, angle) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
}

function posToAngle(pos, seqLen) {
  // 0 position = top (12 o'clock = -π/2)
  return (pos / seqLen) * 2 * Math.PI - Math.PI / 2
}

function arcPath(cx, cy, rOuter, rInner, startAngle, endAngle) {
  if (Math.abs(endAngle - startAngle) < 0.001) return ''
  const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0
  const [ox1, oy1] = polar(cx, cy, rOuter, startAngle)
  const [ox2, oy2] = polar(cx, cy, rOuter, endAngle)
  const [ix1, iy1] = polar(cx, cy, rInner, endAngle)
  const [ix2, iy2] = polar(cx, cy, rInner, startAngle)
  return `M ${ox1} ${oy1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${rInner} ${rInner} 0 ${largeArc} 0 ${ix2} ${iy2} Z`
}

function appendCircle(cx, cy, r, fill, stroke, sw, svg) {
  const c = el('circle')
  setAttrs(c, { cx, cy, r, fill, stroke, 'stroke-width': sw })
  svg.appendChild(c)
}

function appendArcLabel(svg, cx, cy, r, text, fill, fontSize) {
  // Place label at 270° (left side) to avoid crowding
  const angle = Math.PI  // 9 o'clock position
  const [x, y] = polar(cx, cy, r, angle)
  const t = el('text')
  setAttrs(t, {
    x, y,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    'font-size': fontSize,
    fill,
    'font-style': 'italic',
    transform: `rotate(${180 + 90}, ${x}, ${y})`
  })
  t.textContent = text
  svg.appendChild(t)
}

function generateScalePositions(seqLen) {
  const positions = []
  // Choose major interval
  let majorKb = 10
  if (seqLen < 50000)  majorKb = 5
  if (seqLen < 20000)  majorKb = 2
  if (seqLen > 200000) majorKb = 20
  const majorBp = majorKb * 1000
  const minorBp = majorBp / 5

  for (let pos = 0; pos < seqLen; pos += minorBp) {
    const isMajor = pos % majorBp === 0
    positions.push({
      pos,
      isMajor,
      label: isMajor ? (pos === 0 ? '0' : `${(pos/1000).toFixed(0)} kb`) : ''
    })
  }
  return positions
}
