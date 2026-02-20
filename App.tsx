
import React, { useEffect } from 'react';
import { SceneCanvas } from './canvas/SceneCanvas';
import { ProductOverlay } from './ui/ProductOverlay';
import { AdminPanel } from './ui/AdminPanel';
import { UIOverlay } from './ui/UIOverlay';
import { CartSidebar } from './ui/CartSidebar';
import { CheckoutModal } from './ui/CheckoutModal';
import { ShopModal } from './ui/ShopModal';
import { NeonVanguard } from './game/NeonVanguard';
import { useStore } from './store/useStore';
import { useAppwriteSync } from './hooks/useAppwrite';
import { DebugPage } from './DEBUG';

function App() {
  const scene = useStore(state => state.scene);
  
  // Vérifier si les variables d'environnement sont chargées
  const hasRequiredEnv = import.meta.env.VITE_APPWRITE_PROJECT_ID && 
                         import.meta.env.VITE_APPWRITE_DATABASE_ID;
  
  // Synchroniser avec Appwrite au démarrage
  useAppwriteSync();

  // Si les variables d'environnement ne sont pas chargées, afficher la page de debug
  if (!hasRequiredEnv) {
    return <DebugPage />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      {/* 3D Scene Layer - Only render if NOT in game to save performance */}
      {scene !== 'GAME' && (
        <div className="absolute inset-0 z-0">
          <SceneCanvas />
        </div>
      )}

      {/* 2D Game Layer */}
      {scene === 'GAME' && <NeonVanguard />}

      {/* UI Overlay Layer */}
      <UIOverlay />
      
      {/* Modals & Panels */}
      <ShopModal />
      <ProductOverlay />
      <CartSidebar />
      <CheckoutModal />
      <AdminPanel />
    </div>
  );
}

export default App;
