import * as THREE from 'three';
import React from 'react';

// Augment the global JSX namespace to allow any R3F element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Allow any element in JSX to prevent "Property does not exist" errors
      [elemName: string]: any;
    }
  }
}

// Augment React's module JSX namespace (needed for React 18+ / newer TS)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export type SceneState = 'ORBIT' | 'TRANSITIONING' | 'BOUTIQUE' | 'GAME';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  sizes: string[];
  colors: string[];
  imageUrl: string;
  position: [number, number, number];
}

export interface CartItem extends Product {
  cartId: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export interface Poster {
  id: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}