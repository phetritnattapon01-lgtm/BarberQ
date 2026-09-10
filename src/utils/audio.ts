// Web Audio API lightweight synthesizer & Fallback Chime for notifications and queue alerts

function generateWavDataUri(notes: Array<{ freq: number; duration: number }>): string {
  try {
    const sampleRate = 22050;
    const totalDuration = notes.reduce((acc, n) => acc + n.duration, 0);
    const numSamples = Math.floor(sampleRate * totalDuration);
    const buffer = new Uint8Array(44 + numSamples * 2);
    const view = new DataView(buffer.buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true);  // NumChannels (1 for Mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true);  // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    let sampleOffset = 0;
    for (const note of notes) {
      const noteSamples = Math.floor(sampleRate * note.duration);
      for (let i = 0; i < noteSamples; i++) {
        const t = i / sampleRate;
        const progress = i / noteSamples;
        const envelope = Math.max(0, 1 - Math.pow(progress, 0.7));
        const wave = Math.sin(2 * Math.PI * note.freq * t);
        const sampleValue = Math.floor(wave * envelope * 0.45 * 32767);
        const currentIndex = 44 + (sampleOffset + i) * 2;
        if (currentIndex + 1 < buffer.length) {
          view.setInt16(currentIndex, sampleValue, true);
        }
      }
      sampleOffset += noteSamples;
    }

    let binary = '';
    const bytes = new Uint8Array(buffer.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
  } catch {
    return '';
  }
}

class SoundManager {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  private unlocked: boolean = false;
  private notificationWavUri: string = '';
  private queueWavUri: string = '';
  private successWavUri: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      // Lazy generate WAV fallbacks once
      try {
        this.notificationWavUri = generateWavDataUri([
          { freq: 659.25, duration: 0.15 },
          { freq: 880, duration: 0.35 },
        ]);
        this.queueWavUri = generateWavDataUri([
          { freq: 587.33, duration: 0.14 },
          { freq: 783.99, duration: 0.16 },
          { freq: 1046.5, duration: 0.42 },
        ]);
        this.successWavUri = generateWavDataUri([
          { freq: 523.25, duration: 0.08 },
          { freq: 659.25, duration: 0.08 },
          { freq: 783.99, duration: 0.08 },
          { freq: 1046.5, duration: 0.28 },
        ]);
      } catch {
        // Safe fallback
      }

      // Automatically attach user gesture listeners to unlock AudioContext
      const unlockEvents = ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'];
      const onUserGesture = () => {
        this.unlock();
      };
      unlockEvents.forEach((evt) => {
        window.addEventListener(evt, onUserGesture, { passive: true });
      });
    }
  }

  private initCtx() {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
    } catch {
      // Audio context instantiation restriction
    }
  }

  public async unlock(): Promise<boolean> {
    try {
      this.initCtx();
      if (!this.ctx) return false;
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      if (!this.unlocked && this.ctx && this.ctx.state === 'running') {
        // Play 1-sample silent buffer on iOS Safari to permanently unlock audio
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.unlocked = true;
      }
      return this.ctx.state === 'running';
    } catch {
      return false;
    }
  }

  private playFallback(type: 'notification' | 'queue' | 'success') {
    if (typeof window === 'undefined') return;
    try {
      let uri = this.notificationWavUri;
      if (type === 'queue') uri = this.queueWavUri;
      if (type === 'success') uri = this.successWavUri;
      if (!uri) return;

      const audio = new Audio(uri);
      audio.volume = 0.65;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch {
      // Silent catch
    }
  }

  public async playNotification() {
    if (!this.soundEnabled) return;
    try {
      await this.unlock();
      if (!this.ctx || this.ctx.state !== 'running') {
        this.playFallback('notification');
        return;
      }

      const now = this.ctx.currentTime + 0.02;

      // Note 1: E5 (659.25 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.28);

      // Note 2: A5 (880 Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.09);
      gain2.gain.setValueAtTime(0, now + 0.09);
      gain2.gain.linearRampToValueAtTime(0.40, now + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.45);
    } catch {
      this.playFallback('notification');
    }
  }

  public async playQueueAlert() {
    if (!this.soundEnabled) return;
    try {
      await this.unlock();
      if (!this.ctx || this.ctx.state !== 'running') {
        this.playFallback('queue');
        return;
      }

      const now = this.ctx.currentTime + 0.02;

      // 3-tone service bell chime: D5 (587.33Hz) -> G5 (783.99Hz) -> C6 (1046.5Hz)
      const notes = [
        { freq: 587.33, time: 0, duration: 0.22, vol: 0.35, type: 'triangle' as OscillatorType },
        { freq: 783.99, time: 0.14, duration: 0.26, vol: 0.42, type: 'sine' as OscillatorType },
        { freq: 1046.5, time: 0.32, duration: 0.52, vol: 0.50, type: 'sine' as OscillatorType },
      ];

      notes.forEach(({ freq, time, duration, vol, type }) => {
        if (!this.ctx) return;
        const start = now + time;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      });
    } catch {
      this.playFallback('queue');
    }
  }

  public async playSuccess() {
    if (!this.soundEnabled) return;
    try {
      await this.unlock();
      if (!this.ctx || this.ctx.state !== 'running') {
        this.playFallback('success');
        return;
      }

      const now = this.ctx.currentTime + 0.02;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const start = now + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.32, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.28);
      });
    } catch {
      this.playFallback('success');
    }
  }

  public playClick() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx || this.ctx.state !== 'running') return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Silent catch
    }
  }

  public playError() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx || this.ctx.state !== 'running') return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.setValueAtTime(160, now + 0.1);

      gain.gain.setValueAtTime(0.20, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Silent catch
    }
  }

  public speak(text: string) {
    if (!this.soundEnabled || typeof window === 'undefined') return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'th-TH';
        utterance.rate = 1.05;
        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Speech synthesis unsupported or restricted
    }
  }
}

export const soundFx = new SoundManager();
