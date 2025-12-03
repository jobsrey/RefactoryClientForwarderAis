/**
 * @fileoverview Processor untuk memproses data AIS
 * @module core/ais-processor
 */

import AISDecoder from 'decoder-ais-jasalog';
import logger from '../utils/logger.js';
import { 
  getAISMessageType, 
  getMessageTypeDescription, 
  isAISMessage,
  DelayTracker,
  Statistics 
} from '../utils/helpers.js';

/**
 * Class untuk memproses data AIS
 */
export class AISProcessor {
  /**
   * @param {DataBuffer} dataBuffer - Instance data buffer
   * @param {TCPForwarder} [tcpForwarder] - Optional TCP Forwarder untuk OpenCPN
   */
  constructor(dataBuffer, tcpForwarder = null) {
    this.dataBuffer = dataBuffer;
    this.decoder = new AISDecoder();
    this.delayTracker = new DelayTracker();
    this.statistics = new Statistics();
    this.tcpForwarder = tcpForwarder;
  }

  /**
   * Proses data AIS yang diterima
   * @param {string} message - Raw message dari AIS receiver
   */
  process(message) {
    if (!message) return;

    if (isAISMessage(message)) {
      this._processAISMessage(message);
    } else if (message.length > 0) {
      this._processOtherData(message);
    }
  }

  /**
   * Proses pesan AIS
   * @param {string} message - Raw AIS message
   * @private
   */
  _processAISMessage(message) {
    this.statistics.incrementMessage();
    
    const delay = this.delayTracker.getDelay();
    this.delayTracker.update();

    const msgType = getAISMessageType(message);
    const msgDesc = getMessageTypeDescription(msgType);
    
    // Decode AIS message
    const decodedData = this.decoder.decode(message);
    
    // Kirim ke buffer (akan di-forward ke WebSocket)
    const wsStatus = this.dataBuffer.add(decodedData, message);

    // Forward raw NMEA ke TCP Forwarder (untuk OpenCPN)
    if (this.tcpForwarder) {
      this.tcpForwarder.forward(message);
    }

    // Log ke console
    logger.aisMessage({
      messageCount: this.statistics.getMessageCount(),
      delay,
      wsStatus,
      msgDesc,
      decodedData,
      rawMessage: message
    });
  }

  /**
   * Proses data non-AIS
   * @param {string} message - Raw message
   * @private
   */
  _processOtherData(message) {
    logger.otherData(message);
  }

  /**
   * Start processor (reset statistics)
   */
  start() {
    this.statistics.start();
    this.delayTracker.reset();
  }

  /**
   * Mendapatkan statistik
   * @param {boolean} wsConnected - Status koneksi WebSocket
   * @returns {Object} Objek statistik
   */
  getStats(wsConnected) {
    return this.statistics.getStats(wsConnected);
  }

  /**
   * Tampilkan statistik ke console
   * @param {boolean} wsConnected - Status koneksi WebSocket
   */
  showStats(wsConnected) {
    // Update wsSentCount dari dataBuffer
    this.statistics.wsSentCount = this.dataBuffer.getSentCount();
    this.statistics.show(wsConnected);
  }

  /**
   * Cek apakah sudah ada pesan yang diproses
   * @returns {boolean} True jika ada pesan
   */
  hasMessages() {
    return this.statistics.getMessageCount() > 0;
  }

  /**
   * Reset processor
   */
  reset() {
    this.statistics.reset();
    this.delayTracker.reset();
  }
}

export default AISProcessor;
