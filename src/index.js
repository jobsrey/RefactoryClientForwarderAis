/**
 * @fileoverview Entry point utama aplikasi AIS Data Forwarder
 * @module index
 * 
 * @description
 * Aplikasi ini menerima data AIS dari berbagai sumber (Serial, TCP, UDP)
 * dan meneruskannya ke WebSocket server untuk distribusi ke client.
 * 
 * @author WiWIT Project
 * @version 1.0.0
 */

import { 
  CONNECTION_MODE, 
  SERIAL_CONFIG, 
  TCP_CONFIG, 
  UDP_CONFIG, 
  WEBSOCKET_CONFIG,
  APP_CONFIG,
  FORWARDER_CONFIG,
  SENDER_CONFIG 
} from './config.js';
import { createConnection, WebSocketConnection, TCPForwarder, TCPSender } from './connections/index.js';
import { DataBuffer, AISProcessor } from './core/index.js';
import { getMacAddress } from './utils/helpers.js';
import logger from './utils/logger.js';

/**
 * Class utama aplikasi AIS Data Forwarder
 */
class AISDataForwarder {
  constructor() {
    this.macAddress = null;
    this.wsConnection = null;
    this.aisConnection = null;
    this.dataBuffer = null;
    this.aisProcessor = null;
    this.statsInterval = null;
    this.tcpForwarder = null;
    this.tcpSender = null;
    this.deviceStatusInterval = null;
    this.lastDeviceStatus = null;
  }

  /**
   * Tampilkan informasi startup
   * @private
   */
  _showStartupInfo() {
    console.log('=== AIS Data Forwarder ===');
    console.log(`Connection Mode: ${CONNECTION_MODE.toUpperCase()}`);

    switch (CONNECTION_MODE) {
      case 'serial':
        console.log(`Serial Port: ${SERIAL_CONFIG.path}`);
        console.log(`Baud Rate: ${SERIAL_CONFIG.baudRate}`);
        break;
      case 'tcp':
        console.log(`TCP Host: ${TCP_CONFIG.host}`);
        console.log(`TCP Port: ${TCP_CONFIG.port}`);
        break;
      case 'udp':
        console.log(`UDP Host: ${UDP_CONFIG.host}`);
        console.log(`UDP Port: ${UDP_CONFIG.port}`);
        console.log(`Listen Port: ${UDP_CONFIG.listenPort}`);
        break;
    }

    console.log(`WebSocket Server: ${WEBSOCKET_CONFIG.server}`);
    console.log(`Mode: Pengiriman segera saat data diterima (debounce: ${APP_CONFIG.debounceDelay}ms)`);
    
    // TCP Forwarder info (SERVER - menerima koneksi dari OpenCPN)
    if (FORWARDER_CONFIG.enabled) {
      console.log(`TCP Forwarder: ${FORWARDER_CONFIG.host}:${FORWARDER_CONFIG.port} (OpenCPN/Telnet)`);
    } else {
      console.log(`TCP Forwarder: DISABLED`);
    }
    
    // TCP Sender info (CLIENT - forward ke remote server)
    if (SENDER_CONFIG.enabled) {
      console.log(`TCP Sender: -> ${SENDER_CONFIG.host}:${SENDER_CONFIG.port} (Forward to remote)`);
    } else {
      console.log(`TCP Sender: DISABLED`);
    }
    console.log('');
  }

  /**
   * Inisialisasi MAC address
   * @private
   */
  async _initMacAddress() {
    this.macAddress = await getMacAddress();
    console.log(`Device MAC Address: ${this.macAddress || 'Tidak dapat dideteksi'}`);
    console.log(`APP_KEY: ${APP_CONFIG.appKey}\n`);

    if (!this.macAddress) {
      this.macAddress = 'DEFAULT_MAC_ADDRESS';
      console.log('⚠️  Using default MAC address\n');
    }
  }

  /**
   * Setup koneksi WebSocket
   * @private
   */
  _setupWebSocket() {
    this.wsConnection = new WebSocketConnection(this.macAddress);
    
    this.wsConnection.on('connected', () => {
      // WebSocket connected event
    });

    this.wsConnection.on('disconnected', () => {
      // WebSocket disconnected, reconnect handled internally
    });

    this.wsConnection.on('error', (error) => {
      // WebSocket error
    });

    console.log('Connecting to WebSocket Server...');
    this.wsConnection.connect();
  }

  /**
   * Setup koneksi AIS
   * @private
   */
  _setupAISConnection() {
    this.aisConnection = createConnection(CONNECTION_MODE);

    this.aisConnection.on('connected', () => {
      this.aisProcessor.start();
      // Device (Serial/TCP/UDP) is now connected - send ONLINE status
      this._sendDeviceStatus(true);
    });

    this.aisConnection.on('data', (message) => {
      this.aisProcessor.process(message);
    });

    this.aisConnection.on('disconnected', () => {
      this._handleAISDisconnect();
    });

    this.aisConnection.on('error', (error) => {
      // Error already logged in connection
    });

    this.aisConnection.connect();
  }

  /**
   * Handle disconnect dari AIS
   * @private
   */
  _handleAISDisconnect() {
    // Device (Serial/TCP/UDP) disconnected - send OFFLINE status
    this._sendDeviceStatus(false);
    this.aisConnection.disconnect();
    this.aisConnection.scheduleReconnect();
  }

  /**
   * Send device connection status to WebSocket server
   * Status is based on actual device connection (Serial/TCP/UDP), NOT WebSocket connection
   * @param {boolean} isOnline - Whether the AIS device (Serial/TCP/UDP) is connected
   * @private
   */
  _sendDeviceStatus(isOnline) {
    if (!this.wsConnection || !this.wsConnection.isReady()) {
      return;
    }

    // Only send if status changed or first time
    if (this.lastDeviceStatus === isOnline) {
      return;
    }

    this.lastDeviceStatus = isOnline;

    const statusPayload = {
      type: 'device_status',
      app_key: APP_CONFIG.appKey,
      user_key: APP_CONFIG.userKey,
      mac_address: this.macAddress,
      isOnline: isOnline,
      connectionMode: CONNECTION_MODE,
      timestamp: new Date().toISOString()
    };

    const success = this.wsConnection.send(statusPayload);
    if (success) {
      console.log(`📡 Device status sent: ${isOnline ? 'ONLINE' : 'OFFLINE'} (${CONNECTION_MODE})`);
    }
  }

  /**
   * Setup device status interval to periodically send status
   * This ensures server knows the current device connection state
   * @private
   */
  _setupDeviceStatusInterval() {
    // Send initial status after WebSocket connects
    setTimeout(() => {
      // Check actual device connection status (Serial/TCP/UDP), not WebSocket
      const deviceConnected = this.aisConnection?.isConnected || false;
      this._sendDeviceStatus(deviceConnected);
    }, 2000);

    // Periodically check and send device status
    this.deviceStatusInterval = setInterval(() => {
      // Check actual device connection status (Serial/TCP/UDP), not WebSocket
      const deviceConnected = this.aisConnection?.isConnected || false;
      
      // Force send status periodically to keep server updated
      this.lastDeviceStatus = null; // Reset to force send
      this._sendDeviceStatus(deviceConnected);
    }, APP_CONFIG.deviceStatusInterval);
  }

  /**
   * Setup statistik interval
   * @private
   */
  _setupStatsInterval() {
    this.statsInterval = setInterval(() => {
      if (this.aisProcessor.hasMessages()) {
        this.aisProcessor.showStats(this.wsConnection?.isConnected || false);
      }
    }, APP_CONFIG.statsInterval);
  }

  /**
   * Setup signal handlers untuk graceful shutdown
   * @private
   */
  _setupSignalHandlers() {
    const shutdown = () => this.shutdown();
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  /**
   * Shutdown aplikasi dengan graceful
   */
  shutdown() {
    console.log('\n\n' + '='.repeat(70));
    console.log('🛑 MENUTUP APLIKASI');
    console.log('='.repeat(70));

    // Tampilkan statistik terakhir
    if (this.aisProcessor) {
      this.aisProcessor.showStats(this.wsConnection?.isConnected || false);
    }

    // Clear intervals
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    if (this.deviceStatusInterval) {
      clearInterval(this.deviceStatusInterval);
    }

    // Send offline status before shutdown (device disconnecting)
    this.lastDeviceStatus = null;
    this._sendDeviceStatus(false);

    // Disconnect semua koneksi
    if (this.aisConnection) {
      this.aisConnection.disconnect();
    }

    if (this.wsConnection) {
      this.wsConnection.disconnect();
    }

    if (this.dataBuffer) {
      this.dataBuffer.clear();
    }

    // Stop TCP Forwarder
    if (this.tcpForwarder) {
      this.tcpForwarder.stop();
    }

    // Stop TCP Sender
    if (this.tcpSender) {
      this.tcpSender.stop();
    }

    console.log('Terima kasih!\n');
    process.exit(0);
  }

  /**
   * Start aplikasi
   */
  async start() {
    try {
      // Tampilkan info startup
      this._showStartupInfo();

      // Inisialisasi MAC address
      await this._initMacAddress();

      // Setup WebSocket connection
      this._setupWebSocket();

      // Setup TCP Forwarder untuk OpenCPN (SERVER - menerima koneksi)
      this.tcpForwarder = new TCPForwarder(FORWARDER_CONFIG);
      await this.tcpForwarder.start();

      // Setup TCP Sender untuk forward ke remote server (CLIENT - mengirim data)
      this.tcpSender = new TCPSender(SENDER_CONFIG);
      await this.tcpSender.start();

      // Setup data buffer dan AIS processor
      this.dataBuffer = new DataBuffer(this.wsConnection, this.macAddress);
      this.aisProcessor = new AISProcessor(this.dataBuffer, this.tcpForwarder, this.tcpSender);

      // Setup AIS connection
      this._setupAISConnection();

      // Setup statistik interval
      this._setupStatsInterval();

      // Setup device status interval (tracks device connection, not WebSocket)
      this._setupDeviceStatusInterval();

      // Setup signal handlers
      this._setupSignalHandlers();

      console.log(`Aplikasi berjalan. Data akan dikirim segera saat diterima dari ${CONNECTION_MODE.toUpperCase()}.`);
      console.log('Tekan CTRL+C untuk berhenti.');

    } catch (error) {
      logger.error(`Gagal memulai aplikasi: ${error.message}`);
      process.exit(1);
    }
  }
}

// Create dan start aplikasi
const app = new AISDataForwarder();
app.start();

export default AISDataForwarder;
