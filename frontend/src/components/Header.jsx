import React from 'react';
import { Stethoscope, Phone, RotateCcw, Activity } from 'lucide-react';

export function Header({ statusInfo, onOpenPhone, onResetDemo, isCallActive }) {
  return (
    <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-xl sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-17 flex items-center justify-between">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#b48346] shadow-xs">
            <Stethoscope className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-bold tracking-tight text-slate-900">Nexov Health</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-[#926c35] border border-amber-200 font-semibold">
                EXECUTIVE SUITE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans hidden sm:block">Autonomous Clinical Voice Concierge & Dispatch Hub</p>
          </div>
        </div>

        {/* Telemetry pill & Actions */}
        <div className="flex items-center gap-3">
          {/* Telemetry Capsule */}
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-600 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-slate-700 font-medium">Pipecat 1.17</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#926c35] font-medium">Silero VAD</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-medium">Gemini 2.5 Flash</span>
          </div>

          {/* Reset Demo button */}
          <button
            onClick={onResetDemo}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
            title="Restore seed database appointments & slots"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset State</span>
          </button>

          {/* Voice Session Trigger */}
          <button
            onClick={onOpenPhone}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98 ${
              isCallActive
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-emerald-glow animate-pulse'
                : 'bg-gradient-to-r from-[#b48346] via-[#c59b27] to-[#b48346] hover:brightness-105 text-white font-bold shadow-gold-glow'
            }`}
          >
            <Phone className="w-3.5 h-3.5 fill-current" />
            <span>{isCallActive ? 'Session In Progress' : 'Initiate Voice Session'}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
