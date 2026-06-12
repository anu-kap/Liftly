import type { MuscleGroup } from '../lib/types'

// Stylized body illustration with the target muscle group highlighted.
// Back-chain groups render the rear view; everything else the front view.

const BACK_VIEW: MuscleGroup[] = ['Back', 'Hamstrings', 'Glutes', 'Calves', 'Triceps']

interface Props {
  group: MuscleGroup
  size?: number
  className?: string
}

export default function MuscleDiagram({ group, size = 64, className }: Props) {
  const back = BACK_VIEW.includes(group)
  const full = group === 'Full Body' || group === 'Cardio'
  const hl = 'var(--color-accent)'
  const body = 'rgba(255,255,255,0.14)'

  return (
    <svg
      viewBox="0 0 100 190"
      width={size}
      height={size * 1.9}
      className={className}
      aria-label={`${group} muscles${back ? ' (rear view)' : ''}`}
    >
      {/* silhouette */}
      <g fill={full ? 'rgba(211,255,58,0.35)' : body}>
        <circle cx="50" cy="14" r="9" />
        <rect x="45" y="22" width="10" height="7" rx="2" />
        <path d="M33 29 H67 C71 47 69 62 64 79 L36 79 C31 62 29 47 33 29 Z" />
        {/* arms */}
        <line x1="29" y1="35" x2="20" y2="73" stroke={full ? 'rgba(211,255,58,0.35)' : body} strokeWidth="9" strokeLinecap="round" />
        <line x1="71" y1="35" x2="80" y2="73" stroke={full ? 'rgba(211,255,58,0.35)' : body} strokeWidth="9" strokeLinecap="round" />
        {/* legs */}
        <line x1="43" y1="84" x2="41" y2="126" stroke={full ? 'rgba(211,255,58,0.35)' : body} strokeWidth="13" strokeLinecap="round" />
        <line x1="57" y1="84" x2="59" y2="126" stroke={full ? 'rgba(211,255,58,0.35)' : body} strokeWidth="13" strokeLinecap="round" />
        <line x1="41" y1="132" x2="40" y2="168" stroke={full ? 'rgba(211,255,58,0.35)' : body} strokeWidth="9" strokeLinecap="round" />
        <line x1="59" y1="132" x2="60" y2="168" stroke={full ? 'rgba(211,255,58,0.35)' : body} strokeWidth="9" strokeLinecap="round" />
      </g>

      {/* highlight */}
      {!full && (
        <g fill={hl} stroke="none">
          {group === 'Chest' && !back && (<><ellipse cx="42" cy="39" rx="8" ry="6" /><ellipse cx="58" cy="39" rx="8" ry="6" /></>)}
          {group === 'Shoulders' && (<><circle cx="31" cy="33" r="6" /><circle cx="69" cy="33" r="6" /></>)}
          {group === 'Biceps' && (<><line x1="28" y1="40" x2="24" y2="55" stroke={hl} strokeWidth="8" strokeLinecap="round" /><line x1="72" y1="40" x2="76" y2="55" stroke={hl} strokeWidth="8" strokeLinecap="round" /></>)}
          {group === 'Triceps' && (<><line x1="28" y1="40" x2="24" y2="55" stroke={hl} strokeWidth="8" strokeLinecap="round" /><line x1="72" y1="40" x2="76" y2="55" stroke={hl} strokeWidth="8" strokeLinecap="round" /></>)}
          {group === 'Back' && <path d="M36 32 H64 C66 45 65 55 61 66 L39 66 C35 55 34 45 36 32 Z" />}
          {group === 'Core' && <rect x="42" y="50" width="16" height="24" rx="5" />}
          {group === 'Quads' && (<><line x1="43" y1="88" x2="41" y2="118" stroke={hl} strokeWidth="11" strokeLinecap="round" /><line x1="57" y1="88" x2="59" y2="118" stroke={hl} strokeWidth="11" strokeLinecap="round" /></>)}
          {group === 'Hamstrings' && (<><line x1="43" y1="90" x2="41" y2="120" stroke={hl} strokeWidth="11" strokeLinecap="round" /><line x1="57" y1="90" x2="59" y2="120" stroke={hl} strokeWidth="11" strokeLinecap="round" /></>)}
          {group === 'Glutes' && (<><ellipse cx="43" cy="82" rx="7" ry="6" /><ellipse cx="57" cy="82" rx="7" ry="6" /></>)}
          {group === 'Calves' && (<><line x1="41" y1="136" x2="40" y2="160" stroke={hl} strokeWidth="8" strokeLinecap="round" /><line x1="59" y1="136" x2="60" y2="160" stroke={hl} strokeWidth="8" strokeLinecap="round" /></>)}
        </g>
      )}
    </svg>
  )
}
