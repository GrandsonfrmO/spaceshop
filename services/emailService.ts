import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export const emailService = {
    // Envoyer un email de confirmation de commande
    async sendOrderConfirmation(email: string, orderData: any) {
        try {
            const response = await resend.emails.send({
                from: 'orders@grandson-clothes.com',
                to: email,
                subject: 'Confirmation de votre commande - Grandson Clothes',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #000;">Merci pour votre commande !</h1>
                        <p>Bonjour ${orderData.customerName},</p>
                        <p>Votre commande a été reçue avec succès.</p>
                        
                        <h2 style="color: #333; margin-top: 30px;">Détails de la commande</h2>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <th style="text-align: left; padding: 10px;">Produit</th>
                                <th style="text-align: center; padding: 10px;">Quantité</th>
                                <th style="text-align: right; padding: 10px;">Prix</th>
                            </tr>
                            ${orderData.items.map((item: any) => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 10px;">${item.productName}</td>
                                    <td style="text-align: center; padding: 10px;">${item.quantity}</td>
                                    <td style="text-align: right; padding: 10px;">${(item.price * item.quantity).toLocaleString('fr-GN')} GNF</td>
                                </tr>
                            `).join('')}
                        </table>
                        
                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Sous-total:</strong> ${orderData.subtotal.toLocaleString('fr-GN')} GNF</p>
                            <p style="margin: 5px 0;"><strong>Frais de livraison:</strong> ${orderData.deliveryFee.toLocaleString('fr-GN')} GNF</p>
                            <p style="margin: 5px 0; font-size: 18px;"><strong>Total:</strong> ${orderData.total.toLocaleString('fr-GN')} GNF</p>
                        </div>
                        
                        <h2 style="color: #333; margin-top: 30px;">Adresse de livraison</h2>
                        <p>
                            ${orderData.customerName}<br>
                            ${orderData.deliveryAddress}<br>
                            ${orderData.deliveryZone}<br>
                            Téléphone: ${orderData.customerPhone}
                        </p>
                        
                        <p style="margin-top: 30px; color: #666; font-size: 12px;">
                            Merci d'avoir choisi Grandson Clothes !<br>
                            Pour toute question, contactez-nous à support@grandson-clothes.com
                        </p>
                    </div>
                `
            });
            
            console.log('✅ Email de confirmation envoyé:', response);
            return response;
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
            throw error;
        }
    },

    // Envoyer un email de bienvenue
    async sendWelcomeEmail(email: string, name: string) {
        try {
            const response = await resend.emails.send({
                from: 'welcome@grandson-clothes.com',
                to: email,
                subject: 'Bienvenue chez Grandson Clothes !',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #000;">Bienvenue ${name} !</h1>
                        <p>Merci de vous être inscrit chez Grandson Clothes.</p>
                        <p>Découvrez notre collection exclusive de vêtements et accessoires.</p>
                        <a href="https://grandson-clothes.com" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Visiter le site</a>
                    </div>
                `
            });
            
            console.log('✅ Email de bienvenue envoyé:', response);
            return response;
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
            throw error;
        }
    },

    // Envoyer une notification au vendeur
    async sendAdminNotification(orderData: any) {
        try {
            const response = await resend.emails.send({
                from: 'notifications@grandson-clothes.com',
                to: 'admin@grandson-clothes.com',
                subject: `Nouvelle commande - ${orderData.customerName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #000;">Nouvelle commande reçue !</h1>
                        <p><strong>Client:</strong> ${orderData.customerName}</p>
                        <p><strong>Email:</strong> ${orderData.customerEmail}</p>
                        <p><strong>Téléphone:</strong> ${orderData.customerPhone}</p>
                        <p><strong>Adresse:</strong> ${orderData.deliveryAddress}, ${orderData.deliveryZone}</p>
                        <p><strong>Total:</strong> ${orderData.total.toLocaleString('fr-GN')} GNF</p>
                        <p><strong>Nombre d'articles:</strong> ${orderData.items.length}</p>
                    </div>
                `
            });
            
            console.log('✅ Notification admin envoyée:', response);
            return response;
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de la notification:', error);
            throw error;
        }
    }
};
