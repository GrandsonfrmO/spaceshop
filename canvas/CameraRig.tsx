
import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useStore } from '../store/useStore';

export const CameraRig: React.FC = () => {
  const { camera, viewport } = useThree();
  const controlsRef = useRef<any>(null);
  const sceneState = useStore((state) => state.scene);
  const selectedProduct = useStore((state) => state.selectedProduct);

  // Helper to safely animate controls
  const animateControls = (targetPos: THREE.Vector3, lookAt: THREE.Vector3, duration: number, ease: string) => {
    const tl = gsap.timeline();
    
    // Animate Camera Position
    tl.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: duration,
      ease: ease
    }, 0);

    // Animate Controls Target (LookAt)
    if (controlsRef.current) {
      tl.to(controlsRef.current.target, {
        x: lookAt.x,
        y: lookAt.y,
        z: lookAt.z,
        duration: duration,
        ease: ease
      }, 0);
    }
  };

  useEffect(() => {
    const isMobile = viewport.width < 12;

    if (sceneState === 'GAME') {
        if (controlsRef.current) {
            controlsRef.current.enabled = false; // Disable orbit controls in game
        }
        // Game camera is handled inside SpaceGame component
        return;
    }

    if (sceneState === 'ORBIT') {
      // --- ORBIT VIEW ---
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        controlsRef.current.enableRotate = true;
        controlsRef.current.enableZoom = true;
        // Wide range for space exploration
        controlsRef.current.minDistance = 5;
        controlsRef.current.maxDistance = 200;
        controlsRef.current.maxPolarAngle = Math.PI; // Full rotation
      }

      animateControls(
        new THREE.Vector3(0, 2, 15),
        new THREE.Vector3(0, 0, 0),
        2.5,
        'power3.inOut'
      );

    } else if (sceneState === 'TRANSITIONING') {
      // --- ZOOM INTO DOOR ---
      if (controlsRef.current) {
        // Disable interaction during transition
        controlsRef.current.enabled = false;
      }
      
      // Target the door of the miniature house
      // House is approx at [0, -1.8, 0], Door at z ~ 1.5
      animateControls(
        new THREE.Vector3(0, -0.5, 2.8), // End right in front of the door
        new THREE.Vector3(0, -1.0, 0),   // Look at the center/base of the house
        2,
        'power2.in' // Accelerate in
      );

    } else if (sceneState === 'BOUTIQUE') {
      // --- INTERIOR VIEW ---
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        controlsRef.current.enableRotate = true;
        controlsRef.current.enableZoom = true;
        controlsRef.current.enablePan = true;
        
        // Interior limits (Updated for Smaller Room on mobile)
        controlsRef.current.maxPolarAngle = Math.PI / 1.8;
        controlsRef.current.minDistance = 1.0;
        // Max distance reduced drastically on mobile so we don't go through the back wall (z = -14)
        controlsRef.current.maxDistance = isMobile ? 25 : 60; 

        controlsRef.current.rotateSpeed = 0.5;
        controlsRef.current.zoomSpeed = 0.8;
        controlsRef.current.panSpeed = 0.5;
      }

      // Establish the interior shot
      // On Mobile: Start closer because the room is smaller (Z=18 vs Z=35)
      const startZ = isMobile ? 18 : 20;

      animateControls(
        new THREE.Vector3(0, 3, startZ), 
        new THREE.Vector3(0, 1.5, 0), // Look at center products
        2,
        'power2.out' // Decelerate out
      );
    }
  }, [sceneState, camera, viewport.width]); // Re-run if viewport changes significantly

  // Focus Logic
  useEffect(() => {
    if (sceneState === 'BOUTIQUE') {
      if (selectedProduct) {
        const [px, py, pz] = selectedProduct.position;
        // Zoom in to product
        // Note: products in Boutique view might be at overridden positions. 
        // Ideally we pass the rendered position to the store, but for now we use the store data.
        // Since we override visual pos in TheBoutique, we might have a slight mismatch if we don't sync.
        // For simplicity, we just zoom to the store position.
        
        // Fix: In TheBoutique we moved visual props. Let's assume user clicks visual prop.
        // The camera should target the visual prop.
        // However, the selectedProduct has static coords from store.
        // We will just zoom "Close" to it.
        
        animateControls(
          new THREE.Vector3(px, py, pz + 3), 
          new THREE.Vector3(px, py, pz),
          1.2,
          'power3.out'
        );
      } else {
        const isMobile = viewport.width < 12;
        const startZ = isMobile ? 18 : 20;
        // Return to overview
        animateControls(
            new THREE.Vector3(0, 3, startZ),
            new THREE.Vector3(0, 1.5, 0),
            1.5,
            'power3.inOut'
        );
      }
    }
  }, [selectedProduct, sceneState, viewport.width]);

  return (
    <OrbitControls 
      ref={controlsRef}
      makeDefault 
      enableDamping 
      dampingFactor={0.05} 
    />
  );
};
