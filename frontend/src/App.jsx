import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { DoctorsGrid } from './components/DoctorsGrid';
import { AppointmentsTable } from './components/AppointmentsTable';
import { PhoneConsole } from './components/PhoneConsole';
import { useVoiceCall } from './hooks/useVoiceCall';
import { Phone, CheckCircle2, ShieldCheck } from 'lucide-react';

export function App() {
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [statusInfo, setStatusInfo] = useState({});
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');
  const [highlightedAptId, setHighlightedAptId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [docsRes, slotsRes, aptsRes, statusRes] = await Promise.all([
        fetch('/api/doctors').then(r => r.json()),
        fetch('/api/slots').then(r => r.json()),
        fetch('/api/appointments').then(r => r.json()),
        fetch('/api/status').then(r => r.json())
      ]);
      setDoctors(docsRes.doctors || []);
      setSlots(slotsRes.slots || []);
      setAppointments(aptsRes.appointments || []);
      setStatusInfo(statusRes || {});
    } catch (err) {
      console.error("Failed to fetch clinic data:", err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Dashboard WebSocket Sync
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/dashboard`;
    let ws;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'snapshot') {
            if (payload.doctors) setDoctors(payload.doctors);
            if (payload.slots) setSlots(payload.slots);
            if (payload.appointments) setAppointments(payload.appointments);
          } else if (payload.type === 'appointment_booked') {
            const apt = payload.data;
            showToast(`Appointment confirmed: ${apt.doctor_name} at ${apt.time}`, 'success');
            setHighlightedAptId(apt.appointment_id);
            refreshData();
          } else if (payload.type === 'appointment_cancelled') {
            const apt = payload.data;
            showToast(`Appointment cancelled for ${apt.phone_number}`, 'warning');
            refreshData();
          } else if (payload.type === 'data_reset') {
            showToast("Clinical state reset to initial seed data", 'info');
            refreshData();
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      if (ws) ws.close();
    };
  }, [refreshData, showToast]);

  const handleAppointmentBooked = useCallback((apt) => {
    setHighlightedAptId(apt.appointment_id);
    showToast(`Appointment confirmed: ${apt.doctor_name} at ${apt.time}`, 'success');
    refreshData();
  }, [showToast, refreshData]);

  const handleAppointmentCancelled = useCallback((apt) => {
    showToast(`Appointment for ${apt.phone_number} cancelled`, 'warning');
    refreshData();
  }, [showToast, refreshData]);

  const {
    callState,
    callDuration,
    isMuted,
    audioLevel,
    agentStatus,
    transcripts,
    bookingConfirmation,
    startCall,
    endCall,
    toggleMute,
    sendUtterance
  } = useVoiceCall({
    onAppointmentBooked: handleAppointmentBooked,
    onAppointmentCancelled: handleAppointmentCancelled
  });

  const handleManualCancel = async (apt) => {
    if (!confirm(`Cancel appointment for ${apt.phone_number} with ${apt.doctor_name}?`)) return;
    try {
      const res = await fetch('/api/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: apt.phone_number, doctor_name: apt.doctor_name })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Appointment cancelled successfully", 'warning');
        refreshData();
      } else {
        showToast(data.detail || "Cancellation failed", 'error');
      }
    } catch (e) {
      showToast("Server connection error", 'error');
    }
  };

  const handleResetDemo = async () => {
    try {
      await fetch('/api/reset-demo', { method: 'POST' });
      showToast("Demo data reset to seed state", 'info');
      refreshData();
    } catch (e) {
      showToast("Reset failed", 'error');
    }
  };

  const handleSelectSlot = (slot, doctor) => {
    if (callState === 'IDLE') {
      startCall();
    }
    setTimeout(() => {
      sendUtterance(`Is ${doctor.name} available at ${slot.time}?`);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] text-slate-900 selection:bg-[#b48346]/20 selection:text-slate-900">
      
      {/* Zone 1: Left Navigation Sidebar */}
      <Sidebar
        doctors={doctors}
        selectedSpecialty={selectedSpecialty}
        onSelectSpecialty={setSelectedSpecialty}
        onResetDemo={handleResetDemo}
        isCallActive={callState === 'CONNECTED' || callState === 'RINGING'}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <Header
          statusInfo={statusInfo}
          onOpenPhone={startCall}
          onResetDemo={handleResetDemo}
          isCallActive={callState === 'CONNECTED' || callState === 'RINGING'}
        />

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-20 right-6 z-50 max-w-sm animate-in slide-in-from-top-2 duration-200">
            <div className={`rounded-xl px-4 py-2.5 text-xs font-semibold border flex items-center gap-2.5 shadow-lg backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-white border-slate-300 text-slate-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          
          {/* Operations KPI Metrics */}
          <StatsBar
            doctors={doctors}
            slots={slots}
            appointments={appointments}
          />

          {/* 2-Column Command Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Zone 2: Clinical Workspace (7 cols on large desktop) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              
              {/* Physician Directory & Schedule */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase font-mono">
                      Physician Availability Matrix
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Select a slot or speak to the agent. Slots update automatically when booked or cancelled.
                    </p>
                  </div>
                </div>

                <DoctorsGrid
                  doctors={selectedSpecialty === 'ALL' ? doctors : doctors.filter(d => d.specialty === selectedSpecialty)}
                  slots={slots}
                  onSelectSlot={handleSelectSlot}
                />
              </div>

              {/* Appointments Ledger */}
              <div className="pt-2">
                <AppointmentsTable
                  appointments={appointments}
                  onCancelAppointment={handleManualCancel}
                  highlightedAptId={highlightedAptId}
                />
              </div>

            </div>

            {/* Zone 3: Docked Hardware Phone Console (5 cols on large desktop) */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-22">
              <PhoneConsole
                callState={callState}
                callDuration={callDuration}
                isMuted={isMuted}
                audioLevel={audioLevel}
                agentStatus={agentStatus}
                transcripts={transcripts}
                bookingConfirmation={bookingConfirmation}
                onStartCall={startCall}
                onEndCall={endCall}
                onToggleMute={toggleMute}
                onSendUtterance={sendUtterance}
              />
            </div>

          </div>

        </main>
      </div>

    </div>
  );
}
