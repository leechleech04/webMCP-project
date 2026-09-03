// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { componentRegistry } from "../src/domain/data/components";

const generatedUrls = [...new Set(Object.values(componentRegistry)
  .filter((component) => component.visualAsset?.nativeDimensions)
  .map((component) => component.visualAsset!.url!))];

const parseGlb = (payload: Buffer) => {
  expect(payload.subarray(0, 4).toString("ascii")).toBe("glTF");
  expect(payload.readUInt32LE(4)).toBe(2);
  expect(payload.readUInt32LE(8)).toBe(payload.length);
  const jsonLength = payload.readUInt32LE(12);
  expect(payload.subarray(16, 20).toString("ascii")).toBe("JSON");
  return JSON.parse(payload.subarray(20, 20 + jsonLength).toString("utf8")) as {
    scenes: unknown[]; meshes: Array<{ primitives: Array<{ attributes: { POSITION: number } }> }>;
    accessors: Array<{ min?: number[]; max?: number[] }>;
  };
};

describe("generated GLB asset integrity", () => {
  it("contains exactly 12 shared generated asset families", () => {
    expect(generatedUrls).toHaveLength(12);
  });

  for (const url of generatedUrls) {
    it(`validates ${url}`, () => {
      const relative = url.replace(/^\//, "");
      const file = resolve(process.cwd(), "public", relative.replace(/^assets\//, "assets/"));
      const payload = readFileSync(file);
      const doc = parseGlb(payload);
      expect(doc.scenes.length).toBeGreaterThan(0);
      expect(doc.meshes[0].primitives.length).toBeGreaterThan(0);
      expect(doc.accessors.length).toBeGreaterThan(0);
      const positionAccessors = doc.meshes[0].primitives.map((primitive) => doc.accessors[primitive.attributes.POSITION]);
      const bounds = [0, 1, 2].map((axis) => [
        Math.min(...positionAccessors.map((accessor) => accessor.min![axis])),
        Math.max(...positionAccessors.map((accessor) => accessor.max![axis])),
      ]);
      expect(bounds).toEqual([[-0.5, 0.5], [-0.5, 0.5], [-0.5, 0.5]]);

      const folder = resolve(file, "..");
      const manifest = JSON.parse(readFileSync(resolve(folder, "manifest.json"), "utf8")) as {
        nativeBounds: number[]; file: { bytes: number; sha256: string };
      };
      expect(manifest.nativeBounds).toEqual([1, 1, 1]);
      expect(manifest.file.bytes).toBe(payload.length);
      expect(manifest.file.sha256).toBe(createHash("sha256").update(payload).digest("hex"));
      expect(readFileSync(resolve(folder, "ATTRIBUTION.md"), "utf8")).toContain("CC0 1.0");
    });
  }
});
