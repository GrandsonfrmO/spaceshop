import { Client, Databases, Account, Storage, ID } from 'appwrite';

// Configuration Appwrite
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

console.log('🔧 Appwrite Configuration:');
console.log('   Endpoint:', endpoint);
console.log('   Project ID:', projectId ? '✅ Set' : '❌ Missing');
console.log('   Database ID:', import.meta.env.VITE_APPWRITE_DATABASE_ID ? '✅ Set' : '❌ Missing');
console.log('   Products Collection:', import.meta.env.VITE_APPWRITE_COLLECTION_PRODUCTS ? '✅ Set' : '❌ Missing');

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

export const databases = new Databases(client);
export const account = new Account(client);
export const storage = new Storage(client);

// IDs de la base de données et collections
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
export const COLLECTIONS = {
    PRODUCTS: import.meta.env.VITE_APPWRITE_COLLECTION_PRODUCTS || '',
    ORDERS: import.meta.env.VITE_APPWRITE_COLLECTION_ORDERS || '',
    USERS: import.meta.env.VITE_APPWRITE_COLLECTION_USERS || '',
};

export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID || '';

export { ID };
export default client;
