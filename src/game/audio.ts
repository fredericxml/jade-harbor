export class AudioEngine {
  context?: AudioContext;
  volume = 0.3;
  play(
    kind:
      | "break"
      | "place"
      | "craft"
      | "hurt"
      | "step"
      | "eat"
      | "pickup"
      | "click",
  ) {
    if (!this.volume) return;
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") void this.context.resume();
    const ctx = this.context,
      osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.connect(gain).connect(ctx.destination);
    const t = ctx.currentTime;
    const freq = {
      break: 120,
      place: 180,
      craft: 660,
      hurt: 80,
      step: 90,
      eat: 240,
      pickup: 880,
      click: 440,
    }[kind];
    osc.type = kind === "craft" || kind === "pickup" ? "sine" : "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.45, t + 0.14);
    gain.gain.setValueAtTime(this.volume * (kind === "step" ? 0.12 : 0.3), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.start(t);
    osc.stop(t + 0.17);
  }
}
