/**
 * @fileoverview Base class untuk semua koneksi
 * @module connections/base-connection
 */

import { EventEmitter } from 'events';
import logger from '../utils/logger.js';

/**
 * Base class untuk koneksi AIS
 * @extends EventEmitter
 */
export class BaseConnection extends EventEmitter {
  /**
   * @param {string} name - Nama koneksi
   */
  constructor(name) {
    super();
    this.name = name;
    this.client = null;
    this.isConnected = false;
    this.dataBuffer = '';
    this.reconnectDelay = 5000;
  }

  /**
   * Koneksi ke sumber data (harus di-override)
   * @abstract
   */
  connect() {
    throw new Error('Method connect() harus diimplementasikan');
  }

  /**
   * Disconnect dari sumber data
   */
  disconnect() {
    this.isConnected = false;
    this.dataBuffer = '';
  }

  /**
   * Memproses data yang diterima per baris
   * @param {string} data - Data yang diterima
   * @protected
   */
  processDataBuffer(data) {
    this.dataBuffer += data;
    
    let lines = this.dataBuffer.split('\n');
    this.dataBuffer = lines.pop() || '';
    
    lines.forEach(line => {
      const msg = line.trim();
      if (msg) {
        this.emit('data', msg);
      }
    });
  }

  /**
   * Handle error dengan tips
   * @param {Error} error - Error object
   * @param {string[]} tips - Array tips untuk ditampilkan
   * @protected
   */
  handleError(error, tips = []) {
    logger.error(`${this.name} Error: ${error.message}`);
    if (tips.length > 0) {
      logger.tips(tips);
    }
    this.emit('error', error);
  }

  /**
   * Schedule reconnect
   * @protected
   */
  scheduleReconnect() {
    logger.info(`🔄 Mencoba reconnect ${this.name} dalam ${this.reconnectDelay / 1000} detik...`);
    setTimeout(() => this.connect(), this.reconnectDelay);
  }

  /**
   * Menampilkan header koneksi
   * @param {Object} config - Konfigurasi untuk ditampilkan
   * @protected
   */
  showHeader(config) {
    console.log('\n' + '='.repeat(70));
    console.log(`🚢 AIS DATA MONITOR - REALTIME MODE (${this.name})`);
    console.log('='.repeat(70));
    
    Object.entries(config).forEach(([key, value]) => {
      console.log(`${key.padEnd(14)}: ${value}`);
    });
    
    console.log(`Mode          : REALTIME (Instant Display)`);
    console.log('='.repeat(70));
  }
}

export default BaseConnection;
