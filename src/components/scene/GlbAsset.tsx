import { Suspense, Component, type ReactNode } from "react";
import * as Drei from "@react-three/drei";
import type { Object3D } from "three";

interface LoadedAsset {
  scene: Object3D;
}

type UseGlb = ((url: string) => LoadedAsset) & { preload?: (url: string) => void };
let useGLTF: UseGlb | undefined;
try {
  useGLTF = (Drei as unknown as { useGLTF?: UseGlb }).useGLTF;
} catch {
  // Test doubles and older Drei builds may not expose the optional loader.
}

interface GlbAssetProps {
  url: string;
  scale?: number | [number, number, number];
}

function LoadedGlb({ url, scale }: GlbAssetProps) {
  if (!useGLTF) throw new Error("GLB loader is unavailable");
  const asset = useGLTF(url);
  return <primitive object={asset.scene.clone()} scale={scale} />;
}

class GlbErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function GlbAsset({ url, scale, fallback }: GlbAssetProps & { fallback: ReactNode }) {
  return (
    <GlbErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <LoadedGlb url={url} scale={scale} />
      </Suspense>
    </GlbErrorBoundary>
  );
}

export const preloadGlb = (url: string): void => {
  if (typeof useGLTF === "function" && typeof useGLTF.preload === "function") {
    useGLTF.preload(url);
  }
};
