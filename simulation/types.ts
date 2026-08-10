import type { OfferingType, SpeciesId } from "../data/species";

export type BehaviorState =
  | "Dormant"
  | "Wandering"
  | "Foraging"
  | "Inspecting"
  | "Feeding"
  | "Connecting"
  | "Startled"
  | "Resting"
  | "Communicating"
  | "Returning";

export type AgentSnapshot = {
  id: SpeciesId;
  energy: number;
  hunger: number;
  curiosity: number;
  fear: number;
  age: number;
  health: number;
  target: string;
  state: BehaviorState;
  absorbed: string[];
  growth: number;
};

export type Offering = {
  id: string;
  type: OfferingType;
  position: [number, number, number];
  charge: number;
  createdAt: number;
};
