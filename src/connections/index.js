/**
 * @fileoverview Export semua modul koneksi
 * @module connections
 */

export { BaseConnection } from './base-connection.js';
export { SerialConnection } from './serial-connection.js';
export { TCPConnection } from './tcp-connection.js';
export { UDPConnection } from './udp-connection.js';
export { WebSocketConnection } from './websocket-connection.js';

import { CONNECTION_MODES } from '../config.js';
import { SerialConnection } from './serial-connection.js';
import { TCPConnection } from './tcp-connection.js';
import { UDPConnection } from './udp-connection.js';

/**
 * Factory untuk membuat koneksi berdasarkan mode
 * @param {string} mode - Mode koneksi ('serial', 'tcp', 'udp')
 * @returns {BaseConnection} Instance koneksi
 */
export function createConnection(mode) {
  switch (mode) {
    case CONNECTION_MODES.TCP:
      return new TCPConnection();
    case CONNECTION_MODES.UDP:
      return new UDPConnection();
    case CONNECTION_MODES.SERIAL:
    default:
      return new SerialConnection();
  }
}
