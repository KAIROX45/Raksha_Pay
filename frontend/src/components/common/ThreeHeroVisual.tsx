import React, { useRef, useState, useEffect, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// -------------------------------------------------------------
// Interactive 3D Golden Security Sphere with Orbiting Rings
// -------------------------------------------------------------
const GoldenSecuritySphere: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const satellite1Ref = useRef<THREE.Mesh>(null);
  const satellite2Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    // Responsive parallax with pointer (works on mouse move and mobile touch)
    if (groupRef.current) {
      const targetRotY = state.pointer.x * 0.45;
      const targetRotX = -state.pointer.y * 0.45;
      groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.06;
      groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.06;
    }

    // Outer Golden Wireframe Sphere rotation
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.22;
      coreRef.current.rotation.x += delta * 0.12;
    }

    // Inner Glowing Core pulsation & rotation
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.3;
      innerRef.current.rotation.z += delta * 0.15;
      const pulse = 1 + Math.sin(elapsed * 2.5) * 0.05;
      innerRef.current.scale.set(pulse, pulse, pulse);
    }

    // 3 Dynamic Orbital Rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.35;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x += delta * 0.28;
      ring2Ref.current.rotation.y += delta * 0.18;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z -= delta * 0.22;
      ring3Ref.current.rotation.y += delta * 0.3;
    }

    // Orbiting Satellite verification nodes
    if (satellite1Ref.current) {
      const angle1 = elapsed * 1.2;
      satellite1Ref.current.position.set(
        Math.cos(angle1) * 2.2,
        Math.sin(angle1) * 2.2 * Math.cos(Math.PI / 4),
        Math.sin(angle1) * 2.2 * Math.sin(Math.PI / 4)
      );
    }

    if (satellite2Ref.current) {
      const angle2 = -elapsed * 0.9;
      satellite2Ref.current.position.set(
        Math.cos(angle2) * 2.5 * Math.sin(Math.PI / 3),
        Math.sin(angle2) * 2.5,
        Math.cos(angle2) * 2.5 * Math.cos(Math.PI / 3)
      );
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.6}>
        {/* 1. Main Outer Golden Wireframe Sphere */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1.45, 2]} />
          <meshStandardMaterial
            color="#D4AF37"
            wireframe
            roughness={0.15}
            metalness={0.95}
            emissive="#7A5D10"
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* 2. Inner Glowing Core - Semi-transparent Champagne Gem */}
        <mesh ref={innerRef}>
          <octahedronGeometry args={[0.95, 0]} />
          <meshStandardMaterial
            color="#F5D78E"
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.45}
            wireframe
          />
        </mesh>

        {/* 3. Center Glowing AI Pulse Node */}
        <mesh>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
        </mesh>

        {/* 4. Orbital Ring 1 - Metallic Gold */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 3.5, 0, 0]}>
          <torusGeometry args={[2.2, 0.022, 16, 120]} />
          <meshStandardMaterial
            color="#D4AF37"
            metalness={0.95}
            roughness={0.15}
            emissive="#D4AF37"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* 5. Orbital Ring 2 - Champagne Gold */}
        <mesh ref={ring2Ref} rotation={[0, Math.PI / 4, Math.PI / 6]}>
          <torusGeometry args={[2.5, 0.018, 16, 120]} />
          <meshStandardMaterial
            color="#F5D78E"
            metalness={0.9}
            roughness={0.2}
            emissive="#F5D78E"
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* 6. Orbital Ring 3 - Outer Thin Gold Orbit */}
        <mesh ref={ring3Ref} rotation={[Math.PI / 5, Math.PI / 2.5, 0]}>
          <torusGeometry args={[2.85, 0.014, 16, 120]} />
          <meshStandardMaterial
            color="#D4AF37"
            metalness={0.9}
            roughness={0.25}
            transparent
            opacity={0.75}
          />
        </mesh>

        {/* 7. Orbiting Security AI Nodes */}
        <mesh ref={satellite1Ref}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#F5D78E" />
        </mesh>
        <mesh ref={satellite2Ref}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        {/* 8. Floating Golden Particles */}
        <Sparkles
          count={55}
          scale={6.5}
          size={2.8}
          speed={0.4}
          color="#F5D78E"
          opacity={0.65}
        />
      </Float>
    </group>
  );
};

// -------------------------------------------------------------
// Luxury CSS Fallback Component (No WebGL or context crash)
// -------------------------------------------------------------
const LuxuryFallbackVisual: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Glowing backdrop halo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-metallic-gold/20 via-champagne-gold/10 to-transparent blur-2xl animate-pulse" />
        
        {/* Outer Ring */}
        <div className="absolute w-60 h-60 rounded-full border border-metallic-gold/40 animate-spin-slow" />
        
        {/* Middle Ring */}
        <div className="absolute w-48 h-48 rounded-full border border-champagne-gold/50 border-dashed animate-reverse-spin" />
        
        {/* Inner Wireframe Orb */}
        <div className="relative w-32 h-32 rounded-full border-2 border-metallic-gold/80 flex items-center justify-center bg-gradient-to-tr from-secondary-bg via-primary-bg to-metallic-gold/20 shadow-glow-gold">
          <div className="w-20 h-20 rounded-full border border-champagne-gold/60 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-champagne-gold shadow-glow-gold animate-ping" />
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Error Boundary to isolate WebGL context issues
// -------------------------------------------------------------
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('WebGL Rendering fallback activated:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// -------------------------------------------------------------
// Main ThreeHeroVisual Export
// -------------------------------------------------------------
export const ThreeHeroVisual: React.FC = () => {
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
      }
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div className="relative w-full h-[380px] md:h-[480px]">
        <LuxuryFallbackVisual />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[380px] md:h-[480px] flex items-center justify-center">
      <WebGLErrorBoundary fallback={<LuxuryFallbackVisual />}>
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 45 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
          className="cursor-grab active:cursor-grabbing"
        >
          {/* Dynamic Golden Lighting */}
          <ambientLight intensity={0.6} />
          <pointLight position={[6, 6, 6]} intensity={2.8} color="#F5D78E" />
          <pointLight position={[-6, -4, -3]} intensity={2.0} color="#D4AF37" />
          <pointLight position={[0, -5, 2]} intensity={1.0} color="#FFFFFF" />
          <directionalLight position={[0, 8, 4]} intensity={1.2} color="#FFFFFF" />

          {/* Interactive 3D Sphere */}
          <Suspense fallback={null}>
            <GoldenSecuritySphere />
          </Suspense>

          {/* User touch/mouse orbit interaction */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.5}
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 1.4}
            minPolarAngle={Math.PI / 3}
          />
        </Canvas>
      </WebGLErrorBoundary>

      {/* Subtle bottom glow reflection */}
      <div className="absolute -bottom-6 w-3/4 h-12 bg-metallic-gold/15 blur-3xl pointer-events-none rounded-full" />
    </div>
  );
};
