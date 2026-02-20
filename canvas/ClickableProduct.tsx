
import React, { useRef, useState, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useCursor, Text, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Product } from '../types';
import { useStore } from '../store/useStore';

interface ClickableProductProps {
  product: Product;
}

// --- MATERIALS CONSTANTS ---
const FABRIC_ROUGHNESS = 0.9; // Cloth is matte
const FABRIC_METALNESS = 0.1;

// --- REUSABLE COMPONENTS ---

// Hanger removed as per request. Clothes now float freely.

const HoodieModel = ({ color }: { color: string }) => (
  <group position={[0, 0, 0]}>
    {/* Main Body - Soft Box */}
    <RoundedBox args={[0.8, 1.1, 0.3]} radius={0.1} position={[0, 0, 0]} castShadow receiveShadow>
       <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} metalness={FABRIC_METALNESS} />
    </RoundedBox>

    {/* Sleeves - Hanging down slightly angled */}
    <group position={[-0.48, 0.35, 0]} rotation={[0, 0, 0.2]}>
       <RoundedBox args={[0.25, 1.0, 0.25]} radius={0.1} castShadow>
          <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} metalness={FABRIC_METALNESS} />
       </RoundedBox>
       {/* Cuffs */}
       <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.1, 16]} />
          <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
       </mesh>
    </group>

    <group position={[0.48, 0.35, 0]} rotation={[0, 0, -0.2]}>
       <RoundedBox args={[0.25, 1.0, 0.25]} radius={0.1} castShadow>
          <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} metalness={FABRIC_METALNESS} />
       </RoundedBox>
        {/* Cuffs */}
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.1, 16]} />
          <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
       </mesh>
    </group>

    {/* The Hood (Folded on back) */}
    <group position={[0, 0.45, -0.15]} rotation={[-0.3, 0, 0]}>
       <RoundedBox args={[0.6, 0.4, 0.25]} radius={0.1} castShadow>
         <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
       </RoundedBox>
    </group>

    {/* Kangaroo Pocket */}
    <group position={[0, -0.25, 0.16]}>
       <RoundedBox args={[0.5, 0.3, 0.05]} radius={0.02}>
          <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
       </RoundedBox>
    </group>

    {/* Drawstrings */}
    <mesh position={[-0.1, 0.3, 0.2]} rotation={[0.1, 0, 0]}>
       <cylinderGeometry args={[0.015, 0.015, 0.4]} />
       <meshStandardMaterial color="#ddd" />
    </mesh>
    <mesh position={[0.1, 0.3, 0.2]} rotation={[0.1, 0, 0]}>
       <cylinderGeometry args={[0.015, 0.015, 0.4]} />
       <meshStandardMaterial color="#ddd" />
    </mesh>

    {/* Logo / Graphic Area */}
    <mesh position={[0.2, 0.2, 0.16]}>
        <planeGeometry args={[0.15, 0.1]} />
        <meshBasicMaterial color="#ffaa00" />
    </mesh>
  </group>
);

const PantsModel = ({ color }: { color: string }) => (
  <group position={[0, 0, 0]}>
    
    {/* Waistband Area (Replaces folded hanger part) */}
    <group position={[0, 0.65, 0]}>
        <RoundedBox args={[0.55, 0.15, 0.35]} radius={0.05}>
             <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
        </RoundedBox>
    </group>

    {/* Main Leg Left */}
    <RoundedBox args={[0.26, 1.4, 0.15]} radius={0.06} position={[-0.15, -0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
    </RoundedBox>

    {/* Main Leg Right */}
    <RoundedBox args={[0.26, 1.4, 0.15]} radius={0.06} position={[0.15, -0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
    </RoundedBox>

    {/* Cargo Pockets - Bulky & Techwear style */}
    <RoundedBox args={[0.22, 0.3, 0.06]} radius={0.02} position={[-0.15, 0, 0.08]} castShadow>
        <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
    </RoundedBox>
    <RoundedBox args={[0.22, 0.3, 0.06]} radius={0.02} position={[0.15, -0.2, 0.08]} castShadow>
        <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
    </RoundedBox>

    {/* Straps / Ribbons (Techwear aesthetic) */}
    <mesh position={[0.28, -0.3, 0]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.05, 0.6, 0.01]} />
        <meshStandardMaterial color="#111" />
    </mesh>
  </group>
);

const CapModel = ({ color }: { color: string }) => (
  <group position={[0, 0, 0]} rotation={[0.2, -Math.PI/6, 0]}>
    {/* Crown (Main Dome) */}
    <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.3, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
    </mesh>

    {/* Visor (Curved box logic approximated) */}
    <group position={[0, 0, 0.28]} rotation={[0.3, 0, 0]}>
        <RoundedBox args={[0.4, 0.02, 0.35]} radius={0.01} castShadow>
            <meshStandardMaterial color={color} roughness={0.6} />
        </RoundedBox>
    </group>

    {/* Button Top */}
    <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.03]} />
        <meshStandardMaterial color={color} />
    </mesh>

    {/* Ventilation Eyelets */}
    {[0, 72, 144, 216, 288].map((deg, i) => (
       <mesh key={i} position={[
           Math.sin(deg * Math.PI / 180) * 0.25, 
           0.15, 
           Math.cos(deg * Math.PI / 180) * 0.25
       ]}>
           <sphereGeometry args={[0.015]} />
           <meshStandardMaterial color="#333" />
       </mesh>
    ))}

    {/* Display Stand REMOVED - Floating Cap */}
  </group>
);

const TShirtModel = ({ color }: { color: string }) => (
  <group position={[0, 0, 0]}>
    {/* Body */}
    <RoundedBox args={[0.7, 1.2, 0.2]} radius={0.05} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
    </RoundedBox>

    {/* Sleeves */}
    <group position={[-0.45, 0.4, 0]} rotation={[0, 0, 0.3]}>
        <RoundedBox args={[0.35, 0.4, 0.18]} radius={0.05} castShadow>
             <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
        </RoundedBox>
    </group>
    <group position={[0.45, 0.4, 0]} rotation={[0, 0, -0.3]}>
        <RoundedBox args={[0.35, 0.4, 0.18]} radius={0.05} castShadow>
             <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
        </RoundedBox>
    </group>

    {/* Collar / Neckline */}
    <mesh position={[0, 0.6, 0.05]}>
        <torusGeometry args={[0.12, 0.02, 16, 32, Math.PI]} />
        <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
    </mesh>

    {/* Small Chest Pocket */}
    <mesh position={[0.2, 0.2, 0.11]}>
        <planeGeometry args={[0.15, 0.18]} />
        <meshStandardMaterial color={color} roughness={FABRIC_ROUGHNESS} />
    </mesh>
    {/* Pocket shadow line */}
    <mesh position={[0.2, 0.29, 0.111]}>
        <boxGeometry args={[0.15, 0.005, 0.005]} />
        <meshBasicMaterial color="#000" opacity={0.3} transparent />
    </mesh>

  </group>
);

// --- MAIN COMPONENT ---

export const ClickableProduct: React.FC<ClickableProductProps> = ({ product }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);
  const setSelectedProduct = useStore((state) => state.setSelectedProduct);

  useCursor(hovered);

  useFrame((state) => {
    if (meshRef.current && hovered) {
      // Gentle spin on hover
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, Math.PI / 4, 0.05);
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, 1.1, 0.05));
    } else if (meshRef.current) {
      // Return to almost original rotation or slow drift
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.05);
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, 1, 0.05));
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelectedProduct(product);
  };

  // Determine which model to render based on name
  const Model = useMemo(() => {
    const name = product.name.toLowerCase();
    
    // Improved Color Logic
    let baseColor = '#555';
    if (name.includes('hoodie')) baseColor = '#1a1a1a'; // Dark streetwear hoodie
    if (name.includes('pant')) baseColor = '#2f3542'; // Dark Grey pants
    if (name.includes('cap')) baseColor = '#57606f'; 
    if (name.includes('tee') || name.includes('shirt')) baseColor = '#ffffff'; // Classic white tee default

    // Override if provided in product data (simplified mapping for now)
    if (product.colors && product.colors.length > 0) {
        const firstColor = product.colors[0].toLowerCase();
        if (firstColor === 'black') baseColor = '#1e1e1e';
        if (firstColor === 'navy') baseColor = '#001133';
        if (firstColor === 'beige') baseColor = '#d2b48c';
        if (firstColor === 'olive') baseColor = '#556b2f';
        if (firstColor === 'grey') baseColor = '#7f8fa6';
    }

    const finalColor = hovered ? new THREE.Color(baseColor).clone().offsetHSL(0, 0, 0.1).getStyle() : baseColor;

    if (name.includes('hoodie')) return <HoodieModel color={finalColor} />;
    if (name.includes('pant')) return <PantsModel color={finalColor} />;
    if (name.includes('cap')) return <CapModel color={finalColor} />;
    
    return <TShirtModel color={finalColor} />;
  }, [product.name, product.colors, hovered]);

  return (
    <group
      ref={meshRef}
      position={product.position}
      onClick={handleClick}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2} floatingRange={[-0.05, 0.05]}>
        {Model}

        {/* Highlight Ring when hovered - More subtle now */}
        {hovered && (
          <mesh position={[0, -1.0, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[0.5, 0.55, 64]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
          </mesh>
        )}
      </Float>

      {/* Floating Price Tag */}
      <group position={[0.6, 1, 0]} visible={hovered}>
         <Float speed={5} rotationIntensity={0.2} floatIntensity={0.5}>
            <mesh position={[0, 0, 0]}>
                 <planeGeometry args={[0.9, 0.3]} />
                 <meshBasicMaterial color="black" transparent opacity={0.9} />
             </mesh>
             <mesh position={[0, 0, -0.01]}>
                 <planeGeometry args={[0.94, 0.34]} />
                 <meshBasicMaterial color="white" />
             </mesh>
            <Text
              position={[0, 0, 0.01]}
              fontSize={0.08}
              color="white"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {product.price.toLocaleString('fr-GN')} GNF
            </Text>
         </Float>
         {/* Line connecting tag to product */}
         <mesh position={[-0.3, -0.2, 0]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.005, 0.005, 0.6]} />
            <meshBasicMaterial color="white" opacity={0.5} transparent />
         </mesh>
      </group>
    </group>
  );
};
