import { useRef, useCallback } from 'react';

/**
 * Web Audio API synthesizer for realistic phone sound effects.
 * 100% self-contained, zero external asset dependencies.
 */
export function useSoundEffects() {
  const audioCtxRef = useRef(null);
  const ringOscillatorsRef = useRef([]);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // 1. Realistic Telephone Ring Tone (US Standard: 440Hz + 480Hz modulated)
  const startRinging = useCallback(() => {
    try {
      const ctx = getAudioContext();
      stopRinging();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);

      // Ring cadence: 1.5s on, 2.5s off
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, now);

      for (let i = 0; i < 5; i++) {
        const ringStart = now + i * 3.5;
        gainNode.gain.setValueAtTime(0.08, ringStart);
        gainNode.gain.setValueAtTime(0.08, ringStart + 1.6);
        gainNode.gain.setValueAtTime(0, ringStart + 1.65);
      }

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);

      ringOscillatorsRef.current = [osc1, osc2, gainNode];
    } catch (e) {
      console.warn("Ring sound effect prevented:", e);
    }
  }, [getAudioContext]);

  const stopRinging = useCallback(() => {
    ringOscillatorsRef.current.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    ringOscillatorsRef.current = [];
  }, []);

  // 2. Call Connected Chime (Gentle rising two-tone)
  const playConnectedSound = useCallback(() => {
    try {
      stopRinging();
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }, [getAudioContext, stopRinging]);

  // 3. Call Ended Tone (Soft falling double tone)
  const playEndedSound = useCallback(() => {
    try {
      stopRinging();
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      [0, 0.18].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 440 : 330, now + delay);

        gain.gain.setValueAtTime(0.09, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.15);
      });
    } catch (e) {}
  }, [getAudioContext, stopRinging]);

  // 4. Booking Confirmation Chime (Melodic clinical confirmation chord)
  const playConfirmationSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.1, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.4);
      });
    } catch (e) {}
  }, [getAudioContext]);

  return {
    startRinging,
    stopRinging,
    playConnectedSound,
    playEndedSound,
    playConfirmationSound
  };
}
