import React from 'react';
import { CheckCircle2, Calendar, Clock, Phone, Stethoscope } from 'lucide-react';

export function BookingModalCard({ appointment, onClose }) {
  if (!appointment) return null;

  return (
    <div className="bg-white border border-amber-300 rounded-2xl p-4 shadow-md relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Specular Top Gold Highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#b48346] via-[#fef3c7] to-[#059669]" />

      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#78350f] font-bold">Appointment Confirmed</span>
            <p className="text-[11px] font-mono text-slate-500">Ref: {appointment.appointment_id}</p>
          </div>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
          CONFIRMED
        </span>
      </div>

      <div className="py-2.5 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-[#b48346]" /> Attending Physician:
          </span>
          <span className="font-serif font-bold text-slate-900 text-[13px]">{appointment.doctor_name}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date:
          </span>
          <span className="text-slate-700 font-medium">{appointment.date}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" /> Scheduled Window:
          </span>
          <span className="font-mono font-bold text-emerald-700">{appointment.time}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#b48346]" /> Verified Contact:
          </span>
          <span className="font-mono text-slate-800 font-medium">{appointment.phone_number}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>Recorded in Clinic Ledger</span>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-[#78350f] hover:text-amber-800 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
