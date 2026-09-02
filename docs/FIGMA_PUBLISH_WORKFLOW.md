# ENSIL Figma → Code → Vercel workflow

This document is the handoff bridge between the editable ENSIL design file, the production repository, and the Vercel site.

## Working links

- Figma: https://www.figma.com/design/6nzADsXjhKnyHGDQoZ4NGL
- Production: https://ensil-kjb3.vercel.app/
- Repository: https://github.com/kjbis113-crypto/ENSIL.git
- Node-to-code map: `design/figma-map.json`

The deployed code remains the production source of truth. Figma is the editable design source for visual revisions. When a Figma frame is approved, implement that exact node in code and then publish the verified build.

## Screen and component map

| Figma item | Node | Primary code |
| --- | --- | --- |
| INDEX | `6:2` | `src/routes/Landing.tsx`, `src/styles/landing.css` |
| FIELD | `7:2` | `src/routes/Field.tsx`, `src/components/field/PanoramaViewer.tsx`, `src/styles/field.css` |
| ARCHIVE | `8:2` | `src/routes/Archive.tsx`, `src/components/archive/CircularArchiveCarousel.tsx`, `src/styles/archive.css` |
| Site Navigation | `5:27` | `src/components/navigation/SiteNavigation.tsx` |
| Portal Action | `5:33` | `src/routes/Landing.tsx` |
| Archive Row | `5:38` | `src/routes/Archive.tsx` |
| Specimen Node | `5:45` | `src/components/archive/CircularArchiveCarousel.tsx` |
| Foundations | `5:2` | `src/styles/tokens.css` |

If a Figma frame or component is replaced, update `design/figma-map.json` in the same commit as the code change.

## Editing and publishing loop

1. Edit the existing Figma variables, components, and instances instead of detaching them.
2. Select the changed frame or component and copy its node-specific Figma link.
3. Give Codex the node URL and specify what should change. A useful request is:

   ```text
   Implement this ENSIL Figma node exactly: <node URL>.
   Preserve the existing panorama/3D behavior and responsive navigation.
   Update design/figma-map.json if the node ID changes.
   Build, verify, commit with a one-line Korean message, push main, and publish to ensil-kjb3.vercel.app.
   ```

4. Verify INDEX, FIELD, and ARCHIVE on desktop and mobile. Check browser console errors and the 360° panorama interaction.
5. Commit the approved files and push `main` to `https://github.com/kjbis113-crypto/ENSIL.git`.
6. Publish the production build to the Vercel project `ensil` in scope `kjb3`, then confirm the alias `ensil-kjb3.vercel.app`.

## Local checks

```bash
npm run build
git status --short
```

If the Vercel Git integration is active, pushing `main` creates the production deployment. For a manual production deployment:

```bash
vercel --prod --scope kjb3
```

## Design rules

- Production typography: Helvetica Neue / Helvetica / Arial.
- Figma typography currently uses Inter as an editable fallback because Helvetica is not available in the team font list. Replace it with Helvetica when the team font becomes available; do not change the production CSS fallback stack.
- Core palette: `#5FA48D`, `#545756`, and `#FFFFFF`.
- No shadows, gradients, or rounded-card styling unless explicitly approved.
- Preserve the immersive FIELD panorama, circular archive interaction, existing navigation, and responsive behavior.

## Code Connect status

The repository uses `design/figma-map.json` as the deterministic bridge today. Formal Figma Code Connect requires published Figma components and a supported Organization or Enterprise setup. Do not create placeholder `.figma.ts` files before those requirements are available; replace this map with formal Code Connect mappings at that point.
