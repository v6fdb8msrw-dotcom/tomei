import type { Car } from '../data.ts'

// Silhouetten aus der ersten Version (tomei-jdm-bridge.jsx)
const BODY: Record<Car['body'], { path: string; glass: string; wheels: [number, number]; r: number }> = {
  kei: { path: 'M18 78 L18 44 Q18 38 26 38 L96 38 L108 22 L150 22 Q158 22 162 30 L210 50 Q222 54 222 66 L222 78 Z', glass: 'M30 38 L92 38 L100 26 L34 26 Q30 26 30 30 Z', wheels: [62, 182], r: 16 },
  hatch: { path: 'M14 80 Q14 60 34 56 L70 36 Q78 30 92 30 L150 30 Q166 30 176 40 L208 56 Q224 60 224 76 L224 80 Z', glass: 'M74 38 L150 38 Q160 38 168 46 L70 46 Z', wheels: [64, 184], r: 17 },
  sedan: { path: 'M10 80 Q12 62 40 58 L66 38 Q74 32 90 32 L160 32 Q176 32 186 42 L214 58 Q230 62 230 76 L230 80 Z', glass: 'M72 40 L158 40 Q168 40 176 48 L66 48 Z', wheels: [66, 186], r: 17 },
  coupe: { path: 'M8 82 Q10 64 42 58 L78 34 Q88 28 108 28 L150 28 Q172 30 188 46 L216 58 Q232 62 232 78 L232 82 Z', glass: 'M86 40 Q92 34 108 34 L148 34 Q164 36 176 48 L84 48 Z', wheels: [64, 188], r: 18 },
}

export function CarArt({ body }: { body: Car['body'] }) {
  const b = BODY[body]
  const wy = body === 'coupe' ? 86 : body === 'kei' ? 82 : 84
  return (
    <svg viewBox="0 0 240 110" width="100%" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <path d={b.path} fill="var(--car)" stroke="var(--line-strong)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d={b.glass} fill="var(--red)" opacity="0.22" />
      {b.wheels.map((x) => (
        <g key={x} className="wheel" style={{ transformOrigin: `${x}px ${wy}px` }}>
          <circle cx={x} cy={wy} r={b.r} fill="#060607" stroke="var(--line-strong)" strokeWidth="2.5" />
          <circle cx={x} cy={wy} r={b.r * 0.38} fill="var(--red)" />
          <path d={`M${x - b.r * 0.7} ${wy} H${x + b.r * 0.7} M${x} ${wy - b.r * 0.7} V${wy + b.r * 0.7}`} stroke="#2a2a2e" strokeWidth="2" />
        </g>
      ))}
    </svg>
  )
}
