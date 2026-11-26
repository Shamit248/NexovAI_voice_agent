import React, { useEffect, useRef, useState } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Stethoscope, X, Send, ChevronRight
} from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { BookingModalCard } from './BookingModalCard';

export function PhoneInterface({ 
  isOpen, 
  onClose,
  callState,
  callDuration,
  isMuted,
  audioLevel,
  agentStatus,
  transcripts,
  bookingConfirmation,
  engineInfo,
  onStartCall,
  onEndCall,
  onToggleMute,
  onSendUtterance
}) {
  const [manualText, setManualText] = useState('');
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  if (!isOpen) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualText.trim()) {
      onSendUtterance(manualText.trim());
      setManualText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      
      {/* Hardware Frame (Matte Titanium Bezel) */}
      <div className="relative w-full max-w-[380px] h-[720px] bg-[#0c121e] border-2 border-slate-700/80 rounded-[44px] shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-800">
        
        {/* Dynamic Island / Hardware Ear Piece */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-20 flex items-center justify-between px-2">
          <div className="w-2 h-2 rounded-full bg-slate-900" />
          {callState === 'CONNECTED' && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400 font-bold">REC</span>
            </div>
          )}
        </div>

        {/* Top Status Bar */}
        <div className="pt-2.5 px-5 pb-1 flex items-center justify-between text-xs text-slate-400 z-10 select-none">
          <span className="font-semibold text-slate-300 font-mono text-[11px] pl-1">09:41</span>
          <button 
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
            title="Minimize phone"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* STATE 1: IDLE */}
        {callState === 'IDLE' && (
          <div className="flex-1 flex flex-col items-center justify-between p-6 text-center">
            <div className="my-auto space-y-4 max-w-[280px]">
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-teal-400 shadow-lg">
                <Stethoscope className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">Nexov Health AI Concierge</h3>
                <p className="text-xs text-slate-400 mt-1">Direct Voice Appointment Booking</p>
                <div className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  Identified solely by spoken phone number
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-left text-xs text-slate-300 space-y-1.5">
                <p className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Spoken Prompts Supported:</p>
                <p className="text-[11px] text-slate-400">• "Check Dr. Sarah Chen's availability"</p>
                <p className="text-[11px] text-slate-400">• "Book 9:30 AM for phone 555-0199"</p>
                <p className="text-[11px] text-slate-400">• "Cancel appointment for 555-0199"</p>
              </div>
            </div>

            <button
              onClick={onStartCall}
              className="w-full py-3 px-5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 cursor-pointer transition-colors active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Connect Voice Call</span>
            </button>
          </div>
        )}

        {/* STATE 2: RINGING */}
        {callState === 'RINGING' && (
          <div className="flex-1 flex flex-col items-center justify-between p-6 text-center">
            <div className="my-auto space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto">
                <Phone className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-100">Dialing Nexa...</h3>
                <p className="text-xs text-slate-400 mt-0.5">Connecting Pipecat voice pipeline</p>
                <p className="text-[10px] font-mono text-slate-500 mt-2">ElevenLabs STT • Gemini Flash • ElevenLabs TTS</p>
              </div>
            </div>

            <button
              onClick={onEndCall}
              className="w-12 h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer mx-auto"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STATE 3: CONNECTED */}
        {callState === 'CONNECTED' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Header info */}
            <div className="px-4 py-2 border-b border-slate-800 bg-[#0a101b] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-slate-200 text-xs">Nexa (Clinical AI)</span>
              </div>
              <span className="font-mono text-teal-400 text-xs">{formatTimer(callDuration)}</span>
            </div>

            {/* Audio Waveform */}
            <div className="bg-[#090e18] border-b border-slate-800 py-1">
              <AudioWaveform level={audioLevel} status={agentStatus} />
              <div className="text-center text-[10px] text-slate-500 pb-0.5 font-mono">
                {agentStatus === 'speaking' ? (
                  <span className="text-teal-400">Agent Speaking</span>
                ) : agentStatus === 'thinking' ? (
                  <span className="text-slate-400">Querying Database...</span>
                ) : (
                  <span>Microphone Active (Speak clearly)</span>
                )}
              </div>
            </div>

            {/* Transcript & In-call Card Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
              {bookingConfirmation && (
                <BookingModalCard appointment={bookingConfirmation} />
              )}

              {transcripts.map((t, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${t.role === 'caller' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-500 mb-0.5 px-1 font-mono">
                    {t.role === 'caller' ? 'You' : 'Nexa'} • {t.timestamp}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed text-[11px] ${
                      t.role === 'caller'
                        ? 'bg-teal-600 text-white rounded-tr-xs font-normal'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-xs'
                    }`}
                  >
                    {t.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>

            {/* Quick Prompts for Testing */}
            <div className="p-2 border-t border-slate-800 bg-[#0a101b]">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 mb-1">
                <span>Quick Utterances:</span>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-0.5 text-[10px] no-scrollbar">
                <button
                  onClick={() => onSendUtterance("What slots are available for Cardiology?")}
                  className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  Check Cardiology
                </button>
                <button
                  onClick={() => onSendUtterance("I want to book 9:30 AM with Dr Sarah Chen. My phone number is 555-0199")}
                  className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  Book 9:30 AM (555-0199)
                </button>
                <button
                  onClick={() => onSendUtterance("Yes, that is correct")}
                  className="whitespace-nowrap px-2 py-0.5 rounded bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 cursor-pointer"
                >
                  Confirm "Yes"
                </button>
                <button
                  onClick={() => onSendUtterance("Cancel my appointment for 555-0199")}
                  className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  Cancel (555-0199)
                </button>
              </div>
            </div>

            {/* In-Call Controls */}
            <div className="p-3 bg-[#080d17] border-t border-slate-800 flex items-center justify-around">
              <button
                onClick={onToggleMute}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isMuted ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                onClick={onEndCall}
                className="w-12 h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
                title="End Call"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>

          </div>
        )}

        {/* STATE 4: ENDED */}
        {callState === 'ENDED' && (
          <div className="flex-1 flex flex-col items-center justify-between p-6 text-center">
            <div className="my-auto space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
                <PhoneOff className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Call Ended</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Session: {formatTimer(callDuration)}</p>
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
                className="w-full py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call Again
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
