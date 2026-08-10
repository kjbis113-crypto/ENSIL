import type { Metadata } from "next";
import EcosystemApp from "../components/EcosystemApp";

export const metadata: Metadata = {
  title: "ENSIL — Electronic Ensilage",
  description: "A live electronic ecosystem born from the fermentation of abandoned devices.",
};

export default function Home() {
  return <EcosystemApp />;
}
