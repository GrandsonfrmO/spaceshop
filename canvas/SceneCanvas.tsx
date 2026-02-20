
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Loader } from '@react-three/drei';
import { TheOrbit } from './TheOrbit';
import { TheBoutique } from './TheBoutique';
import { CameraRig } from './CameraRig';
import { useStore } from '../store/useStore';

export const SceneCanvas: React.FC = () => {
  const sceneState = useStore((state) => state.scene);

  // If in GAME mode, we unmount the 3D scene entirely to give full resources to the 2D Canvas game
  if (sceneState === 'GAME') return null;

  return (
    <div className="w-full h-screen bg-black">
      <Canvas shadows camera={{ position: [0, 2, 15], fov: 45 }}>
        <Suspense fallback={null}>
          <CameraRig />
          
          {(sceneState === 'ORBIT' || sceneState === 'TRANSITIONING') && <TheOrbit />}
          
          {sceneState === 'BOUTIQUE' && <TheBoutique />}
          
          <Environment preset="city" />
        </Suspense>
      </Canvas>
      <Loader 
        containerStyles={{ background: 'black' }}
        innerStyles={{ width: '50vw' }}
        barStyles={{ height: '5px', background: 'white' }}
        dataStyles={{ fontSize: '12px', color: 'white' }}
      />
    </div>
  );
};
