# Configuration Appwrite pour Grandson Clothes

## 📋 Étapes de Configuration

### 1. Créer un Projet Appwrite

1. Allez sur [Appwrite Cloud](https://cloud.appwrite.io/) ou votre instance self-hosted
2. Créez un nouveau projet nommé "Grandson Clothes"
3. Copiez le **Project ID**

### 2. Créer la Base de Données

1. Dans votre projet, allez dans **Databases**
2. Créez une nouvelle base de données : `grandson_store`
3. Copiez le **Database ID**

### 3. Créer les Collections

#### Collection: Products
**Attributs à créer :**
- `name` (String, Required, Size: 255)
- `price` (Integer, Required)
- `description` (String, Required, Size: 1000)
- `category` (String, Required, Size: 100)
- `sizes` (String[], Required)
- `colors` (String[], Required)
- `imageUrl` (String, Required, Size: 500)
- `position` (Float[], Required, Array Size: 3)

**Permissions :**
- Read: `Any`
- Create: `Users` (ou admin role)
- Update: `Users` (ou admin role)
- Delete: `Users` (ou admin role)

**Indexes :**
- `category_index` sur `category` (ASC)
- `created_index` sur `$createdAt` (DESC)

#### Collection: Orders
**Attributs à créer :**
- `customerName` (String, Required, Size: 255)
- `customerEmail` (Email, Required)
- `customerPhone` (String, Required, Size: 20)
- `deliveryAddress` (String, Required, Size: 500)
- `deliveryZone` (String, Required, Size: 100)
- `items` (String, Required, Size: 10000) - JSON stringifié
- `subtotal` (Integer, Required)
- `deliveryFee` (Integer, Required)
- `total` (Integer, Required)
- `status` (Enum: pending, confirmed, shipped, delivered, cancelled)
- `createdAt` (DateTime, Required)

**Permissions :**
- Read: `Users` (ou admin role)
- Create: `Any`
- Update: `Users` (ou admin role)
- Delete: `Users` (ou admin role)

**Indexes :**
- `status_index` sur `status` (ASC)
- `created_index` sur `createdAt` (DESC)

#### Collection: Users (Optionnel - pour profils clients)
**Attributs à créer :**
- `userId` (String, Required, Size: 100) - Lié à Auth
- `name` (String, Required, Size: 255)
- `phone` (String, Size: 20)
- `address` (String, Size: 500)
- `orderHistory` (String[], Array)

**Permissions :**
- Read: `Users` (owner only)
- Create: `Users`
- Update: `Users` (owner only)
- Delete: `Users` (owner only)

### 4. Créer le Bucket de Stockage

1. Allez dans **Storage**
2. Créez un nouveau bucket : `product_images`
3. Copiez le **Bucket ID**

**Configuration du Bucket :**
- Maximum File Size: `10MB`
- Allowed File Extensions: `jpg, jpeg, png, webp, gif`
- Compression: `Enabled`
- Encryption: `Enabled`

**Permissions :**
- Read: `Any`
- Create: `Users` (ou admin role)
- Update: `Users` (ou admin role)
- Delete: `Users` (ou admin role)

### 5. Configurer les Variables d'Environnement

Mettez à jour le fichier `.env.local` avec vos IDs :

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=votre_project_id
VITE_APPWRITE_DATABASE_ID=votre_database_id
VITE_APPWRITE_COLLECTION_PRODUCTS=votre_products_collection_id
VITE_APPWRITE_COLLECTION_ORDERS=votre_orders_collection_id
VITE_APPWRITE_COLLECTION_USERS=votre_users_collection_id
VITE_APPWRITE_BUCKET_ID=votre_bucket_id
```

### 6. Configurer l'Authentification (Optionnel)

Si vous voulez un système d'authentification admin :

1. Allez dans **Auth**
2. Activez **Email/Password**
3. Créez un compte admin
4. Dans **Teams**, créez une équipe "Admins"
5. Ajoutez votre compte admin à cette équipe

### 7. Tester la Connexion

Redémarrez le serveur :
```bash
npm run dev
```

Le site devrait maintenant se connecter à Appwrite !

## 🔧 Utilisation dans le Code

### Récupérer les produits
```typescript
import { productService } from './services/appwriteService';

const products = await productService.getAll();
```

### Créer une commande
```typescript
import { orderService } from './services/appwriteService';

await orderService.create({
    customerName: 'Mamadou Diallo',
    customerEmail: 'mamadou@example.com',
    customerPhone: '622123456',
    deliveryAddress: 'Kipé, Conakry',
    deliveryZone: 'ratoma',
    items: [...],
    subtotal: 500000,
    deliveryFee: 25000,
    total: 525000,
    status: 'pending'
});
```

### Upload une image
```typescript
import { storageService } from './services/appwriteService';

const imageUrl = await storageService.uploadImage(file);
```

## 📱 Prochaines Étapes

1. Intégrer les services Appwrite dans le store Zustand
2. Remplacer les données mock par les vraies données
3. Ajouter l'authentification admin
4. Implémenter le système de paiement Mobile Money
5. Ajouter les notifications par SMS/Email

## 🆘 Support

- [Documentation Appwrite](https://appwrite.io/docs)
- [Discord Appwrite](https://appwrite.io/discord)
- [GitHub Appwrite](https://github.com/appwrite/appwrite)
