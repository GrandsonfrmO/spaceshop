
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { X, Trash2, CreditCard, ShoppingBag, ArrowRight } from 'lucide-react';

export const CartSidebar: React.FC = () => {
  const { cart, isCartOpen, toggleCart, removeFromCart, toggleCheckout, toggleShop } = useStore();

  // Calculate Total
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleProceedToCheckout = () => {
      toggleCart(false);
      toggleCheckout(true);
  };

  const handleStartShopping = () => {
      toggleCart(false);
      toggleShop(true);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggleCart(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-[#0a0a0a] border-l border-white/10 shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0a0a0a]">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <ShoppingBag size={20} />
                VOTRE PANIER <span className="text-xs text-gray-500 font-normal ml-2">({cart.length})</span>
              </h2>
              <button 
                onClick={() => toggleCart(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                  <ShoppingBag size={48} opacity={0.2} />
                  <p>Votre panier est vide.</p>
                  <button 
                    onClick={handleStartShopping}
                    className="text-white border-b border-white pb-0.5 hover:opacity-70"
                  >
                    Voir le Catalogue
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map((item) => (
                    <motion.div 
                      layout
                      key={item.cartId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-4 bg-white/5 p-3 rounded-xl border border-white/5"
                    >
                      <div className="w-20 h-24 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-sm">{item.name}</h3>
                                <p className="font-mono text-sm">{item.price.toLocaleString('fr-GN')} GNF</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                <span className="text-white">{item.selectedSize}</span> • <span className="text-white">{item.selectedColor}</span>
                            </p>
                        </div>
                        <div className="flex justify-between items-end">
                             <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                             <button 
                                onClick={() => removeFromCart(item.cartId)}
                                className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-md transition-colors"
                             >
                                <Trash2 size={16} />
                             </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Checkout */}
            {cart.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-[#0a0a0a]">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-400">Sous-total</span>
                        <span className="text-xl font-bold font-mono">{total.toLocaleString('fr-GN')} GNF</span>
                    </div>
                    <button
                        onClick={handleProceedToCheckout}
                        className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        VALIDER LE PANIER <ArrowRight size={20} />
                    </button>
                    <div className="mt-4 flex justify-center gap-4 text-gray-600">
                        <CreditCard size={20} />
                        <span className="text-xs uppercase tracking-widest">Paiement Sécurisé</span>
                    </div>
                    <button onClick={handleStartShopping} className="w-full text-center text-gray-500 text-xs mt-4 hover:text-white">
                        Continuer les achats
                    </button>
                </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
