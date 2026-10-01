import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, dedup, weld, simplify, textureCompress, resample, meshopt, mergeDocuments, unpartition } from "@gltf-transform/functions";
import { MeshoptSimplifier, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";
import fs from "node:fs";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
await MeshoptSimplifier.ready; await MeshoptEncoder.ready;

// ---- character
const doc = await io.read("out/character.glb");
for (const m of doc.getRoot().listMaterials()) {
  m.setNormalTexture(null); m.setMetallicRoughnessTexture(null); m.setOcclusionTexture?.(null);
  m.setMetallicFactor(0); m.setRoughnessFactor(0.85);
  m.setAlphaMode(m.getName().includes("eyelash") ? "MASK" : "OPAQUE");
  console.log("mat", m.getName(), m.getBaseColorTexture()?.getName());
}
for (const mesh of doc.getRoot().listMeshes())
  for (const prim of mesh.listPrimitives())
    if (prim.getMaterial()?.getName().includes("eyelash")) { mesh.removePrimitive(prim); prim.dispose(); }
await doc.transform(prune(), dedup(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.17, error: 0.01 }), prune());
// texture sizes: big body sheet 1024, small sheet 512
for (const t of doc.getRoot().listTextures()) {
  const img = sharp(Buffer.from(t.getImage()));
  const meta = await img.metadata();
  const size = meta.width >= 4096 ? 1024 : 512;
  const buf = await img.resize(size, size).removeAlpha().jpeg({ quality: 88 }).toBuffer();
  t.setImage(new Uint8Array(buf)).setMimeType("image/jpeg");
  console.log("tex", t.getName(), meta.width, "->", size, buf.length);
}
await doc.transform(meshopt({ encoder: MeshoptEncoder, level: "medium" }));
await io.write("out/player.glb", doc);
console.log("player.glb", fs.statSync("out/player.glb").size);

// ---- animations: one file, clips named after the source files
const names = fs.readdirSync("anim").filter((f) => f.endsWith(".glb")).map((f) => f.replace(".glb", ""));
let merged = null;
for (const n of names) {
  const d = await io.read(`anim/${n}.glb`);
  const a = d.getRoot().listAnimations()[0];
  a.setName(n.toLowerCase());
  // Keep rotations everywhere and the hips' translation; other bone translations are constant.
  for (const ch of a.listChannels()) {
    const node = ch.getTargetNode();
    if (ch.getTargetPath() === "scale" || (ch.getTargetPath() === "translation" && !node.getName().endsWith("Hips"))) {
      const s = ch.getSampler(); ch.dispose(); s.dispose();
    }
  }
  await d.transform(resample({ tolerance: 0.0005 }));
  if (!merged) merged = d; else mergeDocuments(merged, d);
}
// Every clip must drive the same skeleton: point all channels at the first node of each name.
{
  const first = new Map();
  for (const node of merged.getRoot().listNodes()) if (!first.has(node.getName())) first.set(node.getName(), node);
  for (const anim of merged.getRoot().listAnimations())
    for (const ch of anim.listChannels()) ch.setTargetNode(first.get(ch.getTargetNode().getName()));
  // Drop the duplicate skeletons (nodes that are not the first of their name).
  const keep = new Set(first.values());
  for (const scene of merged.getRoot().listScenes())
    for (const child of scene.listChildren()) if (!keep.has(child)) scene.removeChild(child);
}
await merged.transform(unpartition(), prune({ keepLeaves: false }), dedup());
await merged.transform(meshopt({ encoder: MeshoptEncoder, level: "medium" }));
await io.write("out/anims.glb", merged);
console.log("anims.glb", fs.statSync("out/anims.glb").size, merged.getRoot().listAnimations().map((a) => a.getName()).join(","));
