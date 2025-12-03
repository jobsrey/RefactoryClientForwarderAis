/**
 * @fileoverview Koneksi TCP/IP untuk AIS
 * @module connections/tcp-connection
 */

import net from 'net';
import { BaseConnection } from './base-connection.js';
import { TCP_CONFIG } from '../config.js';
import logger from '../utils/logger.js';

/**
 * Class untuk mengelola koneksi TCP/IP
 * @extends BaseConnection
 */
export class TCPConnection extends BaseConnection {
  constructor() {
    super('TCP/IP');
  }

  /**
   * Koneksi ke server TCP
   */
  connect() {
    this.showHeader({
      'AIS Host': TCP_CONFIG.host,
      'AIS Port': TCP_CONFIG.port
    });

    logger.info(`Menghubungkan ke AIS via TCP/IP...`);

    this.client = new net.Socket();
    this._setupEventHandlers();
    
    this.client.connect(TCP_CONFIG.port, TCP_CONFIG.host);
  }

  /**
   * Setup event handlers
   * @private
   */
  _setupEventHandlers() {
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.success(`Koneksi TCP/IP berhasil! Stream REALTIME aktif...`);
      console.log('\n' + '─'.repeat(70));
      this.emit('connected');
    });

    this.client.on('data', (data) => {
      this.processDataBuffer(data.toString());
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.handleError(err, [
        'AIS receiver terhubung ke jaringan',
        'IP address dan port benar',
        'Tidak ada firewall yang memblokir koneksi'
      ]);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn(`Koneksi TCP/IP terputus`);
      this.emit('disconnected');
    });
  }

  /**
   * Disconnect dari server TCP
   */
  disconnect() {
    super.disconnect();
    if (this.client) {
      this.client.destroy();
    }
    this.client = null;
  }
}

export default TCPConnection;
