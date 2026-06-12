interface Props {
  values: number[]
  width?: number
  height?: number
}

// Tiny inline trend graph (no axes) for at-a-glance progress.
export default function Sparkline({ values, width = 120, height = 36 }: Props) {
  if (values.length < 2) {
    return (
      <svg width={width} height={height}>
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
      </svg>
    )
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 4
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2)
    const y = height - pad - ((v - min) / span) * (height - pad * 2)
    return [x, y] as const
  })
  const path = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const lastPt = pts[pts.length - 1]

  return (
    <svg width={width} height={height}>
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2.8" fill="var(--color-accent)" />
    </svg>
  )
}
