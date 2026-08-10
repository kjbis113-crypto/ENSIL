import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html", host: "localhost" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the ENSIL experience shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /ENSIL/);
  assert.match(html, /Electronic Ensilage/);
  assert.match(html, /Enter the ecosystem/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships the five procedural species and project preview", async () => {
  const [species, visuals, scene, preview] = await Promise.all([
    readFile(new URL("../data/species.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/creatures/CreatureVisuals.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/EcosystemScene.tsx", import.meta.url), "utf8"),
    access(new URL("../public/og.png", import.meta.url)),
  ]);
  for (const name of ["Keycap Crustacean", "Cable Tendril", "Resonance Bloom", "Photophore Drifter", "Lens Oracle"]) {
    assert.match(species, new RegExp(name));
  }
  assert.match(visuals, /TubeGeometry|ExtrudeGeometry|LatheGeometry/);
  assert.match(scene, /EffectComposer/);
  assert.match(scene, /ACESFilmicToneMapping/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  assert.equal(preview, undefined);
});
