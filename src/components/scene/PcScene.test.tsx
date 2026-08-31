import { beforeEach, describe, expect, it, vi } from "vitest";
import { Children, isValidElement, type ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { installComponent } from "../../domain/commands/installComponent";
import { removeComponent } from "../../domain/commands/removeComponent";
import { buildStore, resetBuildStore } from "../../store/buildStore";

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children?: ReactNode }) => {
    const components = Children.toArray(children).filter(
      (child) => isValidElement(child) && typeof child.type !== "string",
    );

    return <div data-r3f-canvas="true">{components}</div>;
  },
}));

vi.mock("@react-three/drei", () => ({
  Grid: () => <span data-scene-object="grid">GRID</span>,
  OrbitControls: () => <span data-scene-object="controls">CONTROLS</span>,
}));

vi.mock("./GpuModel", () => ({
  GpuModel: ({
    transform,
  }: {
    transform: { position: [number, number, number] };
  }) => (
    <div
      data-scene-object="gpu-01"
      data-mount-position={transform.position.join(",")}
    >
      GPU-01
    </div>
  ),
}));

vi.mock("./CaseModel", () => ({
  CaseModel: () => <span data-scene-object="case-model">CASE</span>,
}));

vi.mock("./MotherboardModel", () => ({
  MotherboardModel: () => (
    <span data-scene-object="motherboard-model">MB</span>
  ),
}));

import { PcScene } from "./PcScene";

const GPU_ID = "gpu-01";
const GPU_MOUNT_ID = "pcie-slot-1";

// Zustand's useStore uses getInitialState during server rendering. Point that
// read at the current shared store state for this SSR-only integration check;
// production code and the real useBuildStore hook remain untouched.
const renderScene = (): string => {
  const initialState = buildStore.getInitialState;
  buildStore.getInitialState = buildStore.getState;

  try {
    return renderToString(<PcScene />);
  } finally {
    buildStore.getInitialState = initialState;
  }
};

describe("PcScene GPU vertical slice", () => {
  beforeEach(() => {
    resetBuildStore();
  });

  it("renders GPU absent when no placement exists", () => {
    const html = renderScene();

    expect(html).not.toContain('data-scene-object="gpu-01"');
    expect(html).toContain("GPU is not installed");
  });

  it("renders GPU exactly once at the PCIE transform after installComponent", () => {
    installComponent({ componentId: GPU_ID, mountId: GPU_MOUNT_ID });

    expect(buildStore.getState().placements).toEqual([
      { componentId: GPU_ID, mountId: GPU_MOUNT_ID },
    ]);

    const html = renderScene();

    expect([...html.matchAll(/data-scene-object="gpu-01"/g)]).toHaveLength(1);
    expect(html).toContain('data-mount-position="-1,2.6,-0.15"');
    expect(html).toContain("GPU is installed");
  });

  it("removes the placement and GPU marker after removeComponent", () => {
    installComponent({ componentId: GPU_ID, mountId: GPU_MOUNT_ID });
    removeComponent({ componentId: GPU_ID });

    expect(buildStore.getState().placements).not.toContainEqual({
      componentId: GPU_ID,
      mountId: GPU_MOUNT_ID,
    });

    const html = renderScene();

    expect(html).not.toContain('data-scene-object="gpu-01"');
    expect(html).toContain("GPU is not installed");
  });

  it("does not duplicate the placement when installation is repeated", () => {
    installComponent({ componentId: GPU_ID, mountId: GPU_MOUNT_ID });

    expect(() =>
      installComponent({ componentId: GPU_ID, mountId: GPU_MOUNT_ID }),
    ).toThrow();
    expect(buildStore.getState().placements).toEqual([
      { componentId: GPU_ID, mountId: GPU_MOUNT_ID },
    ]);
  });
});
