import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AvatarProps {
  /** Returns current speech loudness in [0,1] to drive the mouth. */
  getAmplitude: () => number;
}

/**
 * Procedural placeholder avatar that runs with no external assets. The mouth
 * opening is driven by the live audio amplitude (a simple viseme), plus subtle
 * idle micro-gestures (breathing sway + blinking). Swap this for `GltfAvatar`
 * once a rigged GLB with ARKit/Oculus visemes is available.
 */
export function Avatar({ getAmplitude }: AvatarProps) {
  const group = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const openRef = useRef(0);
  const blink = useRef({ next: 2, closing: 0 });

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Smooth the amplitude so the mouth doesn't jitter.
    const target = getAmplitude();
    openRef.current += (target - openRef.current) * Math.min(1, delta * 12);
    if (mouth.current) {
      mouth.current.scale.y = 0.15 + openRef.current * 1.4;
      mouth.current.scale.x = 1 - openRef.current * 0.2;
    }

    // Idle breathing sway.
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.6) * 0.05;
      group.current.position.y = Math.sin(t * 1.2) * 0.02;
    }

    // Blink.
    const b = blink.current;
    b.next -= delta;
    if (b.next <= 0) {
      b.closing = 0.12;
      b.next = 2 + Math.random() * 3;
    }
    const eyeScale = b.closing > 0 ? 0.1 : 1;
    if (b.closing > 0) b.closing -= delta;
    if (eyeL.current) eyeL.current.scale.y = eyeScale;
    if (eyeR.current) eyeR.current.scale.y = eyeScale;
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Head */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#e8c4a8" roughness={0.6} />
      </mesh>
      {/* Hair cap */}
      <mesh position={[0, 0.45, -0.05]} scale={[1.02, 0.8, 1.02]}>
        <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3a2b22" roughness={0.8} />
      </mesh>
      {/* Eyes */}
      <mesh ref={eyeL} position={[-0.32, 0.2, 0.86]}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh ref={eyeR} position={[0.32, 0.2, 0.86]}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.32, 0.2, 0.95]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#2a1a10" />
      </mesh>
      <mesh position={[0.32, 0.2, 0.95]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#2a1a10" />
      </mesh>
      {/* Mouth (scales with amplitude) */}
      <mesh ref={mouth} position={[0, -0.35, 0.9]}>
        <boxGeometry args={[0.4, 0.1, 0.05]} />
        <meshStandardMaterial color="#7a2e2e" />
      </mesh>
    </group>
  );
}
