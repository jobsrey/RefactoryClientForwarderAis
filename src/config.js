/**
 * @fileoverview Konfigurasi aplikasi AIS Data Forwarder
 * @module config
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Mode koneksi yang tersedia
 * @readonly
 * @enum {string}
 */
export const CONNECTION_MODES = {
  SERIAL: 'serial',
  TCP: 'tcp',
  UDP: 'udp'
};

/**
 * Konfigurasi mode koneksi aktif
 * @type {string}
 */
export const CONNECTION_MODE = process.env.CONNECTION_MODE || CONNECTION_MODES.SERIAL;

/**
 * Konfigurasi Serial Port (R400NG)
 * @type {Object}
 */
export const SERIAL_CONFIG = Object.freeze({
  path: process.env.SERIAL_PORT || 'COM3',
  baudRate: parseInt(process.env.SERIAL_BAUD_RATE) || 38400,
  dataBits: parseInt(process.env.SERIAL_DATA_BITS) || 8,
  stopBits: parseInt(process.env.SERIAL_STOP_BITS) || 1,
  parity: process.env.SERIAL_PARITY || 'none'
});

/**
 * Konfigurasi TCP/IP
 * @type {Object}
 */
export const TCP_CONFIG = Object.freeze({
  host: process.env.TCP_HOST || '192.168.1.100',
  port: parseInt(process.env.TCP_PORT) || 10110
});

/**
 * Konfigurasi UDP
 * @type {Object}
 */
export const UDP_CONFIG = Object.freeze({
  host: process.env.UDP_HOST || '192.168.1.100',
  port: parseInt(process.env.UDP_PORT) || 10110,
  listenPort: parseInt(process.env.UDP_LISTEN_PORT) || 10110
});

/**
 * Konfigurasi WebSocket
 * @type {Object}
 */
export const WEBSOCKET_CONFIG = Object.freeze({
  server: process.env.WEBSOCKET_SERVER || 'ws://localhost:8081',
  reconnectDelay: 5000
});

/**
 * Konfigurasi aplikasi umum
 * @type {Object}
 */
export const APP_CONFIG = Object.freeze({
  debounceDelay: parseInt(process.env.DEBOUNCE_DELAY) || 100,
  statsInterval: 30000,
  appKey: process.env.APP_KEY || '',
  userKey: process.env.USER_KEY || ''
});

/**
 * Konfigurasi TCP Forwarder untuk OpenCPN/Telnet
 * @type {Object}
 */
export const FORWARDER_CONFIG = Object.freeze({
  enabled: process.env.FORWARDER_ENABLED === 'true',
  host: process.env.FORWARDER_HOST || '0.0.0.0',
  port: parseInt(process.env.FORWARDER_PORT) || 10111
});

/**
 * Mendapatkan konfigurasi source berdasarkan mode koneksi
 * @returns {Object} Objek dengan source dan sourcePort
 */
export function getSourceConfig() {
  switch (CONNECTION_MODE) {
    case CONNECTION_MODES.TCP:
      return {
        source: 'AIS_TCP',
        sourcePort: `${TCP_CONFIG.host}:${TCP_CONFIG.port}`
      };
    case CONNECTION_MODES.UDP:
      return {
        source: 'AIS_UDP',
        sourcePort: `${UDP_CONFIG.host}:${UDP_CONFIG.port}`
      };
    default:
      return {
        source: 'R400NG_Serial',
        sourcePort: SERIAL_CONFIG.path
      };
  }
}

export default {
  CONNECTION_MODE,
  CONNECTION_MODES,
  SERIAL_CONFIG,
  TCP_CONFIG,
  UDP_CONFIG,
  WEBSOCKET_CONFIG,
  APP_CONFIG,
  FORWARDER_CONFIG,
  getSourceConfig
};
