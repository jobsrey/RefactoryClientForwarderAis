/**
 * @fileoverview Buffer untuk menyimpan dan mengirim data AIS
 * @module core/data-buffer
 */

import { APP_CONFIG, getSourceConfig } from '../config.js';
import logger from '../utils/logger.js';

/**
 * Class untuk mengelola buffer data AIS dengan debouncing
 */
export class DataBuffer {
  /**
   * @param {WebSocketConnection} wsConnection - Instance koneksi WebSocket
   * @param {string} macAddress - MAC address perangkat
   */
  constructor(wsConnection, macAddress) {
    this.wsConnection = wsConnection;
    this.macAddress = macAddress;
    this.buffer = [];
    this.sendTimeout = null;
    this.debounceDelay = APP_CONFIG.debounceDelay;
    this.sentCount = 0;
  }

  /**
   * Tambahkan data ke buffer
   * @param {Object} decodedData - Data AIS yang sudah di-decode
   * @param {string} rawMessage - Raw AIS message
   * @returns {boolean} True jika WebSocket ready
   */
  add(decodedData, rawMessage) {
    this.buffer.push({
      message: rawMessage,
      timestamp: new Date().toISOString(),
      decoded: decodedData
    });

    this._triggerSend();
    return this.wsConnection.isReady();
  }

  /**
   * Trigger pengiriman dengan debouncing
   * @private
   */
  _triggerSend() {
    if (this.sendTimeout) {
      clearTimeout(this.sendTimeout);
    }

    this.sendTimeout = setTimeout(() => {
      this._sendToWebSocket();
      this.sendTimeout = null;
    }, this.debounceDelay);
  }

  /**
   * Kirim data ke WebSocket server
   * @private
   */
  _sendToWebSocket() {
    if (!this.wsConnection.isReady()) {
      console.log('WebSocket belum siap, skip pengiriman data');
      return;
    }

    if (this.buffer.length === 0) {
      console.log('Tidak ada data AIS untuk dikirim');
      return;
    }

    const { source, sourcePort } = getSourceConfig();

    const payload = {
      app_key: APP_CONFIG.appKey,
      mac_address: this.macAddress,
      source: source,
      sourcePort: sourcePort,
      receivedAt: new Date().toISOString(),
      dataCount: this.buffer.length,
      aisData: this.buffer
    };

    const success = this.wsConnection.send(payload);
    
    if (success) {
      console.log(`✓ ${this.buffer.length} data AIS terkirim segera ke WebSocket Server`);
      this.sentCount += this.buffer.length;
      this.buffer = [];
    }
  }

  /**
   * Mendapatkan jumlah data yang telah dikirim
   * @returns {number} Jumlah data terkirim
   */
  getSentCount() {
    return this.sentCount;
  }

  /**
   * Mendapatkan jumlah data dalam buffer
   * @returns {number} Jumlah data dalam buffer
   */
  getBufferSize() {
    return this.buffer.length;
  }

  /**
   * Update MAC address
   * @param {string} macAddress - MAC address baru
   */
  setMacAddress(macAddress) {
    this.macAddress = macAddress;
  }

  /**
   * Clear buffer dan timeout
   */
  clear() {
    if (this.sendTimeout) {
      clearTimeout(this.sendTimeout);
      this.sendTimeout = null;
    }
    this.buffer = [];
  }

  /**
   * Reset statistik
   */
  resetStats() {
    this.sentCount = 0;
  }
}

export default DataBuffer;
