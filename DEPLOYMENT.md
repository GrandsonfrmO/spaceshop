# 🚀 Guide de Déploiement sur Vercel

## Prérequis

- Compte Vercel (https://vercel.com)
- Compte GitHub avec le repository du projet
- Toutes les variables d'environnement configurées

## Étapes de Déploiement

### 1. Préparer le Repository GitHub

```bash
# Assurez-vous que tout est commité
git add .
git commit -m "Préparation pour déploiement Vercel"
git push origin main
```

### 2. Connecter à Vercel

1. Allez sur https://vercel.com
2. Cliquez sur "New Project"
3. Sélectionnez votre repository GitHub
4. Cliquez sur "Import"

### 3. Configurer les Variables d'Environnement

Dans Vercel, allez dans **Settings → Environment Variables** et ajoutez :

```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=votre_project_id
VITE_APPWRITE_DATABASE_ID=votre_database_id
VITE_APPWRITE_COLLECTION_PRODUCTS=votre_products_collection_id
VITE_APPWRITE_COLLECTION_ORDERS=votre_orders_collection_id
VITE_APPWRITE_COLLECTION_USERS=votre_users_collection_id
VITE_APPWRITE_BUCKET_ID=votre_bucket_id
VITE_APPWRITE_ADMIN_TEAM_ID=votre_admin_team_id
VITE_RESEND_API_KEY=votre_resend_api_key
```

### 4. Configurer les Permissions CORS dans Appwrite

Pour que Vercel puisse accéder à Appwrite, configurez les CORS :

1. Allez dans Appwrite Console
2. Settings → Domains
3. Ajoutez votre domaine Vercel (ex: `grandson-clothes.vercel.app`)

### 5. Déployer

1. Cliquez sur "Deploy"
2. Attendez que le build se termine
3. Votre site sera disponible à `https://votre-projet.vercel.app`

## Vérification Post-Déploiement

✅ Vérifiez que :
- Les produits s'affichent correctement
- L'admin panel fonctionne (20 clics sur le logo)
- Les commandes peuvent être créées
- Les emails sont envoyés

## Troubleshooting

### Les produits ne s'affichent pas
- Vérifiez que les variables d'environnement sont correctes
- Vérifiez les CORS dans Appwrite
- Vérifiez les permissions des collections

### Les emails ne s'envoient pas
- Vérifiez la clé API Resend
- Vérifiez que le domaine est autorisé dans Resend

### Erreurs de build
- Vérifiez que `npm run build` fonctionne localement
- Vérifiez les logs de build dans Vercel

## Mise à Jour du Site

Pour mettre à jour le site après le déploiement :

```bash
git add .
git commit -m "Description des changements"
git push origin main
```

Vercel redéploiera automatiquement le site !

## Support

Pour plus d'informations :
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Appwrite](https://appwrite.io/docs)
- [Documentation Resend](https://resend.com/docs)
