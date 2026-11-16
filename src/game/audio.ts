class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public unlock() {
    this.ensureContext();
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.12,
    delay = 0,
    slideToFreq?: number
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideToFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playBarcodeScan() {
    this.playTone(1320, 0.06, 'square', 0.07, 0);
    this.playTone(1760, 0.09, 'square', 0.08, 0.06);
  }

  public playPickSuccess() {
    this.playTone(587.33, 0.08, 'triangle', 0.12, 0);
    this.playTone(880, 0.14, 'triangle', 0.14, 0.07);
  }

  public playBlindCountAlert() {
    this.playTone(740, 0.12, 'sawtooth', 0.08, 0);
    this.playTone(554.37, 0.16, 'sawtooth', 0.08, 0.13);
    this.playTone(740, 0.14, 'triangle', 0.09, 0.28);
  }

  public playPackingComplete() {
    this.playTone(440, 0.08, 'triangle', 0.11, 0);
    this.playTone(554.37, 0.08, 'triangle', 0.11, 0.07);
    this.playTone(659.25, 0.16, 'triangle', 0.13, 0.14);
  }

  public playDispatchSuccess() {
    this.playTone(523.25, 0.09, 'triangle', 0.13, 0);
    this.playTone(659.25, 0.09, 'triangle', 0.13, 0.08);
    this.playTone(783.99, 0.09, 'triangle', 0.14, 0.16);
    this.playTone(1046.5, 0.24, 'triangle', 0.16, 0.24);
  }

  public playError() {
    this.playTone(210, 0.14, 'sawtooth', 0.11, 0, 140);
    this.playTone(165, 0.2, 'sawtooth', 0.11, 0.12, 110);
  }

  public playHazardHit() {
    this.playTone(150, 0.22, 'sawtooth', 0.15, 0, 55);
    this.playTone(95, 0.25, 'square', 0.1, 0.05, 45);
  }

  public playForkliftHorn() {
    const variant = Math.floor(Math.random() * 3);
    if (variant === 0) {
      // Double industrial warning horn
      const baseFreq = 390 + Math.random() * 60;
      this.playTone(baseFreq, 0.09, 'sawtooth', 0.065, 0);
      this.playTone(baseFreq * 1.12, 0.1, 'sawtooth', 0.065, 0.12);
    } else if (variant === 1) {
      // Deep warehouse klaxon
      const baseFreq = 280 + Math.random() * 40;
      this.playTone(baseFreq, 0.22, 'sawtooth', 0.075, 0, baseFreq * 0.94);
    } else {
      // Rapid K3 safety reverse/crossing alert beeps
      const baseFreq = 680 + Math.random() * 90;
      this.playTone(baseFreq, 0.06, 'square', 0.05, 0);
      this.playTone(baseFreq, 0.06, 'square', 0.05, 0.09);
      this.playTone(baseFreq, 0.07, 'square', 0.055, 0.18);
    }
  }

  public playShiftComplete() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, idx === 3 ? 0.35 : 0.12, 'triangle', 0.13, idx * 0.1);
    });
  }
}

export const soundEngine = new SoundEngine();
