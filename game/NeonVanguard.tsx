
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Settings, Play, XCircle, Shield, Zap, RefreshCw, LogOut, Disc, Skull, Pause } from 'lucide-react';

// --- CONFIGURATION DU JEU ---
const POOL_SIZE_PROJ = 300; 
const POOL_SIZE_PARTICLES = 250;
const PLAYER_DRAG_SPEED = 0.15;
const PLAYER_FIRE_RATE = 160; 
const SCREEN_SHAKE_DECAY = 0.9;
const STAR_COUNT = 150;

// --- TYPES & ENUMS ---
type Vector2 = { x: number; y: number };
type EntityType = 
  | 'PLAYER' 
  | 'TIE_FIGHTER' | 'TIE_INTERCEPTOR' | 'TIE_BOMBER' | 'TIE_DEFENDER' | 'STAR_DESTROYER' 
  | 'ASTEROID'
  | 'BONUS_R2' | 'BONUS_WEAPON' | 'BONUS_TORPEDO' | 'BONUS_RAPID';

interface GameObject {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  type?: EntityType;
  hp: number;
  maxHp: number;
  iframe: number;
  scoreValue?: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

// --- OPTIMISATION: OBJECT POOLING ---
class Pool<T extends GameObject> {
  items: T[];
  constructor(size: number, factory: () => T) {
    this.items = new Array(size).fill(null).map(factory);
  }
  get(): T | null {
    return this.items.find(i => !i.active) || null;
  }
  reset() {
    this.items.forEach(i => i.active = false);
  }
}

// --- DONNÉES DE MISSION ---
const MISSIONS = [
  { title: "PATROUILLE TATOOINE", text: "Secteur calme. Interceptez les éclaireurs TIE isolés." },
  { title: "CHAMP D'ASTÉROÏDES", text: "Attention pilote ! Navigation dangereuse. Évitez les impacts." },
  { title: "ESCADRONS D'ÉLITE", text: "Intercepteurs TIE détectés. Ils sont rapides. Restez sur vos gardes." },
  { title: "BLOCUS IMPÉRIAL", text: "Bombardiers en approche. Protégez la flotte rebelle." },
  { title: "PROTOTYPE DÉFENSEUR", text: "Alerte ! Nouveaux TIE Defenders détectés. Puissance de feu extrême." },
  { title: "LE DESTROYER", text: "Destroyer Stellaire en vue ! Visez le générateur de bouclier central !" },
];

export const NeonVanguard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Note: We use useStore.getState() inside the loop to get fresh values, 
  // but we still destructure here for the UI rendering part.
  const { gameScore, gameLives, gameWave, incrementScore, playerDied, endGame, setScene, resetGame, nextWave, takeDamage, gainLife } = useStore();

  // --- REFS ---
  const gameState = useRef<'MENU' | 'BRIEFING' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const frameId = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const lastShot = useRef<number>(0);
  const screenShake = useRef<number>(0);
  const stars = useRef<Star[]>([]);
  
  // Inputs
  const pointer = useRef<Vector2>({ x: window.innerWidth / 2, y: window.innerHeight - 100 });
  
  // Entités
  const player = useRef<GameObject>({
    active: true, x: 0, y: 0, vx: 0, vy: 0, width: 40, height: 40, rotation: 0,
    color: '#fff', type: 'PLAYER', hp: 100, maxHp: 100, iframe: 0
  });

  const enemies = useRef<GameObject[]>([]);
  const waveTimer = useRef<number>(0);
  const bossSpawned = useRef<boolean>(false);
  const weaponLevel = useRef<number>(1); 
  
  // Powerup Timers
  const rapidFireUntil = useRef<number>(0);

  // Pools
  const projectilePool = useRef(new Pool<GameObject & { isEnemy: boolean }>(POOL_SIZE_PROJ, () => ({
    active: false, x: 0, y: 0, vx: 0, vy: 0, width: 4, height: 20, rotation: 0,
    color: '#f00', hp: 1, maxHp: 1, iframe: 0, isEnemy: false
  })));
  
  const particlePool = useRef(new Pool<GameObject & { life: number; maxLife: number; size: number }>(POOL_SIZE_PARTICLES, () => ({
    active: false, x: 0, y: 0, vx: 0, vy: 0, width: 0, height: 0, rotation: 0,
    color: '#fff', hp: 1, maxHp: 1, iframe: 0, life: 1, maxLife: 1, size: 2
  })));

  // UI React State
  const [uiState, setUiState] = useState<'MENU' | 'BRIEFING' | 'HUD' | 'GAMEOVER'>('MENU');
  const [briefingData, setBriefingData] = useState({ title: '', text: '' });
  const [isPaused, setIsPaused] = useState(false);

  // --- AUDIO ENGINE ---
  const playSound = (type: 'laser_xwing' | 'laser_tie' | 'explosion' | 'r2d2' | 'torpedo' | 'alarm' | 'powerup') => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;

    if (type === 'laser_xwing') {
        const isRapid = performance.now() < rapidFireUntil.current;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isRapid ? 800 : 600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(); osc.stop(now + 0.15);
    } else if (type === 'laser_tie') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(); osc.stop(now + 0.1);
    } else if (type === 'explosion') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(); osc.stop(now + 0.4);
    } else if (type === 'r2d2' || type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(1800, now + 0.1);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(); osc.stop(now + 0.2);
    }
  };

  // --- LOGIQUE SPAWN ---

  const spawnProjectile = (x: number, y: number, vx: number, vy: number, isEnemy: boolean) => {
    const p = projectilePool.current.get();
    if (p) {
      p.active = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy;
      p.isEnemy = isEnemy;
      p.color = isEnemy ? '#00FF00' : '#FF0044'; 
      p.width = isEnemy ? 4 : 5;
      p.height = isEnemy ? 20 : 25;
    }
  };

  const spawnParticle = (x: number, y: number, color: string, count: number, size = 2) => {
    for(let i=0; i<count; i++) {
      const p = particlePool.current.get();
      if (p) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4;
        p.active = true; p.x = x; p.y = y; 
        p.vx = Math.cos(angle) * speed; p.vy = Math.sin(angle) * speed;
        p.color = color;
        p.life = 1.0; 
        p.size = Math.random() * size + 1;
      }
    }
  };

  const triggerProtonTorpedo = (width: number, height: number) => {
      playSound('explosion');
      screenShake.current = 40;
      spawnParticle(width/2, height/2, '#00FFFF', 100, 15); 
      spawnParticle(width/2, height/2, '#FFFFFF', 50, 5); 

      enemies.current.forEach(e => {
          if (e.type !== 'STAR_DESTROYER') {
              e.hp = 0; 
              spawnParticle(e.x, e.y, '#FFAA00', 10);
          } else {
              e.hp -= 200; 
              spawnParticle(e.x, e.y, '#FF0000', 20);
          }
      });
  };

  const spawnBonus = (x: number, y: number) => {
      const rand = Math.random();
      let type: EntityType = 'BONUS_WEAPON';
      
      // Bonus Weights
      if (rand > 0.88) type = 'BONUS_TORPEDO';    
      else if (rand > 0.70) type = 'BONUS_RAPID'; 
      else if (rand > 0.45) type = 'BONUS_R2';    

      enemies.current.push({
          active: true, x, y, vx: 0, vy: 1.2,
          width: 30, height: 30, rotation: 0,
          color: '#FFF', type, hp: 1, maxHp: 1, iframe: 0
      });
  };

  // PROGRESSIVE DIFFICULTY LOGIC
  const spawnEnemy = (w: number, currentWave: number) => {
    const rand = Math.random();
    let type: EntityType = 'TIE_FIGHTER';
    let hp = 2; // Default 2 hits for basic
    let width = 35;
    let score = 100;

    // Difficulty Factors
    const speedBoost = Math.min((currentWave - 1) * 0.3, 5); // Speed increases with waves
    const baseSpeed = 3 + speedBoost;

    // Type Logic based on progression
    if (currentWave >= 3 && currentWave % 3 === 0 && Math.random() > 0.75) {
        type = 'ASTEROID'; 
        hp = 999; 
        width = 50; 
        score = 0;
    } 
    else if (currentWave >= 5 && rand > 0.85) {
        type = 'TIE_DEFENDER';
        hp = 3; // Elite
        width = 40;
        score = 500;
    }
    else if (currentWave >= 4 && rand > 0.75) {
        type = 'TIE_BOMBER'; 
        hp = 3; // Bomber
        width = 45; 
        score = 300;
    } else if (currentWave >= 2 && rand > 0.65) {
        type = 'TIE_INTERCEPTOR'; 
        hp = 2; 
        width = 35; 
        score = 200;
    }

    // Specific speeds per type
    let vy = baseSpeed;
    if (type === 'TIE_INTERCEPTOR') vy = baseSpeed * 1.4;
    if (type === 'TIE_BOMBER') vy = baseSpeed * 0.6;
    if (type === 'TIE_DEFENDER') vy = baseSpeed * 1.2;
    if (type === 'ASTEROID') vy = baseSpeed + 2;

    enemies.current.push({
      active: true,
      x: Math.random() * (w - 60) + 30,
      y: -50,
      vx: (type === 'ASTEROID' ? (Math.random()-0.5)*4 : (Math.random() - 0.5) * 1.5),
      vy: vy,
      width, height: width, rotation: Math.random() * Math.PI * 2,
      color: '#fff', type, hp, maxHp: hp, iframe: 0, scoreValue: score
    });
  };

  const spawnBoss = (w: number, currentWave: number) => {
      // Boss HP Scales
      const bossHp = 1000 + (currentWave * 200); 
      // Boss Score fixed to 2000 to perfectly match one wave progression step
      const bossScore = 2000;

      enemies.current.push({
          active: true, x: w / 2, y: -300, vx: 0, vy: 1,
          width: 250, height: 400, rotation: 0,
          color: '#888', type: 'STAR_DESTROYER', hp: bossHp, maxHp: bossHp, iframe: 0,
          scoreValue: bossScore
      });
      bossSpawned.current = true;
  };

  // --- DRAWING FUNCTIONS ---
  // (Assuming identical drawing functions as previous for brevity, handled via context or imports in real app, but implemented here for completeness)
  
  const drawXWing = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save(); ctx.translate(x, y);
      const isRapid = performance.now() < rapidFireUntil.current;
      const gradBody = ctx.createLinearGradient(-5, -size, 5, size);
      gradBody.addColorStop(0, '#E0E0E0'); gradBody.addColorStop(0.5, '#FFFFFF'); gradBody.addColorStop(1, '#CCCCCC');
      const gradWings = ctx.createLinearGradient(-size, 0, size, 0);
      gradWings.addColorStop(0, '#BBBBBB'); gradWings.addColorStop(0.5, '#E0E0E0'); gradWings.addColorStop(1, '#BBBBBB');
      const engineColor = isRapid ? '#FFFF00' : '#FF4400';
      ctx.shadowBlur = isRapid ? 25 : 15; ctx.shadowColor = engineColor; ctx.fillStyle = engineColor;
      ctx.beginPath(); ctx.arc(-10, 15, isRapid ? 5 : 4, 0, Math.PI*2); ctx.arc(10, 15, isRapid ? 5 : 4, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = gradBody;
      ctx.beginPath(); ctx.moveTo(0, -size); ctx.lineTo(6, size/1.5); ctx.lineTo(-6, size/1.5); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = gradWings;
      ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(-size, size/1.2); ctx.moveTo(0, 5); ctx.lineTo(size, size/1.2); ctx.moveTo(0, 5); ctx.lineTo(-size, -size/3); ctx.moveTo(0, 5); ctx.lineTo(size, -size/3); ctx.stroke();
      const gradCockpit = ctx.createRadialGradient(0, -5, 1, 0, -5, 6); gradCockpit.addColorStop(0, '#444'); gradCockpit.addColorStop(1, '#111');
      ctx.fillStyle = gradCockpit; ctx.beginPath(); ctx.ellipse(0, -5, 4, 8, 0, 0, Math.PI*2); ctx.fill();
      if (weaponLevel.current > 1) { ctx.fillStyle = '#00FF00'; ctx.beginPath(); ctx.arc(-15, 0, 2, 0, Math.PI*2); ctx.arc(15, 0, 2, 0, Math.PI*2); ctx.fill(); }
      if (weaponLevel.current > 2) { ctx.fillStyle = '#00FFFF'; ctx.beginPath(); ctx.arc(-20, 5, 2, 0, Math.PI*2); ctx.arc(20, 5, 2, 0, Math.PI*2); ctx.fill(); }
      ctx.restore();
  };

  const drawTie = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, type: EntityType) => {
      ctx.save(); ctx.translate(x, y);
      const gradPanel = ctx.createLinearGradient(-size, -size, size, size);
      gradPanel.addColorStop(0, '#111'); gradPanel.addColorStop(0.5, '#222'); gradPanel.addColorStop(1, '#000');
      const gradCockpit = ctx.createRadialGradient(0, 0, 2, 0, 0, size/3);
      gradCockpit.addColorStop(0, '#555'); gradCockpit.addColorStop(1, '#222');
      if (type === 'TIE_FIGHTER') {
          ctx.fillStyle = gradPanel; ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
          ctx.fillRect(-size/2, -size/2, 6, size); ctx.strokeRect(-size/2, -size/2, 6, size);
          ctx.fillRect(size/2 - 6, -size/2, 6, size); ctx.strokeRect(size/2 - 6, -size/2, 6, size);
          ctx.fillStyle = '#444'; ctx.fillRect(-size/2, -3, size, 6);
          ctx.fillStyle = gradCockpit; ctx.beginPath(); ctx.arc(0, 0, size/3.5, 0, Math.PI*2); ctx.fill();
      } else if (type === 'TIE_INTERCEPTOR') {
          ctx.fillStyle = gradPanel; ctx.beginPath(); ctx.moveTo(-size/1.5, 0); ctx.lineTo(-size, -size/1.5); ctx.lineTo(-size/2, -size); ctx.fill();
          ctx.beginPath(); ctx.moveTo(size/1.5, 0); ctx.lineTo(size, -size/1.5); ctx.lineTo(size/2, -size); ctx.fill();
           ctx.fillStyle = '#444'; ctx.fillRect(-size/2, -2, size, 4);
          ctx.fillStyle = gradCockpit; ctx.beginPath(); ctx.arc(0, 0, size/4, 0, Math.PI*2); ctx.fill();
      } else if (type === 'TIE_BOMBER') {
          ctx.fillStyle = gradCockpit; ctx.beginPath(); ctx.arc(-size/4, 0, size/3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(size/4, 0, size/3, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#111'; ctx.fillRect(-size, -5, 8, 10); ctx.fillRect(size-8, -5, 8, 10);
      } else if (type === 'TIE_DEFENDER') {
          ctx.fillStyle = gradCockpit; ctx.beginPath(); ctx.arc(0, 0, size/4, 0, Math.PI*2); ctx.fill();
          for(let i=0; i<3; i++) { ctx.save(); ctx.rotate(i * (Math.PI * 2 / 3) + Math.PI); ctx.translate(0, -size/3); ctx.fillStyle = gradPanel; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size/2, -size); ctx.lineTo(size/2, -size); ctx.fill(); ctx.fillStyle = '#333'; ctx.fillRect(-2, 0, 4, -size); ctx.restore(); }
      }
      ctx.restore();
  };

  const drawStarDestroyer = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, hpRatio: number) => {
      ctx.save(); ctx.translate(x, y);
      const gradHull = ctx.createLinearGradient(0, -h/2, 0, h/2); gradHull.addColorStop(0, '#555'); gradHull.addColorStop(1, '#333');
      ctx.fillStyle = gradHull; ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w/2, -h/2); ctx.lineTo(-w/2, -h/2); ctx.fill();
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(0, -h/2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w/4, 0); ctx.lineTo(w/4, 0); ctx.stroke();
      ctx.fillStyle = '#444'; ctx.fillRect(-20, -h/2 - 20, 40, 30);
      ctx.fillStyle = '#777'; ctx.beginPath(); ctx.arc(-30, -h/2 - 10, 8, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(30, -h/2 - 10, 8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#300'; ctx.fillRect(-w/2, -h/2 - 60, w, 8);
      ctx.fillStyle = '#F00'; ctx.shadowBlur = 10; ctx.shadowColor = 'red'; ctx.fillRect(-w/2, -h/2 - 60, w * hpRatio, 8); ctx.shadowBlur = 0;
      ctx.restore();
  };

  const drawBonus = (ctx: CanvasRenderingContext2D, x: number, y: number, type: EntityType) => {
      ctx.save(); ctx.translate(x, y); const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.2; ctx.scale(pulse, pulse); ctx.shadowBlur = 15;
      if (type === 'BONUS_R2') { ctx.shadowColor = '#0088FF'; ctx.fillStyle = '#0088FF'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.font = '10px monospace'; ctx.fillText('SHLD', -10, 3); } 
      else if (type === 'BONUS_WEAPON') { ctx.shadowColor = '#00FF00'; ctx.fillStyle = '#00FF00'; ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(12,6); ctx.lineTo(-12,6); ctx.fill(); ctx.fillStyle = '#000'; ctx.font = 'bold 10px monospace'; ctx.fillText('UP', -6, 4); } 
      else if (type === 'BONUS_TORPEDO') { ctx.shadowColor = '#FF00FF'; ctx.fillStyle = '#FF00FF'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill(); } 
      else if (type === 'BONUS_RAPID') { ctx.shadowColor = '#FFFF00'; ctx.fillStyle = '#FFFF00'; ctx.beginPath(); ctx.moveTo(2, -8); ctx.lineTo(8, -8); ctx.lineTo(-2, 8); ctx.lineTo(-8, 8); ctx.fill(); ctx.fillStyle = '#000'; ctx.font = 'bold 9px monospace'; ctx.fillText('SPD', -8, -10); }
      ctx.restore();
  };

  // --- GAME UPDATE LOOP ---

  const update = (dt: number, width: number, height: number) => {
    // IMPORTANT: Get fresh state directly from store to avoid closure staleness in loop
    const { gameWave: currentWave, gameScore: currentScore } = useStore.getState();

    // 1. Shake Decay
    if (screenShake.current > 0) screenShake.current *= SCREEN_SHAKE_DECAY;
    if (screenShake.current < 0.5) screenShake.current = 0;

    // 2. Player Logic (LERP movement)
    const targetX = Math.max(25, Math.min(width - 25, pointer.current.x));
    const targetY = Math.max(50, Math.min(height - 50, pointer.current.y));
    player.current.x += (targetX - player.current.x) * PLAYER_DRAG_SPEED;
    player.current.y += (targetY - player.current.y) * PLAYER_DRAG_SPEED;
    player.current.rotation = (player.current.x - targetX) * 0.05;

    // Auto Fire
    const currentFireRate = performance.now() < rapidFireUntil.current ? PLAYER_FIRE_RATE / 2.5 : PLAYER_FIRE_RATE;
    
    if (gameState.current === 'PLAYING' && !isPaused && performance.now() - lastShot.current > currentFireRate) {
      playSound('laser_xwing');
      // Level 1: Standard Dual
      spawnProjectile(player.current.x - 20, player.current.y - 10, 0, -20, false);
      spawnProjectile(player.current.x + 20, player.current.y - 10, 0, -20, false);
      
      // Level 2: Quad
      if (weaponLevel.current >= 2) { 
          spawnProjectile(player.current.x - 35, player.current.y + 5, 0, -20, false);
          spawnProjectile(player.current.x + 35, player.current.y + 5, 0, -20, false);
      }
      // Level 3: Spread
      if (weaponLevel.current >= 3) {
          spawnProjectile(player.current.x - 25, player.current.y, -3, -18, false);
          spawnProjectile(player.current.x + 25, player.current.y, 3, -18, false);
      }

      lastShot.current = performance.now();
    }

    // 3. Enemies Logic
    if (gameState.current === 'PLAYING' && !isPaused) {
      waveTimer.current += dt;
      
      // PROGRESSIVE DIFFICULTY VARIABLES
      const difficulty = 1.0 + (currentWave - 1) * 0.2; // Increase difficulty 20% per wave
      
      // Spawn Boss every 5 waves
      if (currentWave % 5 === 0 && !bossSpawned.current) {
        if (enemies.current.length === 0) spawnBoss(width, currentWave);
      } 
      else if (!bossSpawned.current) {
        // Spawn Rate increases with difficulty
        const baseInterval = 2000;
        const spawnInterval = Math.max(250, baseInterval / difficulty); // Cap at 4 spawns/sec
        
        // Max enemies on screen increases
        const maxEnemies = 2 + Math.floor(currentWave * 1.5); 
        
        if (waveTimer.current > spawnInterval) {
           if (enemies.current.filter(e => !e.type?.startsWith('BONUS')).length < maxEnemies) {
              spawnEnemy(width, currentWave);
              waveTimer.current = 0;
           }
        }
      }

      for (let i = enemies.current.length - 1; i >= 0; i--) {
        const e = enemies.current[i];
        
        if (e.type === 'STAR_DESTROYER') {
             if (e.y < 150) e.y += 0.5;
             e.x = width/2 + Math.sin(performance.now() * 0.0005) * 50;
             if (Math.random() < 0.08) {
                 playSound('laser_tie');
                 spawnProjectile(e.x + (Math.random()-0.5)*150, e.y + 100, (Math.random()-0.5)*5, 9, true);
             }
        } else if (e.type === 'ASTEROID') {
             e.y += e.vy; e.x += e.vx; e.rotation += 0.05;
        } else if (e.type === 'TIE_INTERCEPTOR') {
             e.y += e.vy; 
             e.x += (player.current.x - e.x) * 0.02; 
        } else {
             e.y += e.vy; e.x += e.vx;
             
             // Enemy Shooting Probability Increases with Wave
             const baseFireChance = 0.002; 
             const fireChance = baseFireChance + (currentWave * 0.001); // Wave 1: 0.3%, Wave 10: 1.2% per frame
             
             // Enemy Projectile Speed Increases with Wave
             const bulletSpeed = 8 + (currentWave * 0.8);

             if (Math.random() < fireChance) {
                 if (e.type === 'TIE_DEFENDER') {
                    playSound('laser_tie');
                    spawnProjectile(e.x, e.y + 20, 0, bulletSpeed + 2, true); 
                    spawnProjectile(e.x, e.y + 20, -3, bulletSpeed, true); 
                    spawnProjectile(e.x, e.y + 20, 3, bulletSpeed, true);
                 } else {
                    playSound('laser_tie');
                    spawnProjectile(e.x, e.y, 0, bulletSpeed, true);
                 }
             }
        }

        const dist = Math.hypot(e.x - player.current.x, e.y - player.current.y);
        const hitRadius = e.type === 'ASTEROID' ? e.width/2 : (e.width + player.current.width) / 2;

        if (dist < hitRadius) {
          if (e.type?.startsWith('BONUS')) {
            if (e.type === 'BONUS_R2') { 
                gainLife(); 
                spawnParticle(player.current.x, player.current.y, '#0088FF', 10);
            } 
            else if (e.type === 'BONUS_WEAPON') { 
                weaponLevel.current = Math.min(weaponLevel.current + 1, 3); 
                spawnParticle(player.current.x, player.current.y, '#00FF00', 10);
            } 
            else if (e.type === 'BONUS_TORPEDO') { triggerProtonTorpedo(width, height); }
            else if (e.type === 'BONUS_RAPID') { rapidFireUntil.current = performance.now() + 10000; } 
            
            playSound('powerup');
            enemies.current.splice(i, 1);
            continue;
          } else {
            screenShake.current = 20;
            spawnParticle(player.current.x, player.current.y, '#f00', 30);
            playSound('explosion');
            playerDied();
            takeDamage(20);
            if (e.type !== 'STAR_DESTROYER') e.hp = 0;
          }
        }

        if (e.y > height + 100 || e.hp <= 0) {
           if (e.hp <= 0) {
             incrementScore(e.scoreValue || 100);
             spawnParticle(e.x, e.y, '#FFA500', 15);
             playSound('explosion');
             // Drop Bonus Logic (Increased Rate)
             if (Math.random() < 0.25) spawnBonus(e.x, e.y); 

             if (e.type === 'STAR_DESTROYER') {
               incrementScore(2000); // Give exactly 1 wave worth of score
               bossSpawned.current = false;
               setTimeout(launchBriefing, 2000);
             }
           }
           enemies.current.splice(i, 1);
        }
      }
      
      // Wave Progression Threshold
      // STRICT RULE: Every 2000 points, go to next wave
      // (Wave 1 @ 0 -> Wave 2 @ 2000 -> Wave 3 @ 4000)
      if (!bossSpawned.current && currentScore >= currentWave * 2000) {
          launchBriefing();
          nextWave();
      }
    }

    // 4. Projectiles
    projectilePool.current.items.forEach(p => {
      if (!p.active) return;
      p.x += p.vx; p.y += p.vy;

      if (p.y < -50 || p.y > height + 50) { p.active = false; return; }

      if (p.isEnemy) {
        if (Math.hypot(p.x - player.current.x, p.y - player.current.y) < 20) {
          playerDied();
          takeDamage(10);
          screenShake.current = 10;
          spawnParticle(player.current.x, player.current.y, '#FF0000', 10);
          p.active = false;
        }
      } else {
        for (const e of enemies.current) {
          if (e.type?.startsWith('BONUS')) continue;
          if (Math.abs(p.x - e.x) < e.width/2 && Math.abs(p.y - e.y) < e.height/2) {
            e.hp--;
            p.active = false;
            spawnParticle(p.x, p.y, '#00FF00', 3);
            break;
          }
        }
      }
    });

    // 5. Particles
    particlePool.current.items.forEach(p => {
      if (p.active) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) p.active = false;
      }
    });

    // 6. Stars
    stars.current.forEach(star => {
        // Star speed boost when rapid fire is active
        const speedBoost = performance.now() < rapidFireUntil.current ? 5 : 1;
        star.y += star.speed * speedBoost;
        if (star.y > height) {
            star.y = 0;
            star.x = Math.random() * width;
        }
    });
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);
    
    stars.current.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.save();
    if (screenShake.current > 0) {
      const dx = (Math.random() - 0.5) * screenShake.current;
      const dy = (Math.random() - 0.5) * screenShake.current;
      ctx.translate(dx, dy);
    }

    if (gameState.current === 'PLAYING') {
        drawXWing(ctx, player.current.x, player.current.y, 30);
    }

    enemies.current.forEach(e => {
        if (e.type?.startsWith('BONUS')) drawBonus(ctx, e.x, e.y, e.type);
        else if (e.type === 'STAR_DESTROYER') drawStarDestroyer(ctx, e.x, e.y, e.width, e.height, e.hp/e.maxHp);
        else if (e.type === 'ASTEROID') {
            ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rotation);
            ctx.fillStyle = '#666'; 
            ctx.beginPath(); ctx.arc(0,0,e.width/2,0,Math.PI*2); ctx.fill();
            ctx.restore();
        }
        else drawTie(ctx, e.x, e.y, e.width, e.type || 'TIE_FIGHTER');
    });

    projectilePool.current.items.forEach(p => {
      if (p.active) {
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10; ctx.shadowColor = p.color;
        ctx.fillRect(p.x - p.width/2, p.y - p.height/2, p.width, p.height);
        ctx.shadowBlur = 0;
      }
    });

    particlePool.current.items.forEach(p => {
      if (p.active) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    });

    ctx.restore();
  };

  const gameLoop = useCallback((time: number) => {
    const dt = time - lastTime.current;
    lastTime.current = time;

    if (gameState.current === 'PLAYING' && !isPaused) {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            update(dt, width, height);
            draw(ctx, width, height);
        }
      }
    } 
    // If paused, just redraw to keep screen alive (optional, or just stop updating)
    else if (gameState.current === 'PLAYING' && isPaused && canvasRef.current) {
        const { width, height } = canvasRef.current;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) draw(ctx, width, height); // Redraw static frame
    }
    
    frameId.current = requestAnimationFrame(gameLoop);
  }, [isPaused]);

  // --- LIFECYCLE ---

  const init = () => {
    resetGame();
    projectilePool.current.reset();
    particlePool.current.reset();
    enemies.current = [];
    weaponLevel.current = 1;
    rapidFireUntil.current = 0;
    gameState.current = 'MENU';
    setUiState('MENU');
    bossSpawned.current = false;
    setIsPaused(false);

    stars.current = [];
    const w = window.innerWidth;
    const h = window.innerHeight;
    for(let i=0; i<STAR_COUNT; i++) {
        stars.current.push({
            x: Math.random() * w,
            y: Math.random() * h,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.8 + 0.2
        });
    }
  };

  const launchBriefing = () => {
    gameState.current = 'BRIEFING';
    setUiState('BRIEFING');
    // We need fresh state here too, but since launchBriefing is called from update or onClick (which triggers re-render), 
    // relying on component prop is safer or use getState.
    // However, gameWave inside update() is fresh. 
    // But for the Text UI, we use the component state which will update on re-render.
    // So reading gameWave here is fine as it comes from the store hook.
    const currentWave = useStore.getState().gameWave; 
    // Note: If called from update(), nextWave() was JUST called.
    // So the store has the NEW wave number.
    
    const mission = MISSIONS[(currentWave - 1) % MISSIONS.length] || MISSIONS[0];
    setBriefingData(mission);
  };

  const launchWave = () => {
    gameState.current = 'PLAYING';
    setUiState('HUD');
  };

  const togglePause = () => {
      setIsPaused(!isPaused);
  };

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      init();
    }
    frameId.current = requestAnimationFrame(gameLoop);
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const x = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const y = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      pointer.current = { x, y };
    };
    
    const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'p') {
            if (gameState.current === 'PLAYING') togglePause();
        }
    };
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('resize', () => {
       if(canvasRef.current) {
         canvasRef.current.width = window.innerWidth;
         canvasRef.current.height = window.innerHeight;
       }
    });

    return () => {
      cancelAnimationFrame(frameId.current);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('keydown', handleKey);
    };
  }, [gameLoop, isPaused]);

  useEffect(() => {
    if (gameLives <= 0 && gameState.current === 'PLAYING') {
      gameState.current = 'GAMEOVER';
      setUiState('GAMEOVER');
    }
  }, [gameLives]);

  return (
    <div ref={containerRef} className="fixed inset-0 h-[100dvh] w-screen bg-black z-50 overflow-hidden cursor-none touch-none select-none font-sans">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* --- HUD: CLEAN SCI-FI STYLE --- */}
      {uiState === 'HUD' && (
        <div className="absolute inset-0 pointer-events-none">
           {/* Top Info Bar */}
           <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              <div className="flex flex-col bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-lg">
                 <span className="text-yellow-400 text-[10px] tracking-widest uppercase font-bold">Score</span>
                 <span className="text-white text-2xl font-black font-mono tracking-tighter">{gameScore.toString().padStart(6, '0')}</span>
              </div>
              
              <div className="flex gap-4 items-center pointer-events-auto">
                 <button onClick={togglePause} className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 shadow-lg text-white hover:bg-white/10 transition-colors">
                     <Pause size={20} />
                 </button>
                 <div className="flex flex-col items-end bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-lg">
                    <span className="text-red-400 text-[10px] tracking-widest uppercase font-bold">Vague</span>
                    <span className="text-white text-2xl font-black">{gameWave}</span>
                 </div>
              </div>
           </div>
           
           {/* Bottom Status Bar */}
           <div className="absolute bottom-6 w-full px-6 flex justify-between items-end">
              {/* Health */}
              <div className="bg-gradient-to-t from-blue-900/40 to-transparent border-b-2 border-blue-500 p-3 rounded-t-lg backdrop-blur-sm">
                 <div className="flex items-center gap-2 mb-1">
                     <Shield size={14} className="text-blue-400" />
                     <span className="text-blue-200 text-xs font-bold uppercase tracking-wider">Boucliers</span>
                 </div>
                 <div className="flex gap-1">
                   {[...Array(5)].map((_, i) => (
                     <div key={i} className={`w-6 h-2 skew-x-12 transition-all duration-300 ${i < gameLives ? 'bg-blue-400 shadow-[0_0_10px_#4488FF]' : 'bg-gray-800'}`} />
                   ))}
                 </div>
              </div>
              
              {/* Weapons */}
              <div className="bg-gradient-to-t from-red-900/40 to-transparent border-b-2 border-red-500 p-3 rounded-t-lg backdrop-blur-sm text-right">
                 <div className="flex items-center justify-end gap-2 mb-1">
                     <span className="text-red-200 text-xs font-bold uppercase tracking-wider">Systèmes</span>
                     <Zap size={14} className="text-red-400" />
                 </div>
                 <div className="flex items-center gap-3">
                     <span className={`text-xs font-mono transition-colors ${weaponLevel.current === 1 ? 'text-white' : 'text-gray-600'}`}>STANDARD</span>
                     <div className={`w-2 h-2 rounded-full ${weaponLevel.current > 1 ? 'bg-green-500 animate-pulse' : 'bg-gray-800'}`} />
                     <div className={`w-2 h-2 rounded-full ${weaponLevel.current > 2 ? 'bg-green-500 animate-pulse' : 'bg-gray-800'}`} />
                     <span className={`text-xs font-mono font-bold transition-colors ${weaponLevel.current > 1 ? 'text-green-400' : 'text-gray-600'}`}>
                        {weaponLevel.current === 1 ? 'DUAL' : weaponLevel.current === 2 ? 'QUAD' : 'MAX'}
                     </span>
                 </div>
              </div>
           </div>
           
           {/* Damage Overlay */}
           {screenShake.current > 10 && (
             <div className="absolute inset-0 border-[20px] border-red-500/30 blur-xl animate-pulse" />
           )}
        </div>
      )}

      {/* --- MENU OVERLAY --- */}
      {uiState === 'MENU' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-center z-10 cursor-auto">
          <div className="relative">
             <div className="absolute -inset-10 bg-yellow-500/20 blur-3xl rounded-full" />
             <h1 className="relative text-7xl text-yellow-400 font-black tracking-tighter mb-2 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] uppercase">Rogue<br/>Squadron</h1>
          </div>
          <p className="text-blue-300 tracking-[0.5em] mb-12 text-xs font-bold">TACTICAL SPACE SIMULATION</p>
          <button onClick={launchBriefing} className="bg-yellow-500 text-black px-12 py-4 rounded-sm hover:scale-105 transition-transform flex items-center gap-3 uppercase font-black tracking-widest text-xl shadow-[0_0_20px_rgba(255,200,0,0.6)]">
            <Play size={24} fill="black" /> Décoller
          </button>
        </div>
      )}

      {/* --- BRIEFING OVERLAY --- */}
      {uiState === 'BRIEFING' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20 cursor-auto">
          <div className="max-w-2xl w-full border-y-2 border-green-500/50 p-12 text-green-500 font-mono bg-black/90 relative overflow-hidden">
             {/* Grid Background */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(0,50,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,50,0,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
             
             <div className="relative z-10">
                 <div className="flex justify-between items-center mb-8 border-b border-green-800/50 pb-4">
                    <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-green-700">Canal Crypté #882</h2>
                    <Disc className="animate-spin text-green-500" />
                 </div>
                 
                 <h3 className="text-4xl text-white mb-6 uppercase font-bold tracking-tighter">{briefingData.title}</h3>
                 <p className="text-xl leading-relaxed mb-12 text-green-400 opacity-90">{briefingData.text}<span className="animate-pulse">_</span></p>
                 
                 <button onClick={launchWave} className="w-full bg-green-900/20 border border-green-500 py-5 hover:bg-green-500 hover:text-black transition-all font-bold uppercase tracking-[0.3em] text-lg">
                   ENGAGER
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* --- PAUSE OVERLAY --- */}
      {isPaused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-lg z-40 cursor-auto">
              {/* Pause Icon */}
              <div className="mb-8 relative">
                  <Pause className="text-cyan-400 w-24 h-24 animate-pulse" />
                  <div className="absolute inset-0 bg-cyan-400/20 blur-3xl"></div>
              </div>
              
              <h2 className="text-6xl md:text-7xl text-white font-black tracking-widest mb-4 uppercase">Pause</h2>
              <p className="text-gray-400 text-sm uppercase tracking-widest mb-12">Mission en Attente</p>
              
              {/* Menu Buttons */}
              <div className="flex flex-col gap-4 w-full max-w-md px-6">
                  {/* Continue Button - Primary */}
                  <button 
                      onClick={togglePause} 
                      className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black text-lg hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-[1.02] active:scale-[0.98]"
                  >
                      <Play size={24} fill="white" className="group-hover:animate-pulse" />
                      Continuer la Mission
                  </button>
                  
                  {/* Restart Button - Secondary */}
                  <button 
                      onClick={() => { setIsPaused(false); init(); launchBriefing(); }} 
                      className="px-10 py-4 bg-white/10 border-2 border-white/30 text-white font-bold hover:bg-white/20 hover:border-white/50 transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-wide rounded-lg backdrop-blur-sm"
                  >
                      <RefreshCw size={20} />
                      Recommencer
                  </button>
                  
                  {/* Quit Button - Danger */}
                  <button 
                      onClick={() => { setIsPaused(false); setScene('ORBIT'); }} 
                      className="px-10 py-4 bg-red-900/20 border-2 border-red-500/30 text-red-400 font-bold hover:bg-red-900/40 hover:border-red-500/60 hover:text-red-300 transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-wide rounded-lg"
                  >
                      <LogOut size={20} />
                      Quitter le Jeu
                  </button>
              </div>
              
              {/* Stats Display */}
              <div className="mt-12 flex gap-8 text-center">
                  <div className="flex flex-col">
                      <span className="text-gray-500 text-xs uppercase tracking-widest mb-1">Score</span>
                      <span className="text-white text-2xl font-mono font-bold">{gameScore}</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-gray-500 text-xs uppercase tracking-widest mb-1">Vague</span>
                      <span className="text-cyan-400 text-2xl font-mono font-bold">{gameWave}</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-gray-500 text-xs uppercase tracking-widest mb-1">Vies</span>
                      <span className="text-green-400 text-2xl font-mono font-bold">{gameLives}</span>
                  </div>
              </div>
              
              {/* Hint */}
              <p className="mt-8 text-gray-600 text-xs uppercase tracking-widest">Appuyez sur ESC pour reprendre</p>
          </div>
      )}

      {/* --- GAME OVER --- */}
      {uiState === 'GAMEOVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 text-center z-30 cursor-auto">
           <Skull className="text-red-500 w-20 h-20 mb-6 animate-pulse" />
           <h2 className="text-6xl text-red-500 font-black mb-4 tracking-tighter uppercase">Échec Mission</h2>
           <div className="flex flex-col gap-1 mb-12">
               <p className="text-gray-400 text-sm uppercase tracking-widest">Score Final</p>
               <p className="text-white font-mono text-4xl">{gameScore}</p>
           </div>
           
           <div className="flex gap-4">
              <button onClick={init} className="px-8 py-3 bg-white text-black font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 uppercase tracking-wide rounded-sm">
                 <RefreshCw size={18} /> Rejouer
              </button>
              <button onClick={() => setScene('ORBIT')} className="px-8 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 uppercase tracking-wide rounded-sm">
                 <LogOut size={18} /> Retour à la base
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
