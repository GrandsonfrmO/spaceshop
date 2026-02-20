
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Stars, Float, Text, Instance, Instances, Sparkles, Trail, Ring, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

// --- NEW: WARSHIP TRIGGER ---

const WarshipTrigger = () => {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);
  const startGame = useStore(state => state.startGame);
  
  useCursor(hovered);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = -1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      if (hovered) {
          ref.current.rotation.y += 0.02;
      }
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      startGame();
  };

  return (
    <group 
        ref={ref} 
        position={[8, -1.5, 6]} 
        rotation={[0, -Math.PI / 4, 0]}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        onClick={handleClick}
    >
        {/* Aggressive Fighter Shape */}
        <mesh position={[0, 0.5, 0]}>
            <coneGeometry args={[0.8, 3, 4]} />
            <meshStandardMaterial color={hovered ? "#ff0000" : "#330000"} emissive="#ff0000" emissiveIntensity={hovered ? 0.5 : 0.1} />
        </mesh>
        
        {/* Wings */}
        <mesh position={[0, 0.5, 0.5]} rotation={[-0.5, 0, 0]}>
            <boxGeometry args={[3, 0.1, 1.5]} />
            <meshStandardMaterial color="#111" />
        </mesh>

        {/* Label */}
        <group position={[0, 2.5, 0]} visible={hovered}>
            <Text 
                fontSize={0.4} 
                color="red"
                anchorX="center" 
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="black"
            >
                START MISSION
            </Text>
        </group>

        {/* Landing Pad Glow */}
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[2, 2.2, 32]} />
            <meshBasicMaterial color="red" transparent opacity={0.5} />
        </mesh>
    </group>
  );
};

// --- NEW: MASSIVE SPACE TRAFFIC ---

const HeavyFreighter = () => {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (ref.current) {
      // Moves slowly from left to right in the background
      ref.current.position.x += delta * 5;
      // Hover effect
      ref.current.position.y += Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      
      // Loop
      if (ref.current.position.x > 200) {
        ref.current.position.x = -200;
        // Randomize depth slightly on respawn
        ref.current.position.z = -80 + (Math.random() * 20); 
      }
    }
  });

  return (
    <group ref={ref} position={[-150, 10, -90]} rotation={[0, Math.PI / 2, 0]} scale={3}>
      {/* Main Hull */}
      <mesh>
        <boxGeometry args={[4, 4, 12]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.8} />
      </mesh>
      {/* Cargo Containers */}
      <mesh position={[0, 0, 0]}>
         <boxGeometry args={[5, 3, 10]} />
         <meshStandardMaterial color="#8B4513" roughness={0.9} /> {/* Rusty Orange */}
      </mesh>
      <mesh position={[0, 3.5, 0]}>
         <boxGeometry args={[3, 2, 8]} />
         <meshStandardMaterial color="#556b2f" roughness={0.9} /> {/* Olive Green */}
      </mesh>
      {/* Bridge */}
      <mesh position={[0, 4, -4]}>
         <boxGeometry args={[2, 1.5, 2]} />
         <meshStandardMaterial color="#555" />
      </mesh>
      {/* Engines */}
      <group position={[0, 0, 6]}>
         <mesh rotation={[Math.PI/2, 0, 0]} position={[1.5, 0, 0]}>
            <cylinderGeometry args={[1, 1.2, 2]} />
            <meshStandardMaterial color="#222" />
         </mesh>
         <mesh rotation={[Math.PI/2, 0, 0]} position={[-1.5, 0, 0]}>
            <cylinderGeometry args={[1, 1.2, 2]} />
            <meshStandardMaterial color="#222" />
         </mesh>
         {/* Engine Glow */}
         <pointLight position={[0, 0, 2]} color="orange" distance={20} intensity={5} />
      </group>
      {/* Side Lights */}
      <mesh position={[2.6, 0, -5]}>
         <sphereGeometry args={[0.2]} />
         <meshBasicMaterial color="red" />
      </mesh>
       <mesh position={[-2.6, 0, -5]}>
         <sphereGeometry args={[0.2]} />
         <meshBasicMaterial color="green" />
      </mesh>
    </group>
  );
};

const FastScout = () => {
    const ref = useRef<THREE.Group>(null);
    
    useFrame((state, delta) => {
        if(ref.current) {
            // Moves fast across the screen, sometimes in front of camera
            ref.current.position.x -= delta * 30; // Fast!
            ref.current.rotation.z = -Math.PI / 8; // Banked turn

            if(ref.current.position.x < -150) {
                ref.current.position.x = 150;
                // Switch between foreground (passing camera) and mid-ground
                const isForeground = Math.random() > 0.6;
                ref.current.position.z = isForeground ? 12 : -40; 
                ref.current.position.y = isForeground ? (Math.random() * 10) : (20 + Math.random() * 10);
            }
        }
    });

    return (
        <group ref={ref} position={[150, 10, 12]} scale={1.5}>
            {/* Sleek Body */}
            <mesh rotation={[0, 0, -Math.PI/2]}>
                <coneGeometry args={[0.5, 4, 16]} />
                <meshStandardMaterial color="#silver" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Wings */}
            <mesh position={[0, 0, 0]} rotation={[0.5, 0, 0]}>
                <boxGeometry args={[2, 0.1, 1]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Engine Trail */}
            <mesh position={[2, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.2, 0.1, 0.5]} />
                <meshBasicMaterial color="cyan" />
            </mesh>
            <Trail width={2} length={8} color="cyan" attenuation={(t) => t * t}>
                <mesh visible={false} />
            </Trail>
        </group>
    );
}

// --- STAR WARS ASSETS (Low Poly Procedural) ---

const LaserBolt = ({ position, color, direction }: { position: [number, number, number], color: string, direction: [number, number, number] }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.position.x += direction[0] * delta * 120; // Faster lasers
      ref.current.position.y += direction[1] * delta * 120;
      ref.current.position.z += direction[2] * delta * 120;
    }
  });
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 4]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
};

const XWing = () => (
  <group scale={0.8}>
    {/* Fuselage */}
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.4, 0.4, 3]} />
      <meshStandardMaterial color="#e0e0e0" roughness={0.3} />
    </mesh>
    {/* Cockpit */}
    <mesh position={[0, 0.2, -0.5]}>
      <boxGeometry args={[0.3, 0.2, 0.8]} />
      <meshStandardMaterial color="#111" />
    </mesh>
    {/* Wings */}
    <group>
        <mesh position={[1, 0.5, 0.5]} rotation={[0, 0, 0.5]}>
           <boxGeometry args={[2, 0.1, 0.8]} />
           <meshStandardMaterial color="#e0e0e0" />
        </mesh>
        <mesh position={[-1, 0.5, 0.5]} rotation={[0, 0, -0.5]}>
           <boxGeometry args={[2, 0.1, 0.8]} />
           <meshStandardMaterial color="#e0e0e0" />
        </mesh>
        <mesh position={[1, -0.5, 0.5]} rotation={[0, 0, -0.5]}>
           <boxGeometry args={[2, 0.1, 0.8]} />
           <meshStandardMaterial color="#e0e0e0" />
        </mesh>
        <mesh position={[-1, -0.5, 0.5]} rotation={[0, 0, 0.5]}>
           <boxGeometry args={[2, 0.1, 0.8]} />
           <meshStandardMaterial color="#e0e0e0" />
        </mesh>
        {/* Engines */}
        <mesh position={[0.8, 0.4, 1]}><cylinderGeometry args={[0.15, 0.15, 0.5]} /><meshBasicMaterial color="orange" /></mesh>
        <mesh position={[-0.8, 0.4, 1]}><cylinderGeometry args={[0.15, 0.15, 0.5]} /><meshBasicMaterial color="orange" /></mesh>
        <mesh position={[0.8, -0.4, 1]}><cylinderGeometry args={[0.15, 0.15, 0.5]} /><meshBasicMaterial color="orange" /></mesh>
        <mesh position={[-0.8, -0.4, 1]}><cylinderGeometry args={[0.15, 0.15, 0.5]} /><meshBasicMaterial color="orange" /></mesh>
    </group>
  </group>
);

const TieFighter = () => (
  <group scale={0.8}>
    {/* Cockpit */}
    <mesh>
      <sphereGeometry args={[0.4]} />
      <meshStandardMaterial color="#888" />
    </mesh>
    <mesh position={[0, 0, 0.35]}>
       <circleGeometry args={[0.25, 8]} />
       <meshBasicMaterial color="#111" />
    </mesh>
    {/* Wings Connectors */}
    <mesh rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.1, 0.1, 2]} />
        <meshStandardMaterial color="#555" />
    </mesh>
    {/* Solar Panels */}
    <mesh position={[1, 0, 0]}>
        <boxGeometry args={[0.1, 2.2, 2.6]} />
        <meshStandardMaterial color="#111" />
    </mesh>
    <mesh position={[1, 0, 0]}>
        <boxGeometry args={[0.12, 2.2, 2.6]} />
        <meshBasicMaterial color="#333" wireframe />
    </mesh>
     <mesh position={[-1, 0, 0]}>
        <boxGeometry args={[0.1, 2.2, 2.6]} />
        <meshStandardMaterial color="#111" />
    </mesh>
     <mesh position={[-1, 0, 0]}>
        <boxGeometry args={[0.12, 2.2, 2.6]} />
        <meshBasicMaterial color="#333" wireframe />
    </mesh>
  </group>
);

const DogfightScene = ({ offset = [0,0,0], speed = 1, radius = 30 }: { offset?: [number,number,number], speed?: number, radius?: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [lasers, setLasers] = useState<any[]>([]);

  useFrame((state) => {
    if (groupRef.current) {
        // Chase animation
        const t = state.clock.getElapsedTime() * 0.5 * speed;
        groupRef.current.rotation.y = t;
        groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.3;
        groupRef.current.rotation.x = Math.cos(t * 0.3) * 0.2;
    }

    // Spawn lasers randomly
    if (Math.random() < 0.08) {
        const isTieShooting = Math.random() > 0.4; // TIE shoot more often
        const color = isTieShooting ? "#00ff00" : "#ff0000";
        const id = Math.random();
        
        // Direction vector approximation based on rotation
        const angle = groupRef.current?.rotation.y || 0;
        
        // Basic trig to find where the ships are on the circle
        const currentX = Math.sin(angle) * radius + offset[0];
        const currentZ = Math.cos(angle) * radius + offset[2];
        const currentY = 20 + offset[1];

        // Shoot roughly tangent to the circle (forward)
        const dirX = Math.cos(angle);
        const dirZ = -Math.sin(angle);

        // Add some randomness to position
        const spawnPos: [number, number, number] = [
            currentX + (Math.random() - 0.5) * 4,
            currentY + (Math.random() - 0.5) * 4, 
            currentZ + (Math.random() - 0.5) * 4
        ];

        setLasers(prev => [...prev.slice(-15), { id, pos: spawnPos, color, dir: [dirX, (Math.random()-0.5)*0.2, dirZ] }]);
    }
  });

  return (
    <group position={[offset[0], offset[1], offset[2]]}>
        <group ref={groupRef}>
            {/* TIE Fighter Chaser */}
            <group position={[radius, 0, 0]} rotation={[0, Math.PI, 0]}>
                <TieFighter />
                <Trail width={0.5} length={2} color="green" attenuation={(t) => t * t}>
                    <mesh visible={false} />
                </Trail>
            </group>
            {/* TIE Fighter Wingman */}
            <group position={[radius + 2, 2, -2]} rotation={[0, Math.PI, 0]}>
                <TieFighter />
            </group>

             {/* X-Wing Target */}
            <group position={[radius, 0, 10]} rotation={[0, Math.PI, 0.2]}>
                <XWing />
                 <Trail width={0.8} length={5} color="orange" attenuation={(t) => t * t}>
                    <mesh visible={false} />
                </Trail>
            </group>
        </group>

        {lasers.map(l => (
            <LaserBolt key={l.id} position={l.pos} color={l.color} direction={l.dir} />
        ))}
    </group>
  );
};

// --- RICK AND MORTY ASSETS ---

const RickPortal = ({ position }: { position: [number, number, number] }) => {
    const portalRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (portalRef.current) {
            portalRef.current.rotation.z -= 0.05;
            // Pulsing scale
            const s = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.05;
            portalRef.current.scale.set(s, s, 1);
        }
    });

    return (
        <group position={position} rotation={[0, -0.5, 0]}>
            <group ref={portalRef}>
                {/* Fluid swirls simulated by multiple rings */}
                <Ring args={[0, 4, 32]} position={[0,0,0]}>
                    <meshBasicMaterial color="#00ff00" side={THREE.DoubleSide} transparent opacity={0.6} toneMapped={false} />
                </Ring>
                <Ring args={[3, 4, 32]} position={[0,0,0.01]}>
                     <meshBasicMaterial color="#adff2f" side={THREE.DoubleSide} transparent opacity={0.8} toneMapped={false} />
                </Ring>
                <Ring args={[1, 3.5, 32]} position={[0,0,-0.01]} rotation={[0,0,1]}>
                     <meshBasicMaterial color="#32cd32" side={THREE.DoubleSide} transparent opacity={0.5} toneMapped={false} />
                </Ring>
                <Sparkles color="#adff2f" count={50} scale={6} size={10} speed={2} />
            </group>
            <pointLight color="#00ff00" intensity={5} distance={20} />
        </group>
    );
};

const FloatingMorty = ({ position }: { position: [number, number, number] }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if(ref.current) {
            // Tumbling in space
            ref.current.rotation.x += 0.01;
            ref.current.rotation.y += 0.02;
            ref.current.position.y += Math.sin(state.clock.elapsedTime) * 0.005;
        }
    });

    return (
        <group ref={ref} position={position} scale={0.8}>
            {/* Head */}
            <mesh position={[0, 1.2, 0]}>
                <sphereGeometry args={[0.35, 16, 16]} />
                <meshStandardMaterial color="#ffccaa" /> {/* Skin */}
            </mesh>
            {/* Hair (Brown fuzz) */}
            <mesh position={[0, 1.45, -0.1]}>
                <sphereGeometry args={[0.36, 16, 16]} />
                <meshStandardMaterial color="#654321" />
            </mesh>
            {/* Yellow Shirt */}
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.25, 0.3, 0.8]} />
                <meshStandardMaterial color="#ffff00" />
            </mesh>
            {/* Blue Pants */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.28, 0.6]} />
                <meshStandardMaterial color="#0000ff" />
            </mesh>
             {/* Arms Flailing */}
             <mesh position={[0.4, 0.7, 0]} rotation={[0, 0, -2]}>
                <capsuleGeometry args={[0.08, 0.6]} />
                <meshStandardMaterial color="#ffccaa" />
            </mesh>
             <mesh position={[-0.4, 0.7, 0]} rotation={[0, 0, 2]}>
                <capsuleGeometry args={[0.08, 0.6]} />
                <meshStandardMaterial color="#ffccaa" />
            </mesh>
            {/* Legs */}
            <mesh position={[0.15, -0.5, 0]}>
                <capsuleGeometry args={[0.1, 0.6]} />
                <meshStandardMaterial color="#0000ff" />
            </mesh>
             <mesh position={[-0.15, -0.5, 0]}>
                <capsuleGeometry args={[0.1, 0.6]} />
                <meshStandardMaterial color="#0000ff" />
            </mesh>
        </group>
    );
};

const RickShip = () => {
    const ref = useRef<THREE.Group>(null);
    
    useFrame((state) => {
        if(ref.current) {
            const t = state.clock.elapsedTime;
            // Drunk driving animation
            ref.current.position.y = 15 + Math.sin(t * 2) * 2;
            ref.current.position.x = -25 + Math.cos(t * 0.5) * 5;
            ref.current.rotation.z = Math.sin(t * 1.5) * 0.2; // Wobble
            ref.current.rotation.x = Math.sin(t * 0.8) * 0.1;
        }
    });

    return (
        <group ref={ref} position={[-25, 15, -40]} scale={2}>
            {/* Main Hull - Trashcan Saucer */}
            <mesh>
                <cylinderGeometry args={[2, 1.5, 1, 32]} />
                <meshStandardMaterial color="#a0a0a0" roughness={0.4} metalness={0.6} />
            </mesh>
            <mesh position={[0, -0.2, 0]}>
                <torusGeometry args={[2, 0.3, 16, 100]} />
                <meshStandardMaterial color="#808080" />
            </mesh>
            {/* Glass Dome */}
            <mesh position={[0, 0.5, 0]}>
                <sphereGeometry args={[1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI/2]} />
                <meshPhysicalMaterial 
                    color="#aaddff" 
                    transparent 
                    opacity={0.4} 
                    roughness={0} 
                    transmission={0.8} 
                    thickness={0.5} 
                />
            </mesh>
            {/* Thrusters */}
            <group position={[0, -0.2, 1.8]} rotation={[1.5, 0, 0]}>
                 <mesh>
                    <cylinderGeometry args={[0.3, 0.5, 1]} />
                    <meshStandardMaterial color="#444" />
                 </mesh>
                 <pointLight color="#00ffff" distance={5} intensity={3} position={[0, -0.6, 0]} />
            </group>
            <group position={[-1.2, -0.2, 1.5]} rotation={[1.5, 0, -0.5]}>
                 <mesh>
                    <cylinderGeometry args={[0.2, 0.4, 0.8]} />
                    <meshStandardMaterial color="#444" />
                 </mesh>
            </group>
             <group position={[1.2, -0.2, 1.5]} rotation={[1.5, 0, 0.5]}>
                 <mesh>
                    <cylinderGeometry args={[0.2, 0.4, 0.8]} />
                    <meshStandardMaterial color="#444" />
                 </mesh>
            </group>
            {/* Headlights */}
            <pointLight position={[0.8, 0, -2]} color="white" distance={10} intensity={2} />
            <pointLight position={[-0.8, 0, -2]} color="white" distance={10} intensity={2} />
        </group>
    );
};

const StarDestroyer = () => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if(ref.current) {
            // Very slow majestic flyby
            ref.current.position.z += delta * 2;
            if(ref.current.position.z > 200) ref.current.position.z = -400;
        }
    });

    return (
        <group ref={ref} position={[-50, 60, -300]} scale={25} rotation={[0.1, 0.2, 0.05]}>
            {/* Main Hull - Wedge */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[1, 3, 4]} />
                <meshStandardMaterial color="#888" roughness={0.4} metalness={0.6} />
            </mesh>
            {/* Command Bridge */}
            <mesh position={[0, 0.3, -0.8]}>
                <boxGeometry args={[0.6, 0.4, 0.4]} />
                <meshStandardMaterial color="#777" />
            </mesh>
            {/* Shield Generators */}
             <mesh position={[0.2, 0.6, -0.8]}>
                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial color="#999" />
            </mesh>
            <mesh position={[-0.2, 0.6, -0.8]}>
                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial color="#999" />
            </mesh>
            {/* Engine Glow */}
            <pointLight position={[0, 0, 1.5]} color="#00aaff" intensity={2} distance={5} />
            <mesh position={[0, 0, 1.5]}>
                <sphereGeometry args={[0.2]} />
                <meshBasicMaterial color="#00aaff" />
            </mesh>
        </group>
    );
};

const TheSun = () => (
    <group position={[100, 40, -100]}>
        <mesh>
            <sphereGeometry args={[12, 64, 64]} />
            <meshBasicMaterial color="#ffaa00" toneMapped={false} />
        </mesh>
        {/* Glow Halo */}
        <mesh scale={1.2}>
            <sphereGeometry args={[12, 32, 32]} />
            <meshBasicMaterial color="#ff5500" transparent opacity={0.3} side={THREE.BackSide} />
        </mesh>
        {/* Main Light Source for the Scene */}
        <pointLight intensity={3} distance={500} decay={1} color="#ffaa00" />
        <directionalLight intensity={1.5} color="#ffd700" castShadow />
    </group>
);


// --- ENVIRONMENT & SURFACE ---

const Satellite = ({ radius, speed, offset = 0, rotationSpeed = 1 }: { radius: number, speed: number, offset?: number, rotationSpeed?: number }) => {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime() * speed + offset;
      ref.current.position.x = Math.sin(t) * radius;
      ref.current.position.z = Math.cos(t) * radius;
      ref.current.position.y = Math.sin(t * 2) * 2;
      ref.current.lookAt(0, 0, 0);
      ref.current.rotateZ(state.clock.getElapsedTime() * rotationSpeed * 0.5);
    }
  });

  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="gold" metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[1.5, 0, 0]}>
        <boxGeometry args={[2, 0.1, 1]} />
        <meshStandardMaterial color="#001133" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry args={[2, 0.1, 1]} />
        <meshStandardMaterial color="#001133" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

const DetailedAstronaut = ({ position, rotation, scale = 1 }: { position: [number, number, number], rotation?: [number, number, number], scale?: number }) => {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
        group.current.rotation.z = (rotation?.[2] || 0) + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        group.current.rotation.y = (rotation?.[1] || 0) + Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={group} position={position} rotation={rotation} scale={scale}>
        <mesh position={[0, 0.5, -0.4]}>
            <boxGeometry args={[0.6, 0.8, 0.3]} />
            <meshStandardMaterial color="#ddd" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
            <capsuleGeometry args={[0.3, 0.6, 4, 8]} />
            <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.35, 32, 32]} />
            <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[0, 1, 0.22]}>
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.1} />
        </mesh>
        <mesh position={[-0.4, 0.5, 0]} rotation={[0, 0, 0.5]}>
            <capsuleGeometry args={[0.1, 0.5]} />
            <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[0.4, 0.6, 0.2]} rotation={[0.5, 0, -0.5]}>
            <capsuleGeometry args={[0.1, 0.5]} />
            <meshStandardMaterial color="#fff" />
        </mesh>
      </group>
    </Float>
  );
};

const CyberTrees = () => {
  const count = 30;
  const planetCenter = new THREE.Vector3(0, -22, 0);
  const planetRadius = 20;

  const treeData = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
        const theta = (Math.random() - 0.5) * 1.5;
        const phi = (Math.random() - 0.5) * 1.5;
        const x = Math.sin(theta) * planetRadius;
        const z = Math.sin(phi) * planetRadius;
        const y = planetCenter.y + Math.sqrt(Math.pow(planetRadius, 2) - Math.pow(x, 2) - Math.pow(z, 2));
        if (Math.abs(x) < 4 && Math.abs(z) < 4) continue;
        temp.push({ position: new THREE.Vector3(x, y, z), scale: 0.5 + Math.random() * 0.8 });
    }
    return temp;
  }, []);

  return (
    <group>
      {treeData.map((data, i) => {
        const up = new THREE.Vector3(0, 1, 0);
        const normal = new THREE.Vector3().subVectors(data.position, planetCenter).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);

        return (
            <group key={i} position={data.position} quaternion={quaternion} scale={data.scale}>
                <mesh position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[0.1, 0.2, 1, 6]} />
                    <meshStandardMaterial color="#444" roughness={0.9} />
                </mesh>
                <mesh position={[0, 1.2, 0]}>
                    <coneGeometry args={[0.8, 1.5, 7]} />
                    <meshStandardMaterial color="#00ffcc" roughness={0.4} emissive="#004433" emissiveIntensity={0.2} />
                </mesh>
                <mesh position={[0, 1.8, 0]}>
                    <coneGeometry args={[0.6, 1.2, 7]} />
                    <meshStandardMaterial color="#00ffcc" roughness={0.4} emissive="#004433" emissiveIntensity={0.2} />
                </mesh>
            </group>
        );
      })}
    </group>
  );
};

const ParkedSpaceship = () => {
    const position = [7, -1.9, 3] as [number, number, number];
    const planetCenter = new THREE.Vector3(0, -22, 0);
    const posVec = new THREE.Vector3(...position);
    const normal = new THREE.Vector3().subVectors(posVec, planetCenter).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);

    return (
        <group position={position} quaternion={quaternion}>
             <group rotation={[0, -Math.PI / 4, 0]}>
                <mesh position={[1, 0.5, 1]} rotation={[0, 0, -0.5]}>
                    <cylinderGeometry args={[0.1, 0.1, 1.5]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[-1, 0.5, 1]} rotation={[0, 0, 0.5]}>
                    <cylinderGeometry args={[0.1, 0.1, 1.5]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[0, 0.5, -1.2]} rotation={[0.5, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 1.5]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[0, 1.5, 0]}>
                    <capsuleGeometry args={[1, 3, 4, 16]} />
                    <meshStandardMaterial color="#eee" metalness={0.6} roughness={0.2} />
                </mesh>
                <mesh position={[0, 2.2, 0.8]}>
                     <sphereGeometry args={[0.4]} />
                     <meshStandardMaterial color="#111" />
                </mesh>
                <pointLight position={[0, 0.5, 0]} color="cyan" distance={3} intensity={2} />
             </group>
        </group>
    );
};

const NeighborPlanets = () => (
  <group>
    {/* Planet 1: Purple Gas Giant */}
    <group position={[-45, 15, -60]}>
      <mesh receiveShadow>
        <sphereGeometry args={[12, 32, 32]} />
        <meshStandardMaterial color="#8a2be2" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[18, 2, 2, 64]} />
        <meshStandardMaterial color="#d8bfd8" opacity={0.4} transparent />
      </mesh>
      <Satellite radius={22} speed={0.5} />
    </group>

    {/* Planet 2: Icy Blue */}
    <mesh position={[50, 5, -50]} receiveShadow>
      <sphereGeometry args={[8, 32, 32]} />
      <meshStandardMaterial color="#00ffff" roughness={0.5} metalness={0.8} />
    </mesh>

    {/* Planet 3: Orange Desert */}
    <group position={[10, 45, -70]}>
        <mesh receiveShadow>
            <sphereGeometry args={[15, 32, 32]} />
            <meshStandardMaterial color="#ff8c00" roughness={0.9} />
        </mesh>
    </group>

    {/* New Planet 4: Red Volcanic (Mustafar style) */}
    <group position={[-80, -20, -100]}>
        <mesh receiveShadow>
            <sphereGeometry args={[20, 32, 32]} />
            <meshStandardMaterial color="#880000" roughness={0.8} emissive="#330000" />
        </mesh>
        <pointLight intensity={1} color="red" distance={50} />
    </group>

    {/* New Planet 5: Green Forest Moon */}
    <group position={[90, -10, -80]}>
         <mesh receiveShadow>
            <sphereGeometry args={[10, 32, 32]} />
            <meshStandardMaterial color="#228822" roughness={0.8} />
        </mesh>
    </group>
  </group>
);

const AsteroidField = ({ count = 40 }) => {
  const data = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      position: [
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 60 - 20,
      ] as [number, number, number],
      scale: 0.5 + Math.random() * 1.5,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
    }));
  }, [count]);

  return (
    <Instances range={count}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#888" roughness={0.8} />
      {data.map((props, i) => (
        <group key={i} position={props.position} scale={props.scale} rotation={props.rotation}>
            <Instance />
        </group>
      ))}
    </Instances>
  );
};

// --- Minimalist Bright Boutique ---

const SimpleStore = ({ hovered }: { hovered: boolean }) => {
  return (
    <group>
      <pointLight position={[0, 4, 4]} intensity={2} distance={15} decay={2} color="#ffffff" />
      <pointLight position={[0, 4, -4]} intensity={1} distance={15} decay={2} color="#ffffff" />
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[4, 3.5, 0.5, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 2.5, 3]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.2, 1.51]}>
        <planeGeometry args={[4.5, 2]} />
        <meshPhysicalMaterial 
          color={hovered ? "#aaddff" : "#eef"}
          roughness={0}
          transmission={0.6}
          thickness={1}
          metalness={0.2}
        />
      </mesh>
      <group position={[0, 0.5, 1.52]}>
         <mesh position={[0, 0, 0]}>
           <boxGeometry args={[1.2, 2.2, 0.1]} />
           <meshStandardMaterial color="#333" />
         </mesh>
         <mesh position={[0, 0, 0.01]}>
           <planeGeometry args={[1, 2]} />
           <meshBasicMaterial color={hovered ? "#ffffaa" : "#ffffff"} />
         </mesh>
      </group>
      <mesh position={[0, 2.5, 0]}>
         <boxGeometry args={[5.2, 0.2, 3.2]} />
         <meshStandardMaterial color="#333" />
      </mesh>
      <group position={[0, 3.2, 0]}>
         <Text
            fontSize={0.6}
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000"
         >
            GRANDSON
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
         </Text>
         <Text
             position={[0, -0.5, 0]}
             fontSize={0.2}
             font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
             anchorX="center"
             anchorY="middle"
             letterSpacing={0.2}
         >
             STORE
             <meshBasicMaterial color="#aaaaaa" />
         </Text>
      </group>
      <group position={[0, 1.5, 2]}>
         <Text 
           fontSize={0.15} 
           color={hovered ? "#00ff00" : "white"} 
           visible={hovered}
           anchorX="center"
           anchorY="middle"
         >
           CLICK TO ENTER
         </Text>
      </group>
    </group>
  );
}

// --- Main Component ---

export const TheOrbit: React.FC = () => {
  const planetRef = useRef<THREE.Mesh>(null);
  const houseRef = useRef<THREE.Group>(null);
  const setScene = useStore((state) => state.setScene);
  const [hovered, setHover] = React.useState(false);

  useFrame((state, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.05;
    }
  });

  const handleEnterBoutique = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setScene('TRANSITIONING');
    setTimeout(() => {
      setScene('BOUTIQUE');
    }, 2000); 
  };

  return (
    <group>
      {/* Intense Star Field */}
      <Stars radius={300} depth={50} count={10000} factor={8} saturation={1} fade speed={1} />
      
      {/* The Sun & Lighting */}
      <TheSun />
      <ambientLight intensity={0.4} color="#ccccff" /> 

      {/* Galactic Environment */}
      <NeighborPlanets />
      <AsteroidField count={30} />
      
      {/* --- POP CULTURE CHAOS --- */}
      
      {/* Massive Space Traffic (NEW) */}
      <HeavyFreighter />
      <FastScout />

      {/* Star Wars Battles - Intense! */}
      <StarDestroyer />
      {/* Front and Center - Close to camera, small radius for tight fighting */}
      <DogfightScene offset={[0, 2, 8]} speed={1.5} radius={15} />
      {/* Left Foreground */}
      <DogfightScene offset={[-15, 5, 5]} speed={1} radius={20} />
      {/* Right Foreground */}
      <DogfightScene offset={[15, -2, 5]} speed={1.2} radius={20} />
      
      {/* Rick and Morty Scene */}
      <RickPortal position={[-20, 15, -45]} />
      <RickShip />
      <FloatingMorty position={[-18, 12, -35]} />
      
      {/* Local Orbit Elements */}
      <Satellite radius={24} speed={0.3} rotationSpeed={2} />
      <DetailedAstronaut position={[-6, 4, 8]} rotation={[0.2, 0.5, 0]} />
      <DetailedAstronaut position={[10, -5, -2]} rotation={[-0.2, -0.5, 0.5]} scale={0.7} />

      {/* Main World */}
      <mesh ref={planetRef} position={[0, -22, 0]} receiveShadow>
        <sphereGeometry args={[20, 64, 64]} />
        <meshStandardMaterial 
          color="#1a1a2e"
          roughness={0.7}
          metalness={0.4}
        />
      </mesh>
      
      <group ref={planetRef} position={[0, 0, 0]}>
         <CyberTrees />
         <ParkedSpaceship />
         {/* TRIGGER FOR THE GAME */}
         <WarshipTrigger />
      </group>

      {/* The Store */}
      <group 
        ref={houseRef} 
        position={[0, -1.8, 0]} 
        onClick={handleEnterBoutique}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <Float speed={2} rotationIntensity={0.05} floatIntensity={0.2}>
          <SimpleStore hovered={hovered} />
        </Float>
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
           <planeGeometry args={[6, 6]} />
           <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
        </mesh>
        <Sparkles count={15} scale={4} size={6} speed={0.4} opacity={0.5} color="#ffffff" position={[0, 0, 0]} />
      </group>
    </group>
  );
};
