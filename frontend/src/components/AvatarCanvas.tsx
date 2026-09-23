import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { Avatar } from "./Avatar";
// import { GltfAvatar } from "./GltfAvatar"; // enable when a rigged GLB exists

interface Props {
  getAmplitude: () => number;
}

// const AVATAR_URL = import.meta.env.VITE_AVATAR_URL ?? "/models/avatar.glb";

export function AvatarCanvas({ getAmplitude }: Props) {
  return (
    <Canvas camera={{ position: [0, 0.2, 3.2], fov: 40 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 2]} intensity={1.1} />
      <Suspense fallback={null}>
        <Avatar getAmplitude={getAmplitude} />
        {/* <GltfAvatar url={AVATAR_URL} getAmplitude={getAmplitude} /> */}
        <Environment preset="city" />
      </Suspense>
      <OrbitControls enablePan={false} minDistance={2} maxDistance={5} />
    </Canvas>
  );
}
