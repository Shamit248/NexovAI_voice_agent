import React, { useState } from 'react';
import { CalendarCheck, Phone, Stethoscope, Clock, Search, XCircle } from 'lucide-react';

export function AppointmentsTable({ appointments = [], onCancelAppointment, highlightedAptId }) {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredAppointments = appointments.filter(apt => {
    if (!filterQuery) return true;
    return apt.phone_number.includes(filterQuery) || 
           apt.doctor_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
           apt.id.toLowerCase().includes(filterQuery.toLowerCase());
  });

  return (
    <div className="luxury-card rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#b48346]">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">Clinical Appointments Ledger</h3>
            <p className="text-[10px] text-slate-500 font-sans">Synced real-time ledger matching phone bookings</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold ml-1">
            {appointments.length} Total
          </span>
        </div>

        {/* Search Ledger */}
        <div className="relative">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search phone, doctor, or Ref ID..."
            className="w-full sm:w-60 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all shadow-xs"
          />
        </div>
      </div>

      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="text-[10px] uppercase font-mono tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className="py-2.5 px-3">Reference</th>
              <th className="py-2.5 px-3">Patient Contact</th>
              <th className="py-2.5 px-3">Attending Physician</th>
              <th className="py-2.5 px-3">Scheduled Window</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                  No appointments registered yet. Speak to the voice concierge to book a slot.
                </td>
              </tr>
            ) : (
              filteredAppointments.map(apt => {
                const isHighlighted = highlightedAptId === apt.id;
                return (
                  <tr
                    key={apt.id}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isHighlighted ? 'animate-row-flash bg-amber-50/80' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-[11px] text-[#78350f] font-semibold">
                      {apt.id}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-900 font-semibold">
                      {apt.phone_number}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-serif font-bold text-slate-900">{apt.doctor_name}</span>
                      <span className="text-slate-500 ml-1.5 text-[11px]">({apt.specialty})</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-600">{apt.date}</span>
                      <span className="text-emerald-700 font-mono ml-1.5 text-[11px] font-bold">{apt.time}</span>
                    </td>
                    <td className="py-3 px-3">
                      {apt.status === 'CONFIRMED' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          CONFIRMED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 line-through">
                          CANCELLED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {apt.status === 'CONFIRMED' && (
                        <button
                          onClick={() => onCancelAppointment(apt)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-[11px] font-medium transition-colors cursor-pointer shadow-xs active:scale-95"
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
