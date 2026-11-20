/**
 * Web Audio API synthesizer for sound effects and aircraft engine audio.
 * Designed with low-pass filtering and smooth envelopes to avoid crackle or buzzing ("rè").
 * Works 100% offline without external asset dependencies.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineLfo: OscillatorNode | null = null;
  private isEngineRunning: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopEngineSound();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Play crisp, pleasant button click sound
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Ignore autoplay errors
    }
  }

  // Play smooth aerodynamic package release whistle
  public playDropSound() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio error safety
    }
  }

  // Play impact / landing sound (Hit or Miss)
  public playImpactSound(isHit: boolean) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      if (isHit) {
        // Warm rewarding landing thud + major triad chime
        const frequencies = [261.63, 329.63, 392.00]; // C4, E4, G4
        frequencies.forEach((freq, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.03);

          gain.gain.setValueAtTime(0.001, now + i * 0.03);
          gain.gain.linearRampToValueAtTime(0.12, now + i * 0.03 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.35);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + i * 0.03);
          osc.stop(now + i * 0.03 + 0.4);
        });
      } else {
        // Soft low-frequency sub-thud for miss (no crackle)
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // Audio error safety
    }
  }

  // Play victory fanfare sound
  public playVictoryFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.11;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.16, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.42);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.45);
      });
    } catch {
      // Audio error safety
    }
  }

  // Smooth, warm aircraft engine hum controller (No buzz/rè)
  public startEngineSound() {
    if (this.isEngineRunning || this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Master Filter: Lowpass at 280Hz to eliminate all harsh high frequencies
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(280, now);
      this.engineFilter.Q.setValueAtTime(1.2, now);

      // 2. Master Gain for Engine
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.001, now);
      this.engineGain.gain.linearRampToValueAtTime(0.05, now + 0.2); // Smooth fade in

      // 3. Primary Engine Fundamental (Warm Triangle Wave at 68Hz)
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'triangle';
      this.engineOsc1.frequency.setValueAtTime(68, now);

      // 4. Secondary Sub Engine Body (Sine Wave at 34Hz)
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'sine';
      this.engineOsc2.frequency.setValueAtTime(34, now);

      // 5. Subtle Volume Tremolo LFO (8Hz propeller flutter without pitch distortion)
      this.engineLfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      this.engineLfo.type = 'sine';
      this.engineLfo.frequency.setValueAtTime(8, now);
      lfoGain.gain.setValueAtTime(0.012, now); // Gentle volume pulsation

      this.engineLfo.connect(lfoGain);
      lfoGain.connect(this.engineGain.gain);

      // Connect nodes
      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start(now);
      this.engineOsc2.start(now);
      this.engineLfo.start(now);
      this.isEngineRunning = true;
    } catch {
      // Audio error safety
    }
  }

  public stopEngineSound() {
    if (!this.isEngineRunning) return;
    if (this.ctx && this.engineGain) {
      const now = this.ctx.currentTime;
      // Fade out engine smoothly over 0.25s
      this.engineGain.gain.cancelScheduledValues(now);
      this.engineGain.gain.setValueAtTime(this.engineGain.gain.value, now);
      this.engineGain.gain.linearRampToValueAtTime(0.001, now + 0.25);
      
      setTimeout(() => {
        this.cleanupEngineNodes();
      }, 260);
    } else {
      this.cleanupEngineNodes();
    }
    this.isEngineRunning = false;
  }

  private cleanupEngineNodes() {
    if (this.engineOsc1) {
      try { this.engineOsc1.stop(); this.engineOsc1.disconnect(); } catch {}
      this.engineOsc1 = null;
    }
    if (this.engineOsc2) {
      try { this.engineOsc2.stop(); this.engineOsc2.disconnect(); } catch {}
      this.engineOsc2 = null;
    }
    if (this.engineLfo) {
      try { this.engineLfo.stop(); this.engineLfo.disconnect(); } catch {}
      this.engineLfo = null;
    }
    if (this.engineGain) {
      try { this.engineGain.disconnect(); } catch {}
      this.engineGain = null;
    }
    if (this.engineFilter) {
      try { this.engineFilter.disconnect(); } catch {}
      this.engineFilter = null;
    }
  }
}

export const audio = new SoundManager();

