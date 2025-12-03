/**
 * @fileoverview Koneksi WebSocket untuk mengirim data ke server
 * @module connections/websocket-connection
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { WEBSOCKET_CONFIG, APP_CONFIG } from '../config.js';
import logger from '../utils/logger.js';

/**
 * Class untuk mengelola koneksi WebSocket
 * @extends EventEmitter
 */
export class WebSocketConnection extends EventEmitter {
  /**
   * @param {string} macAddress - MAC address perangkat
   */
  constructor(macAddress) {
    super();
    this.client = null;
    this.isConnected = false;
    this.macAddress = macAddress;
    this.reconnectDelay = WEBSOCKET_CONFIG.reconnectDelay;
  }

  /**
   * Koneksi ke WebSocket server
   */
  connect() {
    logger.info(`Connecting to WebSocket Server: ${WEBSOCKET_CONFIG.server}`);

    this.client = new WebSocket(WEBSOCKET_CONFIG.server);
    this._setupEventHandlers();
  }

  /**
   * Setup event handlers
   * @private
   */
  _setupEventHandlers() {
    this.client.on('open', () => {
      this.isConnected = true;
      logger.success(`WebSocket connected!`);
      this._sendIdentify();
      this.emit('connected');
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn(`WebSocket disconnected. Reconnecting in ${this.reconnectDelay / 1000}s...`);
      this.emit('disconnected');
      this._scheduleReconnect();
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error(`WebSocket error: ${error.message}`);
      this.emit('error', error);
    });

    this.client.on('message', (data) => {
      this.emit('message', data);
    });
  }

  /**
   * Kirim identify message ke server
   * @private
   */
  _sendIdentify() {
    const identifyMessage = {
      type: 'identify',
      clientType: 'sender',
      app_key: APP_CONFIG.appKey,
      user_key: APP_CONFIG.userKey,
      mac_address: this.macAddress
    };

    this.send(identifyMessage);
    logger.success(`Sent identify message as sender`);
  }

  /**
   * Schedule reconnect setelah disconnect
   * @private
   */
  _scheduleReconnect() {
    this.client = null;
    logger.info(`Mencoba reconnect ke WebSocket Server dalam ${this.reconnectDelay / 1000} detik...`);
    setTimeout(() => this.connect(), this.reconnectDelay);
  }

  /**
   * Kirim data ke WebSocket server
   * @param {Object} data - Data untuk dikirim
   * @returns {boolean} True jika berhasil dikirim
   */
  send(data) {
    if (!this.isReady()) {
      return false;
    }

    try {
      this.client.send(JSON.stringify(data));
      return true;
    } catch (err) {
      logger.error(`Error mengirim data: ${err.message}`);
      return false;
    }
  }

  /**
   * Cek apakah WebSocket siap untuk mengirim
   * @returns {boolean} True jika siap
   */
  isReady() {
    return this.client && this.client.readyState === WebSocket.OPEN;
  }

  /**
   * Update MAC address
   * @param {string} macAddress - MAC address baru
   */
  setMacAddress(macAddress) {
    this.macAddress = macAddress;
  }

  /**
   * Disconnect dari WebSocket server
   */
  disconnect() {
    if (this.client) {
      this.client.close();
    }
    this.client = null;
    this.isConnected = false;
  }
}

export default WebSocketConnection;
