/**
 * @fileoverview Fungsi helper umum
 * @module utils/helpers
 */

import macaddress from 'macaddress';

/**
 * Deskripsi tipe pesan AIS
 * @readonly
 * @type {Object<number, string>}
 */
const AIS_MESSAGE_TYPES = {
  1: 'Position Report (Class A)',
  2: 'Position Report (Class A)',
  3: 'Position Report (Class A)',
  4: 'Base Station Report',
  5: 'Static and Voyage Data',
  18: 'Position Report (Class B)',
  19: 'Extended Position Report (Class B)',
  21: 'Aid-to-Navigation Report',
  24: 'Static Data Report'
};

/**
 * Mendapatkan tipe pesan AIS dari raw message
 * @param {string} message - Raw AIS message
 * @returns {number|string} Tipe pesan atau 'Unknown'
 */
export function getAISMessageType(message) {
  const parts = message.split(',');
  if (parts.length >= 6) {
    const payload = parts[5];
    if (payload && payload.length > 0) {
      const firstChar = payload.charCodeAt(0);
      const messageType = firstChar - 48;
      if (messageType > 40) {
        return (firstChar - 56);
      }
      return messageType;
    }
  }
  return 'Unknown';
}

/**
 * Mendapatkan deskripsi tipe pesan AIS
 * @param {number|string} type - Tipe pesan
 * @returns {string} Deskripsi tipe pesan
 */
export function getMessageTypeDescription(type) {
  return AIS_MESSAGE_TYPES[type] || `Type ${type}`;
}

/**
 * Mengecek apakah message adalah AIS message
 * @param {string} message - Raw message
 * @returns {boolean} True jika AIS message
 */
export function isAISMessage(message) {
  return message.startsWith('!AIVDM') || message.startsWith('!AIVDO');
}

/**
 * Mendapatkan MAC address perangkat
 * @returns {Promise<string|null>} MAC address atau null jika gagal
 */
export async function getMacAddress() {
  try {
    const mac = await macaddress.one();
    return mac;
  } catch (err) {
    console.error('Error mendapatkan MAC address:', err.message);
    return null;
  }
}

/**
 * Class untuk menghitung delay antar pesan
 */
export class DelayTracker {
  constructor() {
    this.lastMessageTime = null;
  }

  /**
   * Mendapatkan delay dari pesan sebelumnya
   * @returns {string} Delay dalam format string
   */
  getDelay() {
    if (!this.lastMessageTime) return 'First message';
    const delay = Date.now() - this.lastMessageTime;
    return `${delay}ms`;
  }

  /**
   * Update waktu pesan terakhir
   */
  update() {
    this.lastMessageTime = Date.now();
  }

  /**
   * Reset tracker
   */
  reset() {
    this.lastMessageTime = null;
  }
}

/**
 * Class untuk statistik aplikasi
 */
export class Statistics {
  constructor() {
    this.messageCount = 0;
    this.wsSentCount = 0;
    this.startTime = null;
  }

  /**
   * Start statistik
   */
  start() {
    this.startTime = Date.now();
  }

  /**
   * Increment message count
   */
  incrementMessage() {
    this.messageCount++;
  }

  /**
   * Increment WebSocket sent count
   * @param {number} count - Jumlah pesan terkirim
   */
  incrementWsSent(count = 1) {
    this.wsSentCount += count;
  }

  /**
   * Get current message count
   * @returns {number} Message count
   */
  getMessageCount() {
    return this.messageCount;
  }

  /**
   * Mendapatkan statistik saat ini
   * @param {boolean} wsConnected - Status koneksi WebSocket
   * @returns {Object} Objek statistik
   */
  getStats(wsConnected) {
    const uptime = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    const messagesPerMinute = uptime > 0 ? (this.messageCount / (uptime / 60)).toFixed(2) : 0;
    const messagesPerSecond = uptime > 0 ? (this.messageCount / uptime).toFixed(2) : 0;

    return {
      messageCount: this.messageCount,
      wsSentCount: this.wsSentCount,
      wsConnected,
      uptime,
      messagesPerMinute,
      messagesPerSecond
    };
  }

  /**
   * Menampilkan statistik ke console
   * @param {boolean} wsConnected - Status koneksi WebSocket
   */
  show(wsConnected) {
    const stats = this.getStats(wsConnected);
    
    console.log('\n' + '='.repeat(70));
    console.log(`📊 STATISTIK REALTIME`);
    console.log('='.repeat(70));
    console.log(`Total Pesan      : ${stats.messageCount}`);
    console.log(`Sent to WS       : ${stats.wsSentCount}`);
    console.log(`WS Status        : ${stats.wsConnected ? '✓ Connected' : '✗ Disconnected'}`);
    console.log(`Uptime           : ${stats.uptime} detik`);
    console.log(`Rate             : ${stats.messagesPerMinute} pesan/menit`);
    console.log(`Average          : ${stats.messagesPerSecond} pesan/detik`);
    console.log(`Last Update      : ${new Date().toLocaleTimeString('id-ID')}`);
    console.log('='.repeat(70) + '\n');
  }

  /**
   * Reset statistik
   */
  reset() {
    this.messageCount = 0;
    this.wsSentCount = 0;
    this.startTime = Date.now();
  }
}

export default {
  getAISMessageType,
  getMessageTypeDescription,
  isAISMessage,
  getMacAddress,
  DelayTracker,
  Statistics
};
