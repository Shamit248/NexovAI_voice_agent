import React, { useState, useMemo } from 'react';
import { Stethoscope, Star, Clock, Search, ChevronRight, UserCheck } from 'lucide-react';

export function DoctorsGrid({ doctors = [], slots = [], onSelectSlot }) {
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const specialties = [
    { id: 'ALL', label: 'All Departments' },
    { id: 'Cardiology', label: 'Cardiology' },
    { id: 'Dermatology', label: 'Dermatology' },
    { id: 'General Medicine', label: 'General Medicine' },
    { id: 'Orthopedics', label: 'Orthopedics' },
    { id: 'Pediatrics', label: 'Pediatrics' },
  ];

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchSpec = selectedSpecialty === 'ALL' || doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase();
      const matchSearch = searchQuery.trim() === '' || 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.hospital.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSpec && matchSearch;
    });
  }, [doctors, selectedSpecialty, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search and Department Filter Bar */}
      <div className="clinical-panel rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search physician name, specialty, or clinic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
          />
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs self-start md:self-auto">
          {['ALL', 'Today', 'Tomorrow'].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedDate === d
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {d === 'ALL' ? 'All Dates' : d}
            </button>
          ))}
        </div>
      </div>

      {/* Specialty Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {specialties.map(spec => (
          <button
            key={spec.id}
            onClick={() => setSelectedSpecialty(spec.id)}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedSpecialty === spec.id
                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 font-semibold'
                : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-300 border border-slate-800'
            }`}
          >
            {spec.label}
          </button>
        ))}
      </div>

      {/* Physician Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredDoctors.map(doctor => {
          let docSlots = slots.filter(s => s.doctor_id === doctor.id);
          if (selectedDate !== 'ALL') {
            docSlots = docSlots.filter(s => s.date.toLowerCase().includes(selectedDate.toLowerCase()));
          }
          const availableSlots = docSlots.filter(s => s.is_available === 1);

          return (
            <div
              key={doctor.id}
              className="clinical-panel rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                {/* Header Profile */}
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={doctor.avatar_url}
                    alt={doctor.name}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-sm font-bold text-slate-100 truncate">{doctor.name}</h4>
                      <span className="flex items-center gap-0.5 text-[11px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {doctor.rating}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-teal-400">{doctor.specialty}</p>
                    <p className="text-[11px] text-slate-400 truncate">{doctor.hospital} • {doctor.experience}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {doctor.bio}
                </p>
              </div>

              {/* Slot Scheduling Section */}
              <div className="pt-2.5 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-slate-500" /> Next Available Slots:
                  </span>
                  <span className="font-mono text-xs text-teal-400">
                    {availableSlots.length} open
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {docSlots.slice(0, 6).map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => onSelectSlot && onSelectSlot(slot, doctor)}
                      disabled={slot.is_available === 0}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                        slot.is_available === 1
                          ? 'bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 hover:border-teal-400 active:scale-95'
                          : 'bg-slate-900/40 text-slate-600 line-through border border-slate-850 cursor-not-allowed opacity-50'
                      }`}
                      title={slot.is_available === 1 ? `Click to ask voice agent for this slot (${slot.date} ${slot.time})` : "Slot filled"}
                    >
                      <span>{slot.time}</span>
                      {slot.is_available === 1 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      )}
                    </button>
                  ))}
                  {docSlots.length > 6 && (
                    <span className="text-[10px] text-slate-500 self-center pl-1 font-mono">
                      +{docSlots.length - 6} more
                    </span>
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
