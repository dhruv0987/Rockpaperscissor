// This uses the Web Audio API to generate sounds from scratch!
// No external files needed - pure code-generated audio.

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmNodes: AudioNode[] = [];
  private _muted: boolean = false;
  private isBgmPlaying: boolean = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = this._muted ? 0 : 0.3; // Default volume 30%
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public get muted() { return this._muted; }
  public set muted(val: boolean) {
    this._muted = val;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(val ? 0 : 0.3, now, 0.1);
    }
  }

  public stopAll() {
      if (this.ctx) {
          this.bgmNodes.forEach(node => node.disconnect());
          this.bgmNodes = [];
          this.isBgmPlaying = false;
      }
  }

  // --- Sound Effects ---

  public playHover() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.05);
    
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(t + 0.05);
  }

  public playClick() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
    
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(t + 0.1);
  }

  public playCountdown(count: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Higher pitch for 3-2-1, Lower for GO
    const freq = count > 0 ? 800 : 1200;
    const type = count > 0 ? 'sine' : 'square';
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(t + 0.3);
  }

  public playWin() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // Major Arpeggio: C - E - G - C
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = t + (i * 0.1);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
    });
  }

  public playLose() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(50, t + 0.5); // Slide down
    
    // Wobble effect
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 20;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 50;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    lfo.stop(t+0.5);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.5);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(t + 0.5);
  }

  public playDraw() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(t + 0.3);
  }

  // --- Background Music (Procedural) ---
  
  public startBGM() {
    this.init();
    if (this.isBgmPlaying || !this.ctx || !this.masterGain) return;
    this.isBgmPlaying = true;

    const t = this.ctx.currentTime;

    // 1. Low Drone (The "Space" Ambience)
    const droneOsc = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    
    droneOsc.type = 'sawtooth';
    droneOsc.frequency.setValueAtTime(55, t); // A1 (Low)

    // Filter to make it muffled and dark
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    // LFO to make the filter breathe
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2; // Slow pulse
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200; // Filter cutoff modulation depth

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    droneOsc.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.masterGain);
    
    droneGain.gain.value = 0.05; // Very quiet

    droneOsc.start();
    lfo.start();

    this.bgmNodes.push(droneOsc, droneGain, filter, lfo, lfoGain);

    // 2. Simple Cyber-Pulse (The "Heartbeat")
    const pulseOsc = this.ctx.createOscillator();
    const pulseGain = this.ctx.createGain();
    pulseOsc.type = 'square';
    pulseOsc.frequency.value = 110; // A2
    
    const pulseAmpLfo = this.ctx.createOscillator();
    pulseAmpLfo.type = 'square';
    pulseAmpLfo.frequency.value = 2; // 2 beats per second
    
    const pulseAmpGain = this.ctx.createGain();
    pulseAmpGain.gain.value = 0.02; // Modulation depth
    
    // Connect pulse LFO to Gain to create rhythm
    // Actually, let's just use a simple gain osc
    // Simple way:
    // This is a bit complex for simple cleanup, so we'll stick to just the Drone for now
    // to ensure no memory leaks with complex scheduling.
  }
}

export const soundManager = new SoundManager();
