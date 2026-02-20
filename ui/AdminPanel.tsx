
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useProducts, useOrders } from '../hooks/useAppwrite';
import { storageService } from '../services/appwriteService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Package, ShoppingCart, Settings, 
  LogOut, Plus, Search, Edit2, Trash2, X, Save, Upload, Tag,
  Activity, ArrowUpRight, DollarSign, Box, ChevronLeft, Image as ImageIcon, TrendingUp
} from 'lucide-react';
import { Product } from '../types';
import { v4 as uuidv4 } from 'uuid';

const CATEGORIES = ['Vêtements', 'Pantalons', 'Accessoires', 'Chaussures', 'Édition Limitée', 'Autre'];
const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

export const AdminPanel: React.FC = () => {
  const { isAdmin, products, toggleAdmin } = useStore();
  const { createProduct, editProduct, removeProduct } = useProducts();
  const { getOrders } = useOrders();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders'>('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // State for the product being edited
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [colorInput, setColorInput] = useState('');
  
  // Mobile search state
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les commandes au démarrage
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const fetchedOrders = await getOrders();
        setOrders(fetchedOrders || []);
      } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    loadOrders();
  }, []);

  // Filter products for the list view
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) return null;

  // --- VRAIES DONNÉES ---
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  const stats = [
    { 
      label: 'Revenu Total', 
      value: (totalRevenue / 1000000).toFixed(1) + 'M', 
      prefix: 'GNF', 
      change: '+12.5%', 
      icon: DollarSign, 
      color: 'text-green-400', 
      bg: 'bg-green-500/10',
      fullValue: totalRevenue
    },
    { 
      label: 'Commandes', 
      value: totalOrders.toString(), 
      change: `${pendingOrders} en attente`, 
      icon: ShoppingCart, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10',
      fullValue: totalOrders
    },
    { 
      label: 'Produits', 
      value: totalProducts.toString(), 
      change: '+2 récents', 
      icon: Box, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10',
      fullValue: totalProducts
    },
    { 
      label: 'Livraisons', 
      value: deliveredOrders.toString(), 
      change: `${shippedOrders} en cours`, 
      icon: TrendingUp, 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/10',
      fullValue: deliveredOrders
    },
  ];

  // --- HANDLERS ---

  const handleEdit = (product?: Product) => {
    if (product) {
      // Deep copy to avoid mutating store directly before save
      setCurrentProduct(JSON.parse(JSON.stringify(product)));
    } else {
      // New Product Template
      setCurrentProduct({
        id: uuidv4(),
        name: '',
        price: 0,
        category: 'Vêtements',
        description: '',
        imageUrl: '',
        sizes: ['M', 'L'],
        colors: ['Noir'],
        position: [0, 0, 0]
      });
    }
    setColorInput('');
    setIsEditing(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentProduct(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSize = (size: string) => {
    const sizes = currentProduct.sizes || [];
    if (sizes.includes(size)) {
      setCurrentProduct({ ...currentProduct, sizes: sizes.filter(s => s !== size) });
    } else {
      setCurrentProduct({ ...currentProduct, sizes: [...sizes, size] });
    }
  };

  const addColor = () => {
    if (colorInput.trim()) {
      const colors = currentProduct.colors || [];
      if (!colors.includes(colorInput.trim())) {
        setCurrentProduct({ ...currentProduct, colors: [...colors, colorInput.trim()] });
      }
      setColorInput('');
    }
  };

  const removeColor = (color: string) => {
    const colors = currentProduct.colors || [];
    setCurrentProduct({ ...currentProduct, colors: colors.filter(c => c !== color) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct.imageUrl) {
        alert("L'image est obligatoire.");
        return;
    }
    
    setIsSaving(true);
    try {
      let imageUrl = currentProduct.imageUrl;
      
      // Si l'image est en base64 (data URL), l'uploader d'abord
      if (imageUrl.startsWith('data:')) {
        // Convertir data URL en blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'product-image.jpg', { type: 'image/jpeg' });
        
        // Uploader l'image
        const uploadedUrl = await storageService.uploadImage(file);
        if (!uploadedUrl) {
          alert('Erreur lors de l\'upload de l\'image');
          setIsSaving(false);
          return;
        }
        imageUrl = uploadedUrl;
      }
      
      // Mettre à jour l'URL de l'image
      const productToSave = { ...currentProduct, imageUrl };
      
      // Check if updating or adding
      const exists = products.some(p => p.id === currentProduct.id);
      
      if (exists) {
        // Update existing product
        await editProduct(currentProduct.id!, productToSave);
      } else {
        // Create new product
        await createProduct(productToSave);
      }
      setIsEditing(false);
      alert('Produit sauvegardé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du produit');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await removeProduct(productId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du produit');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020202] text-white font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <div className="hidden md:flex w-72 border-r border-white/5 bg-[#050505] flex-col justify-between">
        <div>
            <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
                <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(255,255,255,0.3)]">G</div>
                <div>
                    <h1 className="font-black tracking-[0.2em] text-lg">GRANDSON</h1>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Admin v2.0</p>
                </div>
            </div>

            <nav className="p-4 space-y-2 mt-4">
                <NavButton icon={<LayoutDashboard />} label="Tableau de bord" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavButton icon={<Package />} label="Produits" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
                <NavButton icon={<ShoppingCart />} label="Commandes" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} badge="3" />
            </nav>
        </div>
        <div className="p-4 border-t border-white/5">
            <button onClick={toggleAdmin} className="flex items-center gap-3 text-gray-500 hover:text-red-400 hover:bg-red-500/5 w-full p-3 rounded-xl transition-all">
                <LogOut size={20} />
                <span className="font-medium">Quitter</span>
            </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-black">
        
        {/* Header (Mobile & Desktop) */}
        <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black/50 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-3 md:hidden">
               <div className="w-8 h-8 bg-white text-black rounded flex items-center justify-center font-black">G</div>
               <span className="font-bold tracking-widest text-sm">ADMIN</span>
            </div>
            <h2 className="hidden md:block text-xl font-bold uppercase tracking-widest text-gray-200">{activeTab === 'dashboard' ? "Vue d'ensemble" : activeTab}</h2>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-green-400 uppercase hidden md:inline">Live</span>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 overflow-hidden border border-white/20">
                    <img src="https://ui-avatars.com/api/?name=Admin&background=random&color=fff" alt="Admin" />
                </div>
            </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            
            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Stats Grid - Amélioré */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                        {stats.map((stat, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 hover:border-white/20 p-4 md:p-6 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-white/5"
                            >
                                {/* Background gradient effect */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${stat.bg}`} />
                                
                                <div className={`absolute top-3 right-3 p-2 md:p-3 rounded-lg ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                    <stat.icon size={18} className="md:w-6 md:h-6" />
                                </div>
                                
                                <div className="relative z-10">
                                    <p className="text-gray-400 text-[10px] md:text-xs uppercase font-bold tracking-wider mb-2 md:mb-3">{stat.label}</p>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-2xl md:text-4xl font-mono font-bold text-white">{stat.value}</span>
                                        {stat.prefix && <span className="text-[10px] text-gray-500 font-mono">{stat.prefix}</span>}
                                        <p className="text-[10px] md:text-xs text-gray-500 mt-1">{stat.change}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Tableau des Commandes Récentes */}
                    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <ShoppingCart size={20} />
                                Commandes Récentes
                            </h3>
                        </div>
                        
                        {orders.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider sticky top-0">
                                        <tr>
                                            <th className="p-4">Client</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4">Total</th>
                                            <th className="p-4">Statut</th>
                                            <th className="p-4">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {orders.slice(0, 5).map((order, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-4 font-medium">{order.customerName}</td>
                                                <td className="p-4 text-gray-400 text-xs">{order.customerEmail}</td>
                                                <td className="p-4 font-mono font-bold">{(order.total / 1000000).toFixed(1)}M GNF</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        order.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                                                        order.status === 'shipped' ? 'bg-purple-500/20 text-purple-400' :
                                                        order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-400 text-xs">
                                                    {new Date(order.createdAt || order.$createdAt).toLocaleDateString('fr-FR')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Aucune commande pour le moment</p>
                            </div>
                        )}
                    </div>

                    {/* Statistiques des Commandes */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 p-4 rounded-xl">
                            <p className="text-gray-400 text-xs uppercase mb-2">En Attente</p>
                            <p className="text-2xl font-bold text-yellow-400">{pendingOrders}</p>
                        </div>
                        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 p-4 rounded-xl">
                            <p className="text-gray-400 text-xs uppercase mb-2">Confirmées</p>
                            <p className="text-2xl font-bold text-blue-400">{confirmedOrders}</p>
                        </div>
                        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 p-4 rounded-xl">
                            <p className="text-gray-400 text-xs uppercase mb-2">Expédiées</p>
                            <p className="text-2xl font-bold text-purple-400">{shippedOrders}</p>
                        </div>
                        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 p-4 rounded-xl">
                            <p className="text-gray-400 text-xs uppercase mb-2">Livrées</p>
                            <p className="text-2xl font-bold text-green-400">{deliveredOrders}</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-6 rounded-2xl border border-white/10">
                            <h3 className="font-bold mb-4">Actions Rapides</h3>
                            <button onClick={() => { setActiveTab('products'); handleEdit(); }} className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                                <Plus size={18} /> Nouveau Produit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
                <div className="h-full flex flex-col animate-in fade-in">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Chercher un produit..." 
                                className="w-full md:w-64 bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-white/30 outline-none text-white" 
                            />
                        </div>
                        <button 
                            onClick={() => handleEdit()} 
                            className="w-full md:w-auto bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-white/5"
                        >
                            <Plus size={18} /> Ajouter
                        </button>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex-1">
                        <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-black/40 text-gray-500 text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                                    <tr>
                                        <th className="p-5 border-b border-white/5">Produit</th>
                                        <th className="p-5 border-b border-white/5">Catégorie</th>
                                        <th className="p-5 border-b border-white/5">Prix</th>
                                        <th className="p-5 border-b border-white/5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredProducts.map(product => (
                                        <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-4 pl-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white/5 rounded-lg overflow-hidden border border-white/10">
                                                        <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="font-bold text-sm">{product.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-400 text-sm">{product.category}</td>
                                            <td className="p-4 font-mono text-sm">{product.price.toLocaleString()} GNF</td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEdit(product)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg"><Edit2 size={14} /></button>
                                                    <button onClick={() => handleDelete(product.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card Grid View */}
                    <div className="md:hidden grid grid-cols-1 gap-4 pb-20">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="bg-[#111] border border-white/5 rounded-xl p-4 flex gap-4 items-center shadow-lg">
                                <div className="w-20 h-20 bg-black rounded-lg overflow-hidden shrink-0 border border-white/10">
                                    <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white truncate">{product.name}</h4>
                                    <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                                    <p className="text-sm font-mono text-white">{product.price.toLocaleString()} GNF</p>
                                    
                                    <div className="flex gap-2 mt-3">
                                        <button 
                                            onClick={() => handleEdit(product)}
                                            className="flex-1 py-1.5 bg-white/10 rounded text-xs font-bold text-white text-center"
                                        >
                                            Modifier
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(product.id)}
                                            className="w-8 flex items-center justify-center bg-red-500/10 text-red-400 rounded"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'orders' && (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 text-gray-500">
                    <ShoppingCart size={48} className="mb-4 opacity-20" />
                    <h3 className="text-lg font-bold text-white mb-2">Gestion des Commandes</h3>
                    <p className="text-sm">Ce module sera disponible une fois l'API de paiement intégrée.</p>
                </div>
            )}
        </div>

        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 flex justify-around p-2 pb-6 z-40">
            <MobileNavButton icon={<LayoutDashboard size={20} />} label="Stats" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <MobileNavButton icon={<Package size={20} />} label="Produits" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
            <MobileNavButton icon={<ShoppingCart size={20} />} label="Ordres" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
            <button onClick={toggleAdmin} className="flex flex-col items-center gap-1 p-2 rounded-xl text-gray-500">
                <LogOut size={20} className="text-red-400" />
                <span className="text-[10px]">Sortir</span>
            </button>
        </div>

      </div>

      {/* --- EDIT MODAL (Responsive) --- */}
      <AnimatePresence>
        {isEditing && (
            <div className="fixed inset-0 z-[150] flex justify-end">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsEditing(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                
                {/* Slide Panel */}
                <motion.div 
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full md:w-[600px] bg-[#080808] h-full shadow-2xl flex flex-col border-l border-white/10"
                >
                    {/* Modal Header */}
                    <div className="h-16 md:h-20 border-b border-white/10 flex justify-between items-center px-6 bg-[#080808] shrink-0">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsEditing(false)} className="md:hidden p-2 -ml-2 text-gray-400"><ChevronLeft /></button>
                            <h2 className="text-lg font-bold uppercase flex items-center gap-2">
                                {products.some(p => p.id === currentProduct.id) ? 'Modifier Produit' : 'Créer Produit'}
                            </h2>
                        </div>
                        <button onClick={() => setIsEditing(false)} className="hidden md:block p-2 hover:bg-white/10 rounded-full text-gray-400"><X size={20} /></button>
                    </div>

                    {/* Modal Content - Scrollable Form */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                        
                        {/* Image Uploader */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Image du produit</label>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="relative aspect-video rounded-2xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer overflow-hidden group flex flex-col items-center justify-center gap-2"
                            >
                                {currentProduct.imageUrl ? (
                                    <>
                                        <img src={currentProduct.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="Preview" />
                                        <div className="z-10 bg-black/60 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md border border-white/10">
                                            <Upload size={14} /> <span className="text-xs font-bold">Changer l'image</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2"><ImageIcon className="text-gray-400" /></div>
                                        <span className="text-sm font-bold text-gray-400">Appuyer pour uploader</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Main Fields */}
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nom</label>
                                <input 
                                    type="text" 
                                    value={currentProduct.name || ''} 
                                    onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                                    className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white focus:border-white/40 outline-none text-lg font-medium"
                                    placeholder="Nom du produit" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Catégorie</label>
                                    <select 
                                        value={currentProduct.category || CATEGORIES[0]} 
                                        onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                                        className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white appearance-none outline-none"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Prix (GNF)</label>
                                    <input 
                                        type="number" 
                                        value={currentProduct.price || ''} 
                                        onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
                                        className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white font-mono focus:border-white/40 outline-none"
                                        placeholder="0" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sizes & Colors */}
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-6">
                            <h3 className="font-bold flex items-center gap-2"><Settings size={18} /> Configuration</h3>
                            
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Tailles</label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_SIZES.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => toggleSize(size)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                                                currentProduct.sizes?.includes(size)
                                                ? 'bg-white text-black border-white'
                                                : 'bg-transparent text-gray-500 border-white/10'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Couleurs</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {currentProduct.colors?.map(c => (
                                        <span key={c} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs flex items-center gap-2">
                                            {c}
                                            <button onClick={() => removeColor(c)}><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={colorInput} 
                                        onChange={e => setColorInput(e.target.value)}
                                        placeholder="Ajouter une couleur..."
                                        className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
                                    />
                                    <button onClick={addColor} className="px-4 bg-white/10 rounded-lg font-bold hover:bg-white/20">+</button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</label>
                             <textarea 
                                value={currentProduct.description || ''}
                                onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
                                className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white h-32 focus:border-white/40 outline-none resize-none"
                             />
                        </div>

                    </div>

                    {/* Footer Action */}
                    <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-[#080808] border-t border-white/10 z-20">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest text-lg hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={20} /> {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>

                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Components Helpers

const NavButton = ({ icon, label, active, onClick, badge }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all mb-1 ${
            active 
            ? 'bg-white text-black font-bold shadow-lg shadow-white/5' 
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
    >
        {icon}
        <span>{label}</span>
        {badge && <span className="ml-auto bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">{badge}</span>}
    </button>
);

const MobileNavButton = ({ icon, label, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            active ? 'text-white bg-white/10' : 'text-gray-500'
        }`}
    >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);
