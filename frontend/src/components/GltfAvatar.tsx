import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface GltfAvatarProps {
  url: string;
  getAmplitude: () => number;
}

// Common ARKit / Oculus viseme morph-target names that map to an open mouth.
const OPEN_MOUTH_TARGETS = ["jawOpen", "viseme_aa", "mouthOpen", "vrc.v_aa"];

/**
 * Renders a rigged GLB and drives its mouth-open blendshape from live audio
 * amplitude. This is a lightweight amplitude-based lip-sync; for phoneme-level
 * accuracy, map Vertex transcript timings to specific visemes here instead.
 *
 * Enable by importing this in AvatarCanvas and pointing VITE_AVATAR_URL at a
 * real GLB rigged with ARKit/Oculus morph targets.
 */
export function GltfAvatar({ url, getAmplitude }: GltfAvatarProps) {
  const gltf = useGLTF(url);
  const openRef = useRef(0);

  // Collect every skinned mesh that exposes one of the open-mouth targets.
  const targets = useMemo(() => {
    const found: { mesh: THREE.Mesh; index: number }[] = [];
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      const dict = mesh.morphTargetDictionary;
      if (!dict || !mesh.morphTargetInfluences) return;
      for (const name of OPEN_MOUTH_TARGETS) {
        if (name in dict) found.push({ mesh, index: dict[name] });
      }
    });
    return found;
  }, [gltf]);

  useEffect(() => {
    useGLTF.preload(url);
  }, [url]);

  useFrame((_, delta) => {
    const target = getAmplitude();
    openRef.current += (target - openRef.current) * Math.min(1, delta * 12);
    for (const { mesh, index } of targets) {
      mesh.morphTargetInfluences![index] = openRef.current;
    }
  });

  return <primitive object={gltf.scene} />;
}
