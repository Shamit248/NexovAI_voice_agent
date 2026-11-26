import React, { useMemo } from 'react';

/**
 * 32 slim reactive audio visualizer bars.
 * Clean, technical aesthetic matching real-time audio analysis tools.
 */
export function AudioWaveform({ level = 0, status = 'idle', className = '' }) {
  const barCount = 32;

  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      const distanceFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
      const curveWeight = 1 - Math.pow(distanceFromCenter, 1.6);
      
      let heightPct;
      if (status === 'idle') {
        heightPct = 10 + Math.sin(i * 0.4) * 4;
      } else if (status === 'thinking') {
        const wave = (Math.sin(Date.now() / 140 + i * 0.45) + 1) / 2;
        heightPct = 16 + wave * 25 * curveWeight;
      } else {
        const noise = Math.random() * 0.35 + 0.65;
        const target = level * 100 * curveWeight * noise;
        heightPct = Math.max(12, Math.min(92, target));
      }
      return heightPct;
    });
  }, [level, status, barCount]);

  return (
    <div className={`flex items-center justify-center gap-[2px] h-11 px-3 ${className}`}>
      {bars.map((h, idx) => (
        <div
          key={idx}
          className="w-[2.5px] rounded-full transition-all duration-75"
          style={{
            height: `${h}%`,
            background: level > 0.05 || status === 'thinking'
              ? `#14b8a6`
              : `#334155`,
            opacity: level > 0.05 ? 0.9 : 0.4
          }}
        />
      ))}
    </div>
  );
}
