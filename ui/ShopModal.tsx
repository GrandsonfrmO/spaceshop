
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { X, ShoppingBag, Eye } from 'lucide-react';

export const ShopModal: React.FC = () => {
  const { products, isShopOpen, toggleShop, setSelectedProduct } = useStore();

  const handleProductClick = (product: any) => {
    setSelectedProduct(product); // This opens the existing ProductOverlay
    // We do NOT close the shop modal immediately, so the user can come back to the list easily
    // The ProductOverlay has a z-index higher than this modal
  };

  return (
    <AnimatePresence>
      {isShopOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[40] bg-[#050505] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 p-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <h2 className="text-3xl font-black tracking-tighter uppercase">Catalogue</h2>
               <span className="bg-white text-black text-xs font-bold px-2 py-1 rounded-full">{products.length} ITEMS</span>
            </div>
            <button 
              onClick={() => toggleShop(false)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
            >
              <X size={24} />
            </button>
          </div>

          {/* Grid Content */}
          <div className="max-w-7xl mx-auto p-4 md:p-12">
            <div className="grid grid-cols-2 gap-4 md:gap-8">
              {products.map((product) => (
                <motion.div 
                  key={product.id}
                  layoutId={`product-${product.id}`}
                  className="group relative bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-white/5"
                >
                  {/* Image Area */}
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    
                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                        <button 
                            onClick={() => handleProductClick(product)}
                            className="bg-white text-black px-4 py-2 md:px-6 md:py-3 rounded-full font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 text-xs md:text-sm"
                        >
                            <Eye size={16} />
                            <span className="hidden md:inline">VOIR DETAILS</span>
                            <span className="md:hidden">VOIR</span>
                        </button>
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-2 gap-1">
                        <h3 className="text-sm md:text-xl font-bold leading-tight">{product.name}</h3>
                        <span className="font-mono text-sm md:text-lg">{product.price.toLocaleString('fr-GN')} GNF</span>
                    </div>
                    <p className="text-gray-400 text-xs md:text-sm line-clamp-2 hidden md:block">{product.description}</p>
                    
                    <div className="mt-2 md:mt-4 flex gap-1 md:gap-2 flex-wrap">
                        {product.sizes.slice(0, 3).map(s => (
                            <span key={s} className="text-[10px] md:text-xs border border-white/10 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-gray-500">{s}</span>
                        ))}
                        {product.sizes.length > 3 && <span className="text-[10px] md:text-xs text-gray-500 py-0.5 md:py-1">+</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
