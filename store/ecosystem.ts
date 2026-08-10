"use client";

import { create } from "zustand";
import type { OfferingType, SpeciesId } from "../data/species";
import { SPECIES } from "../data/species";
import type { AgentSnapshot, Offering } from "../simulation/types";

type ExperienceMode = "entry" | "fermenting" | "live" | "archive";
type Quality = "low" | "medium" | "high";

const initialAgents = Object.fromEntries(
  SPECIES.map((species, index) => [
    species.id,
    {
      id: species.id,
      energy: 66 + index * 4,
      hunger: 22 + index * 5,
      curiosity: 46 + index * 7,
      fear: index === 4 ? 34 : 12,
      age: 118 + index * 71,
      health: 100,
      target: "ambient field",
      state: "Dormant",
      absorbed: species.components.slice(0, 2),
      growth: 0,
    } satisfies AgentSnapshot,
  ]),
) as Record<SpeciesId, AgentSnapshot>;

type EcosystemState = {
  mode: ExperienceMode;
  previousMode: ExperienceMode;
  quiet: boolean;
  sound: boolean;
  microphone: boolean;
  reducedMotion: boolean;
  micIntensity: number;
  quality: Quality;
  selectedSpecies: SpeciesId | null;
  selectedOffering: OfferingType;
  offerings: Offering[];
  agents: Record<SpeciesId, AgentSnapshot>;
  lifecycle: "Dormancy" | "Fermentation" | "Emergence";
  enter: () => void;
  finishFermentation: () => void;
  showArchive: () => void;
  showEcosystem: () => void;
  toggleQuiet: () => void;
  toggleSound: () => void;
  setMicrophone: (active: boolean) => void;
  setMicIntensity: (intensity: number) => void;
  toggleReducedMotion: () => void;
  setQuality: (quality: Quality) => void;
  setSelectedSpecies: (id: SpeciesId | null) => void;
  setSelectedOffering: (type: OfferingType) => void;
  addOffering: (position: [number, number, number], charge: number) => void;
  consumeOffering: (offeringId: string, speciesId: SpeciesId, component: string) => void;
  pruneOfferings: (now: number) => void;
  updateAgent: (id: SpeciesId, patch: Partial<AgentSnapshot>) => void;
  setLifecycle: (phase: "Dormancy" | "Fermentation" | "Emergence") => void;
};

let offeringSequence = 0;

export const useEcosystem = create<EcosystemState>((set, get) => ({
  mode: "entry",
  previousMode: "entry",
  quiet: false,
  sound: false,
  microphone: false,
  reducedMotion: false,
  micIntensity: 0.22,
  quality: "high",
  selectedSpecies: null,
  selectedOffering: "charge",
  offerings: [],
  agents: initialAgents,
  lifecycle: "Dormancy",
  enter: () => set({ mode: "fermenting", previousMode: "entry", lifecycle: "Fermentation" }),
  finishFermentation: () => set({ mode: "live", previousMode: "live", lifecycle: "Emergence" }),
  showArchive: () => set((state) => ({ mode: "archive", previousMode: state.mode })),
  showEcosystem: () => set({ mode: "live", previousMode: "live" }),
  toggleQuiet: () => set((state) => ({ quiet: !state.quiet, selectedSpecies: null })),
  toggleSound: () => set((state) => ({ sound: !state.sound })),
  setMicrophone: (microphone) => set({ microphone }),
  setMicIntensity: (micIntensity) => set({ micIntensity }),
  toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
  setQuality: (quality) => set({ quality }),
  setSelectedSpecies: (selectedSpecies) => set({ selectedSpecies }),
  setSelectedOffering: (selectedOffering) => set({ selectedOffering }),
  addOffering: (position, charge) => {
    const offering: Offering = {
      id: `fragment-${offeringSequence++}`,
      type: get().selectedOffering,
      position,
      charge,
      createdAt: Date.now(),
    };
    set((state) => ({ offerings: [...state.offerings.slice(-11), offering] }));
  },
  consumeOffering: (offeringId, speciesId, component) =>
    set((state) => {
      if (!state.offerings.some((offering) => offering.id === offeringId)) return state;
      const agent = state.agents[speciesId];
      return {
        offerings: state.offerings.filter((offering) => offering.id !== offeringId),
        agents: {
          ...state.agents,
          [speciesId]: {
            ...agent,
            energy: Math.min(100, agent.energy + 18),
            hunger: Math.max(0, agent.hunger - 28),
            state: "Feeding",
            target: component,
            growth: Math.min(5, agent.growth + 1),
            absorbed: [...agent.absorbed.slice(-4), component],
          },
        },
      };
    }),
  pruneOfferings: (now) =>
    set((state) => ({ offerings: state.offerings.filter((item) => now - item.createdAt < 45000) })),
  updateAgent: (id, patch) =>
    set((state) => ({ agents: { ...state.agents, [id]: { ...state.agents[id], ...patch } } })),
  setLifecycle: (lifecycle) => set({ lifecycle }),
}));
