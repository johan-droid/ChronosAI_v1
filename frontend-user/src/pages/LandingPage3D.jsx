import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

function GlowingSphere() {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.4;
    ref.current.position.y = Math.sin(t * 1.2) * 0.18;
  });
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <sphereGeometry args={[1.1, 64, 64]} />
      <meshPhysicalMaterial
        color="#2563eb"
        roughness={0.15}
        metalness={0.7}
        clearcoat={1}
        clearcoatRoughness={0.1}
        emissive="#3b82f6"
        emissiveIntensity={0.25}
        transmission={0.5}
        thickness={0.7}
      />
      <Html position={[0, -1.7, 0]} center>
        <div className="text-xs text-blue-200/60 select-none">ChronosAI 3D</div>
      </Html>
    </mesh>
  );
}

export default function LandingPage3D() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.7, 4.5], fov: 48 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={["#020617"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 5, 2]} intensity={1.1} castShadow />
        <pointLight position={[-2, 2, 2]} intensity={0.5} color="#60a5fa" />
        <GlowingSphere />
      </Canvas>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-lg mb-8 pointer-events-auto">ChronosAI</h1>
        <a
          href="/login"
          className="pointer-events-auto px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Enter
        </a>
      </div>
    </div>
  );
}
