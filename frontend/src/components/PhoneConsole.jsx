import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Stethoscope, Radio, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { BookingModalCard } from './BookingModalCard';

export function PhoneConsole({
  callState,
  callDuration,
  isMuted,
  audioLevel,
  agentStatus,
  transcripts,
  bookingConfirmation,
  onStartCall,
  onEndCall,
  onToggleMute,
  onSendUtterance
}) {
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Executive Starlight Titanium Phone Chassis */}
      <div className="relative w-full max-w-[360px] h-[710px] titanium-phone rounded-[46px] overflow-hidden flex flex-col select-none bg-white">
        
        {/* Dynamic Island / Titanium Speaker Earpiece */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-[#0f172a] rounded-full z-20 flex items-center justify-between px-2.5 border border-slate-700/50 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          {callState === 'CONNECTED' ? (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400 font-bold tracking-wider">LIVE</span>
            </div>
          ) : (
            <span className="text-[9px] font-mono text-slate-400 font-medium">STANDBY</span>
          )}
        </div>

        {/* Top Status Bar */}
        <div className="pt-3.5 px-6 pb-2 flex items-center justify-between text-xs text-slate-500 z-10 font-mono text-[11px] bg-white">
          <span className="text-slate-700 font-semibold">09:41</span>
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
            <span>16kHz PCM</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[#926c35] font-medium">Silero VAD</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* STATE 1: IDLE */}
        {/* ======================================================== */}
        {callState === 'IDLE' && (
          <div className="flex-1 flex flex-col justify-between p-6 text-center bg-white">
            <div className="my-auto space-y-4">
              <div className="w-18 h-18 rounded-2xl bg-amber-50 border border-amber-200/90 mx-auto flex items-center justify-center text-[#b48346] shadow-sm">
                <Stethoscope className="w-9 h-9" />
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900 tracking-tight">Nexa Voice Concierge</h3>
                <p className="text-xs text-slate-500 mt-1">Direct Clinical Appointment Booking</p>
                <div className="inline-flex items-center gap-1.5 mt-2.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#78350f] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Identified solely by spoken phone</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-left text-xs text-slate-700 space-y-1.5 shadow-xs">
                <p className="text-[10px] font-mono uppercase text-[#78350f] font-bold tracking-wider">Clinical Dialog Flow:</p>
                <p className="text-[11px] text-slate-700">• "Check Dr. Sarah Chen's availability"</p>
                <p className="text-[11px] text-slate-700">• "Book 9:30 AM for phone 555-0199"</p>
                <p className="text-[11px] text-emerald-800 font-semibold">• Nexa confirms number before locking</p>
              </div>
            </div>

            <button
              onClick={onStartCall}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#b48346] via-[#c59b27] to-[#b48346] hover:brightness-105 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-gold-glow cursor-pointer transition-all active:scale-98"
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>Connect Voice Session (Try Now)</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* STATE 2: RINGING */}
        {/* ======================================================== */}
        {callState === 'RINGING' && (
          <div className="flex-1 flex flex-col justify-between p-6 text-center bg-white">
            <div className="my-auto space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#b48346] mx-auto shadow-sm">
                <Phone className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900">Connecting Nexa Concierge...</h3>
                <p className="text-xs text-slate-500 mt-1">Establishing low-latency PCM audio stream</p>
                <p className="text-[10px] font-mono text-[#926c35] mt-2 font-medium">ElevenLabs STT • Gemini Flash • ElevenLabs TTS</p>
              </div>
            </div>

            <button
              onClick={onEndCall}
              className="w-13 h-13 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer mx-auto"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* STATE 3: CONNECTED */}
        {/* ======================================================== */}
        {callState === 'CONNECTED' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Call Header */}
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-serif font-bold text-slate-900 text-xs">Nexa • Clinical Concierge</span>
              </div>
              <span className="font-mono text-[#78350f] font-bold text-xs">{formatTimer(callDuration)}</span>
            </div>

            {/* Audio Waveform */}
            <div className="bg-slate-50/50 border-b border-slate-100 py-1.5">
              <AudioWaveform level={audioLevel} status={agentStatus} />
              <div className="text-center text-[10px] text-slate-500 font-mono">
                {agentStatus === 'speaking' ? (
                  <span className="text-[#926c35] font-semibold">Nexa speaking (ElevenLabs TTS)</span>
                ) : agentStatus === 'thinking' ? (
                  <span className="text-slate-700 font-semibold">Consulting database records...</span>
                ) : (
                  <span className="text-slate-500">Microphone streaming • Silero VAD active</span>
                )}
              </div>
            </div>

            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs bg-slate-50/30">
              {bookingConfirmation && (
                <BookingModalCard appointment={bookingConfirmation} />
              )}

              {transcripts.map((t, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${t.role === 'caller' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] text-slate-400 mb-0.5 px-1 font-mono">
                    {t.role === 'caller' ? 'Caller' : 'Nexa Concierge'} • {t.timestamp}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed text-[11px] ${
                      t.role === 'caller'
                        ? 'bg-emerald-600 text-white font-medium rounded-tr-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {t.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>

            {/* Quick Test Prompt Chips */}
            <div className="p-2 border-t border-slate-200 bg-white">
              <span className="text-[9px] font-mono text-[#926c35] uppercase px-1 mb-1 block font-bold">
                Quick Speech Prompts:
              </span>
              <div className="flex gap-1 overflow-x-auto pb-0.5 text-[10px] font-mono no-scrollbar">
                <button
                  onClick={() => onSendUtterance("What slots are available for Cardiology?")}
                  className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                >
                  Check Cardiology
                </button>
                <button
                  onClick={() => onSendUtterance("I want to book 9:30 AM with Dr Sarah Chen. Phone number 555-0199")}
                  className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                >
                  Book 9:30 AM (555-0199)
                </button>
                <button
                  onClick={() => onSendUtterance("Yes, that is correct, please confirm")}
                  className="whitespace-nowrap px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 cursor-pointer font-semibold transition-colors"
                >
                  Confirm "Yes"
                </button>
                <button
                  onClick={() => onSendUtterance("Cancel my appointment for 555-0199")}
                  className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                >
                  Cancel (555-0199)
                </button>
              </div>
            </div>

            {/* In-Call Phone Controls */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-around">
              <button
                onClick={onToggleMute}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isMuted ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                onClick={onEndCall}
                className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
                title="End Call"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STATE 4: ENDED */}
        {/* ======================================================== */}
        {callState === 'ENDED' && (
          <div className="flex-1 flex flex-col justify-between p-6 text-center bg-white">
            <div className="my-auto space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto shadow-xs">
                <PhoneOff className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900">Session Completed</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Duration: {formatTimer(callDuration)}</p>
              </div>
              {bookingConfirmation && (
                <div className="max-w-[280px] mx-auto text-left mt-2">
                  <BookingModalCard appointment={bookingConfirmation} />
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <button
                onClick={onStartCall}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#b48346] to-[#c59b27] hover:brightness-105 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-gold-glow"
              >
                <Phone className="w-3.5 h-3.5 fill-current" /> Call Again
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
