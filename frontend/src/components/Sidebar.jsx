import React from 'react';
import { Stethoscope, Activity, Users, CalendarCheck, RotateCcw, ShieldCheck } from 'lucide-react';

export function Sidebar({ 
  doctors = [], 
  selectedSpecialty = 'ALL', 
  onSelectSpecialty, 
  onResetDemo,
  isCallActive 
}) {
  const departments = [
    { id: 'ALL', name: 'All Departments', count: doctors.length },
    { id: 'Cardiology', name: 'Cardiology', count: doctors.filter(d => d.specialty === 'Cardiology').length },
    { id: 'Dermatology', name: 'Dermatology', count: doctors.filter(d => d.specialty === 'Dermatology').length },
    { id: 'General Medicine', name: 'General Medicine', count: doctors.filter(d => d.specialty === 'General Medicine').length },
    { id: 'Orthopedics', name: 'Orthopedics', count: doctors.filter(d => d.specialty === 'Orthopedics').length },
    { id: 'Pediatrics', name: 'Pediatrics', count: doctors.filter(d => d.specialty === 'Pediatrics').length },
  ];

  return (
    <aside className="w-68 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between flex-shrink-0 min-h-screen hidden xl:flex shadow-xs">
      
      {/* Top Brand Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#b48346] shadow-xs">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-base font-bold text-slate-900 tracking-tight">Nexov Health</h1>
            <p className="text-[10px] font-mono text-[#926c35] uppercase tracking-wider font-semibold">Concierge Dispatch</p>
          </div>
        </div>

        {/* Live Audio Telemetry Capsule */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-emerald-500 animate-pulse' : 'bg-[#b48346]'}`} />
              Clinical Engine
            </span>
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
              isCallActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-[#926c35] border border-amber-200'
            }`}>
              {isCallActive ? 'ACTIVE' : 'READY'}
            </span>
          </div>
          
          <div className="text-[10px] font-mono text-slate-600 space-y-1 pt-2 border-t border-slate-200/80">
            <div className="flex justify-between">
              <span className="text-slate-500">Pipeline:</span>
              <span className="text-slate-800 font-medium">Pipecat 1.17</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">VAD Model:</span>
              <span className="text-emerald-700 font-medium">Silero ONNX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Voice Synthesis:</span>
              <span className="text-[#926c35] font-medium">ElevenLabs Turbo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reasoning Core:</span>
              <span className="text-slate-800 font-medium">Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>

        {/* Department Switcher */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 block mb-1.5 font-semibold">
            Specialist Clinics ({doctors.length} On Duty)
          </span>
          {departments.map(dept => (
            <button
              key={dept.id}
              onClick={() => onSelectSpecialty(dept.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer text-left ${
                selectedSpecialty === dept.id
                  ? 'bg-amber-50 text-[#78350f] border border-amber-300 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <span>{dept.name}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                selectedSpecialty === dept.id
                  ? 'bg-amber-100/60 border-amber-200 text-amber-900'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                {dept.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
        <button
          onClick={onResetDemo}
          className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs active:scale-98"
          title="Restore seed appointments & slots"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Clinic Database</span>
        </button>

        <p className="text-[10px] text-slate-400 text-center font-mono">
          Nexov Clinical Engine v1.0 • FDE
        </p>
      </div>

    </aside>
  );
}
