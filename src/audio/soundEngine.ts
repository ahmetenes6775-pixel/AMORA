export type VoiceType = 'narrator' | 'guide' | 'corn' | 'spider' | 'king' | 'cactus' | 'pirate_potato';
export type MusicTrack = 'none' | 'title' | 'tutorial' | 'sky' | 'spider' | 'king' | 'cactus' | 'pirate_potato' | 'victory' | 'gameover';

type NoteName = string | null;

interface TrackPattern {
  stepMs: number;
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  leadVol: number;
  bassVol: number;
  cutoffHz: number;
  somber?: boolean;
  lead: NoteName[];
  bass: NoteName[];
}

const NOTE_OFFSETS: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

function noteToFreq(note: string): number | null {
  const match = /^([A-G][#b]?)(\d)$/.exec(note);
  if (!match) return null;
  const pitch = NOTE_OFFSETS[match[1]];
  const octave = Number(match[2]);
  if (pitch === undefined) return null;
  const midi = (octave + 1) * 12 + pitch;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const TRACKS: Record<Exclude<MusicTrack, 'none'>, TrackPattern> = {
  // Pixel Piano arrangement of "Korobeiniki" for the Title Screen (64 steps, E minor)
  title: {
    stepMs: 185,
    leadWave: 'triangle',
    bassWave: 'sine',
    leadVol: 0.065,
    bassVol: 0.045,
    cutoffHz: 1850,
    lead: [
      // Section A
      'E5', null, 'B4', 'C5', 'D5', null, 'C5', 'B4',
      'A4', null, 'A4', 'C5', 'E5', null, 'D5', 'C5',
      'B4', null, null, 'C5', 'D5', null, 'E5', null,
      'C5', null, 'A4', null, 'A4', null, null, null,
      null, 'D5', null, 'F5', 'A5', null, 'G5', 'F5',
      'E5', null, null, 'C5', 'E5', null, 'D5', 'C5',
      'B4', null, 'B4', 'C5', 'D5', null, 'E5', null,
      'C5', null, 'A4', null, 'A4', null, null, null,
      // Section B (gentle piano bridge)
      'E5', null, null, null, 'C5', null, null, null,
      'D5', null, null, null, 'B4', null, null, null,
      'C5', null, null, null, 'A4', null, null, null,
      'G#4', null, null, null, 'B4', null, null, null,
      'E5', null, null, null, 'C5', null, null, null,
      'D5', null, null, null, 'B4', null, null, null,
      'C5', null, 'E5', null, 'A5', null, null, null,
      'G#5', null, null, null, null, null, null, null,
    ],
    bass: [
      'E2', null, 'E3', null, 'E2', null, 'E3', null,
      'A2', null, 'E3', null, 'A2', null, 'E3', null,
      'G#2', null, 'E3', null, 'E2', null, 'E3', null,
      'A2', null, 'E3', null, 'A2', null, 'E3', null,
      'D2', null, 'A2', null, 'D3', null, 'A2', null,
      'C3', null, 'G3', null, 'C3', null, 'G3', null,
      'E2', null, 'B2', null, 'G#2', null, 'E3', null,
      'A2', null, 'E3', null, 'A2', null, 'E3', null,
      'A2', null, 'E3', null, 'A2', null, 'E3', null,
      'G#2', null, 'E3', null, 'E2', null, 'E3', null,
      'A2', null, 'E3', null, 'A2', null, 'E3', null,
      'E2', null, 'B2', null, 'E2', null, 'B2', null,
      'A2', null, 'E3', null, 'A2', null, 'E3', null,
      'G#2', null, 'E3', null, 'E2', null, 'E3', null,
      'A2', null, 'E3', null, 'C3', null, 'A2', null,
      'E2', null, 'B2', null, 'E2', null, null, null,
    ],
  },

  // Soft pixel chiptune arrangement of "All That She Wants" chorus for Corn Tutorial (128 steps, C# minor)
  tutorial: {
    stepMs: 162,
    leadWave: 'triangle',
    bassWave: 'sine',
    leadVol: 0.056,
    bassVol: 0.044,
    cutoffHz: 1520,
    lead: [
      // Bar 1: "All that she wants..."
      'C#5', null, null, null, 'D#5', null, 'E5', null,
      'D#5', null, null, null, null, null, 'B4', null,
      // Bar 2: "...is another baby"
      'C#5', null, 'D#5', null, 'C#5', null, 'B4', null,
      'G#4', null, null, null, null, null, null, null,
      // Bar 3: "She's gone tomorrow, boy"
      'A4', null, 'B4', null, 'C#5', null, 'B4', null,
      'A4', null, 'G#4', null, null, null, null, null,
      // Bar 4: Soft chorus turnaround
      'F#4', null, 'G#4', null, 'B4', null, 'G#4', null,
      'F#4', null, 'G#4', null, null, null, null, null,
      // Bar 5: "All that she wants..."
      'C#5', null, null, null, 'D#5', null, 'E5', null,
      'D#5', null, null, null, null, null, 'B4', null,
      // Bar 6: "...is another baby"
      'C#5', null, 'D#5', null, 'C#5', null, 'B4', null,
      'G#4', null, null, null, null, null, null, null,
      // Bar 7: "All that she wants is another baby, yeah!"
      'A4', null, 'B4', null, 'C#5', null, 'E5', null,
      'D#5', null, 'C#5', null, 'B4', null, 'C#5', null,
      // Bar 8: Gentle dreamy echo tail
      'C#5', null, null, null, 'E5', null, 'D#5', null,
      'C#5', null, 'G#4', null, null, null, null, null,
    ],
    bass: [
      // C#m reggae-pop pulse
      'C#2', null, null, 'G#2', null, null, 'C#3', null,
      'C#2', null, 'G#2', null, 'C#3', null, null, null,
      // B / G#m pulse
      'B1', null, null, 'F#2', null, null, 'B2', null,
      'B1', null, 'F#2', null, 'B2', null, null, null,
      // A pulse
      'A1', null, null, 'E2', null, null, 'A2', null,
      'A1', null, 'E2', null, 'A2', null, null, null,
      // G# pulse
      'G#1', null, null, 'D#2', null, null, 'G#2', null,
      'G#1', null, 'D#2', null, 'G#2', null, null, null,
      // Repeat chord cycle cleanly
      'C#2', null, null, 'G#2', null, null, 'C#3', null,
      'C#2', null, 'G#2', null, 'C#3', null, null, null,
      'B1', null, null, 'F#2', null, null, 'B2', null,
      'B1', null, 'F#2', null, 'B2', null, null, null,
      'A1', null, null, 'E2', null, null, 'A2', null,
      'G#1', null, 'D#2', null, 'G#2', null, null, null,
      'C#2', null, null, 'G#2', null, null, 'C#3', null,
      'G#1', null, 'D#2', null, 'G#2', null, null, null,
    ],
  },

  // Peaceful floating clouds & puzzle island stroll (64 steps)
  sky: {
    stepMs: 215,
    leadWave: 'triangle',
    bassWave: 'sine',
    leadVol: 0.055,
    bassVol: 0.042,
    cutoffHz: 1650,
    lead: [
      'G4', 'A4', 'C5', null, 'E5', null, 'D5', 'C5',
      'A4', null, 'C5', null, 'G4', null, null, null,
      'F4', 'G4', 'A4', null, 'C5', null, 'B4', 'A4',
      'G4', null, 'E4', null, 'D4', null, null, null,
      'G4', 'C5', 'E5', null, 'G5', null, 'E5', 'D5',
      'C5', null, 'A4', null, 'F4', null, 'A4', null,
      'G4', null, 'E5', null, 'D5', null, 'B4', null,
      'C5', null, null, null, 'G4', null, null, null,
    ],
    bass: [
      'C3', null, 'E3', null, 'G3', null, 'E3', null,
      'A2', null, 'E3', null, 'G2', null, 'D3', null,
      'F2', null, 'C3', null, 'F2', null, 'C3', null,
      'G2', null, 'B2', null, 'D3', null, 'G2', null,
      'C3', null, 'G3', null, 'E3', null, 'G3', null,
      'A2', null, 'E3', null, 'F2', null, 'C3', null,
      'G2', null, 'C3', null, 'G2', null, 'D3', null,
      'C3', null, 'G3', null, 'C3', null, null, null,
    ],
  },

  // Boss 1 (Arakna): Soft, bouncy Undertale "Spider Dance" inspired variation in F minor (64 steps)
  spider: {
    stepMs: 148,
    leadWave: 'square',
    bassWave: 'triangle',
    leadVol: 0.028,
    bassVol: 0.048,
    cutoffHz: 1750,
    lead: [
      // Phrase A: Playful Spider Dance bounce
      'F5', null, 'C5', 'Ab4', 'G4', null, 'F4', 'G4',
      'Ab4', null, 'C5', 'Eb5', 'Db5', 'C5', 'Bb4', 'G4',
      // Phrase A': Varied sky-silk turnaround
      'F5', null, 'C5', 'Ab4', 'G4', null, 'F4', 'C5',
      'Bb4', 'Ab4', 'G4', 'F4', 'E4', null, 'G4', 'C5',
      // Phrase B: Dancing up the web strings
      'Ab4', 'Bb4', 'C5', null, 'Eb5', 'Db5', 'C5', 'Bb4',
      'Ab4', 'G4', 'F4', 'Ab4', 'G4', null, 'C5', null,
      // Phrase C: Silken sparkle cadence
      'F5', 'Eb5', 'Db5', 'C5', 'Bb4', 'Ab4', 'G4', 'F4',
      'G4', 'Ab4', 'Bb4', 'C5', 'E5', null, 'F5', null,
    ],
    bass: [
      'F2', null, 'C3', null, 'Ab2', null, 'C3', null,
      'Db3', null, 'Ab2', null, 'Eb3', null, 'C3', null,
      'F2', null, 'C3', null, 'Ab2', null, 'C3', null,
      'Bb2', null, 'F2', null, 'C3', null, 'G2', null,
      'Ab2', null, 'Eb3', null, 'Bb2', null, 'F3', null,
      'F2', null, 'C3', null, 'C3', null, 'G2', null,
      'Db3', null, 'Ab2', null, 'Bb2', null, 'F2', null,
      'C3', null, 'G2', null, 'F2', null, 'C3', null,
    ],
  },

  // Boss 2 (Kral Aether, Asgore-like): Noble, emotional soft sky-king theme in D minor (64 steps)
  king: {
    stepMs: 185,
    leadWave: 'triangle',
    bassWave: 'triangle',
    leadVol: 0.055,
    bassVol: 0.045,
    cutoffHz: 1600,
    lead: [
      'A4', null, 'D5', null, 'E5', null, 'F5', null,
      'E5', null, 'D5', null, 'C5', null, 'A4', null,
      'Bb4', null, 'C5', null, 'D5', null, 'F5', null,
      'E5', null, 'C5', null, 'A4', null, null, null,
      'D5', null, 'F5', null, 'G5', null, 'A5', null,
      'G5', null, 'F5', null, 'E5', null, 'D5', null,
      'Bb4', null, 'D5', null, 'C#5', null, 'E5', null,
      'D5', null, null, null, 'A4', null, null, null,
    ],
    bass: [
      'D2', null, 'A2', null, 'D3', null, 'A2', null,
      'C2', null, 'G2', null, 'C3', null, 'G2', null,
      'Bb2', null, 'F3', null, 'Bb2', null, 'F3', null,
      'A2', null, 'E3', null, 'A2', null, 'E2', null,
      'D2', null, 'A2', null, 'F2', null, 'C3', null,
      'G2', null, 'D3', null, 'A2', null, 'E3', null,
      'Bb2', null, 'F3', null, 'A2', null, 'E3', null,
      'D2', null, 'A2', null, 'D3', null, null, null,
    ],
  },

  // Boss 3 (Minik Kaktüs Piko - Final Boss): Fast, thrilling, heroic final-boss chiptune! (64 steps)
  cactus: {
    stepMs: 112,
    leadWave: 'square',
    bassWave: 'triangle',
    leadVol: 0.036,
    bassVol: 0.058,
    cutoffHz: 2300,
    lead: [
      'E5', 'G5', 'B5', null, 'E5', 'A5', 'G5', 'F#5',
      'E5', 'D5', 'C5', 'B4', 'C5', 'D5', 'E5', 'G5',
      'F#5', 'A5', 'C6', null, 'B5', 'A5', 'G5', 'F#5',
      'G5', 'F#5', 'E5', 'D#5', 'E5', 'G5', 'B5', null,
      'C6', 'B5', 'A5', 'G5', 'A5', 'G5', 'F#5', 'E5',
      'D5', 'F#5', 'A5', 'C6', 'B5', 'A5', 'G5', 'F#5',
      'E5', 'B4', 'E5', 'G5', 'A5', 'G5', 'F#5', 'D#5',
      'E5', null, 'B5', null, 'E6', null, 'B5', null,
    ],
    bass: [
      'E2', 'E3', 'E2', 'E3', 'E2', 'E3', 'E2', 'E3',
      'C2', 'C3', 'C2', 'C3', 'D2', 'D3', 'D2', 'D3',
      'D2', 'D3', 'D2', 'D3', 'B1', 'B2', 'B1', 'B2',
      'E2', 'E3', 'B1', 'B2', 'E2', 'B2', 'E3', null,
      'A2', 'A3', 'A2', 'A3', 'D2', 'D3', 'D2', 'D3',
      'G2', 'G3', 'F#2', 'F#3', 'B1', 'B2', 'B1', 'B2',
      'C2', 'C3', 'A2', 'A3', 'B1', 'B2', 'B1', 'B2',
      'E2', 'E3', 'G2', 'B2', 'E3', null, 'B2', null,
    ],
  },

  // Secret Final Boss (Dev Depresif Korsan Patates): Full 60-second (600 steps * 100ms = 60s) dark, somber, non-repeating "La Campanella"
  pirate_potato: {
    stepMs: 100,
    leadWave: 'triangle',
    bassWave: 'sine',
    leadVol: 0.068,
    bassVol: 0.056,
    cutoffHz: 720,
    somber: true,
    lead: [
      // Mvt 1 (Bars 1-8, 64 steps): Dramatic High Bell Tolls & Rising Suspense
      'E6', null, 'E5', null, 'E6', null, 'E5', null,
      'E6', null, 'D#6', null, 'E6', null, 'F6', null,
      'E6', null, 'D6', null, 'C6', null, 'B5', null,
      'A5', 'B5', 'C6', 'D6', 'E6', null, 'E5', null,
      'E6', 'E5', 'E6', 'D#6', 'E6', 'F6', 'E6', 'D#6',
      'E6', 'C6', 'B5', 'A5', 'G#5', 'A5', 'B5', 'C6',
      'D6', 'C6', 'B5', 'A5', 'G#5', 'F5', 'E5', 'D5',
      'E5', 'G#5', 'B5', 'D6', 'E6', null, null, null,

      // Mvt 2 (Bars 9-18, 80 steps): Iconic La Campanella Bell Leaps (A minor)
      'E6', 'E5', 'E6', 'D#6', 'E6', 'F6', 'E6', 'D#6',
      'E6', 'D6', 'C6', 'B5', 'C6', 'D6', 'C6', 'B5',
      'A5', 'E5', 'A5', 'B5', 'C6', 'B5', 'A5', 'G#5',
      'A5', 'C6', 'E6', 'A6', 'G#6', 'E6', 'C6', 'A5',
      'E6', 'C6', 'E6', 'B5', 'E6', 'A5', 'E6', 'G#5',
      'E6', 'A5', 'E6', 'B5', 'E6', 'C6', 'E6', 'D6',
      'E6', 'D#6', 'D6', 'C#6', 'C6', 'B5', 'Bb5', 'A5',
      'G#5', 'A5', 'B5', 'C6', 'D6', 'E6', 'B5', 'G#5',
      'A5', 'C6', 'E6', 'C6', 'B5', 'D6', 'F6', 'D6',
      'C6', 'E6', 'A6', 'E6', 'D#6', 'E6', 'E5', null,

      // Mvt 3 (Bars 19-28, 80 steps): Virtuosic Descending Cascades & Upper Trills
      'E6', 'F6', 'E6', 'D#6', 'E6', 'C6', 'A5', 'E5',
      'F5', 'A5', 'D6', 'F6', 'E6', 'D6', 'C6', 'B5',
      'C6', 'E6', 'G6', 'E6', 'D6', 'F6', 'A6', 'F6',
      'E6', 'D6', 'C6', 'B5', 'A5', 'G#5', 'A5', 'B5',
      'C6', 'B5', 'C6', 'D6', 'E6', 'D6', 'C6', 'B5',
      'A5', 'G#5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F6',
      'G6', 'F6', 'E6', 'D6', 'C6', 'B5', 'A5', 'G5',
      'F5', 'E5', 'D5', 'C5', 'B4', 'C5', 'D5', 'E5',
      'F5', 'G#5', 'B5', 'D6', 'F6', 'D6', 'B5', 'G#5',
      'A5', 'C6', 'E6', 'A6', 'E6', null, 'C6', null,

      // Mvt 4 (Bars 29-38, 80 steps): Pirate Storm Fanfare (C Major -> G Major -> E7)
      'C6', 'G5', 'C6', 'D6', 'E6', 'C6', 'G5', 'E5',
      'G5', 'C6', 'E6', 'G6', 'F6', 'E6', 'D6', 'C6',
      'D6', 'B5', 'G5', 'B5', 'D6', 'G6', 'F6', 'D6',
      'E6', 'C6', 'G5', 'C6', 'E6', 'G6', 'E6', 'C6',
      'A5', 'E5', 'A5', 'B5', 'C6', 'A5', 'E5', 'C5',
      'F5', 'A5', 'C6', 'F6', 'E6', 'D6', 'C6', 'B5',
      'G5', 'B5', 'D6', 'G6', 'F#6', 'G6', 'D6', 'B5',
      'E6', 'B5', 'G#5', 'E5', 'G#5', 'B5', 'E6', 'G#6',
      'E6', 'D6', 'C6', 'B5', 'A5', 'G#5', 'F#5', 'E5',
      'E6', 'D#6', 'E6', 'B5', 'G#5', 'E5', 'B4', null,

      // Mvt 5 (Bars 39-48, 80 steps): Depressive Sea Waltz Bridge (F Major / D Minor)
      'F5', null, 'A5', null, 'C6', null, 'F6', null,
      'E6', 'D6', 'C6', 'Bb5', 'A5', 'G5', 'F5', 'E5',
      'D5', null, 'F5', null, 'A5', null, 'D6', null,
      'C6', 'Bb5', 'A5', 'G5', 'F5', 'E5', 'D5', 'C#5',
      'D5', 'E5', 'F5', 'G5', 'A5', 'Bb5', 'C6', 'D6',
      'E6', 'F6', 'G6', 'E6', 'C6', 'Bb5', 'A5', 'G5',
      'F5', 'A5', 'C6', 'F6', 'D6', 'Bb5', 'G5', 'E5',
      'A5', 'C#6', 'E6', 'A6', 'G6', 'F6', 'E6', 'D6',
      'C#6', 'D6', 'E6', 'F6', 'G6', 'E6', 'C#6', 'A5',
      'D6', 'A5', 'F5', 'D5', 'E5', 'G#5', 'B5', 'E6',

      // Mvt 6 (Bars 49-58, 80 steps): Rapid Bell Cadenza & Chromatic Climb
      'A4', 'C5', 'E5', 'A5', 'C6', 'E6', 'A6', 'E6',
      'G#4', 'B4', 'E5', 'G#5', 'B5', 'E6', 'G#6', 'E6',
      'A4', 'D5', 'F5', 'A5', 'D6', 'F6', 'A6', 'F6',
      'E5', 'G#5', 'B5', 'D6', 'E6', 'G#6', 'B6', 'G#6',
      'A6', 'G#6', 'G6', 'F#6', 'F6', 'E6', 'D#6', 'D6',
      'C#6', 'C6', 'B5', 'Bb5', 'A5', 'G#5', 'G5', 'F#5',
      'F5', 'F#5', 'G5', 'G#5', 'A5', 'Bb5', 'B5', 'C6',
      'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6',
      'A6', 'E6', 'C6', 'A5', 'E6', 'C6', 'A5', 'E5',
      'B5', 'E6', 'G#6', 'E6', 'B5', 'G#5', 'E5', null,

      // Mvt 7 (Bars 59-68, 80 steps): Climax — Furious Double-Bell Pedal Showdown
      'E6', 'A5', 'E6', 'B5', 'E6', 'C6', 'E6', 'D6',
      'E6', 'D#6', 'E6', 'F6', 'E6', 'D6', 'C6', 'B5',
      'A6', 'C6', 'A6', 'B5', 'A6', 'A5', 'A6', 'G#5',
      'A6', 'E6', 'C6', 'E6', 'F6', 'D6', 'B5', 'D6',
      'E6', 'G#5', 'E6', 'A5', 'E6', 'B5', 'E6', 'C6',
      'D6', 'F5', 'D6', 'G5', 'D6', 'A5', 'D6', 'B5',
      'C6', 'E5', 'C6', 'F5', 'C6', 'G5', 'C6', 'A5',
      'B5', 'E5', 'G#5', 'B5', 'E6', 'G#6', 'E6', 'B5',
      'E6', 'E5', 'E6', 'D#6', 'E6', 'F6', 'E6', 'D#6',
      'E6', 'D6', 'C6', 'B5', 'A5', 'G#5', 'A5', 'B5',

      // Mvt 8 (Bars 69-75, 56 steps): Heroic Grand Finale & Seamless Loop Turnaround
      'C6', 'E6', 'A6', 'E6', 'C6', 'A5', 'E5', 'C5',
      'D6', 'F6', 'A6', 'F6', 'D6', 'B5', 'G#5', 'F5',
      'E6', 'C6', 'A5', 'C6', 'E6', 'A6', 'C6', 'E6',
      'D#6', 'E6', 'F6', 'E6', 'D6', 'C6', 'B5', 'A5',
      'G#5', 'B5', 'E6', 'G#6', 'E6', 'B5', 'G#5', 'E5',
      'A5', 'C6', 'E6', 'A6', 'E6', 'C6', 'A5', 'E5',
      'E6', null, 'B5', null, 'G#5', null, 'E5', null,
    ],
    bass: [
      // Mvt 1 Bass (64 steps)
      'A2', null, 'E3', null, 'A2', null, 'E3', null,
      'A2', null, 'E3', null, 'G#2', null, 'E3', null,
      'A2', null, 'E3', null, 'F2', null, 'E2', null,
      'A2', null, 'C3', null, 'E3', null, 'B2', null,
      'A2', 'E3', 'A2', 'E3', 'G#2', 'E3', 'G#2', 'E3',
      'A2', 'E3', 'D2', 'A2', 'E2', 'B2', 'E3', null,
      'D2', 'A2', 'F2', 'C3', 'E2', 'B2', 'G#2', 'E3',
      'E2', 'B2', 'E3', 'B2', 'E2', null, null, null,

      // Mvt 2 Bass (80 steps)
      'A2', null, 'E3', 'A3', 'E2', null, 'B2', 'E3',
      'A2', null, 'E3', 'A3', 'E2', null, 'G#2', 'B2',
      'A2', 'E3', 'A2', 'E3', 'F2', 'C3', 'E2', 'B2',
      'A2', 'E2', 'C2', 'E2', 'A2', null, 'E3', null,
      'A2', 'E3', 'G#2', 'E3', 'F#2', 'E3', 'E2', 'E3',
      'F2', 'C3', 'G2', 'D3', 'A2', 'E3', 'B2', 'E3',
      'C3', 'G3', 'B2', 'F#3', 'A2', 'E3', 'F2', 'C3',
      'E2', 'B2', 'E2', 'G#2', 'E3', null, 'E2', null,
      'A2', 'E3', 'A2', 'E3', 'D2', 'A2', 'G#2', 'E3',
      'A2', 'E3', 'A3', 'E3', 'E2', 'B2', 'E3', null,

      // Mvt 3 Bass (80 steps)
      'A2', 'E3', 'G#2', 'E3', 'A2', 'E3', 'C3', 'A2',
      'D2', 'A2', 'F2', 'D3', 'E2', 'B2', 'G#2', 'E3',
      'C3', 'G3', 'C3', 'G3', 'D3', 'A3', 'D3', 'A3',
      'E3', 'B3', 'E2', 'B2', 'A2', 'E3', 'A2', 'E3',
      'A2', 'E3', 'G2', 'D3', 'C3', 'G3', 'E2', 'B2',
      'F2', 'C3', 'D2', 'A2', 'A2', 'E3', 'D3', 'A3',
      'G2', 'D3', 'C3', 'G3', 'F2', 'C3', 'E2', 'B2',
      'D2', 'A2', 'C2', 'G2', 'B1', 'F#2', 'E2', 'B2',
      'E2', 'B2', 'G#2', 'E3', 'E2', 'B2', 'E3', 'B2',
      'A2', 'E3', 'A3', 'E3', 'A2', null, 'E2', null,

      // Mvt 4 Bass (80 steps)
      'C3', null, 'G3', null, 'C3', null, 'G3', null,
      'E2', null, 'B2', null, 'F2', null, 'C3', null,
      'G2', null, 'D3', null, 'G2', null, 'B2', null,
      'C3', null, 'G3', null, 'C3', null, 'E2', null,
      'A2', null, 'E3', null, 'A2', null, 'E3', null,
      'F2', null, 'C3', null, 'D2', null, 'G2', null,
      'G2', null, 'D3', null, 'B2', null, 'G2', null,
      'E2', null, 'B2', null, 'E3', null, 'G#2', null,
      'A2', 'E3', 'G2', 'D3', 'F2', 'C3', 'D#2', 'B2',
      'E2', 'B2', 'E3', 'B2', 'E2', 'B2', 'E2', null,

      // Mvt 5 Bass (80 steps)
      'F2', 'C3', 'F3', 'C3', 'F2', 'C3', 'F3', 'C3',
      'C2', 'G2', 'C3', 'G2', 'F2', 'C3', 'A2', 'E3',
      'D2', 'A2', 'D3', 'A2', 'D2', 'A2', 'D3', 'A2',
      'G2', 'D3', 'C3', 'G3', 'D2', 'A2', 'A1', 'E2',
      'D2', 'A2', 'D3', 'A2', 'F2', 'C3', 'D2', 'A2',
      'C2', 'G2', 'C3', 'G2', 'C2', 'G2', 'A2', 'E3',
      'F2', 'C3', 'A2', 'E3', 'Bb2', 'F3', 'G2', 'D3',
      'A2', 'E3', 'A3', 'E3', 'A2', 'E3', 'D2', 'A2',
      'A2', 'E3', 'A2', 'E3', 'A2', 'E3', 'A2', 'E3',
      'D2', 'A2', 'D3', 'A2', 'E2', 'B2', 'E3', 'B2',

      // Mvt 6 Bass (80 steps)
      'A2', null, 'E3', null, 'A3', null, 'E3', null,
      'E2', null, 'B2', null, 'E3', null, 'B2', null,
      'D2', null, 'A2', null, 'D3', null, 'A2', null,
      'E2', null, 'B2', null, 'E3', null, 'B2', null,
      'A2', 'E3', 'G#2', 'E3', 'G2', 'D3', 'F#2', 'D3',
      'F2', 'C3', 'E2', 'B2', 'D2', 'A2', 'D#2', 'B2',
      'E2', 'B2', 'E2', 'B2', 'A2', 'E3', 'C3', 'G3',
      'A2', 'D3', 'B2', 'D#3', 'E2', 'B2', 'E3', 'B2',
      'A2', 'E3', 'C3', 'A2', 'E2', 'C3', 'A2', 'E2',
      'E2', 'B2', 'E3', 'B2', 'E2', 'B2', 'E2', null,

      // Mvt 7 Bass (80 steps)
      'A2', 'E3', 'G#2', 'E3', 'G2', 'E3', 'F#2', 'E3',
      'F2', 'C3', 'E2', 'B2', 'D2', 'A2', 'E2', 'B2',
      'A2', 'E3', 'G#2', 'E3', 'F#2', 'E3', 'E2', 'E3',
      'A2', 'E3', 'C3', 'A2', 'D2', 'A2', 'G2', 'D3',
      'E2', 'B2', 'A2', 'E3', 'G#2', 'E3', 'A2', 'E3',
      'D2', 'A2', 'G2', 'D3', 'F2', 'C3', 'G2', 'D3',
      'C3', 'G3', 'F2', 'C3', 'E2', 'B2', 'A2', 'E3',
      'E2', 'B2', 'E3', 'B2', 'E2', 'B2', 'G#2', 'E3',
      'A2', 'E3', 'A2', 'E3', 'F2', 'C3', 'E2', 'B2',
      'A2', 'E3', 'D2', 'A2', 'E2', 'B2', 'A2', 'E2',

      // Mvt 8 Bass (56 steps)
      'A2', 'E3', 'A3', 'E3', 'A2', 'E3', 'C3', 'A2',
      'D2', 'A2', 'D3', 'A2', 'B1', 'F#2', 'E2', 'B2',
      'A2', 'E3', 'A3', 'E3', 'A2', 'E3', 'A2', 'E3',
      'F2', 'C3', 'D2', 'A2', 'E2', 'B2', 'A2', 'E2',
      'E2', 'B2', 'E3', 'B2', 'E2', 'B2', 'G#2', 'E3',
      'A2', 'E3', 'A3', 'E3', 'A2', 'E3', 'C3', 'A2',
      'E2', null, 'G#2', null, 'B2', null, 'E2', null,
    ],
  },

  // Sweet, cute pixel chiptune arrangement of "Kalinka" for the Victory Ending! (64 steps)
  victory: {
    stepMs: 175,
    leadWave: 'triangle',
    bassWave: 'sine',
    leadVol: 0.065,
    bassVol: 0.045,
    cutoffHz: 1950,
    lead: [
      // "Ka-lin-ka, ka-lin-ka, ka-lin-ka mo-ya!"
      'E5', null, 'D5', 'B4', 'C5', 'D5', 'B4', 'C5',
      'A4', null, null, null, 'E5', null, 'D5', 'B4',
      'C5', 'D5', 'B4', 'C5', 'A4', null, null, null,
      // "V sa-du ya-go-da ma-lin-ka ma-lin-ka mo-ya!"
      'C5', 'D5', 'E5', 'G5', 'F5', 'E5', 'D5', 'C5',
      'B4', 'C5', 'D5', 'F5', 'E5', 'D5', 'C5', 'B4',
      // Cheerful dance cadence
      'C5', 'E5', 'A5', null, 'G5', 'E5', 'F5', 'D5',
      'E5', 'C5', 'D5', 'B4', 'C5', 'A4', 'E5', null,
      'A5', null, 'E5', null, 'C5', null, 'A4', null,
    ],
    bass: [
      'A2', null, 'E3', null, 'E2', null, 'E3', null,
      'A2', null, 'E3', null, 'A2', null, 'E3', null,
      'E2', null, 'E3', null, 'A2', null, 'E3', null,
      'C3', null, 'G3', null, 'D3', null, 'A3', null,
      'G2', null, 'D3', null, 'E2', null, 'B2', null,
      'A2', null, 'E3', null, 'D3', null, 'A2', null,
      'C3', null, 'E2', null, 'A2', null, 'E3', null,
      'A2', null, 'E3', null, 'A2', null, null, null,
    ],
  },

  // Soft, tender, sad pixel lullaby on Game Over (48 steps)
  gameover: {
    stepMs: 320,
    leadWave: 'sine',
    bassWave: 'sine',
    leadVol: 0.055,
    bassVol: 0.038,
    cutoffHz: 1150,
    lead: [
      'E5', null, 'D5', null, 'C5', null, null, null,
      'B4', null, 'C5', null, 'A4', null, null, null,
      'F4', null, 'A4', null, 'G4', null, 'E4', null,
      'D4', null, null, null, null, null, null, null,
      'C5', null, 'B4', null, 'A4', null, 'G4', null,
      'F4', null, 'E4', null, 'D4', null, 'E4', null,
    ],
    bass: [
      'A2', null, null, null, 'E2', null, null, null,
      'G2', null, null, null, 'A2', null, null, null,
      'F2', null, null, null, 'C2', null, null, null,
      'G2', null, null, null, 'E2', null, null, null,
      'A2', null, null, null, 'E2', null, null, null,
      'F2', null, null, null, 'E2', null, null, null,
    ],
  },
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private muted = false;
  private currentTrack: MusicTrack = 'none';
  private loopTimer: number | null = null;
  private step = 0;

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
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (!this.musicFilter) {
        this.musicFilter = this.ctx.createBiquadFilter();
        this.musicFilter.type = 'lowpass';
        this.musicFilter.frequency.value = 1750;
        this.musicFilter.Q.value = 0.7;
        this.musicFilter.connect(this.ctx.destination);
      }
    }
    return this.ctx;
  }

  public unlock(): void {
    const ctx = this.ensureContext();
    if (ctx && !this.muted && this.currentTrack !== 'none' && this.loopTimer === null) {
      const track = this.currentTrack;
      this.currentTrack = 'none';
      this.playMusic(track);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusicLoop();
    } else {
      this.ensureContext();
      const track = this.currentTrack;
      this.currentTrack = 'none';
      this.playMusic(track);
    }
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.08,
    slideTo?: number,
    softFilter = false,
    softAttack = false
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }

    // Gentle attack (deeper swell for somber cathedral/cello tracks) & smooth release
    const attackSec = softAttack ? Math.min(0.032, duration * 0.25) : Math.min(0.015, duration * 0.2);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + attackSec);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    if (softFilter && this.musicFilter) {
      gain.connect(this.musicFilter);
    } else {
      gain.connect(ctx.destination);
    }

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playVoiceBlip(voice: VoiceType): void {
    if (this.muted) return;
    switch (voice) {
      case 'guide':
        this.playTone(155 + Math.random() * 22, 0.055, 'triangle', 0.065);
        break;
      case 'corn':
        this.playTone(215 + Math.random() * 35, 0.05, 'triangle', 0.06);
        break;
      case 'spider':
        this.playTone(540 + Math.random() * 140, 0.04, 'triangle', 0.065);
        break;
      case 'king':
        this.playTone(112 + Math.random() * 16, 0.08, 'triangle', 0.07);
        break;
      case 'cactus':
        this.playTone(680 + Math.random() * 160, 0.045, 'triangle', 0.055);
        break;
      case 'pirate_potato':
        this.playTone(84 + Math.random() * 18, 0.085, 'sawtooth', 0.048, undefined, true);
        break;
      default:
        this.playTone(320 + Math.random() * 25, 0.04, 'triangle', 0.045);
        break;
    }
  }

  public playMenuMove(): void {
    this.playTone(440, 0.045, 'triangle', 0.055);
  }

  public playMenuSelect(): void {
    this.playTone(660, 0.07, 'triangle', 0.065, 880);
  }

  public playBack(): void {
    this.playTone(300, 0.06, 'triangle', 0.055, 210);
  }

  public playSlash(): void {
    this.playTone(860, 0.14, 'sawtooth', 0.07, 140, true);
  }

  public playEnemyHit(): void {
    this.playTone(160, 0.18, 'square', 0.08, 55, true);
  }

  public playPlayerHit(): void {
    this.playTone(210, 0.16, 'sawtooth', 0.09, 70, true);
  }

  public playHeal(): void {
    this.playTone(523, 0.08, 'triangle', 0.075);
    setTimeout(() => this.playTone(659, 0.08, 'triangle', 0.075), 70);
    setTimeout(() => this.playTone(784, 0.14, 'triangle', 0.075), 140);
  }

  public playSpare(): void {
    this.playTone(440, 0.09, 'triangle', 0.075);
    setTimeout(() => this.playTone(554, 0.09, 'triangle', 0.075), 80);
    setTimeout(() => this.playTone(659, 0.12, 'triangle', 0.075), 160);
    setTimeout(() => this.playTone(880, 0.24, 'triangle', 0.075), 240);
  }

  public playAlert(): void {
    this.playTone(760, 0.08, 'triangle', 0.055);
  }

  public playTileFlip(): void {
    this.playTone(480, 0.06, 'triangle', 0.07, 620);
  }

  public playPuzzleSolved(): void {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.15, 'triangle', 0.07), i * 95);
    });
  }

  public playKiss(): void {
    this.playTone(580, 0.055, 'sine', 0.06, 980);
    setTimeout(() => this.playTone(880, 0.09, 'triangle', 0.055, 1180), 65);
  }

  private stopMusicLoop(): void {
    if (this.loopTimer !== null) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }

  public playMusic(track: MusicTrack): void {
    if (this.currentTrack === track && this.loopTimer !== null) return;
    this.currentTrack = track;
    this.stopMusicLoop();
    this.step = 0;

    if (this.muted || track === 'none') return;

    const pattern = TRACKS[track];
    if (this.musicFilter) {
      this.musicFilter.frequency.value = pattern.cutoffHz;
    }

    const playStep = () => {
      if (this.muted) return;
      const ctx = this.ctx;
      if (!ctx || ctx.state !== 'running') return;

      const idx = this.step % pattern.lead.length;
      const leadNote = pattern.lead[idx];
      const bassNote = pattern.bass[idx % pattern.bass.length];

      if (leadNote) {
        const freq = noteToFreq(leadNote);
        if (freq) {
          if (pattern.somber) {
            const darkFreq = freq * 0.5; // One octave deeper for dark moody atmosphere
            const leadDur = (pattern.stepMs / 1000) * 2.5;
            this.playTone(darkFreq, leadDur, pattern.leadWave, pattern.leadVol, undefined, true, true);
            this.playTone(
              darkFreq * 0.994,
              leadDur * 1.1,
              'sine',
              pattern.leadVol * 0.58,
              undefined,
              true,
              true
            );
            this.playTone(
              darkFreq * 0.5,
              leadDur * 1.25,
              'sine',
              pattern.leadVol * 0.32,
              undefined,
              true,
              true
            );
          } else {
            this.playTone(
              freq,
              (pattern.stepMs / 1000) * 1.15,
              pattern.leadWave,
              pattern.leadVol,
              undefined,
              true
            );
          }
        }
      }

      if (bassNote) {
        const freq = noteToFreq(bassNote);
        if (freq) {
          if (pattern.somber) {
            const subFreq = freq * 0.5 >= 42 ? freq * 0.5 : freq;
            const bassDur = (pattern.stepMs / 1000) * 3.2;
            this.playTone(subFreq, bassDur, pattern.bassWave, pattern.bassVol, undefined, true, true);
            this.playTone(
              freq,
              bassDur * 0.9,
              'triangle',
              pattern.bassVol * 0.35,
              undefined,
              true,
              true
            );
          } else {
            this.playTone(
              freq,
              (pattern.stepMs / 1000) * 1.4,
              pattern.bassWave,
              pattern.bassVol,
              undefined,
              true
            );
          }
        }
      }

      this.step++;
    };

    this.loopTimer = window.setInterval(playStep, pattern.stepMs);
  }
}

export const soundEngine = new SoundEngine();
