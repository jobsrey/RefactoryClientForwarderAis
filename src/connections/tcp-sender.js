/**
 * @fileoverview TCP Sender - Forward data AIS ke remote TCP server
 * @module connections/tcp-sender
 * 
 * @description
 * Berbeda dengan TCP Forwarder (server yang menerima koneksi),
 * TCP Sender adalah CLIENT yang mengirim data ke remote server.
 * 
 * Use case: Forward AIS data ke server lain seperti AIS receiver di cloud
 */

import net from 'net';
import logger from '../utils/logger.js';

/**
 * Class TCP Sender - Client yang forward data ke remote server
 */
export class TCPSender {
  /**
   * @param {Object} config - Konfigurasi sender
   * @param {boolean} config.enabled - Apakah sender aktif
   * @param {string} config.host - IP address remote server tujuan
   * @param {number} config.port - Port remote server tujuan
   * @param {number} config.reconnectDelay - Delay reconnect dalam ms (default 5000)
   */
  constructor(config) {
    this.enabled = config.enabled || false;
    this.host = config.host || '127.0.0.1';
    this.port = config.port || 10110;
    this.reconnectDelay = config.reconnectDelay || 5000;
    
    this.client = null;
    this.connected = false;
    this.messagesSent = 0;
    this.reconnectTimer = null;
    this.buffer = []; // Buffer untuk menyimpan data saat disconnected
    this.maxBufferSize = 100; // Max buffer saat disconnect
  }

  /**
   * Start TCP sender - connect ke remote server
   * @returns {Promise<void>}
   */
  start() {
    return new Promise((resolve) => {
      if (!this.enabled) {
        console.log('📤 TCP Sender: DISABLED');
        resolve();
        return;
      }

      console.log('');
      console.log('='.repeat(70));
      console.log('📤 TCP SENDER - FORWARD TO REMOTE SERVER');
      console.log('='.repeat(70));
      console.log(`Status        : ENABLED`);
      console.log(`Remote Server : ${this.host}:${this.port}`);
      console.log('='.repeat(70));
      console.log('');

      this._connect();
      resolve();
    });
  }

  /**
   * Connect ke remote server
   * @private
   */
  _connect() {
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }

    this.client = new net.Socket();

    this.client.connect(this.port, this.host, () => {
      this.connected = true;
      
      // CRITICAL: Disable Nagle's algorithm untuk real-time data
      this.client.setNoDelay(true);
      this.client.setKeepAlive(true, 30000);
      
      console.log(`📤 [TCP Sender] ✅ Connected to ${this.host}:${this.port}`);
      
      // Kirim buffered data jika ada
      this._flushBuffer();
    });

    this.client.on('data', (data) => {
      // Response dari server (biasanya tidak ada, tapi log jika ada)
      const response = data.toString().trim();
      if (response) {
        console.log(`📤 [TCP Sender] Response: ${response.substring(0, 100)}`);
      }
    });

    this.client.on('close', () => {
      this.connected = false;
      console.log(`📤 [TCP Sender] ❌ Disconnected from ${this.host}:${this.port}`);
      this._scheduleReconnect();
    });

    this.client.on('error', (error) => {
      this.connected = false;
      if (error.code === 'ECONNREFUSED') {
        console.error(`📤 [TCP Sender] ❌ Connection refused to ${this.host}:${this.port}`);
      } else if (error.code === 'ETIMEDOUT') {
        console.error(`📤 [TCP Sender] ❌ Connection timeout to ${this.host}:${this.port}`);
      } else if (error.code === 'ENOTFOUND') {
        console.error(`📤 [TCP Sender] ❌ Host not found: ${this.host}`);
      } else {
        console.error(`📤 [TCP Sender] ❌ Error: ${error.message}`);
      }
      // Reconnect akan di-handle oleh 'close' event
    });

    this.client.on('timeout', () => {
      console.log(`📤 [TCP Sender] ⏰ Socket timeout, reconnecting...`);
      this.client.destroy();
    });

    // Set timeout 30 detik
    this.client.setTimeout(30000);
  }

  /**
   * Schedule reconnect
   * @private
   */
  _scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    console.log(`📤 [TCP Sender] 🔄 Reconnecting in ${this.reconnectDelay / 1000}s...`);
    
    this.reconnectTimer = setTimeout(() => {
      this._connect();
    }, this.reconnectDelay);
  }

  /**
   * Flush buffered data
   * @private
   */
  _flushBuffer() {
    if (this.buffer.length > 0 && this.connected) {
      console.log(`📤 [TCP Sender] Flushing ${this.buffer.length} buffered messages...`);
      for (const msg of this.buffer) {
        this._sendImmediate(msg);
      }
      this.buffer = [];
    }
  }

  /**
   * Send data immediately tanpa buffer
   * @param {string} message - NMEA message
   * @private
   */
  _sendImmediate(message) {
    if (!this.client || this.client.destroyed) return false;

    try {
      // Pastikan message diakhiri dengan CRLF
      const msg = message.endsWith('\r\n') 
        ? message 
        : message.replace(/[\r\n]+$/, '') + '\r\n';
      
      this.client.write(msg);
      this.messagesSent++;
      return true;
    } catch (error) {
      console.error(`📤 [TCP Sender] Send error: ${error.message}`);
      return false;
    }
  }

  /**
   * Send/forward data AIS ke remote server
   * @param {string} rawMessage - Raw NMEA AIS message
   */
  send(rawMessage) {
    if (!this.enabled) return;

    if (this.connected) {
      this._sendImmediate(rawMessage);
    } else {
      // Buffer saat disconnected
      if (this.buffer.length < this.maxBufferSize) {
        this.buffer.push(rawMessage);
      }
    }
  }

  /**
   * Alias untuk send (kompatibilitas dengan forwarder)
   * @param {string} rawMessage - Raw NMEA AIS message
   */
  forward(rawMessage) {
    this.send(rawMessage);
  }

  /**
   * Check apakah connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Mendapatkan statistik sender
   * @returns {Object}
   */
  getStats() {
    return {
      enabled: this.enabled,
      host: this.host,
      port: this.port,
      connected: this.connected,
      messagesSent: this.messagesSent,
      bufferedMessages: this.buffer.length
    };
  }

  /**
   * Stop TCP sender
   */
  stop() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.client) {
      this.client.destroy();
      this.client = null;
    }

    this.connected = false;
    console.log('📤 [TCP Sender] Stopped');
  }
}

export default TCPSender;
