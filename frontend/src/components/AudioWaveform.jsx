import React, { useMemo } from 'react';

/**
 * Premium 32-bar Audio Waveform visualizer (Light Luxury).
 * Synthesizes warm champagne-gold and surgical emerald audio frequencies.
 */
export function AudioWaveform({ level = 0, status = 'idle', className = '' }) {
  const barCount = 32;

  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      const distanceFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
      const curveWeight = 1 - Math.pow(distanceFromCenter, 1.7);
      
      let heightPct;
      if (status === 'idle') {
        heightPct = 12 + Math.sin(i * 0.4) * 5;
      } else if (status === 'thinking') {
        const wave = (Math.sin(Date.now() / 140 + i * 0.35) + 1) / 2;
        heightPct = 18 + wave * 32 * curveWeight;
      } else {
        const noise = Math.random() * 0.35 + 0.65;
        const target = level * 100 * curveWeight * noise;
        heightPct = Math.max(12, Math.min(96, target));
      }
      return heightPct;
    });
  }, [level, status, barCount]);

  return (
    <div className={`flex items-center justify-center gap-[3px] h-13 px-4 ${className}`}>
      {bars.map((h, idx) => (
        <div
          key={idx}
          className="w-[2.5px] rounded-full transition-all duration-75"
          style={{
            height: `${h}%`,
            background: (level > 0.05 || status === 'thinking' || status === 'speaking')
              ? `linear-gradient(to top, #059669, #10b981, #b48346)`
              : `rgba(148, 163, 184, 0.45)`,
            boxShadow: (level > 0.1 || status === 'thinking' || status === 'speaking') 
              ? `0 0 6px rgba(180, 131, 70, ${Math.min(0.6, h / 100)})` 
              : 'none'
          }}
        />
      ))}
    </div>
  );
}
