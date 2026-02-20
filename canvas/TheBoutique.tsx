
import React, { useRef } from 'react';
import { MeshReflectorMaterial, Text, Float, SpotLight, useDepthBuffer } from '@react-three/drei';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../store/useStore';
import { ClickableProduct } from './ClickableProduct';
import { MOCK_POSTERS } from '../services/mockData';

// --- Sub-components for Furniture ---

const CentralPodium = ({ scale = 1 }: { scale?: number }) => (
  <group position={[0, 0, 0]} scale={scale}>
    {/* Base levitation ring */}
    <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.5, 1.6, 64]} />
      <meshBasicMaterial color="#00ffff" toneMapped={false} opacity={0.5} transparent />
    </mesh>
    
    {/* Floating Blocks */}
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.2, 1.2]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.25, 0.05, 1.25]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
    </Float>
    
    {/* Light emanating from below */}
    <pointLight position={[0, 0.2, 0]} color="#00ffff" intensity={2} distance={3} />
  </group>
);

const SideRack = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => (
  <group position={position} rotation={rotation}>
    {/* Vertical Posts */}
    <mesh position={[-1, 1.5, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 3]} />
      <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
    </mesh>
    <mesh position={[1, 1.5, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 3]} />
      <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
    </mesh>
    
    {/* Horizontal Bar */}
    <mesh position={[0, 2.5, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.04, 0.04, 2.2]} />
      <meshStandardMaterial color="#eee" metalness={1} roughness={0.1} />
    </mesh>
    
    {/* Base glow */}
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
       <planeGeometry args={[2.5, 0.8]} />
       <meshBasicMaterial color="#ffffff" opacity={0.1} transparent />
    </mesh>
  </group>
);

const NeonStrip = ({ position, args, color = "#fff" }: any) => (
  <mesh position={position}>
    <boxGeometry args={args} />
    <meshBasicMaterial color={color} toneMapped={false} />
  </mesh>
);

export const TheBoutique: React.FC = () => {
  const products = useStore((state) => state.products);
  const depthBuffer = useDepthBuffer({ size: 256 });
  const { viewport } = useThree();

  // --- RESPONSIVE LOGIC ---
  // Threshold roughly separates mobile portrait from desktop
  const isMobile = viewport.width < 12;

  // Responsive Measurements - TIGHTER ON MOBILE
  // Previous wallX was 12 for mobile, bringing it to 8 to remove empty side space
  const wallX = isMobile ? 8 : 30; 
  // Previous rackX was 5, bringing to 4
  const rackX = isMobile ? 3.5 : 12;  
  // Previous backWallZ was -30 (huge tunnel). Bringing it WAY closer on mobile.
  const backWallZ = isMobile ? -14 : -30;
  
  const textSize = isMobile ? 2.5 : 6;
  const posterScale = isMobile ? 1.0 : 1.5;
  const podiumScale = isMobile ? 0.7 : 1;

  // Lighting adjustments based on room size
  const spotDistance = isMobile ? 15 : 20;

  return (
    <group>
      {/* --- ARCHITECTURE --- */}
      
      {/* Floor - Dark Polished Concrete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
         {/* Smaller plane on mobile to avoid rendering unnecessary geometry */}
         <planeGeometry args={[isMobile ? 30 : 100, isMobile ? 40 : 100]} /> 
         <MeshReflectorMaterial
            blur={[400, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={1.5}
            roughness={0.5}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#1a1a1a"
            metalness={0.6}
            mirror={0.7}
         />
      </mesh>

      {/* Ceiling Grid */}
      <group position={[0, 12, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#111" side={THREE.DoubleSide} />
        </mesh>
        <gridHelper args={[100, 50, 0xffffff, 0x222222]} rotation={[0, 0, 0]} position={[0, -0.1, 0]} />
      </group>

      {/* Back Wall */}
      <mesh position={[0, 10, backWallZ]} receiveShadow>
        <planeGeometry args={[wallX * 2.5, 24]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.5} />
      </mesh>

      {/* Side Walls */}
      <mesh position={[-wallX, 10, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[100, 24]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
      </mesh>
      <mesh position={[wallX, 10, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[100, 24]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
      </mesh>

      {/* --- FURNITURE --- */}
      <CentralPodium scale={podiumScale} />
      
      {/* Side Racks */}
      <SideRack position={[-rackX, 0, 0]} rotation={[0, 0.3, 0]} />
      <SideRack position={[rackX, 0, 0]} rotation={[0, -0.3, 0]} />

      {/* Corner Fillers (Mobile Only) - To remove emptiness if needed, but shrinking room is better. 
          Adding vertical Neon columns at corners to frame the view. */}
      {isMobile && (
        <>
            <NeonStrip position={[-wallX + 0.5, 6, backWallZ + 2]} args={[0.2, 12, 0.2]} color="#444" />
            <NeonStrip position={[wallX - 0.5, 6, backWallZ + 2]} args={[0.2, 12, 0.2]} color="#444" />
        </>
      )}

      {/* --- LIGHTING --- */}
      <ambientLight intensity={0.5} />
      
      {/* Spotlights highlighting products */}
      <SpotLight
        position={[0, 9, 2]}
        target-position={[0, 1, 0]}
        penumbra={0.5}
        radiusTop={0.4}
        radiusBottom={2}
        distance={spotDistance}
        angle={0.4}
        attenuation={5}
        anglePower={5}
        intensity={8}
        opacity={0.5}
        color="#ffffff"
        castShadow
        depthBuffer={depthBuffer}
      />

      <SpotLight
        position={[-rackX/2, 9, 2]}
        target-position={[-rackX, 1, 0]}
        penumbra={0.5}
        distance={spotDistance}
        angle={0.5}
        attenuation={5}
        anglePower={5}
        intensity={6}
        color="#aaaaff"
        castShadow
        depthBuffer={depthBuffer}
      />

      <SpotLight
        position={[rackX/2, 9, 2]}
        target-position={[rackX, 1, 0]}
        penumbra={0.5}
        distance={spotDistance}
        angle={0.5}
        attenuation={5}
        anglePower={5}
        intensity={6}
        color="#aaaaff"
        castShadow
        depthBuffer={depthBuffer}
      />

      {/* Fill Lights */}
      <pointLight position={[-10, 8, -5]} intensity={2} color="blue" distance={30} />
      <pointLight position={[10, 8, -5]} intensity={2} color="purple" distance={30} />

      {/* Neon Accents - Follow dimensions */}
      {/* Back Top Strip */}
      <NeonStrip position={[0, 12, backWallZ + 0.1]} args={[wallX * 2, 0.1, 0.1]} color="#00ffff" />
      
      {/* Side Vertical Strips */}
      <NeonStrip position={[-(wallX - 0.1), 6, 0]} args={[0.1, 12, 0.1]} color="#ff0055" />
      <NeonStrip position={[(wallX - 0.1), 6, 0]} args={[0.1, 12, 0.1]} color="#ff0055" />

      {/* Large Neon Sign Back */}
      <Text
        position={[0, 8, backWallZ + 0.2]}
        fontSize={textSize}
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#00ffff"
        fillOpacity={0}
      >
        GRANDSON
      </Text>
      <Text
        position={[0, 8, backWallZ + 0.15]}
        fontSize={textSize}
        anchorX="center"
        anchorY="middle"
        color="#00ffff"
        fillOpacity={0.1}
      >
        GRANDSON
      </Text>

      {/* --- CONTENT --- */}
      
      {/* Posters - Moved closer to center on mobile */}
      {MOCK_POSTERS.slice(0, 2).map((poster, i) => (
        <group key={poster.id} position={[i === 0 ? -(wallX/2.5) : (wallX/2.5), 4, backWallZ + 0.1]} scale={posterScale}>
           <mesh>
             <planeGeometry args={[3, 4.5]} />
             <meshStandardMaterial color="#444" emissive="#222" />
           </mesh>
           <mesh position={[0, 0, 0.05]}>
              <boxGeometry args={[2.8, 4.3, 0.05]} />
              <meshBasicMaterial color="#fff" />
           </mesh>
        </group>
      ))}

      {/* Products - Need to override positions based on new rack locations for this view */}
      {products.map((product, i) => {
         // Crude override logic for presentation in this specific room layout
         // In a real app, product positions might be calculated by shelf slots
         let pos: [number, number, number] = [product.position[0], product.position[1], product.position[2]];
         
         // If it's the hoodie (left)
         if (i === 0) pos = [-rackX, 0.8, 0];
         // If it's the pants (right)
         if (i === 2) pos = [rackX, 0.8, 0];
         // Cap (center) remains center
         
         return (
             <group key={product.id} position={pos}>
                <ClickableProduct product={{...product, position: [0,0,0]}} />
             </group>
         )
      })}
      
    </group>
  );
};
