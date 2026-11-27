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
  const silenceGainRef = useRef(null);
  const timerRef = useRef(null);
  const isMutedRef = useRef(false);
  const isAgentSpeakingRef = useRef(false);
  const lastUtteranceTimeRef = useRef(0);
  const lastUtteranceTextRef = useRef('');
  const pendingSpeechRef = useRef('');
  const speechSilenceTimerRef = useRef(null);
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

  // Initialize Speech Recognition fallback with Echo-Cancellation & End-of-Speech Debounce
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e) => {
        // Prevent acoustic feedback: NEVER process mic while agent's speaker is outputting
        if (isAgentSpeakingRef.current) {
          console.debug('[Echo Suppression] Discarded mic capture during agent speech');
          return;
        }
        if (isMutedRef.current) return;

        let accumulated = '';
        for (let i = 0; i < e.results.length; ++i) {
          accumulated += e.results[i][0].transcript + ' ';
        }
        const text = accumulated.trim();

        // Ignore empty, single characters, or trivial background noise
        if (!text || text.length < 2) return;

        pendingSpeechRef.current = text;

        // Clear previous silence timer because user is actively speaking or pausing naturally
        if (speechSilenceTimerRef.current) {
          clearTimeout(speechSilenceTimerRef.current);
        }

        // Wait for 1000ms of true silence before finalizing user turn to avoid cutting off mid-sentence
        speechSilenceTimerRef.current = setTimeout(() => {
          const finalUtterance = pendingSpeechRef.current.trim();
          pendingSpeechRef.current = '';

          if (!finalUtterance || finalUtterance.length < 2) return;

          // Prevent duplicate trigger bursts of the exact same utterance within 2.5s
          const now = Date.now();
          if (
            finalUtterance.toLowerCase() === lastUtteranceTextRef.current.toLowerCase() &&
            now - lastUtteranceTimeRef.current < 2500
          ) {
            return;
          }

          lastUtteranceTextRef.current = finalUtterance;
          lastUtteranceTimeRef.current = now;

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isAgentSpeakingRef.current) {
            console.info('[Speech Dispatched after natural pause]:', finalUtterance);
            wsRef.current.send(JSON.stringify({ type: 'user_text', text: finalUtterance }));
          }
        }, 1000);
      };

      rec.onerror = (e) => {
        console.debug('Speech recognition status:', e.error);
      };

      // Auto-restart recognition if disconnected while call is active
      rec.onend = () => {
        if (
          !isAgentSpeakingRef.current &&
          wsRef.current &&
          wsRef.current.readyState === WebSocket.OPEN
        ) {
          try {
            rec.start();
          } catch (err) {}
        }
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

  // Audio queue player for incoming PCM binary chunks (ElevenLabs TTS)
  const playAudioChunk = useCallback((arrayBuffer) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    isAgentSpeakingRef.current = true;
    setAgentStatus('speaking');

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

    // Monitor when the audio stream queue is exhausted
    source.onended = () => {
      if (ctx.currentTime >= nextPlayTimeRef.current - 0.08) {
        setAudioLevel(0);
        setAgentStatus('listening');
        setTimeout(() => {
          isAgentSpeakingRef.current = false;
        }, 500);
      }
    };
  }, []);

  // Browser Text-To-Speech fallback for simulator mode with Echo Cancellation
  const speakText = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isAgentSpeakingRef.current = true;
      setAgentStatus('speaking');

      // Abort speech recognition during agent speech to avoid microphone picking up speakers
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      
      // Animate waveform while speaking
      const waveInterval = setInterval(() => {
        setAudioLevel(0.25 + Math.random() * 0.45);
      }, 80);

      const finishSpeaking = () => {
        clearInterval(waveInterval);
        setAudioLevel(0);
        setAgentStatus('listening');

        // Allow 700ms grace period for physical acoustic reverberations to clear
        setTimeout(() => {
          isAgentSpeakingRef.current = false;
          if (
            recognitionRef.current &&
            wsRef.current?.readyState === WebSocket.OPEN &&
            !isMutedRef.current
          ) {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }
        }, 700);
      };

      utterance.onend = finishSpeaking;
      utterance.onerror = finishSpeaking;

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
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          micStreamRef.current = stream;

          const source = ctx.createMediaStreamSource(stream);
          // Script processor to capture PCM audio chunks (2048 samples = 128ms @ 16kHz)
          const processor = ctx.createScriptProcessor(2048, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            // Mute or agent speech suppression
            if (isMutedRef.current || isAgentSpeakingRef.current) return;

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

          // CRITICAL FIX: Route mic processor through a ZERO GAIN node.
          // This keeps the ScriptProcessor alive without playing mic audio back into speakers!
          const silenceGain = ctx.createGain();
          silenceGain.gain.value = 0;
          silenceGainRef.current = silenceGain;

          source.connect(processor);
          processor.connect(silenceGain);
          silenceGain.connect(ctx.destination);

          // Start speech recognition fallback (with a 800ms delay to let initial greeting speak)
          setTimeout(() => {
            if (recognitionRef.current && !isAgentSpeakingRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {}
            }
          }, 800);

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
    isAgentSpeakingRef.current = false;
    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }
    pendingSpeechRef.current = '';
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (silenceGainRef.current) {
      silenceGainRef.current.disconnect();
      silenceGainRef.current = null;
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
    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }
    pendingSpeechRef.current = '';
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
