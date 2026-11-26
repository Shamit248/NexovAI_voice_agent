import React, { useRef, useEffect } from 'react';
import { MessageSquare, Bot, User, Radio, Activity } from 'lucide-react';

export function TranscriptFeed({ transcripts = [], isLive = false, agentStatus = 'idle' }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div className="luxury-card rounded-2xl p-4 flex flex-col h-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-[#b48346]" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Live Voice Stream Transcript</h3>
        </div>
        {isLive && (
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-mono font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>STREAMING (16kHz PCM)</span>
          </div>
        )}
      </div>

      {/* Transcript Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-2.5 space-y-2.5">
        {transcripts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs p-4">
            <Activity className="w-6 h-6 mb-2 text-slate-300 stroke-[1.5]" />
            <p className="font-semibold text-slate-700">Waiting for call session...</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
              Click <span className="text-[#926c35] font-semibold">"Initiate Voice Session"</span> to begin speaking with the clinical concierge.
            </p>
          </div>
        ) : (
          transcripts.map((t, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 ${t.role === 'caller' ? 'flex-row-reverse' : ''}`}
            >
              <div 
                className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-mono ${
                  t.role === 'caller' 
                    ? 'bg-emerald-600 text-white font-bold' 
                    : 'bg-amber-100 text-[#78350f] border border-amber-200 font-bold'
                }`}
              >
                {t.role === 'caller' ? 'YOU' : 'AI'}
              </div>

              <div className={`max-w-[82%] space-y-0.5 ${t.role === 'caller' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>{t.role === 'caller' ? 'Caller' : 'Nexa Concierge'}</span>
                  <span>{t.timestamp}</span>
                </div>
                <div
                  className={`rounded-xl px-3 py-1.5 text-xs leading-relaxed ${
                    t.role === 'caller'
                      ? 'bg-emerald-600 text-white font-medium shadow-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200 shadow-xs'
                  }`}
                >
                  {t.text}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
