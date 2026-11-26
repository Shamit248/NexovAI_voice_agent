import React, { useState } from 'react';
import { CalendarCheck, Phone, Stethoscope, Clock, Search, XCircle } from 'lucide-react';

export function AppointmentsTable({ appointments = [], onCancelAppointment, highlightedAptId }) {
  const [filterPhone, setFilterPhone] = useState('');

  const filteredAppointments = appointments.filter(apt => {
    if (!filterPhone) return true;
    return apt.phone_number.includes(filterPhone) || apt.doctor_name.toLowerCase().includes(filterPhone.toLowerCase());
  });

  return (
    <div className="clinical-panel rounded-xl p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-teal-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Clinical Appointments Ledger</h3>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {appointments.length} Total
          </span>
        </div>

        {/* Filter Ledger */}
        <div className="relative">
          <input
            type="text"
            value={filterPhone}
            onChange={(e) => setFilterPhone(e.target.value)}
            placeholder="Search phone or doctor..."
            className="w-full sm:w-48 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
          />
        </div>
      </div>

      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="text-[10px] uppercase font-mono tracking-wider text-slate-500 border-b border-slate-800 bg-slate-950/40">
            <tr>
              <th className="py-2 px-3">Ref ID</th>
              <th className="py-2 px-3">Patient Phone</th>
              <th className="py-2 px-3">Physician</th>
              <th className="py-2 px-3">Scheduled Slot</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 font-normal">
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                  No appointments registered. Tell the voice agent to book a slot.
                </td>
              </tr>
            ) : (
              filteredAppointments.map(apt => {
                const isHighlighted = highlightedAptId === apt.id;
                return (
                  <tr
                    key={apt.id}
                    className={`transition-colors hover:bg-slate-900/60 ${
                      isHighlighted ? 'animate-row-flash bg-teal-500/15' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      {apt.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-200">
                      {apt.phone_number}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-100">{apt.doctor_name}</span>
                      <span className="text-slate-500 ml-1.5 text-[11px]">({apt.specialty})</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-slate-300">{apt.date}</span>
                      <span className="text-teal-400 font-mono ml-1.5 text-[11px]">{apt.time}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      {apt.status === 'CONFIRMED' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          CONFIRMED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 line-through">
                          CANCELLED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {apt.status === 'CONFIRMED' && (
                        <button
                          onClick={() => onCancelAppointment(apt)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/30 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
