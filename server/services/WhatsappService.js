// WhatsApp Service - Currently Disabled
// To enable: Install whatsapp-web.js or integrate with Twilio

class WhatsappService {
    constructor() {
        console.log('WhatsApp Service: Disabled (Mock Mode)');
    }

    async sendMessage(number, message) {
        // Mock implementation - just log the message
        console.log('📱 WhatsApp (Mock):', {
            to: number,
            message: message,
            status: 'Would be sent in production'
        });
        return true;
    }
}

module.exports = new WhatsappService();
