/**
 * @fileoverview Koneksi Serial Port untuk R400NG
 * @module connections/serial-connection
 */

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { BaseConnection } from './base-connection.js';
import { SERIAL_CONFIG } from '../config.js';
import logger from '../utils/logger.js';

/**
 * Class untuk mengelola koneksi Serial Port
 * @extends BaseConnection
 */
export class SerialConnection extends BaseConnection {
  constructor() {
    super('SERIAL USB');
    this.parser = null;
  }

  /**
   * Koneksi ke Serial Port
   */
  connect() {
    this.showHeader({
      'R400NG Port': SERIAL_CONFIG.path,
      'Baud Rate': SERIAL_CONFIG.baudRate
    });

    logger.info(`Menghubungkan ke R400NG via Serial USB...`);

    this.client = new SerialPort({
      path: SERIAL_CONFIG.path,
      baudRate: SERIAL_CONFIG.baudRate,
      dataBits: SERIAL_CONFIG.dataBits,
      stopBits: SERIAL_CONFIG.stopBits,
      parity: SERIAL_CONFIG.parity,
      autoOpen: false
    });

    this.parser = this.client.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    this._setupEventHandlers();
    this._openConnection();
  }

  /**
   * Setup event handlers
   * @private
   */
  _setupEventHandlers() {
    this.client.on('open', () => {
      this.isConnected = true;
      logger.success(`Koneksi Serial USB berhasil! Stream REALTIME aktif...`);
      console.log('\n' + '─'.repeat(70));
      this.emit('connected');
    });

    this.parser.on('data', (line) => {
      const msg = line.trim();
      if (msg) {
        this.emit('data', msg);
      }
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      const tips = [];
      
      if (err.message.includes('cannot open')) {
        tips.push(
          'R400NG terhubung ke USB',
          'Port COM benar (cek di Device Manager)',
          'Tidak ada aplikasi lain yang menggunakan port ini'
        );
      }
      
      this.handleError(err, tips);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn(`Koneksi Serial USB terputus`);
      this.emit('disconnected');
    });
  }

  /**
   * Buka koneksi serial
   * @private
   */
  _openConnection() {
    this.client.open((err) => {
      if (err) {
        logger.error(`Gagal membuka port: ${err.message}`);
        this.emit('disconnected');
      }
    });
  }

  /**
   * Disconnect dari Serial Port
   */
  disconnect() {
    super.disconnect();
    if (this.client && this.client.isOpen) {
      this.client.close();
    }
    this.client = null;
    this.parser = null;
  }
}

export default SerialConnection;
