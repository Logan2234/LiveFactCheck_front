// AudioWorklet: downsamples captured audio to 16 kHz mono Int16 PCM and posts it
// to the main thread in ~100 ms batches (the live /ws wire format).
//
// COPY: an identical file lives at extension/public/pcm-worklet.js. The frontend
// serves it from /static; the extension loads it via chrome.runtime.getURL. Change
// both together (see root CLAUDE.md, frontend↔extension sync).
//
// `sampleRate` is a global in the AudioWorkletGlobalScope (the context's rate, e.g.
// 48000). We run the context at native rate so tab playback keeps full quality and
// downsample here instead. Int16 is written in platform endianness — little-endian
// on every browser target — matching the backend's "<i2" decode.

const TARGET_RATE = 16000;
const BATCH_SAMPLES = 1600; // ~100 ms at 16 kHz

class PCMDownsampler extends AudioWorkletProcessor {
  constructor() {
    super();
    this._ratio = sampleRate / TARGET_RATE; // input samples per output sample
    this._pos = 0; // fractional read position, carried across process() blocks
    this._batch = new Int16Array(BATCH_SAMPLES);
    this._count = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0]; // mono: first channel of the first input
    if (!channel) return true;

    // Nearest-neighbour decimation: step through the block at _ratio, keeping the
    // fractional remainder so the next block resumes at the right offset.
    for (; this._pos < channel.length; this._pos += this._ratio) {
      const s = Math.max(-1, Math.min(1, channel[Math.floor(this._pos)]));
      this._batch[this._count++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this._count === BATCH_SAMPLES) {
        const out = this._batch.slice(0, BATCH_SAMPLES);
        this.port.postMessage(out.buffer, [out.buffer]);
        this._count = 0;
      }
    }
    this._pos -= channel.length;

    return true;
  }
}

registerProcessor("pcm-downsampler", PCMDownsampler);
