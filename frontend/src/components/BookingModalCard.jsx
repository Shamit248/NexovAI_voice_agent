import React from 'react';
import { CheckCircle2, Calendar, Clock, Phone, Stethoscope, Hash } from 'lucide-react';

export function BookingModalCard({ appointment, onClose }) {
  if (!appointment) return null;

  return (
    <div className="bg-slate-900/95 border border-teal-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Decorative top ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400" />

      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-teal-400">Appointment Confirmed</h4>
            <p className="text-[11px] text-slate-400">Ref: {appointment.appointment_id}</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          CONFIRMED
        </span>
      </div>

      <div className="py-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-teal-400" /> Doctor:
          </span>
          <span className="font-semibold text-slate-200">{appointment.doctor_name}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Date:
          </span>
          <span className="font-medium text-slate-200">{appointment.date}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-400" /> Time:
          </span>
          <span className="font-mono font-semibold text-teal-300">{appointment.time}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-indigo-400" /> Patient Phone:
          </span>
          <span className="font-mono text-slate-200">{appointment.phone_number}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span>Synced with Clinic Ledger</span>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-teal-400 hover:text-teal-300 font-medium cursor-pointer"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
