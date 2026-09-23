// Web Audio pipeline: microphone capture (-> 16kHz PCM16) and playback of
// 24kHz PCM16 chunks streamed back from Vertex, with an amplitude signal for
// lip-sync visemes.

import { INPUT_SAMPLE_RATE, OUTPUT_SAMPLE_RATE } from "./protocol";

export function int16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToInt16(b64: string): Int16Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

/** Downsample a Float32 buffer from srcRate to 16kHz and convert to PCM16. */
function toPcm16(input: Float32Array, srcRate: number): Int16Array {
  const ratio = srcRate / INPUT_SAMPLE_RATE;
  const outLength = Math.floor(input.length / ratio);
  const out = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const s = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export class AudioCapture {
  private ctx?: AudioContext;
  private stream?: MediaStream;
  private processor?: ScriptProcessorNode;
  private source?: MediaStreamAudioSourceNode;

  constructor(private onChunk: (b64: string) => void) {}

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.ctx = new AudioContext();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.processor = this.ctx.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcm = toPcm16(input, this.ctx!.sampleRate);
      this.onChunk(int16ToBase64(pcm));
    };
    this.source.connect(this.processor);
    this.processor.connect(this.ctx.destination);
  }

  stop(): void {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    this.ctx = this.processor = this.source = this.stream = undefined;
  }
}

export class AudioPlayer {
  private ctx: AudioContext;
  private analyser: AnalyserNode;
  private nextStart = 0;
  private buf = new Uint8Array(2048);

  constructor() {
    this.ctx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.connect(this.ctx.destination);
    this.buf = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async resume(): Promise<void> {
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  enqueue(pcm: Int16Array): void {
    const audio = this.ctx.createBuffer(1, pcm.length, OUTPUT_SAMPLE_RATE);
    const channel = audio.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 0x8000;

    const src = this.ctx.createBufferSource();
    src.buffer = audio;
    src.connect(this.analyser);
    const now = this.ctx.currentTime;
    this.nextStart = Math.max(this.nextStart, now);
    src.start(this.nextStart);
    this.nextStart += audio.duration;
  }

  /** Stop everything currently scheduled (used on barge-in / interruption). */
  reset(): void {
    this.nextStart = 0;
  }

  /** Current output loudness in [0,1] — drives the mouth-open viseme. */
  amplitude(): number {
    this.analyser.getByteTimeDomainData(this.buf);
    let sum = 0;
    for (let i = 0; i < this.buf.length; i++) {
      const v = (this.buf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / this.buf.length) * 4);
  }
}
