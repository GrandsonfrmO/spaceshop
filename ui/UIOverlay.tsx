
import React from 'react';
import { useStore } from '../store/useStore';
import { Settings, ShoppingBag, Grid, LogOut } from 'lucide-react';

export const UIOverlay: React.FC = () => {
  const toggleAdmin = useStore((state) => state.toggleAdmin);
  const toggleCart = useStore((state) => state.toggleCart);
  const toggleShop = useStore((state) => state.toggleShop);
  const setScene = useStore((state) => state.setScene);
  const scene = useStore((state) => state.scene);
  const cart = useStore((state) => state.cart);
  
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Secret admin access on mobile: 20 taps on logo
  const [tapCount, setTapCount] = React.useState(0);
  const tapTimeoutRef = React.useRef<NodeJS.Timeout>();

  const handleLogoTap = () => {
    setTapCount(prev => prev + 1);
    
    // Clear previous timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    // Reset tap count after 5 seconds
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 5000);

    // If 20 taps detected, open admin
    if (tapCount + 1 === 20) {
      toggleAdmin();
      setTapCount(0);
      console.log('🔐 Admin access via 20 taps');
    }
  };

  // If playing Neon Vanguard, hide the standard store UI completely
  if (scene === 'GAME') {
      return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-30">
      {/* Brand - 20 taps to access admin on mobile */}
      <div 
        className="absolute top-6 left-6 pointer-events-auto cursor-pointer select-none"
        onClick={handleLogoTap}
        onTouchEnd={handleLogoTap}
      >
        <h1 className="text-2xl font-black tracking-widest">GRANDSON</h1>
        <p className="text-xs text-gray-400 tracking-[0.3em]">IMMERSIVE STORE</p>
      </div>

      {/* Top Right Actions */}
      <div className="absolute top-6 right-6 pointer-events-auto flex items-center gap-3">
        {/* Catalogue Icon Button */}
        <button 
          onClick={() => toggleShop(true)}
          className="p-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full transition-all duration-300 hover:scale-105"
          title="Open Catalogue"
        >
          <Grid size={24} className="text-white" />
        </button>

        {/* Cart Button */}
        <button 
            onClick={() => toggleCart(true)}
            className="group relative p-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full transition-all duration-300 hover:scale-105"
        >
            <ShoppingBag size={24} className="text-white" />
            {cartCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold border border-black">
                    {cartCount}
                </div>
            )}
        </button>
      </div>

      {/* Bottom Actions (Exit only - Admin hidden) */}
      <div className="absolute bottom-6 left-6 pointer-events-auto flex items-center gap-6">
         {/* Admin button hidden - Access via URL: /admin or keyboard shortcut */}
         
         {scene === 'BOUTIQUE' && (
            <button 
              onClick={() => setScene('ORBIT')}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors bg-red-900/10 px-3 py-1.5 rounded-full border border-red-500/20"
            >
              <LogOut size={14} />
              EXIT STORE
            </button>
         )}
      </div>

      {/* Helper Text */}
      {scene === 'ORBIT' && (
        <div className="absolute bottom-10 w-full text-center pointer-events-none">
          <p className="text-white/50 text-sm animate-pulse tracking-widest uppercase">Click the base to enter</p>
        </div>
      )}
    </div>
  );
};
