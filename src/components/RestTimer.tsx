import { useEffect, useRef, useState } from 'react'

interface Props {
  seconds: number          // duration of this rest period
  startedAt: number        // epoch ms when the rest began
  onDone: () => void
  onSkip: () => void
  onAdjust: (deltaSeconds: number) => void
}

// Circular countdown shown after completing a set. Survives re-renders and
// backgrounding because it derives remaining time from the start timestamp.
export default function RestTimer({ seconds, startedAt, onDone, onSkip, onAdjust }: Props) {
  const [now, setNow] = useState(startedAt)
  const firedRef = useRef(false)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  const elapsed = (now - startedAt) / 1000
  const remaining = Math.max(0, seconds - elapsed)

  useEffect(() => {
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true
      // Gentle haptic / beep where supported.
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.18, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
        osc.connect(gain).connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.7)
      } catch { /* audio blocked — vibration already attempted */ }
      onDone()
    }
  }, [remaining, onDone])

  const pct = seconds > 0 ? remaining / seconds : 0
  const R = 52
  const C = 2 * Math.PI * R
  const mm = Math.floor(remaining / 60)
  const ss = Math.floor(remaining % 60).toString().padStart(2, '0')

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="card animate-pop flex items-center gap-4 p-3 shadow-2xl shadow-black/60">
        <div className="relative h-[72px] w-[72px] shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={R} fill="none"
              stroke="url(#tg)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
              style={{ transition: 'stroke-dashoffset 0.25s linear' }}
            />
            <defs>
              <linearGradient id="tg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold">
            {mm}:{ss}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Rest timer</p>
          <p className="text-xs text-zinc-500">Next set when the ring closes</p>
          <div className="mt-1.5 flex gap-2">
            <button className="btn-ghost !px-3 !py-1 text-xs" onClick={() => onAdjust(-15)}>−15s</button>
            <button className="btn-ghost !px-3 !py-1 text-xs" onClick={() => onAdjust(15)}>+15s</button>
            <button className="btn-ghost !px-3 !py-1 text-xs" onClick={onSkip}>Skip</button>
          </div>
        </div>
      </div>
    </div>
  )
}
