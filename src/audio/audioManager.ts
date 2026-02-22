import { Howl, Howler } from "howler";

type Waveform = "sine" | "triangle" | "square";

interface SynthNote {
  start: number;
  duration: number;
  frequency: number;
  volume: number;
  waveform: Waveform;
}

const SAMPLE_RATE = 22050;

export class AudioManager {
  private unlocked = false;
  private muted = false;

  private readonly mineSfx: Howl;
  private readonly winSfx: Howl;
  private readonly restartSfx: Howl;

  public constructor() {
    Howler.volume(0.9);

    this.mineSfx = new Howl({
      src: [
        createClip(0.34, [
          // Short "bang" impact with low body.
          { start: 0, duration: 0.04, frequency: 208, volume: 0.25, waveform: "square" },
          { start: 0.01, duration: 0.16, frequency: 118, volume: 0.33, waveform: "triangle" },
          { start: 0.02, duration: 0.24, frequency: 62, volume: 0.31, waveform: "sine" },
          { start: 0.05, duration: 0.06, frequency: 340, volume: 0.13, waveform: "square" },
        ]),
      ],
      volume: 0.5,
      preload: true,
    });

    this.winSfx = new Howl({
      src: [
        createClip(0.5, [
          // "Ding-dong" confirmation.
          { start: 0, duration: 0.12, frequency: 1046, volume: 0.34, waveform: "triangle" },
          { start: 0.01, duration: 0.12, frequency: 1318, volume: 0.17, waveform: "sine" },
          { start: 0.18, duration: 0.2, frequency: 784, volume: 0.36, waveform: "triangle" },
          { start: 0.19, duration: 0.2, frequency: 988, volume: 0.16, waveform: "sine" },
        ]),
      ],
      volume: 0.62,
      preload: true,
    });

    this.restartSfx = new Howl({
      src: [
        createClip(0.28, [
          { start: 0, duration: 0.12, frequency: 220, volume: 0.35, waveform: "triangle" },
          { start: 0.09, duration: 0.16, frequency: 330, volume: 0.32, waveform: "sine" },
        ]),
      ],
      volume: 0.5,
      preload: true,
    });
  }

  public async unlock(): Promise<void> {
    if (this.unlocked) {
      return;
    }

    if (Howler.ctx && Howler.ctx.state !== "running") {
      await Howler.ctx.resume();
    }

    this.unlocked = true;
  }

  public isUnlocked(): boolean {
    return this.unlocked;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    Howler.mute(this.muted);
    return this.muted;
  }

  public playMine(): void {
    this.play(this.mineSfx);
  }

  public playWin(): void {
    this.play(this.winSfx);
  }

  public playRestart(): void {
    this.play(this.restartSfx);
  }

  private play(sound: Howl): void {
    if (!this.unlocked || this.muted) {
      return;
    }

    sound.play();
  }
}

function createClip(duration: number, notes: SynthNote[]): string {
  const sampleCount = Math.max(1, Math.floor(duration * SAMPLE_RATE));
  const channel = new Float32Array(sampleCount);

  for (const note of notes) {
    renderNote(channel, note);
  }

  let max = 0;
  for (let i = 0; i < channel.length; i += 1) {
    const amplitude = Math.abs(channel[i]);
    if (amplitude > max) {
      max = amplitude;
    }
  }

  if (max > 0.95) {
    const gain = 0.95 / max;
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] *= gain;
    }
  }

  const wav = encodeWav(channel, SAMPLE_RATE);
  return `data:audio/wav;base64,${toBase64(wav)}`;
}

function renderNote(target: Float32Array, note: SynthNote): void {
  const attack = Math.min(0.01, note.duration * 0.2);
  const release = Math.min(0.05, note.duration * 0.4);
  const startSample = Math.floor(note.start * SAMPLE_RATE);
  const endSample = Math.min(
    target.length,
    Math.floor((note.start + note.duration) * SAMPLE_RATE),
  );

  for (let sample = startSample; sample < endSample; sample += 1) {
    const t = (sample - startSample) / SAMPLE_RATE;
    const env = envelope(t, note.duration, attack, release);
    const phase = Math.PI * 2 * note.frequency * t;
    const wave = oscillator(phase, note.waveform);
    target[sample] += wave * note.volume * env;
  }
}

function envelope(
  elapsed: number,
  duration: number,
  attack: number,
  release: number,
): number {
  if (elapsed <= attack) {
    return elapsed / Math.max(attack, 0.0001);
  }

  if (elapsed >= duration - release) {
    return (duration - elapsed) / Math.max(release, 0.0001);
  }

  return 1;
}

function oscillator(phase: number, waveform: Waveform): number {
  if (waveform === "triangle") {
    return (2 / Math.PI) * Math.asin(Math.sin(phase));
  }

  if (waveform === "square") {
    return Math.sin(phase) >= 0 ? 1 : -1;
  }

  return Math.sin(phase);
}

function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const pcm = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, pcm, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function toBase64(data: Uint8Array): string {
  const chunkSize = 0x4000;
  let binary = "";

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}
