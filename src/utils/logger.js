/**
 * @fileoverview Utilitas logging untuk aplikasi
 * @module utils/logger
 */

/**
 * Format timestamp dengan presisi tinggi
 * @returns {string} Timestamp terformat
 */
export function getTimeStamp() {
  const now = new Date();
  return now.toLocaleTimeString('id-ID', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
}

/**
 * Membuat separator line
 * @param {number} length - Panjang separator
 * @param {string} char - Karakter separator
 * @returns {string} Separator line
 */
export function separator(length = 70, char = '─') {
  return char.repeat(length);
}

/**
 * Membuat header box
 * @param {string} title - Judul header
 * @param {number} width - Lebar box
 * @returns {string} Header box
 */
export function headerBox(title, width = 70) {
  return '\n' + '='.repeat(width) + '\n' + title + '\n' + '='.repeat(width);
}

/**
 * Logger class untuk manajemen log
 */
class Logger {
  /**
   * Log info message
   * @param {string} message - Pesan
   */
  info(message) {
    console.log(`[${getTimeStamp()}] ${message}`);
  }

  /**
   * Log success message
   * @param {string} message - Pesan
   */
  success(message) {
    console.log(`[${getTimeStamp()}] ✓ ${message}`);
  }

  /**
   * Log warning message
   * @param {string} message - Pesan
   */
  warn(message) {
    console.log(`[${getTimeStamp()}] ⚠️  ${message}`);
  }

  /**
   * Log error message
   * @param {string} message - Pesan
   */
  error(message) {
    console.error(`[${getTimeStamp()}] ❌ ${message}`);
  }

  /**
   * Log data AIS
   * @param {Object} params - Parameter log
   */
  aisMessage(params) {
    const { messageCount, delay, wsStatus, msgDesc, decodedData, rawMessage } = params;
    
    console.log(`[${getTimeStamp()}] 📡 Pesan #${messageCount} | Delay: ${delay} | WS: ${wsStatus ? '✓' : '✗'}`);
    console.log(`  Type: ${msgDesc}`);

    if (decodedData?.country) {
      console.log(`  Country: ${decodedData.country} (${decodedData.countryCode}) | MMSI: ${decodedData.mmsi}`);
    } else if (decodedData?.mmsi) {
      console.log(`  MMSI: ${decodedData.mmsi} | Country: Unknown`);
    }

    console.log(`  Data: ${rawMessage}`);
    console.log(`  Decoded:`, JSON.stringify(decodedData, null, 2));
    console.log(separator());
  }

  /**
   * Log data non-AIS
   * @param {string} message - Pesan
   */
  otherData(message) {
    console.log(`[${getTimeStamp()}] 📋 Data lain: ${message}`);
    console.log(separator());
  }

  /**
   * Log tips
   * @param {string[]} tips - Array tips
   */
  tips(tips) {
    console.error(`\n💡 Tips: Pastikan:`);
    tips.forEach((tip, index) => {
      console.error(`   ${index + 1}. ${tip}`);
    });
  }
}

export const logger = new Logger();
export default logger;
