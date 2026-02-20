
import { create } from 'zustand';
import { SceneState, Product, CartItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  scene: SceneState;
  selectedProduct: Product | null;
  isAdmin: boolean;
  products: Product[];
  
  // Cart State
  cart: CartItem[];
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  isShopOpen: boolean;

  // Game State
  gameScore: number;
  gameHealth: number;
  gameLives: number;
  gameWave: number;
  highScore: number;
  isGameOver: boolean;

  // Actions
  setScene: (scene: SceneState) => void;
  setSelectedProduct: (product: Product | null) => void;
  toggleAdmin: () => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;

  // Cart Actions
  addToCart: (product: Product, size: string, color: string) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  toggleCart: (isOpen?: boolean) => void;
  toggleCheckout: (isOpen?: boolean) => void;
  toggleShop: (isOpen?: boolean) => void;

  // Game Actions
  startGame: () => void;
  endGame: () => void;
  resetGame: () => void;
  incrementScore: (points: number) => void;
  takeDamage: (amount: number) => void;
  gainLife: () => void;
  nextWave: () => void;
  playerDied: () => void;
}

// Initial Mock Data - DISABLED - Using Appwrite data only
const INITIAL_PRODUCTS: Product[] = [];

export const useStore = create<AppState>((set) => ({
  scene: 'ORBIT',
  selectedProduct: null,
  isAdmin: false,
  products: INITIAL_PRODUCTS,
  
  cart: [],
  isCartOpen: false,
  isCheckoutOpen: false,
  isShopOpen: false,

  gameScore: 0,
  gameHealth: 100,
  gameLives: 3,
  gameWave: 1,
  highScore: parseInt(localStorage.getItem('neon_vanguard_highscore') || '0'),
  isGameOver: false,

  setScene: (scene) => set({ scene }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  toggleAdmin: () => set((state) => ({ isAdmin: !state.isAdmin })),
  setProducts: (products) => set({ products }),
  
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
  updateProduct: (product) => set((state) => ({
    products: state.products.map((p) => (p.id === product.id ? product : p))
  })),
  deleteProduct: (id) => set((state) => ({
    products: state.products.filter((p) => p.id !== id)
  })),

  // Cart Implementation
  addToCart: (product, size, color) => set((state) => {
    // Check if item already exists with same size/color
    const existingItem = state.cart.find(
      item => item.id === product.id && item.selectedSize === size && item.selectedColor === color
    );

    if (existingItem) {
      return {
        cart: state.cart.map(item => 
          item.cartId === existingItem.cartId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
        isCartOpen: true // Auto open cart on add
      };
    }

    const newItem: CartItem = {
      ...product,
      cartId: uuidv4(),
      selectedSize: size,
      selectedColor: color,
      quantity: 1
    };

    return { 
      cart: [...state.cart, newItem],
      isCartOpen: true 
    };
  }),

  removeFromCart: (cartId) => set((state) => ({
    cart: state.cart.filter((item) => item.cartId !== cartId)
  })),

  clearCart: () => set({ cart: [] }),

  toggleCart: (isOpen) => set((state) => ({ 
    isCartOpen: isOpen !== undefined ? isOpen : !state.isCartOpen 
  })),

  toggleCheckout: (isOpen) => set((state) => ({
    isCheckoutOpen: isOpen !== undefined ? isOpen : !state.isCheckoutOpen
  })),

  toggleShop: (isOpen) => set((state) => ({
    isShopOpen: isOpen !== undefined ? isOpen : !state.isShopOpen
  })),

  // Game Logic
  startGame: () => set({ scene: 'GAME', gameScore: 0, gameHealth: 100, gameLives: 3, gameWave: 1, isGameOver: false }),
  endGame: () => set((state) => {
    const newHigh = Math.max(state.gameScore, state.highScore);
    localStorage.setItem('neon_vanguard_highscore', newHigh.toString());
    return { isGameOver: true, highScore: newHigh };
  }),
  resetGame: () => set({ gameScore: 0, gameHealth: 100, gameLives: 3, gameWave: 1, isGameOver: false }),
  incrementScore: (points) => set((state) => ({ gameScore: state.gameScore + points })),
  takeDamage: (amount) => set((state) => {
    const newHealth = state.gameHealth - amount;
    return { 
      gameHealth: newHealth
    };
  }),
  gainLife: () => set((state) => ({ gameLives: Math.min(state.gameLives + 1, 3) })),
  nextWave: () => set((state) => ({ gameWave: state.gameWave + 1 })),
  playerDied: () => set((state) => {
    const lives = state.gameLives - 1;
    if (lives <= 0) {
        const newHigh = Math.max(state.gameScore, state.highScore);
        localStorage.setItem('neon_vanguard_highscore', newHigh.toString());
        return { gameLives: 0, isGameOver: true, highScore: newHigh };
    }
    return { gameLives: lives, gameHealth: 100 };
  })
}));
