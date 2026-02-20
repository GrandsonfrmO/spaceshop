import React from 'react';

export const DebugPage: React.FC = () => {
  const env = {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    productsCollection: import.meta.env.VITE_APPWRITE_COLLECTION_PRODUCTS,
    ordersCollection: import.meta.env.VITE_APPWRITE_COLLECTION_ORDERS,
    usersCollection: import.meta.env.VITE_APPWRITE_COLLECTION_USERS,
    bucketId: import.meta.env.VITE_APPWRITE_BUCKET_ID,
    adminTeamId: import.meta.env.VITE_APPWRITE_ADMIN_TEAM_ID,
    resendKey: import.meta.env.VITE_RESEND_API_KEY,
  };

  return (
    <div style={{ 
      background: '#000', 
      color: '#fff', 
      padding: '20px', 
      fontFamily: 'monospace',
      minHeight: '100vh'
    }}>
      <h1>🔧 Debug - Environment Variables</h1>
      <pre style={{ background: '#111', padding: '20px', borderRadius: '8px', overflow: 'auto' }}>
        {JSON.stringify(env, null, 2)}
      </pre>
      
      <h2 style={{ marginTop: '30px' }}>✅ Status</h2>
      <ul>
        <li>Endpoint: {env.endpoint ? '✅' : '❌'}</li>
        <li>Project ID: {env.projectId ? '✅' : '❌'}</li>
        <li>Database ID: {env.databaseId ? '✅' : '❌'}</li>
        <li>Products Collection: {env.productsCollection ? '✅' : '❌'}</li>
        <li>Orders Collection: {env.ordersCollection ? '✅' : '❌'}</li>
        <li>Users Collection: {env.usersCollection ? '✅' : '❌'}</li>
        <li>Bucket ID: {env.bucketId ? '✅' : '❌'}</li>
        <li>Admin Team ID: {env.adminTeamId ? '✅' : '❌'}</li>
        <li>Resend Key: {env.resendKey ? '✅' : '❌'}</li>
      </ul>

      <h2 style={{ marginTop: '30px' }}>💡 Instructions</h2>
      <p>Si vous voyez des ❌, vérifiez que les variables d'environnement sont correctement configurées dans Vercel.</p>
      <p>Allez dans: Settings → Environment Variables</p>
    </div>
  );
};
