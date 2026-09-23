import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Avatar } from "./Avatar";
// import { GltfAvatar } from "./GltfAvatar"; // enable when a rigged GLB exists

interface Props {
  getAmplitude: () => number;
}

// const AVATAR_URL = import.meta.env.VITE_AVATAR_URL ?? "/models/avatar.glb";

export function AvatarCanvas({ getAmplitude }: Props) {
  return (
    <Canvas camera={{ position: [0, 0.2, 3.2], fov: 40 }}>
      <color attach="background" args={["#0f172a"]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 2]} intensity={1.2} />
      <directionalLight position={[-2, 1, -1]} intensity={0.4} />
      {/* Procedural avatar renders synchronously (no assets needed). */}
      <Avatar getAmplitude={getAmplitude} />
      {/* A GLB model loads async, so wrap it in Suspense when enabled:
      <Suspense fallback={null}>
        <GltfAvatar url={AVATAR_URL} getAmplitude={getAmplitude} />
      </Suspense> */}
      <OrbitControls enablePan={false} minDistance={2} maxDistance={5} />
    </Canvas>
  );
}
