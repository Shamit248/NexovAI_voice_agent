import React, { useState, useMemo } from 'react';
import { Search, Clock, Calendar, Star, Stethoscope, ChevronRight } from 'lucide-react';

export function DoctorsGrid({ doctors = [], slots = [], onSelectSlot }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');

  const specialties = ['ALL', 'Cardiology', 'Dermatology', 'General Medicine', 'Orthopedics', 'Pediatrics'];

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchesSpec = selectedSpecialty === 'ALL' || doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase();
      const matchesSearch = !searchQuery || 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.hospital.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSpec && matchesSearch;
    });
  }, [doctors, selectedSpecialty, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Department Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Specialty Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {specialties.map(spec => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedSpecialty === spec
                  ? 'bg-amber-50 text-[#78350f] border border-amber-300 font-semibold shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {spec === 'ALL' ? 'All Specialists' : spec}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search physician or clinic..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all shadow-xs"
          />
        </div>

      </div>

      {/* Physician Dossiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDoctors.map(doctor => {
          const docSlots = slots.filter(s => s.doctor_id === doctor.id);
          const availableSlots = docSlots.filter(s => s.is_available === 1);

          return (
            <div
              key={doctor.id}
              className="luxury-card rounded-2xl p-5 flex flex-col justify-between"
            >
              {/* Doctor Profile Dossier */}
              <div>
                <div className="flex items-start gap-3.5 mb-3">
                  <img
                    src={doctor.avatar_url}
                    alt={doctor.name}
                    className="w-13 h-13 rounded-xl object-cover border border-amber-200/80 shadow-xs flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif text-sm font-bold text-slate-900 truncate">{doctor.name}</h4>
                      <span className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#78350f] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                        <Star className="w-3 h-3 fill-[#b48346] text-[#b48346]" />
                        {doctor.rating}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#926c35] mt-0.5">{doctor.specialty}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{doctor.hospital} • {doctor.experience}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3.5">
                  {doctor.bio}
                </p>
              </div>

              {/* Consultation Slots */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-2">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Clock className="w-3 h-3 text-[#b48346]" /> Available Windows
                  </span>
                  <span className="font-mono text-[10px] text-emerald-700 font-semibold">
                    {availableSlots.length} open of {docSlots.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {docSlots.length === 0 ? (
                    <span className="text-slate-400 text-xs italic">No schedule posted</span>
                  ) : (
                    docSlots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => slot.is_available === 1 && onSelectSlot(slot, doctor)}
                        disabled={slot.is_available !== 1}
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                          slot.is_available === 1
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 hover:border-emerald-300 font-semibold cursor-pointer shadow-xs active:scale-95'
                            : 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed'
                        }`}
                        title={slot.is_available === 1 ? `Book ${slot.time} with ${doctor.name}` : 'Slot already booked'}
                      >
                        {slot.time}
                      </button>
                    ))
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
