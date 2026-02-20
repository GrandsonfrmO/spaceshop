# 🚀 Démarrage Rapide Appwrite

## Configuration en 5 Minutes

### 1️⃣ Créer le Projet (2 min)
```
1. Allez sur https://cloud.appwrite.io/
2. Créez un compte / Connectez-vous
3. Créez un nouveau projet "Grandson Clothes"
4. Copiez le Project ID
```

### 2️⃣ Créer la Base de Données (1 min)
```
1. Cliquez sur "Databases" dans le menu
2. Créez une base "grandson_store"
3. Copiez le Database ID
```

### 3️⃣ Créer les Collections (2 min)

**Collection Products :**
```
Nom: products
Attributs:
- name (String, 255)
- price (Integer)
- description (String, 1000)
- category (String, 100)
- sizes (String Array)
- colors (String Array)
- imageUrl (String, 500)
- position (Float Array, size 3)

Permissions: Read = Any, Create/Update/Delete = Users
```

**Collection Orders :**
```
Nom: orders
Attributs:
- customerName (String, 255)
- customerEmail (Email)
- customerPhone (String, 20)
- deliveryAddress (String, 500)
- deliveryZone (String, 100)
- items (String, 10000)
- subtotal (Integer)
- deliveryFee (Integer)
- total (Integer)
- status (String, 50)
- createdAt (DateTime)

Permissions: Read/Update = Users, Create = Any
```

### 4️⃣ Créer le Bucket Images
```
1. Allez dans "Storage"
2. Créez un bucket "product_images"
3. Max size: 10MB
4. Extensions: jpg, jpeg, png, webp
5. Permissions: Read = Any, Create/Update/Delete = Users
6. Copiez le Bucket ID
```

### 5️⃣ Configurer .env.local
```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=65xxxxxxxxxxxxx
VITE_APPWRITE_DATABASE_ID=65xxxxxxxxxxxxx
VITE_APPWRITE_COLLECTION_PRODUCTS=65xxxxxxxxxxxxx
VITE_APPWRITE_COLLECTION_ORDERS=65xxxxxxxxxxxxx
VITE_APPWRITE_BUCKET_ID=65xxxxxxxxxxxxx
```

### 6️⃣ Redémarrer le Serveur
```bash
npm run dev
```

## ✅ C'est Prêt !

Le site va maintenant :
- ✅ Charger les produits depuis Appwrite
- ✅ Sauvegarder les nouvelles commandes
- ✅ Uploader les images produits
- ✅ Synchroniser en temps réel

## 🎯 Prochaines Étapes

1. Ajoutez vos premiers produits via le panel Admin
2. Testez une commande
3. Vérifiez dans Appwrite que tout est sauvegardé
4. Configurez l'authentification pour sécuriser l'admin

## 📚 Documentation Complète

Voir `APPWRITE_SETUP.md` pour plus de détails.
