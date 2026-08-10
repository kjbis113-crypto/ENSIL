# ENSIL — Electronic Ensilage

ENSIL is a continuous, browser-based artificial-life artwork. Five species made from procedural Three.js geometry inhabit a pale electronic terrarium, respond to the viewer and to one another, metabolize component offerings, and continue moving without direct input.

## Run locally

Requirements: Node.js 22.13 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by the development server. To create a production build:

```bash
npm run build
npm run start
```

## Experience

- **Dormancy:** a quiet entry culture of inactive circuit embryos.
- **Electro-fermentation:** a staged transition in which residual charge reorganizes into instinct.
- **Emergence:** the autonomous ecosystem, offering interaction, specimen telemetry, quiet observation, sound, and explicit microphone mode.
- **Archive:** five editable species records, each with its own rotating real-time 3D specimen and a link back to the living organism.

Move the pointer to create a presence field. Click empty space to leave the selected electronic offering; press and hold before releasing to increase its charge. Click an organism to inspect age, energy, behavior, target, health, absorbed parts, and growth history. Scroll changes observation depth without dragging an organism.

Audio starts only after the **Sound** control is activated. The microphone is never requested automatically; permission is requested only after **Mic mode** is selected. **Calm motion** provides a manual reduced-motion mode in addition to automatic `prefers-reduced-motion` support.

## Species and behavior

- **EO-001 Keycap Crustacean:** switch/force logic; curls, startles at fast pointer motion, contracts, brightens, and grows shell keys after feeding.
- **EO-002 Cable Tendril:** distance/connection logic; elastically searches for open ports and grows connector limbs.
- **EO-003 Resonance Bloom:** sound/resonance logic; breathes through speaker petals and emits visible pressure rings.
- **EO-004 Photophore Drifter:** gesture/light logic; drifts above the culture and exchanges synchronized flashes with Resonance Bloom.
- **EO-005 Lens Oracle:** light/display logic; cautiously observes, samples color, and develops iris structure.

Each agent tracks energy, hunger, curiosity, fear, age, health, a current target, absorbed components, growth, and a behavioral state. Seeded paths, damped steering, species-specific reaction times, feeding, communication, startle, and avoidance create legible intent instead of Brownian motion. Offerings are capped and expire; the simulation does not accumulate unbounded objects.

## Architecture

- `components/EcosystemApp.tsx` — mode transitions and top-level experience orchestration
- `components/EcosystemScene.tsx` — renderer, camera, lighting, particles, interactions, agents, lifecycle, offerings, and post-processing
- `components/creatures/CreatureVisuals.tsx` — the five procedural PBR organism anatomies
- `components/EcosystemUI.tsx` and `components/SpecimenPanel.tsx` — live controls and telemetry
- `components/Archive.tsx` — research archive with five independent real-time specimen views
- `store/ecosystem.ts` — bounded Zustand state, agent snapshots, lifecycle, offerings, and UI state
- `simulation/` — agent types and deterministic math helpers
- `hooks/useAudioEngine.ts` — gesture-gated generative Web Audio and explicit microphone analysis
- `data/species.ts` — centralized project copy, field notes, component logic, accents, and offering definitions

## Rendering and performance

The renderer uses ACES filmic tone mapping, capped device pixel ratio, restrained bloom, haze, contact shadows, shared procedural forms, bounded particles, and quality-dependent post-processing. Low quality disables contact shadows and post effects and reduces particle count. Mobile uses a compressed ecosystem layout and lower DPR while keeping all five species in real 3D. Rendering pauses when the page is hidden.

## Accessibility

All interface controls are semantic and keyboard accessible with visible focus states. The project supports desktop, exhibition display, and narrow mobile layouts; responds to `prefers-reduced-motion`; offers a manual calm-motion mode; remains understandable while muted; and includes archive copy as the fallback source of essential specimen information when WebGL is unavailable.

## Asset sources

- Organism geometry, materials, animation, electronic fragments, and iconography are original procedural WebGL assets created for this project; no production imagery or 3D files are hotlinked.
- `public/og.png` is an original OpenAI-generated social preview created for this project from the approved ENSIL material direction.
- The supplied `Meshy_AI_HexKey_Glove_0810025144_generate.glb` was inspected as a modeling reference. It contains a single untextured mesh (approximately 737k triangles) with no normals, materials, or animation, so it is intentionally not shipped; the production Keycap Crustacean is a lighter articulated procedural build.
- The team presentation and supplied creature render informed concept, material, component relationships, and composition only. No reference imagery is used as a production texture.
