import React from 'react';
import { Stethoscope, Phone, RotateCcw, Activity, Shield, Terminal } from 'lucide-react';

export function Header({ statusInfo, onOpenPhone, onResetDemo, isCallActive }) {
  return (
    <header className="border-b border-slate-800 bg-[#0a101e]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-slate-100">Nexov Health</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                v1.0 • FDE Voice Suite
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Clinical Operations & Voice Booking Dispatch</p>
          </div>
        </div>

        {/* Telemetry pill & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Telemetry Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Pipecat 1.17</span>
            <span className="text-slate-600">/</span>
            <span className="text-teal-400">Silero VAD</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">Gemini 2.5 Flash</span>
          </div>

          {/* Reset Demo button */}
          <button
            onClick={onResetDemo}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset database to fresh seed state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset State</span>
          </button>

          {/* Voice Call Trigger Button */}
          <button
            onClick={onOpenPhone}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isCallActive
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 animate-pulse'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-sm shadow-teal-500/20'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{isCallActive ? 'Active Call In Progress' : 'Start Voice Call'}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
