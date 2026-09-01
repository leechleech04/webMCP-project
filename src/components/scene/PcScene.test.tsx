import { beforeEach, describe, expect, it, vi } from "vitest";
import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { installComponent } from "../../domain/commands/installComponent";
import { moveComponent } from "../../domain/commands/moveComponent";
import { removeComponent } from "../../domain/commands/removeComponent";
import { buildStore, resetBuildStore } from "../../store/buildStore";

vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
  Canvas: ({ children }: { children?: ReactNode }) => {
    const components = Children.toArray(children).filter(
      (child) => isValidElement(child) && typeof child.type !== "string" &&
        (child.type as { name?: string }).name !== "StudioEnvironment",
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
    highlight,
  }: {
    transform: {
      position: [number, number, number];
      rotation: [number, number, number];
    };
    highlight?: boolean;
  }) => (
    <div
      data-scene-object="gpu-01"
      data-mount-position={transform.position.join(",")}
      data-mount-rotation={transform.rotation.join(",")}
      data-highlight={String(!!highlight)}
    >
      GPU-01
    </div>
  ),
}));

vi.mock("./RadiatorModel", () => ({
  RadiatorModel: ({
    transform,
    highlight,
  }: {
    transform: {
      position: [number, number, number];
      rotation: [number, number, number];
    };
    highlight?: boolean;
  }) => (
    <div
      data-scene-object="radiator-01"
      data-mount-position={transform.position.join(",")}
      data-mount-rotation={transform.rotation.join(",")}
      data-highlight={String(!!highlight)}
    >
      RADIATOR-01
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
const RADIATOR_ID = "radiator-01";
const RADIATOR_FRONT_MOUNT_ID = "radiator-front";
const RADIATOR_TOP_MOUNT_ID = "radiator-top";

// Zustand's useStore uses getInitialState during server rendering. Point that
// read at the current shared store state for this SSR-only integration check;
// production code and the real useBuildStore hook remain untouched.
const renderScene = (props: ComponentProps<typeof PcScene> = {}): string => {
  const initialState = buildStore.getInitialState;
  buildStore.getInitialState = buildStore.getState;

  try {
    return renderToString(<PcScene {...props} />);
  } finally {
    buildStore.getInitialState = initialState;
  }
};

describe("PcScene mount-based placement", () => {
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
    expect(html).toContain('data-mount-position="-0.5,3,0"');
    expect(html).toContain('data-mount-rotation="0,0,0"');
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

  it("moves the radiator by Mount ID and resolves a new transform", () => {
    installComponent({
      componentId: RADIATOR_ID,
      mountId: RADIATOR_FRONT_MOUNT_ID,
    });

    const frontHtml = renderScene();

    expect(frontHtml).toContain('data-scene-object="radiator-01"');
    expect(frontHtml).toContain('data-mount-position="0,4.9,4.35"');
    expect(frontHtml).toContain(
      `data-mount-rotation="0,0,0"`,
    );

    moveComponent({
      componentId: RADIATOR_ID,
      mountId: RADIATOR_TOP_MOUNT_ID,
    });

    expect(buildStore.getState().placements).toEqual([
      { componentId: RADIATOR_ID, mountId: RADIATOR_TOP_MOUNT_ID },
    ]);

    const topHtml = renderScene();

    expect([...topHtml.matchAll(/data-scene-object="radiator-01"/g)]).toHaveLength(1);
    expect(topHtml).toContain('data-mount-position="0,9.3,0"');
    expect(topHtml).toContain(
      `data-mount-rotation="${Math.PI / 2},0,0"`,
    );
    expect(topHtml).toContain("Radiator is installed at radiator-top");
  });

  it("passes only selected affected IDs to the scene/model layer", () => {
    installComponent({ componentId: GPU_ID, mountId: GPU_MOUNT_ID });
    installComponent({ componentId: RADIATOR_ID, mountId: RADIATOR_FRONT_MOUNT_ID });

    const html = renderScene({ highlightedComponentIds: [GPU_ID, RADIATOR_ID] });
    expect(html).toContain('data-scene-object="gpu-01" data-mount-position="-0.5,3,0" data-mount-rotation="0,0,0" data-highlight="true"');
    expect(html).toContain('data-scene-object="radiator-01" data-mount-position="0,4.9,4.35" data-mount-rotation="0,0,0" data-highlight="true"');

    const gpuOnly = renderScene({ highlightedComponentIds: [GPU_ID] });
    expect(gpuOnly).toContain('data-scene-object="gpu-01"');
    expect(gpuOnly).toContain('data-highlight="true"');
    expect(gpuOnly).toContain('data-scene-object="radiator-01"');
    expect(gpuOnly).toContain('data-highlight="false"');
  });
});
