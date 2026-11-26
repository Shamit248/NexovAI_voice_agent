import React from 'react';
import { Users, CalendarCheck, Clock, Zap } from 'lucide-react';

export function StatsBar({ doctors = [], slots = [], appointments = [] }) {
  const availableSlotsCount = slots.filter(s => s.is_available === 1).length;
  const confirmedAptsCount = appointments.filter(a => a.status === 'CONFIRMED').length;

  const stats = [
    {
      label: 'Specialist Physicians',
      value: doctors.length || 5,
      note: 'Cardiology, Dermatology, Ortho, Peds',
      icon: Users,
      accent: 'text-[#b48346]',
      bgAccent: 'bg-amber-50 border-amber-200/80'
    },
    {
      label: 'Open Appointment Slots',
      value: availableSlotsCount,
      note: 'Live real-time ledger sync',
      icon: Clock,
      accent: 'text-emerald-700',
      bgAccent: 'bg-emerald-50 border-emerald-200/80'
    },
    {
      label: 'Confirmed Registrations',
      value: confirmedAptsCount,
      note: 'Spoken phone number verified',
      icon: CalendarCheck,
      accent: 'text-[#926c35]',
      bgAccent: 'bg-amber-50 border-amber-200/80'
    },
    {
      label: 'Voice Engine Latency',
      value: '< 420 ms',
      note: 'ElevenLabs + Gemini 2.5 Flash',
      icon: Zap,
      accent: 'text-slate-700',
      bgAccent: 'bg-slate-100 border-slate-200'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div 
            key={i} 
            className="luxury-card rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <div className="text-2xl font-serif font-bold text-slate-900 mt-0.5">{stat.value}</div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{stat.note}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${stat.accent} ${stat.bgAccent} shadow-xs`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
