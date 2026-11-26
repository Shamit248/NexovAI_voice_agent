import React from 'react';
import { Users, CalendarCheck, Clock, Zap } from 'lucide-react';

export function StatsBar({ doctors = [], slots = [], appointments = [] }) {
  const availableSlotsCount = slots.filter(s => s.is_available === 1).length;
  const confirmedAptsCount = appointments.filter(a => a.status === 'CONFIRMED').length;

  const stats = [
    {
      label: 'Clinical Specialists',
      value: doctors.length || 5,
      note: 'Cardio, Derm, Primary, Ortho, Peds',
      icon: Users
    },
    {
      label: 'Open Appointment Slots',
      value: availableSlotsCount,
      note: 'Live database sync',
      icon: Clock
    },
    {
      label: 'Active Confirmed Bookings',
      value: confirmedAptsCount,
      note: 'Verified by caller phone',
      icon: CalendarCheck
    },
    {
      label: 'Audio Pipeline Target',
      value: '< 420 ms',
      note: 'Full-duplex WebSocket stream',
      icon: Zap
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div 
            key={i} 
            className="clinical-panel rounded-xl p-3.5 flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <div className="text-xl font-bold font-mono text-slate-100 mt-0.5">{stat.value}</div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{stat.note}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 flex-shrink-0">
              <Icon className="w-4 h-4 text-teal-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
