import {
  AimOutlined,
  ApartmentOutlined,
  BorderOuterOutlined,
  CameraOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  HeatMapOutlined,
  NodeIndexOutlined,
  RadarChartOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Html, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Button, Skeleton, Space, Switch, Tooltip, Typography } from 'antd';
import type { ReactNode } from 'react';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import staticPreview from '../../assets/architecture-static-preview.svg';

type LayerKey = 'terrain' | 'buildings' | 'pipelines' | 'points' | 'analysis';

interface LayerState {
  terrain: boolean;
  buildings: boolean;
  pipelines: boolean;
  points: boolean;
  analysis: boolean;
}

interface SceneProps {
  layers: LayerState;
  hotspotsVisible: boolean;
  paused: boolean;
  resetSignal: number;
  onPointerActivity: (active: boolean) => void;
}

const defaultLayers: LayerState = {
  terrain: true,
  buildings: true,
  pipelines: true,
  points: true,
  analysis: true
};

const layerMeta: Array<{ key: LayerKey; label: string; description: string }> = [
  { key: 'terrain', label: '地形', description: '底图、水体和道路基底' },
  { key: 'buildings', label: '建筑', description: '园区建筑体块与灯光' },
  { key: 'pipelines', label: '管线', description: '地下/业务联通管线' },
  { key: 'points', label: '业务点位', description: '客户业务热点位置' },
  { key: 'analysis', label: '空间分析结果', description: '缓冲区、覆盖和风险结果' }
];

const capabilityTags = [
  { icon: <ApartmentOutlined />, title: '数据接入', desc: '多源空间数据治理' },
  { icon: <RadarChartOutlined />, title: '空间分析', desc: '叠加、缓冲与研判' },
  { icon: <AimOutlined />, title: '三维展示', desc: '园区/CIM 场景预览' },
  { icon: <NodeIndexOutlined />, title: '业务系统集成', desc: '流程、权限与交付链路' }
];

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function ArchitectureSkeleton() {
  return (
    <div className="architecture-preview-skeleton">
      <Skeleton.Button active block className="architecture-preview-skeleton__canvas" />
    </div>
  );
}

function StaticFallback({ reason }: { reason: string }) {
  return (
    <div className="architecture-preview-fallback">
      <img src={staticPreview} alt="GIS 三维架构静态预览" />
      <div className="architecture-preview-fallback__content">
        <Typography.Text className="gis-section-kicker">STATIC PREVIEW</Typography.Text>
        <Typography.Title level={5}>三维架构静态预览</Typography.Title>
        <Typography.Paragraph>{reason}</Typography.Paragraph>
        <div className="architecture-capability-list is-fallback">
          {capabilityTags.map((item) => (
            <span key={item.title}>
              {item.icon}
              <strong>{item.title}</strong>
              <small>{item.desc}</small>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResettableCamera({ resetSignal }: { resetSignal: number }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(8.2, 6.4, 8.6);
    camera.lookAt(0, 0, 0);
  }, [camera, resetSignal]);

  return null;
}

function FadingGroup({ visible, children }: { visible: boolean; children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(visible ? 1 : 0);

  useFrame((_, delta) => {
    const target = visible ? 1 : 0;
    opacityRef.current = THREE.MathUtils.damp(opacityRef.current, target, 7, delta);
    const opacity = opacityRef.current;

    if (groupRef.current) {
      groupRef.current.visible = opacity > 0.015;
      groupRef.current.traverse((object) => {
        const mesh = object as THREE.Mesh;
        const material = mesh.material;
        if (!material) return;
        const materials = Array.isArray(material) ? material : [material];
        materials.forEach((item) => {
          if ('transparent' in item) item.transparent = true;
          if ('opacity' in item) item.opacity = opacity;
          if ('depthWrite' in item) item.depthWrite = opacity > 0.35;
        });
      });
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function CampusScene({ layers, hotspotsVisible, paused, resetSignal, onPointerActivity }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const analysisRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);

  const buildings = useMemo(() => [
    { position: [-2.8, 0.42, -1.2], scale: [0.78, 0.84, 0.86], color: '#0e7888' },
    { position: [-1.7, 0.9, -0.2], scale: [0.78, 1.8, 0.72], color: '#126f7a' },
    { position: [-0.6, 0.66, -1.15], scale: [0.94, 1.32, 0.84], color: '#167d64' },
    { position: [0.55, 1.05, -0.28], scale: [0.84, 2.1, 0.88], color: '#0d8a83' },
    { position: [1.65, 0.56, -1.42], scale: [1.1, 1.12, 0.72], color: '#115c64' },
    { position: [2.5, 0.82, -0.25], scale: [0.72, 1.64, 0.78], color: '#0891b2' },
    { position: [-2.35, 0.48, 1.06], scale: [1.12, 0.96, 0.7], color: '#125e69' },
    { position: [-0.9, 0.74, 1.2], scale: [0.86, 1.48, 0.82], color: '#0f766e' },
    { position: [0.9, 0.58, 1.35], scale: [1.18, 1.16, 0.72], color: '#0d6b78' },
    { position: [2.2, 0.46, 1.05], scale: [0.72, 0.92, 0.8], color: '#167d64' }
  ], []);

  const hotspots = useMemo(() => [
    { position: [-1.7, 2.08, -0.2], title: '城市更新指标', desc: '建筑密度与人口热力' },
    { position: [0.55, 2.32, -0.28], title: '空间分析结果', desc: '缓冲区与叠加分析' },
    { position: [2.5, 1.86, -0.25], title: '业务系统集成', desc: '审批与工单联动' }
  ], []);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    if (!paused && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.06;
    }
    if (analysisRef.current) {
      const pulse = 1 + Math.sin(elapsedRef.current * 1.8) * 0.035;
      analysisRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <>
      <ResettableCamera resetSignal={resetSignal} />
      <color attach="background" args={['#071319']} />
      <fog attach="fog" args={['#071319', 7, 18]} />
      <ambientLight intensity={0.76} />
      <directionalLight position={[2, 8, 4]} intensity={1.2} color="#dffdf4" />
      <pointLight position={[0, 3.5, 2.8]} intensity={1.1} color="#50d6b2" distance={8} />
      <pointLight position={[-3, 2.2, -2]} intensity={0.64} color="#0891b2" distance={7} />

      <group ref={groupRef} rotation={[0, -0.36, 0]}>
        <FadingGroup visible={layers.terrain}>
          <group>
            <mesh receiveShadow position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[8.2, 5.8, 42, 28]} />
              <meshStandardMaterial color="#0f2525" roughness={0.82} metalness={0.08} />
            </mesh>
            <gridHelper args={[8.2, 18, '#1f766d', '#123437']} position={[0, 0.002, 0]} />
            <mesh position={[1.68, 0.012, 1.84]} rotation={[-Math.PI / 2, 0, -0.28]}>
              <planeGeometry args={[4.8, 0.58]} />
              <meshStandardMaterial color="#0b5d72" emissive="#073b4a" emissiveIntensity={0.45} transparent opacity={0.74} />
            </mesh>
            {[-2.8, -1.42, 0, 1.42, 2.8].map((x) => (
              <mesh key={`road-x-${x}`} position={[x, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.08, 5.2]} />
                <meshStandardMaterial color="#2b4240" emissive="#173532" emissiveIntensity={0.18} />
              </mesh>
            ))}
            {[-1.85, -0.58, 0.74, 1.92].map((z) => (
              <mesh key={`road-z-${z}`} position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
                <planeGeometry args={[0.08, 7.4]} />
                <meshStandardMaterial color="#2b4240" emissive="#173532" emissiveIntensity={0.18} />
              </mesh>
            ))}
          </group>
        </FadingGroup>

        <FadingGroup visible={layers.buildings}>
          <group>
            {buildings.map((building, index) => (
              <group key={index} position={building.position as [number, number, number]}>
                <mesh castShadow receiveShadow scale={building.scale as [number, number, number]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color={building.color} roughness={0.38} metalness={0.46} emissive={building.color} emissiveIntensity={0.08} />
                </mesh>
                <mesh position={[0, Number(building.scale[1]) / 2 + 0.01, 0]} scale={[Number(building.scale[0]) * 1.03, 0.015, Number(building.scale[2]) * 1.03]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#50d6b2" emissive="#50d6b2" emissiveIntensity={0.62} transparent opacity={0.58} />
                </mesh>
              </group>
            ))}
          </group>
        </FadingGroup>

        <FadingGroup visible={layers.pipelines}>
          <group position={[0, 0.08, 0]}>
            <mesh position={[-0.6, 0, -2.18]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.026, 0.026, 5.2, 16]} />
              <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.72} />
            </mesh>
            <mesh position={[2.95, 0, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.024, 0.024, 4.2, 16]} />
              <meshStandardMaterial color="#50d6b2" emissive="#50d6b2" emissiveIntensity={0.58} />
            </mesh>
            <mesh position={[-2.95, 0, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.024, 0.024, 3.6, 16]} />
              <meshStandardMaterial color="#0891b2" emissive="#0891b2" emissiveIntensity={0.58} />
            </mesh>
          </group>
        </FadingGroup>

        <FadingGroup visible={layers.analysis}>
          <group ref={analysisRef}>
            <mesh position={[0.5, 0.06, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.16, 1.24, 64]} />
              <meshBasicMaterial color="#50d6b2" transparent opacity={0.48} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[-1.6, 0.065, 0.84]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.74, 64]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.16} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </FadingGroup>

        <FadingGroup visible={layers.points}>
          <group>
            {hotspots.map((hotspot, index) => (
              <group key={hotspot.title} position={hotspot.position as [number, number, number]}>
                <mesh>
                  <sphereGeometry args={[0.09, 24, 24]} />
                  <meshStandardMaterial color={index === 1 ? '#f59e0b' : '#50d6b2'} emissive={index === 1 ? '#f59e0b' : '#50d6b2'} emissiveIntensity={0.86} />
                </mesh>
                {hotspotsVisible && (
                  <Html center distanceFactor={7.6} position={[0, 0.26, 0]}>
                    <div className="architecture-hotspot-label">
                      <strong>{hotspot.title}</strong>
                      <span>{hotspot.desc}</span>
                    </div>
                  </Html>
                )}
              </group>
            ))}
          </group>
        </FadingGroup>
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={5.8}
        maxDistance={11.5}
        minPolarAngle={0.78}
        maxPolarAngle={1.28}
        onStart={() => onPointerActivity(true)}
        onEnd={() => onPointerActivity(false)}
      />
    </>
  );
}

export default function ProjectArchitecturePreview() {
  const [layers, setLayers] = useState<LayerState>(defaultLayers);
  const [webglReady, setWebglReady] = useState<boolean | null>(null);
  const [canvasFailed, setCanvasFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hotspotsVisible, setHotspotsVisible] = useState(true);
  const [layersVisible, setLayersVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setWebglReady(canUseWebGL());
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleLayer = (key: LayerKey, checked: boolean) => {
    setLayers((prev) => ({ ...prev, [key]: checked }));
  };

  const captureCanvas = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('画布尚未就绪');
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `geoagent-architecture-preview-${Date.now()}.png`;
      link.click();
    } catch (error) {
      window.alert((error as Error).message || '截图失败，请稍后重试');
    }
  };

  const toggleFullscreen = async () => {
    const element = containerRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await element.requestFullscreen();
  };

  if (webglReady === null) return <ArchitectureSkeleton />;
  if (!webglReady || canvasFailed) {
    return <StaticFallback reason={!webglReady ? '当前浏览器或设备未启用 WebGL，已切换为静态架构预览。' : '三维场景加载失败，已自动切换为静态架构预览。'} />;
  }

  return (
    <div className={`architecture-preview-shell${fullscreen ? ' is-fullscreen' : ''}`} ref={containerRef}>
      <div className="architecture-preview-head">
        <div>
          <strong>三维架构预览</strong>
          <span>园区模型 / 空间分析 / 业务热点</span>
        </div>
        <Typography.Text>R3F / Three.js 展示层，不写入 API</Typography.Text>
      </div>

      {layersVisible && (
        <aside className="architecture-layer-panel">
          <Typography.Text className="gis-section-kicker">LAYERS</Typography.Text>
          {layerMeta.map((layer) => (
            <label className="architecture-layer-item" key={layer.key}>
              <span>
                <strong>{layer.label}</strong>
                <small>{layer.description}</small>
              </span>
              <Switch size="small" checked={layers[layer.key]} onChange={(checked) => toggleLayer(layer.key, checked)} />
            </label>
          ))}
        </aside>
      )}

      <aside className="architecture-capability-panel">
        {capabilityTags.map((item) => (
          <span key={item.title}>
            {item.icon}
            <strong>{item.title}</strong>
            <small>{item.desc}</small>
          </span>
        ))}
      </aside>

      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ position: [8.2, 6.4, 8.6], fov: 42 }}
        gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
        }}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onError={() => setCanvasFailed(true)}
      >
        <Suspense fallback={null}>
          <CampusScene
            layers={layers}
            hotspotsVisible={hotspotsVisible}
            paused={paused}
            resetSignal={resetSignal}
            onPointerActivity={setPaused}
          />
        </Suspense>
      </Canvas>

      <div className="architecture-toolbar">
        <Space size={8} wrap>
          <Tooltip title="复位相机">
            <Button icon={<ReloadOutlined />} onClick={() => setResetSignal((value) => value + 1)} />
          </Tooltip>
          <Tooltip title="图层控制">
            <Button type={layersVisible ? 'primary' : 'default'} icon={<BorderOuterOutlined />} onClick={() => setLayersVisible((value) => !value)} />
          </Tooltip>
          <Tooltip title="热点标签">
            <Button type={hotspotsVisible ? 'primary' : 'default'} icon={<HeatMapOutlined />} onClick={() => setHotspotsVisible((value) => !value)} />
          </Tooltip>
          <Tooltip title="截图">
            <Button icon={<CameraOutlined />} onClick={captureCanvas} />
          </Tooltip>
          <Tooltip title={fullscreen ? '退出全屏' : '全屏'}>
            <Button icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={toggleFullscreen} />
          </Tooltip>
        </Space>
      </div>
    </div>
  );
}
