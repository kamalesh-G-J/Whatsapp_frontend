/**
 * WebSocket Service for Real-time Communication
 */
import { WS_BASE } from '../config';

class WebSocketService {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.messageHandlers = new Set();
        this.statusHandlers = new Set();
        this.typingHandlers = new Set();
        this.readHandlers = new Set();
        this.connectionHandlers = new Set();
        this.userPhone = null;
    }

    connect(userPhone) {
        this.userPhone = userPhone;
        
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(WS_BASE);
                
                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.reconnectAttempts = 0;
                    
                    // Register with server
                    this.send({
                        type: 'register',
                        userPhone: userPhone
                    });
                    
                    this.connectionHandlers.forEach(handler => handler(true));
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (e) {
                        console.error('Failed to parse message:', e);
                    }
                };
                
                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.connectionHandlers.forEach(handler => handler(false));
                    this.attemptReconnect();
                };
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.userPhone) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connect(this.userPhone).catch(() => {
                    // Will retry automatically
                });
            }, this.reconnectDelay);
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'message':
                this.messageHandlers.forEach(handler => handler(data));
                break;
            case 'status':
                this.statusHandlers.forEach(handler => handler(data));
                break;
            case 'typing':
                this.typingHandlers.forEach(handler => handler(data));
                break;
            case 'read':
                this.readHandlers.forEach(handler => handler(data));
                break;
            case 'onlineUsers':
                this.statusHandlers.forEach(handler => handler(data));
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    // Send a chat message
    sendMessage(chatId, recipientPhone, senderName, content) {
        this.send({
            type: 'message',
            chatId,
            recipientPhone,
            senderName,
            content
        });
    }

    // Send typing indicator
    sendTyping(recipientPhone, isTyping) {
        this.send({
            type: 'typing',
            recipientPhone,
            isTyping
        });
    }

    // Send read receipt
    sendReadReceipt(chatId) {
        this.send({
            type: 'read',
            chatId,
            readBy: this.userPhone
        });
    }

    // Subscribe to events
    onMessage(handler) {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    onStatus(handler) {
        this.statusHandlers.add(handler);
        return () => this.statusHandlers.delete(handler);
    }

    onTyping(handler) {
        this.typingHandlers.add(handler);
        return () => this.typingHandlers.delete(handler);
    }

    onRead(handler) {
        this.readHandlers.add(handler);
        return () => this.readHandlers.delete(handler);
    }

    onConnectionChange(handler) {
        this.connectionHandlers.add(handler);
        return () => this.connectionHandlers.delete(handler);
    }

    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

// Singleton instance
const wsService = new WebSocketService();
export default wsService;
