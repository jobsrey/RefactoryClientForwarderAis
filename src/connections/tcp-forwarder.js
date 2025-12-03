/**
 * @fileoverview TCP Forwarder Server untuk mengirim data AIS ke OpenCPN via TCP/Telnet
 * @module connections/tcp-forwarder
 */

import net from 'net';
import logger from '../utils/logger.js';

/**
 * Class TCP Forwarder Server
 * Membuat TCP server yang menerima koneksi dari OpenCPN atau aplikasi lain
 * dan meneruskan data AIS NMEA secara real-time
 */
export class TCPForwarder {
  /**
   * @param {Object} config - Konfigurasi forwarder
   * @param {boolean} config.enabled - Apakah forwarder aktif
   * @param {string} config.host - IP address untuk listen (0.0.0.0 untuk semua interface)
   * @param {number} config.port - Port untuk listen
   */
  constructor(config) {
    this.enabled = config.enabled || false;
    this.host = config.host || '0.0.0.0';
    this.port = config.port || 10111;
    this.server = null;
    this.clients = new Set();
    this.messagesSent = 0;
  }

  /**
   * Start TCP server
   * @returns {Promise<void>}
   */
  start() {
    return new Promise((resolve, reject) => {
      if (!this.enabled) {
        console.log('📡 TCP Forwarder: DISABLED');
        resolve();
        return;
      }

      this.server = net.createServer((socket) => {
        this._handleConnection(socket);
      });

      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ TCP Forwarder Error: Port ${this.port} sudah digunakan`);
        } else {
          console.error(`❌ TCP Forwarder Error: ${error.message}`);
        }
        reject(error);
      });

      this.server.listen(this.port, this.host, () => {
        console.log('');
        console.log('='.repeat(70));
        console.log('📡 TCP FORWARDER SERVER - FOR OPENCPN / TELNET');
        console.log('='.repeat(70));
        console.log(`Status        : ENABLED`);
        console.log(`Listen IP     : ${this.host}`);
        console.log(`Listen Port   : ${this.port}`);
        console.log(`Connect URL   : telnet://${this.host === '0.0.0.0' ? 'localhost' : this.host}:${this.port}`);
        console.log('='.repeat(70));
        console.log('');
        resolve();
      });
    });
  }

  /**
   * Handle koneksi baru dari client
   * @param {net.Socket} socket - Socket client
   * @private
   */
  _handleConnection(socket) {
    const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
    this.clients.add(socket);

    console.log(`📡 [TCP Forwarder] Client connected: ${clientId} (Total: ${this.clients.size})`);

    // Kirim welcome message
    socket.write(`# AIS Data Forwarder - R400NG\r\n`);
    socket.write(`# Connected at ${new Date().toISOString()}\r\n`);
    socket.write(`# Waiting for AIS data...\r\n`);

    socket.on('close', () => {
      this.clients.delete(socket);
      console.log(`📡 [TCP Forwarder] Client disconnected: ${clientId} (Total: ${this.clients.size})`);
    });

    socket.on('error', (error) => {
      this.clients.delete(socket);
      // Ignore ECONNRESET errors
      if (error.code !== 'ECONNRESET') {
        console.error(`📡 [TCP Forwarder] Client error (${clientId}): ${error.message}`);
      }
    });

    // Handle incoming data dari client (biasanya tidak ada, tapi bisa untuk commands)
    socket.on('data', (data) => {
      const command = data.toString().trim().toLowerCase();
      if (command === 'stats') {
        socket.write(`# Messages sent: ${this.messagesSent}\r\n`);
        socket.write(`# Connected clients: ${this.clients.size}\r\n`);
      } else if (command === 'help') {
        socket.write(`# Commands: stats, help\r\n`);
      }
    });
  }

  /**
   * Forward data AIS ke semua client yang terhubung
   * @param {string} rawMessage - Raw NMEA AIS message
   */
  forward(rawMessage) {
    if (!this.enabled || this.clients.size === 0) {
      return;
    }

    // Pastikan message diakhiri dengan CRLF (standar NMEA)
    const message = rawMessage.endsWith('\r\n') 
      ? rawMessage 
      : rawMessage.replace(/[\r\n]+$/, '') + '\r\n';

    // Broadcast ke semua client
    for (const client of this.clients) {
      if (!client.destroyed) {
        try {
          client.write(message);
          this.messagesSent++;
        } catch (error) {
          // Client mungkin sudah disconnect
          this.clients.delete(client);
        }
      }
    }
  }

  /**
   * Mendapatkan jumlah client yang terhubung
   * @returns {number}
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Mendapatkan statistik forwarder
   * @returns {Object}
   */
  getStats() {
    return {
      enabled: this.enabled,
      host: this.host,
      port: this.port,
      connectedClients: this.clients.size,
      messagesSent: this.messagesSent
    };
  }

  /**
   * Stop TCP server
   */
  stop() {
    if (this.server) {
      // Close semua client connections
      for (const client of this.clients) {
        client.destroy();
      }
      this.clients.clear();

      this.server.close(() => {
        console.log('📡 [TCP Forwarder] Server stopped');
      });
      this.server = null;
    }
  }
}

export default TCPForwarder;
