import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

interface GisGlobeProps {
  interactivity?: number;
}

const cityLabels = [
  ['北京', 39.9, 116.4], ['上海', 31.2, 121.5], ['广州', 23.1, 113.3], ['深圳', 22.5, 114.1],
  ['成都', 30.7, 104.1], ['武汉', 30.6, 114.3], ['西安', 34.3, 108.9], ['杭州', 30.3, 120.2],
  ['重庆', 29.6, 106.5], ['南京', 32.1, 118.8], ['青岛', 36.1, 120.4], ['乌鲁木齐', 43.8, 87.6]
] as const;

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function GlobeMesh({ interactivity = 0.4 }: GisGlobeProps) {
  const group = useRef<THREE.Group>(null);
  const points = useMemo(() => {
    const vertices: number[] = [];
    for (let i = 0; i < 900; i += 1) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const radius = 2.04;
      vertices.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
    }
    return new Float32Array(vertices);
  }, []);

  const arcs = useMemo(() => {
    const pairs = [[0, 1], [1, 2], [2, 5], [4, 7], [6, 0], [8, 10], [11, 0], [3, 9]];
    return pairs.map(([from, to]) => {
      const start = latLngToVector3(cityLabels[from][1], cityLabels[from][2], 2.1);
      const end = latLngToVector3(cityLabels[to][1], cityLabels[to][2], 2.1);
      const mid = start.clone().add(end).multiplyScalar(0.55).normalize().multiplyScalar(2.85);
      return new THREE.CatmullRomCurve3([start, mid, end]);
    });
  }, []);

  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    group.current.rotation.y = clock.elapsedTime * 0.11 + pointer.x * 0.15 * interactivity;
    group.current.rotation.x = pointer.y * 0.12 * interactivity;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial color="#0f3656" transparent opacity={0.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.01, 32, 32]} />
        <meshBasicMaterial color="#18d6c8" wireframe transparent opacity={0.18} />
      </mesh>
      <mesh rotation={[Math.PI / 2.8, 0.2, 0]}>
        <torusGeometry args={[2.45, 0.006, 12, 160]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[Math.PI / 2.1, 0.8, 0.7]}>
        <torusGeometry args={[2.65, 0.005, 12, 160]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.42} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={points.length / 3} array={points} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#7dd3fc" size={0.018} transparent opacity={0.75} />
      </points>
      {cityLabels.map(([name, lat, lng]) => {
        const pos = latLngToVector3(lat, lng, 2.13);
        return (
          <group key={name} position={pos}>
            <mesh>
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshBasicMaterial color="#facc15" />
            </mesh>
            <Html distanceFactor={8} center>
              <span className="globe-city-label">{name}</span>
            </Html>
          </group>
        );
      })}
      {arcs.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 40, 0.009, 8, false]} />
          <meshBasicMaterial color={index % 2 ? '#22d3ee' : '#34d399'} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

export default function GisGlobe({ interactivity = 0.4 }: GisGlobeProps) {
  return (
    <div className="gis-globe-canvas">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#050b14']} />
        <ambientLight intensity={0.7} />
        <pointLight position={[4, 3, 5]} intensity={2.2} color="#38bdf8" />
        <Stars radius={60} depth={24} count={1000} factor={3} saturation={0} fade speed={0.4} />
        <GlobeMesh interactivity={interactivity} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.35} />
      </Canvas>
    </div>
  );
}