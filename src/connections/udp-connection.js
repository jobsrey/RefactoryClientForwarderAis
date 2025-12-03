/**
 * @fileoverview Koneksi UDP untuk AIS
 * @module connections/udp-connection
 */

import dgram from 'dgram';
import { BaseConnection } from './base-connection.js';
import { UDP_CONFIG } from '../config.js';
import logger from '../utils/logger.js';

/**
 * Class untuk mengelola koneksi UDP
 * @extends BaseConnection
 */
export class UDPConnection extends BaseConnection {
  constructor() {
    super('UDP');
  }

  /**
   * Koneksi ke server UDP (bind ke port listen)
   */
  connect() {
    this.showHeader({
      'AIS Host': UDP_CONFIG.host,
      'AIS Port': UDP_CONFIG.port,
      'Listen Port': UDP_CONFIG.listenPort
    });

    logger.info(`Menghubungkan ke AIS via UDP...`);

    this.client = dgram.createSocket('udp4');
    this._setupEventHandlers();
    
    this.client.bind(UDP_CONFIG.listenPort);
  }

  /**
   * Setup event handlers
   * @private
   */
  _setupEventHandlers() {
    this.client.on('listening', () => {
      const address = this.client.address();
      this.isConnected = true;
      logger.success(`UDP listening pada ${address.address}:${address.port}`);
      logger.success(`Stream REALTIME aktif...`);
      console.log('\n' + '─'.repeat(70));
      this.emit('connected');
    });

    this.client.on('message', (msg, rinfo) => {
      this.processDataBuffer(msg.toString());
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.handleError(err, [
        'Port UDP tidak digunakan aplikasi lain',
        'AIS receiver mengirim data ke port ini',
        'Tidak ada firewall yang memblokir UDP'
      ]);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn(`Koneksi UDP terputus`);
      this.emit('disconnected');
    });
  }

  /**
   * Disconnect dari UDP
   */
  disconnect() {
    super.disconnect();
    if (this.client) {
      this.client.close();
    }
    this.client = null;
  }
}

export default UDPConnection;
