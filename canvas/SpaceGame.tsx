
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Instance, Instances, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

// --- CONSTANTS & CONFIG ---
const PLAYER_SPEED = 0.15;
const PLAYER_FIRE_RATE = 0.15; 
const LASER_SPEED = 80;
const SCENE_DEPTH = 150;
const BOUNDARY_X = 25;
const BOUNDARY_Y = 15;

type EnemyType = 'FIGHTER' | 'INTERCEPTOR' | 'BOMBER';

// --- UTILS ---
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// --- ASSETS (OPTIMIZED LOW POLY STAR WARS) ---

const PlayerShipModel = () => (
  <group rotation={[0, Math.PI, 0]} scale={0.35}>
    {/* X-WING FUSELAGE */}
    <mesh position={[0, 0, 1]}>
      <boxGeometry args={[1, 1, 8]} />
      <meshStandardMaterial color="#e6e6e6" roughness={0.6} />
    </mesh>
    {/* NOSE */}
    <mesh position={[0, -0.2, 5.5]}>
       <boxGeometry args={[0.9, 0.7, 3]} />
       <meshStandardMaterial color="#e6e6e6" />
    </mesh>
    {/* COCKPIT */}
    <mesh position={[0, 0.6, -1]}>
      <boxGeometry args={[0.95, 0.6, 2.5]} />
      <meshStandardMaterial color="#333" roughness={0.2} metalness={0.8} />
    </mesh>
    {/* R2 UNIT */}
    <mesh position={[0, 0.6, 1]}>
       <cylinderGeometry args={[0.3, 0.3, 0.3]} />
       <meshStandardMaterial color="blue" />
    </mesh>
    <mesh position={[0, 0.8, 1]}>
       <sphereGeometry args={[0.3, 0, 0, 0, Math.PI*2, 0, Math.PI/2]} />
       <meshStandardMaterial color="silver" />
    </mesh>

    {/* WINGS MECHANISM */}
    <group position={[0, 0, -2]}>
        {/* Top Right */}
        <group position={[-1.2, 0.5, 0]} rotation={[0, 0, 0.3]}>
            <mesh position={[-2, 0, 0]}><boxGeometry args={[4, 0.2, 2]} /><meshStandardMaterial color="#e6e6e6" /></mesh>
            <mesh position={[-3.8, 0, 1.5]}><cylinderGeometry args={[0.1, 0.1, 5]} rotation={[Math.PI/2, 0, 0]} /><meshStandardMaterial color="#888" /></mesh>
            <mesh position={[-0.5, 0, -1]}><cylinderGeometry args={[0.5, 0.5, 2]} rotation={[Math.PI/2, 0, 0]} /><meshStandardMaterial color="#999" /></mesh>
            {/* Engine Glow */}
            <mesh position={[-0.5, 0, -2.1]}><circleGeometry args={[0.35]} /><meshBasicMaterial color="#ff4400" /></mesh>
        </group>
        {/* Top Left */}
        <group position={[1.2, 0.5, 0]} rotation={[0, 0, -0.3]}>
            <mesh position={[2, 0, 0]}><boxGeometry args={[4, 0.2, 2]} /><meshStandardMaterial color="#e6e6e6" /></mesh>
             <mesh position={[3.8, 0, 1.5]}><cylinderGeometry args={[0.1, 0.1, 5]} rotation={[Math.PI/2, 0, 0]} /><meshStandardMaterial color="#888" /></mesh>
             <mesh position={[0.5, 0, -1]}><cylinderGeometry args={[0.5, 0.5, 2]} rotation={[Math.PI/2, 0, 0]} /><meshStandardMaterial color="#999" /></mesh>
             <mesh position={[0.5, 0, -2.1]}><circleGeometry args={[0.35]} /><meshBasicMaterial color="#ff4400" /></mesh>
        </group>
        {/* Bottom Right */}
        <group position={[-1.2, -0.5, 0]} rotation={[0, 0, -0.3]}>
            <mesh position={[-2, 0, 0]}><boxGeometry args={[4, 0.2, 2]} /><meshStandardMaterial color="#e6e6e6" /></mesh>
             <mesh position={[-3.8, 0, 1.5]}><cylinderGeometry args={[0.1, 0.1, 5]} rotation={[Math.PI/2, 0, 0]} /><meshStandardMaterial color="#888" /></mesh>
             <mesh position={[-0.5, 0, -1]}><cylinderGeometry args={[0.5, 0.5, 2]} rotation={[Math.PI/2, 0, 0]} /><meshStandardMaterial color="#999" /></mesh>
             <mesh position={[-0.5, 0, -2.1]}><circleGeometry args={[0.35]} /><meshBasicMaterial color="#ff4400" /></mesh>
        </group>
        {/* Bottom Left */}
        <group position={[1.2, -0.5, 0]} rotation={[0, 0, 0.3]}>
            <mesh position={[2, 0, 0]}><boxGeometry args={[4, 0.2, 2]} /><meshStandardMaterial color="#e6e6e6" /></mesh>
             <mesh position={[3.8, 0, 1.5]}><cylinderGeometry args={[0.1, 0.1, 5]} rotation={[Math.PI/2, 0, 0]} /><meshStandardMaterial color="#888" /></mesh>
             <mesh position={[0.5, 0, -1]}><cylinderGeometry args={[0.5, 0.5, 2]} rotation={[Math.PI/2, 0, 0]} /><meshStandardMaterial color="#999" /></mesh>
             <mesh position={[0.5, 0, -2.1]}><circleGeometry args={[0.35]} /><meshBasicMaterial color="#ff4400" /></mesh>
        </group>
    </group>
    <pointLight position={[0, 0, -4]} color="#ffaa00" intensity={2} distance={5} />
  </group>
);

const EnemyModel = React.memo(({ type }: { type: EnemyType }) => {
  const grey = "#a0a0a0";
  const darkGrey = "#303030";
  const solarBlack = "#111";

  // TIE INTERCEPTOR
  if (type === 'INTERCEPTOR') {
      return (
        <group scale={0.5}>
            {/* Cockpit */}
            <mesh>
                <sphereGeometry args={[1, 16, 16]} />
                <meshStandardMaterial color={grey} />
            </mesh>
            <mesh position={[0, 0, 0.85]}>
                <circleGeometry args={[0.6]} />
                <meshBasicMaterial color={darkGrey} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI/2]}>
                 <cylinderGeometry args={[0.3, 0.3, 3]} />
                 <meshStandardMaterial color={grey} />
            </mesh>
            {/* Wings */}
            {[-1, 1].map((side) => (
                <group key={side} position={[side * 2, 0, 0]} scale={[side, 1, 1]}>
                    <mesh position={[0, 1.5, 1]} rotation={[0.5, 0, 0]}>
                        <boxGeometry args={[0.15, 2, 4]} />
                        <meshStandardMaterial color={solarBlack} />
                    </mesh>
                    <mesh position={[0, 1.5, 1]} rotation={[0.5, 0, 0]} scale={[1.1, 1.05, 1.05]}>
                        <boxGeometry args={[0.15, 2, 4]} />
                        <meshStandardMaterial color={grey} wireframe />
                    </mesh>
                    <mesh position={[0, -1.5, 1]} rotation={[-0.5, 0, 0]}>
                        <boxGeometry args={[0.15, 2, 4]} />
                        <meshStandardMaterial color={solarBlack} />
                    </mesh>
                    <mesh position={[0, -1.5, 1]} rotation={[-0.5, 0, 0]} scale={[1.1, 1.05, 1.05]}>
                        <boxGeometry args={[0.15, 2, 4]} />
                        <meshStandardMaterial color={grey} wireframe />
                    </mesh>
                </group>
            ))}
        </group>
      )
  }

  // TIE BOMBER
  if (type === 'BOMBER') {
      return (
        <group scale={0.6}>
            {/* Double Hull */}
            <group position={[-0.8, 0, 0]}>
                 <mesh rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[1, 1, 3, 16]} />
                    <meshStandardMaterial color={grey} />
                 </mesh>
                 <mesh position={[0, 0, 1.51]}>
                    <circleGeometry args={[0.8]} />
                    <meshBasicMaterial color={darkGrey} />
                 </mesh>
            </group>
            <group position={[0.8, 0, 0]}>
                 <mesh rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[1, 1, 2.5, 16]} />
                    <meshStandardMaterial color={grey} />
                 </mesh>
                 <mesh position={[0, 0, 1.26]}>
                     <sphereGeometry args={[0.9, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} />
                     <meshStandardMaterial color={grey} />
                 </mesh>
                 <mesh position={[0, 0, 2]}>
                    <circleGeometry args={[0.6]} />
                    <meshBasicMaterial color={darkGrey} />
                 </mesh>
            </group>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[2, 0.5, 1]} />
                <meshStandardMaterial color={grey} />
            </mesh>
             {/* Wings */}
             {[-1, 1].map(side => (
                 <group key={side} position={[side * 2.5, 0, 0]} scale={[side, 1, 1]}>
                    <mesh rotation={[0, 0, -0.4]}>
                        <boxGeometry args={[0.2, 3, 3]} />
                        <meshStandardMaterial color={solarBlack} />
                    </mesh>
                 </group>
             ))}
        </group>
      )
  }

  // TIE FIGHTER (STANDARD)
  return (
      <group scale={0.5}>
        <mesh><sphereGeometry args={[1, 16, 16]} /><meshStandardMaterial color={grey} /></mesh>
        <mesh position={[0, 0, 0.8]}><circleGeometry args={[0.7]} /><meshBasicMaterial color={darkGrey} /></mesh>
        <mesh rotation={[0, 0, Math.PI/2]}><cylinderGeometry args={[0.3, 0.3, 3]} /><meshStandardMaterial color={grey} /></mesh>
        
        {/* Panels */}
        {[-2, 2].map(pos => (
            <group key={pos} position={[pos, 0, 0]}>
                <mesh>
                    <boxGeometry args={[0.15, 4, 5]} />
                    <meshStandardMaterial color={solarBlack} />
                </mesh>
                <mesh scale={[1.1, 1.02, 1.02]}>
                    <boxGeometry args={[0.15, 4, 5]} />
                    <meshStandardMaterial color={grey} wireframe />
                </mesh>
                 <mesh>
                    <boxGeometry args={[0.16, 4, 0.2]} />
                    <meshStandardMaterial color={grey} />
                </mesh>
                 <mesh>
                    <boxGeometry args={[0.16, 0.2, 5]} />
                    <meshStandardMaterial color={grey} />
                </mesh>
            </group>
        ))}
      </group>
  )
});

// --- EFFECTS ---

const SpeedLines = () => {
    const count = 100;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const data = useMemo(() => Array.from({ length: count }, () => ({
        x: randomRange(-40, 40),
        y: randomRange(-30, 30),
        z: randomRange(-100, 50),
        speed: randomRange(1, 2)
    })), []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        // Speed multiplier based on mouse Y (move up = go faster feel)
        const speedMult = 100; 

        data.forEach((particle, i) => {
            particle.z += particle.speed * delta * speedMult;
            if (particle.z > 20) particle.z = -150; // Reset to back

            tempObject.position.set(particle.x, particle.y, particle.z);
            tempObject.rotation.x = Math.PI / 2; // Face camera
            tempObject.scale.set(0.05, 0.05, randomRange(5, 15)); // Stretch
            tempObject.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObject.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <cylinderGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="white" transparent opacity={0.3} />
        </instancedMesh>
    );
};

const Explosion = ({ position, onComplete }: { position: THREE.Vector3, onComplete: () => void }) => {
    const ref = useRef<THREE.Group>(null);
    const [dead, setDead] = useState(false);
    
    useFrame((_, delta) => {
        if (ref.current && !dead) {
            ref.current.scale.multiplyScalar(1 + delta * 5);
            ref.current.rotation.z += delta * 5;
            // Fade logic simplified by just scaling up until pop
            if (ref.current.scale.x > 3) {
                setDead(true);
                onComplete();
            }
        }
    });

    if (dead) return null;

    return (
        <group ref={ref} position={position}>
             <mesh>
                <dodecahedronGeometry args={[1, 0]} />
                <meshBasicMaterial color="orange" wireframe />
             </mesh>
             <mesh>
                 <sphereGeometry args={[0.5]} />
                 <meshBasicMaterial color="white" />
             </mesh>
        </group>
    );
};

// --- GAME LOGIC ---

export const SpaceGame: React.FC = () => {
  const { mouse, viewport, camera } = useThree();
  const { incrementScore, takeDamage, isGameOver, gameHealth } = useStore();
  
  // Refs for game loop access without re-renders
  const shipRef = useRef<THREE.Group>(null);
  const lasersRef = useRef<any[]>([]); 
  const enemiesRef = useRef<any[]>([]);
  const lastShotRef = useRef(0);
  
  // State for rendering visuals (React needs to know about these to mount components)
  // We sync these with the Refs
  const [enemyVisuals, setEnemyVisuals] = useState<any[]>([]);
  const [laserVisuals, setLaserVisuals] = useState<any[]>([]);
  const [explosions, setExplosions] = useState<{id: string, pos: THREE.Vector3}[]>([]);

  // Camera Shake
  const cameraShake = useRef(0);

  // --- GAME LOOP ---
  useFrame((state, delta) => {
    if (isGameOver) return;

    const time = state.clock.elapsedTime;
    const difficulty = 1 + Math.min(time / 60, 2); // Scales up over 1 minute

    // 1. PLAYER MOVEMENT
    if (shipRef.current) {
        // Calculate target based on mouse (-1 to 1) mapped to boundaries
        const targetX = THREE.MathUtils.clamp(mouse.x * (viewport.width / 2) * 1.5, -BOUNDARY_X, BOUNDARY_X);
        const targetY = THREE.MathUtils.clamp(mouse.y * (viewport.height / 2) * 1.5, -BOUNDARY_Y, BOUNDARY_Y);

        // Smooth Lerp
        shipRef.current.position.x = THREE.MathUtils.lerp(shipRef.current.position.x, targetX, PLAYER_SPEED);
        shipRef.current.position.y = THREE.MathUtils.lerp(shipRef.current.position.y, targetY, PLAYER_SPEED);

        // Banking (Roll)
        const diffX = targetX - shipRef.current.position.x;
        shipRef.current.rotation.z = THREE.MathUtils.lerp(shipRef.current.rotation.z, -diffX * 0.1, 0.1);
        shipRef.current.rotation.x = THREE.MathUtils.lerp(shipRef.current.rotation.x, (targetY - shipRef.current.position.y) * 0.05, 0.1);

        // Dynamic Camera Follow
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, shipRef.current.position.x * 0.3, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2 + shipRef.current.position.y * 0.3, 0.05);
        
        // Camera Shake decay
        if (cameraShake.current > 0) {
            camera.position.x += (Math.random() - 0.5) * cameraShake.current;
            camera.position.y += (Math.random() - 0.5) * cameraShake.current;
            cameraShake.current = THREE.MathUtils.lerp(cameraShake.current, 0, 0.1);
        }
    }

    // 2. SHOOTING (Auto-Fire)
    if (time - lastShotRef.current > PLAYER_FIRE_RATE) {
        if (shipRef.current) {
            const id = Math.random().toString();
            // Fire from X-Wing wing tips
            const tips = [
                new THREE.Vector3(2.5, 0.2, 0),
                new THREE.Vector3(-2.5, 0.2, 0),
                new THREE.Vector3(2.5, -0.2, 0),
                new THREE.Vector3(-2.5, -0.2, 0)
            ];
            
            tips.forEach((offset, i) => {
                 const p = shipRef.current!.position.clone().add(offset);
                 lasersRef.current.push(
                    { id: id + '_' + i, pos: p, vel: new THREE.Vector3(0, 0, -LASER_SPEED), isEnemy: false }
                 );
            });
            
            // Trigger Visual Update
            setLaserVisuals([...lasersRef.current]);
            lastShotRef.current = time;
        }
    }

    // 3. SPAWNING ENEMIES
    if (Math.random() < 0.03 * difficulty) {
        const id = Math.random().toString();
        
        // Randomize Enemy Type
        const typeRoll = Math.random();
        let type: EnemyType = 'FIGHTER';
        if (typeRoll > 0.8) type = 'BOMBER';
        else if (typeRoll > 0.6) type = 'INTERCEPTOR';

        const x = randomRange(-BOUNDARY_X, BOUNDARY_X);
        const y = randomRange(-BOUNDARY_Y, BOUNDARY_Y);
        const z = -120; // Spawn far away
        
        // Stats based on type
        let speed = 25;
        let hp = 1;
        let fireRate = 3;

        if (type === 'INTERCEPTOR') {
            speed = 40;
            hp = 2; // Fast but slightly tougher than base
            fireRate = 1.5; // Rapid fire
        } else if (type === 'BOMBER') {
            speed = 15;
            hp = 5; // Tanky
            fireRate = 4; // Slow fire
        }

        speed *= difficulty;

        enemiesRef.current.push({
            id, type, 
            pos: new THREE.Vector3(x, y, z), 
            vel: new THREE.Vector3(0, 0, speed),
            hp, maxHp: hp,
            lastShot: 0,
            fireRate
        });
        setEnemyVisuals([...enemiesRef.current]);
    }

    // 4. PHYSICS & COLLISIONS LOOP
    let lasersDirty = false;
    let enemiesDirty = false;

    // Move Lasers
    for (let i = lasersRef.current.length - 1; i >= 0; i--) {
        const l = lasersRef.current[i];
        l.pos.addScaledVector(l.vel, delta);

        // Remove if out of bounds
        if (l.pos.z < -160 || l.pos.z > 20) {
            lasersRef.current.splice(i, 1);
            lasersDirty = true;
            continue;
        }

        // Collision: Laser vs Player
        if (l.isEnemy && shipRef.current) {
            if (l.pos.distanceTo(shipRef.current.position) < 2) {
                takeDamage(10);
                cameraShake.current = 0.5;
                lasersRef.current.splice(i, 1);
                lasersDirty = true;
                continue;
            }
        }
    }

    // Move Enemies & Logic
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const e = enemiesRef.current[i];
        // Move forward
        e.pos.z += e.vel.z * delta;
        
        // Simple AI: Move towards player x/y slowly
        if (shipRef.current) {
             e.pos.x = THREE.MathUtils.lerp(e.pos.x, shipRef.current.position.x, delta * 0.5);
             e.pos.y = THREE.MathUtils.lerp(e.pos.y, shipRef.current.position.y, delta * 0.5);
        }

        // Enemy Shooting
        if (time - e.lastShot > e.fireRate && e.pos.z > -100 && e.pos.z < -10) {
            if (Math.random() < 0.5) { // 50% chance to shoot when ready
                const dir = shipRef.current 
                    ? shipRef.current.position.clone().sub(e.pos).normalize()
                    : new THREE.Vector3(0,0,1);
                
                lasersRef.current.push({
                    id: Math.random().toString(),
                    pos: e.pos.clone(),
                    vel: dir.multiplyScalar(40), // Enemy laser speed
                    isEnemy: true
                });
                lasersDirty = true;
                e.lastShot = time;
            }
        }

        // Collision: Enemy vs Player
        if (shipRef.current && e.pos.distanceTo(shipRef.current.position) < 3) {
            takeDamage(20);
            cameraShake.current = 1;
            // Kill enemy
            e.hp = 0;
        }

        // Collision: Enemy vs Player Lasers
        for (let j = lasersRef.current.length - 1; j >= 0; j--) {
            const l = lasersRef.current[j];
            if (!l.isEnemy && l.pos.distanceTo(e.pos) < 3) {
                e.hp--;
                lasersRef.current.splice(j, 1);
                lasersDirty = true;
                
                // Small hit effect (optional)
                break; // Laser destroyed
            }
        }

        // Check Death or Out of Bounds
        if (e.hp <= 0 || e.pos.z > 10) {
            if (e.hp <= 0) {
                // Score based on type
                const points = e.type === 'BOMBER' ? 300 : e.type === 'INTERCEPTOR' ? 200 : 100;
                incrementScore(points);
                // Explosion Visual
                setExplosions(prev => [...prev, { id: Math.random().toString(), pos: e.pos.clone() }]);
            }
            enemiesRef.current.splice(i, 1);
            enemiesDirty = true;
        }
    }

    // 5. SYNC STATE FOR RENDER (Only if changed to save React cycles)
    if (lasersDirty) setLaserVisuals([...lasersRef.current]);
    if (enemiesDirty) setEnemyVisuals([...enemiesRef.current]);

  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 12]} fov={60} />
      <color attach="background" args={['#000005']} />
      
      {/* --- ENVIRONMENT --- */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={2} />
      <SpeedLines />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#aaddff" />
      <pointLight position={[0, 0, -20]} intensity={2} color="#ff0000" distance={50} />

      {/* --- PLAYER --- */}
      <group ref={shipRef}>
          <PlayerShipModel />
      </group>

      {/* --- ENEMIES --- */}
      {enemyVisuals.map(e => (
          <group key={e.id} position={e.pos}>
              <EnemyModel type={e.type} />
              {/* Health Bar if damaged */}
              {e.hp < e.maxHp && (
                  <mesh position={[0, 1.5, 0]}>
                      <planeGeometry args={[2 * (e.hp / e.maxHp), 0.2]} />
                      <meshBasicMaterial color="red" />
                  </mesh>
              )}
          </group>
      ))}

      {/* --- LASERS --- */}
      {laserVisuals.map(l => (
          <mesh key={l.id} position={l.pos} rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[l.isEnemy ? 0.2 : 0.08, l.isEnemy ? 0.2 : 0.08, 4]} />
              <meshBasicMaterial color={l.isEnemy ? "#ff0000" : "#00ff44"} toneMapped={false} />
          </mesh>
      ))}

      {/* --- FX --- */}
      {explosions.map(ex => (
          <Explosion key={ex.id} position={ex.pos} onComplete={() => setExplosions(prev => prev.filter(p => p.id !== ex.id))} />
      ))}
    </>
  );
};
