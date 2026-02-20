import { databases, storage, ID, DATABASE_ID, COLLECTIONS, BUCKET_ID } from '../lib/appwrite';
import { Product } from '../types';
import { Query } from 'appwrite';
import { emailService } from './emailService';

// ==================== PRODUCTS ====================

export const productService = {
    // Récupérer tous les produits
    async getAll(): Promise<Product[]> {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                [Query.orderDesc('$createdAt')]
            );
            return response.documents.map(doc => ({
                id: doc.$id,
                name: doc.name,
                price: doc.price,
                description: doc.description,
                category: doc.category,
                sizes: typeof doc.sizes === 'string' ? JSON.parse(doc.sizes) : doc.sizes,
                colors: typeof doc.colors === 'string' ? JSON.parse(doc.colors) : doc.colors,
                imageUrl: doc.imageUrl,
                position: doc.position || [0, 0, 0]
            }));
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    },

    // Créer un produit
    async create(product: Omit<Product, 'id'>): Promise<Product | null> {
        try {
            const response = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                ID.unique(),
                {
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    category: product.category,
                    sizes: JSON.stringify(product.sizes),
                    colors: JSON.stringify(product.colors),
                    imageUrl: product.imageUrl,
                    position: product.position || [0, 0, 0]
                }
            );
            return {
                id: response.$id,
                name: response.name,
                price: response.price,
                description: response.description,
                category: response.category,
                sizes: typeof response.sizes === 'string' ? JSON.parse(response.sizes) : response.sizes,
                colors: typeof response.colors === 'string' ? JSON.parse(response.colors) : response.colors,
                imageUrl: response.imageUrl,
                position: response.position || [0, 0, 0]
            };
        } catch (error) {
            console.error('Error creating product:', error);
            return null;
        }
    },

    // Mettre à jour un produit
    async update(id: string, product: Partial<Product>): Promise<Product | null> {
        try {
            const response = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                id,
                {
                    ...(product.name && { name: product.name }),
                    ...(product.price !== undefined && { price: product.price }),
                    ...(product.description && { description: product.description }),
                    ...(product.category && { category: product.category }),
                    ...(product.sizes && { sizes: JSON.stringify(product.sizes) }),
                    ...(product.colors && { colors: JSON.stringify(product.colors) }),
                    ...(product.imageUrl && { imageUrl: product.imageUrl }),
                    ...(product.position && { position: product.position })
                }
            );
            return {
                id: response.$id,
                name: response.name,
                price: response.price,
                description: response.description,
                category: response.category,
                sizes: typeof response.sizes === 'string' ? JSON.parse(response.sizes) : response.sizes,
                colors: typeof response.colors === 'string' ? JSON.parse(response.colors) : response.colors,
                imageUrl: response.imageUrl,
                position: response.position || [0, 0, 0]
            };
        } catch (error) {
            console.error('Error updating product:', error);
            return null;
        }
    },

    // Supprimer un produit
    async delete(id: string): Promise<boolean> {
        try {
            await databases.deleteDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                id
            );
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            return false;
        }
    }
};

// ==================== ORDERS ====================

export interface OrderData {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryAddress: string;
    deliveryZone: string;
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        size: string;
        color: string;
        price: number;
    }>;
    subtotal: number;
    deliveryFee: number;
    total: number;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

export const orderService = {
    // Créer une commande
    async create(orderData: OrderData): Promise<any> {
        try {
            const response = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                ID.unique(),
                {
                    ...orderData,
                    createdAt: new Date().toISOString(),
                    status: 'pending'
                }
            );
            
            // Envoyer les emails après la création
            try {
                // Email au client
                await emailService.sendOrderConfirmation(orderData.customerEmail, {
                    ...orderData,
                    customerName: orderData.customerName
                });
                
                // Notification à l'admin
                await emailService.sendAdminNotification({
                    ...orderData,
                    customerName: orderData.customerName
                });
            } catch (emailError) {
                console.error('Erreur lors de l\'envoi des emails:', emailError);
                // Ne pas bloquer la création de la commande si l'email échoue
            }
            
            return response;
        } catch (error) {
            console.error('Error creating order:', error);
            return null;
        }
    },

    // Récupérer toutes les commandes
    async getAll(): Promise<any[]> {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                [Query.orderDesc('$createdAt'), Query.limit(100)]
            );
            return response.documents;
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
    },

    // Mettre à jour le statut d'une commande
    async updateStatus(orderId: string, status: OrderData['status']): Promise<boolean> {
        try {
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                orderId,
                { status }
            );
            return true;
        } catch (error) {
            console.error('Error updating order status:', error);
            return false;
        }
    }
};

// ==================== STORAGE (Images) ====================

export const storageService = {
    // Upload une image
    async uploadImage(file: File): Promise<string | null> {
        try {
            const response = await storage.createFile(
                BUCKET_ID,
                ID.unique(),
                file
            );
            
            // Retourner l'URL publique de l'image
            const fileUrl = storage.getFileView(BUCKET_ID, response.$id);
            return fileUrl.toString();
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    },

    // Supprimer une image
    async deleteImage(fileId: string): Promise<boolean> {
        try {
            await storage.deleteFile(BUCKET_ID, fileId);
            return true;
        } catch (error) {
            console.error('Error deleting image:', error);
            return false;
        }
    }
};
