import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { productService, orderService } from '../services/appwriteService';

/**
 * Hook pour synchroniser le store Zustand avec Appwrite
 * Recharge les produits toutes les 2 secondes pour détecter les changements
 */
export const useAppwriteSync = () => {
    const setProducts = useStore(state => state.setProducts);

    useEffect(() => {
        // Charger les produits depuis Appwrite
        const loadProducts = async () => {
            try {
                const products = await productService.getAll();
                // TOUJOURS mettre à jour le store, même si la liste est vide
                setProducts(products);
                console.log('✅ Produits chargés depuis Appwrite:', products.length);
            } catch (error) {
                console.error('❌ Erreur lors du chargement des produits:', error);
            }
        };

        // Charger au démarrage
        loadProducts();

        // Recharger toutes les 2 secondes pour détecter les changements
        const interval = setInterval(loadProducts, 2000);

        // Nettoyer l'intervalle au démontage
        return () => clearInterval(interval);
    }, [setProducts]);
};

/**
 * Hook pour les opérations produits avec Appwrite
 */
export const useProducts = () => {
    const { products, addProduct, updateProduct, deleteProduct } = useStore();

    const createProduct = async (product: any) => {
        const newProduct = await productService.create(product);
        if (newProduct) {
            addProduct(newProduct);
            return newProduct;
        }
        return null;
    };

    const editProduct = async (id: string, updates: any) => {
        const updated = await productService.update(id, updates);
        if (updated) {
            updateProduct(updated);
            return updated;
        }
        return null;
    };

    const removeProduct = async (id: string) => {
        const success = await productService.delete(id);
        if (success) {
            deleteProduct(id);
            return true;
        }
        return false;
    };

    return {
        products,
        createProduct,
        editProduct,
        removeProduct
    };
};

/**
 * Hook pour les commandes
 */
export const useOrders = () => {
    const submitOrder = async (orderData: any) => {
        try {
            const order = await orderService.create(orderData);
            if (order) {
                console.log('✅ Commande créée:', order.$id);
                return order;
            }
            return null;
        } catch (error) {
            console.error('❌ Erreur lors de la création de la commande:', error);
            return null;
        }
    };

    const getOrders = async () => {
        try {
            const orders = await orderService.getAll();
            return orders;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des commandes:', error);
            return [];
        }
    };

    const updateOrderStatus = async (orderId: string, status: any) => {
        try {
            const success = await orderService.updateStatus(orderId, status);
            return success;
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du statut:', error);
            return false;
        }
    };

    return {
        submitOrder,
        getOrders,
        updateOrderStatus
    };
};
