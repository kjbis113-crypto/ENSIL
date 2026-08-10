export type SpeciesId =
  | "keycap"
  | "tendril"
  | "resonance"
  | "photophore"
  | "oracle";

export type OfferingType = "charge" | "connector" | "coil" | "pixel" | "lens";

export type SpeciesDefinition = {
  id: SpeciesId;
  index: string;
  name: string;
  latin: string;
  shortName: string;
  components: string[];
  input: string;
  output: string;
  lifecycle: string;
  note: string;
  accent: string;
  offering: OfferingType;
};

export const SPECIES: SpeciesDefinition[] = [
  {
    id: "keycap",
    index: "EO-001",
    name: "Keycap Crustacean",
    latin: "Clavicaris memoria",
    shortName: "Clavicaris",
    components: ["keycaps", "tactile switch", "USB lead", "vibration motor"],
    input: "Pressure / pointer velocity",
    output: "Contraction / vibration",
    lifecycle: "Adds a shell key after three successful charge feedings.",
    note:
      "Recovered beside a sealed office keyboard. The organism keeps obsolete keystrokes as armor and emits them as minute mechanical tremors.",
    accent: "#b8ff28",
    offering: "charge",
  },
  {
    id: "tendril",
    index: "EO-002",
    name: "Cable Tendril",
    latin: "Nexum flexor",
    shortName: "Nexum",
    components: ["ribbon cable", "copper wire", "PCB fragment", "micro connectors"],
    input: "Distance / capacitance",
    output: "Connection / elastic locomotion",
    lifecycle: "Grows another connector limb when compatible ports accumulate.",
    note:
      "Its suspended board carries no intact program. Continuity itself appears to have become the organism's appetite.",
    accent: "#2457ff",
    offering: "connector",
  },
  {
    id: "resonance",
    index: "EO-003",
    name: "Resonance Bloom",
    latin: "Soniflora inducta",
    shortName: "Soniflora",
    components: ["speaker cones", "microphone", "induction coil", "clear membrane"],
    input: "Ambient sound pressure",
    output: "Resonance / pressure pulse",
    lifecycle: "A new speaker petal opens after sustained harmonic feeding.",
    note:
      "The bloom does not reproduce recorded sound. It answers the room with a pulse shaped by the silences between sounds.",
    accent: "#ff2f91",
    offering: "coil",
  },
  {
    id: "photophore",
    index: "EO-004",
    name: "Photophore Drifter",
    latin: "Lux manta residualis",
    shortName: "Lux manta",
    components: ["NeoPixels", "optical fiber", "infrared sensor", "flex PCB"],
    input: "Motion / gesture",
    output: "Traveling light / color signal",
    lifecycle: "Extends a luminous fiber when it receives a repeated gesture pattern.",
    note:
      "Observed signaling to Resonance Bloom before each pressure event. The exchange may be warning, courtship, or calibration.",
    accent: "#21d9ff",
    offering: "pixel",
  },
  {
    id: "oracle",
    index: "EO-005",
    name: "Lens Oracle",
    latin: "Opticon cauta",
    shortName: "Opticon",
    components: ["camera lens", "OLED membrane", "servo iris", "light sensor"],
    input: "Light / sampled color",
    output: "Display / motor response",
    lifecycle: "Develops another iris blade after a long period of quiet observation.",
    note:
      "It approaches nothing directly. Color samples are held for hours, then displayed only when nearby life becomes still.",
    accent: "#7d52ff",
    offering: "lens",
  },
];

export const OFFERINGS: Array<{
  id: OfferingType;
  label: string;
  mark: string;
  description: string;
}> = [
  { id: "charge", label: "Charge cell", mark: "+", description: "Excites switch-driven organisms" },
  { id: "connector", label: "Open port", mark: "⊣", description: "Attracts connection-seeking tendrils" },
  { id: "coil", label: "Induction coil", mark: "◉", description: "Feeds resonant structures" },
  { id: "pixel", label: "Light diode", mark: "✦", description: "Carries a color signal" },
  { id: "lens", label: "Optic shard", mark: "◎", description: "Provides a new color sample" },
];

export const PROJECT_COPY = {
  title: "ENSIL",
  subtitle: "Electronic Ensilage",
  statement: "An ecosystem born from the fermentation of abandoned electronics.",
  question: "What if electronic waste were not dead material, but the substrate of a new ecosystem?",
  archiveIntro:
    "Five organisms catalogued inside a continuously fermenting electronic habitat. Each anatomy keeps the function of its source components, but redirects that function toward life.",
};

export function getSpecies(id: SpeciesId) {
  return SPECIES.find((species) => species.id === id) ?? SPECIES[0];
}
