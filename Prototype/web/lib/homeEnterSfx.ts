/**
 * College-home entrance bed — soft whoosh with the logo,
 * paper taps with the polaroids. No UI-text settle chime.
 */

type AudioCtx = AudioContext & { webkitAudioContext?: typeof AudioContext };

let shared: AudioContext | null = null;
let master: GainNode | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!shared || shared.state === "closed") {
    shared = new AC() as AudioCtx;
    master = shared.createGain();
    master.gain.value = 0.0001;
    master.connect(shared.destination);
  }
  return shared;
}

async function unlock(a: AudioContext) {
  if (a.state === "suspended") {
    try {
      await a.resume();
    } catch {
      /* autoplay policy */
    }
  }
}

function fadeIn(a: AudioContext, peak = 0.55, ms = 280) {
  if (!master) return;
  const t = a.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
  master.gain.exponentialRampToValueAtTime(peak, t + ms / 1000);
}

function env(
  g: GainNode,
  t0: number,
  peak: number,
  att: number,
  dec: number,
) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + att + dec);
}

function tone(
  a: AudioContext,
  type: OscillatorType,
  f0: number,
  f1: number,
  t0: number,
  peak: number,
  dec: number,
  att = 0.01,
) {
  if (!master) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + att + dec);
  env(g, t0, peak, att, dec);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + att + dec + 0.05);
}

function noiseWhoosh(
  a: AudioContext,
  t0: number,
  dur: number,
  peak: number,
  freq = 600,
) {
  if (!master) return;
  const n = a.createBufferSource();
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  n.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = 0.7;
  const g = a.createGain();
  env(g, t0, peak, 0.04, dur * 0.85);
  n.connect(f);
  f.connect(g);
  g.connect(master);
  n.start(t0);
  n.stop(t0 + dur + 0.02);
}

function paperTap(a: AudioContext, t0: number, peak = 0.045) {
  noiseWhoosh(a, t0, 0.12, peak, 1400);
  tone(a, "triangle", 420, 280, t0, peak * 0.7, 0.1, 0.004);
}

/** Play once for the home enter sequence. Returns false if AudioContext blocked. */
export async function playHomeEnterSfx(): Promise<boolean> {
  const a = ctx();
  if (!a || !master) return false;
  await unlock(a);
  if (a.state !== "running") return false;

  fadeIn(a, 0.5, 220);
  const t0 = a.currentTime;

  /* Logo swell */
  noiseWhoosh(a, t0 + 0.06, 0.55, 0.055, 520);
  tone(a, "sine", 220, 330, t0 + 0.08, 0.06, 0.55, 0.08);

  /* Polaroids land — matches PolaroidCard delay 0.78 + i * 0.055 */
  for (let i = 0; i < 6; i++) {
    paperTap(a, t0 + 0.78 + i * 0.055, 0.038 + i * 0.004);
  }

  return true;
}
