import { useState, useRef, useCallback, useEffect } from 'react';
import { useSoundEffects } from './useSoundEffects';

export function useVoiceCall({ onAppointmentBooked, onAppointmentCancelled }) {
  const [callState, setCallState] = useState('IDLE'); // IDLE, RINGING, CONNECTED, ENDED
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 1 for waveform
  const [agentStatus, setAgentStatus] = useState('idle'); // listening, thinking, speaking
  const [transcripts, setTranscripts] = useState([]);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  const [engineInfo, setEngineInfo] = useState({ mode: 'detecting', engine: 'Nexov Voice Engine' });

  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const micStreamRef = useRef(null);
  const processorRef = useRef(null);
  const timerRef = useRef(null);
  const isMutedRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const recognitionRef = useRef(null);

  const {
    startRinging,
    stopRinging,
    playConnectedSound,
    playEndedSound,
    playConfirmationSound
  } = useSoundEffects();

  isMutedRef.current = isMuted;

  // Initialize Speech Recognition fallback if available
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (e) => {
        const last = e.results.length - 1;
        const text = e.results[last][0].transcript.trim();
        if (text && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'user_text', text }));
        }
      };
      rec.onerror = (e) => {
        console.debug('Speech recognition notice:', e.error);
      };
      recognitionRef.current = rec;
    }
  }, []);

  // Timer counter for call duration
  useEffect(() => {
    if (callState === 'CONNECTED') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Audio queue player for incoming PCM binary chunks
  const playAudioChunk = useCallback((arrayBuffer) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Convert 16-bit PCM bytes to Float32
    const int16 = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(int16.length);
    let sumSquares = 0;
    
    for (let i = 0; i < int16.length; i++) {
      const normalized = int16[i] / 32768.0;
      float32[i] = normalized;
      sumSquares += normalized * normalized;
    }

    // Update audio level for waveform animation
    const rms = Math.sqrt(sumSquares / int16.length);
    setAudioLevel(Math.min(1, rms * 4));

    const audioBuffer = ctx.createBuffer(1, float32.length, 16000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    const startTime = Math.max(currentTime, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + audioBuffer.duration;
  }, []);

  // Browser Text-To-Speech fallback for simulator mode
  const speakText = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      
      // Animate waveform while speaking
      setAgentStatus('speaking');
      const waveInterval = setInterval(() => {
        setAudioLevel(0.3 + Math.random() * 0.5);
      }, 80);

      utterance.onend = () => {
        clearInterval(waveInterval);
        setAudioLevel(0);
        setAgentStatus('listening');
      };
      
      utterance.onerror = () => {
        clearInterval(waveInterval);
        setAudioLevel(0);
        setAgentStatus('listening');
      };

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Start Call flow
  const startCall = useCallback(async () => {
    setTranscripts([]);
    setBookingConfirmation(null);
    setCallDuration(0);
    setCallState('RINGING');
    startRinging();

    // 1. Initialize Audio Context
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx({ sampleRate: 16000 });
    audioCtxRef.current = ctx;

    // 2. Open WebSocket to Voice Pipeline
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/call`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = async () => {
      // Simulate 1.2s connecting ring for realism
      setTimeout(async () => {
        stopRinging();
        playConnectedSound();
        setCallState('CONNECTED');
        setAgentStatus('listening');

        // Request microphone access
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              sampleRate: 16000,
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true
            }
          });
          micStreamRef.current = stream;

          const source = ctx.createMediaStreamSource(stream);
          // Script processor to capture PCM audio chunks
          const processor = ctx.createScriptProcessor(2048, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (isMutedRef.current) return;
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Calculate caller voice level for waveform
            let sumSquares = 0;
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              sumSquares += s * s;
            }
            const rms = Math.sqrt(sumSquares / inputData.length);
            if (rms > 0.02) {
              setAudioLevel(Math.min(1, rms * 5));
            }

            // Send binary PCM chunk to Pipecat WebSocket
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(pcm16.buffer);
            }
          };

          source.connect(processor);
          processor.connect(ctx.destination);

          // Start speech recognition fallback
          if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        } catch (err) {
          console.warn("Microphone access declined or unavailable; text/chips remain active:", err);
        }
      }, 1200);
    };

    ws.onmessage = (event) => {
      // Binary audio received from ElevenLabs TTS
      if (event.data instanceof ArrayBuffer) {
        playAudioChunk(event.data);
      } else if (typeof event.data === 'string') {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'system_info') {
            setEngineInfo({ mode: payload.mode, engine: payload.engine });
          } else if (payload.type === 'status') {
            setAgentStatus(payload.status);
          } else if (payload.type === 'transcript') {
            setTranscripts(prev => [...prev, {
              role: payload.role,
              text: payload.text,
              timestamp: payload.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }]);
          } else if (payload.type === 'speak') {
            speakText(payload.text);
          } else if (payload.type === 'booking_confirmed') {
            setBookingConfirmation(payload.appointment);
            playConfirmationSound();
            if (onAppointmentBooked) onAppointmentBooked(payload.appointment);
          } else if (payload.type === 'booking_cancelled') {
            if (onAppointmentCancelled) onAppointmentCancelled(payload.appointment);
          }
        } catch (e) {
          console.debug("Non-json message:", event.data);
        }
      }
    };

    ws.onclose = () => {
      setCallState(prev => prev === 'CONNECTED' ? 'ENDED' : 'IDLE');
      cleanupMedia();
    };

    ws.onerror = (err) => {
      console.error("Call websocket error:", err);
      cleanupMedia();
      setCallState('ENDED');
    };
  }, [playConnectedSound, playConfirmationSound, startRinging, stopRinging, playAudioChunk, speakText, onAppointmentBooked, onAppointmentCancelled]);

  // Clean up media streams and audio nodes
  const cleanupMedia = useCallback(() => {
    stopRinging();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [stopRinging]);

  // End Call
  const endCall = useCallback(() => {
    playEndedSound();
    setCallState('ENDED');
    setAgentStatus('idle');
    setAudioLevel(0);
    cleanupMedia();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
  }, [playEndedSound, cleanupMedia]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Send quick speech text utterance
  const sendUtterance = useCallback((text) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'user_text', text }));
    }
  }, []);

  return {
    callState,
    callDuration,
    isMuted,
    audioLevel,
    agentStatus,
    transcripts,
    bookingConfirmation,
    engineInfo,
    startCall,
    endCall,
    toggleMute,
    sendUtterance
  };
}
