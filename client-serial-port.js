import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import AISDecoder from 'decoder-ais-jasalog';
import WebSocket from 'ws';
import macaddress from 'macaddress';
import net from 'net';
import dgram from 'dgram';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================
// KONFIGURASI MODE KONEKSI (dari .env)
// ============================================
const CONNECTION_MODE = process.env.CONNECTION_MODE || 'serial';

// Konfigurasi R400NG Serial USB
const SERIAL_CONFIG = {
  path: process.env.SERIAL_PORT || 'COM3',
  baudRate: parseInt(process.env.SERIAL_BAUD_RATE) || 38400,
  dataBits: parseInt(process.env.SERIAL_DATA_BITS) || 8,
  stopBits: parseInt(process.env.SERIAL_STOP_BITS) || 1,
  parity: process.env.SERIAL_PARITY || 'none'
};

// Konfigurasi AIS via TCP/IP
const TCP_CONFIG = {
  host: process.env.TCP_HOST || '192.168.1.100',
  port: parseInt(process.env.TCP_PORT) || 10110
};

// Konfigurasi AIS via UDP
const UDP_CONFIG = {
  host: process.env.UDP_HOST || '192.168.1.100',
  port: parseInt(process.env.UDP_PORT) || 10110,
  listenPort: parseInt(process.env.UDP_LISTEN_PORT) || 10110
};

// Konfigurasi WebSocket
const WEBSOCKET_SERVER = process.env.WEBSOCKET_SERVER || 'ws://localhost:8081';
const DEBOUNCE_DELAY = parseInt(process.env.DEBOUNCE_DELAY) || 100;
const APP_KEY = process.env.APP_KEY || '';
const USER_KEY = process.env.USER_KEY || '';

// Buffer untuk menyimpan data AIS
let aisDataBuffer = [];
let serialPort = null;
let tcpClient = null;
let udpClient = null;
let parser = null;
let messageCount = 0;
let startTime = Date.now();
let lastMessageTime = null;
const aisDecoder = new AISDecoder();
let wsClient = null;
let wsConnected = false;
let wsSentCount = 0;
let deviceMacAddress = null;
let sendTimeout = null; // Untuk debouncing
let dataBuffer = ''; // Buffer untuk data TCP/UDP yang belum lengkap

// Fungsi untuk format waktu
function getTimeStamp() {
  const now = new Date();
  return now.toLocaleTimeString('id-ID', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
}

// Fungsi untuk menghitung delay
function getDelay() {
  if (!lastMessageTime) return 'First message';
  const delay = Date.now() - lastMessageTime;
  return `${delay}ms`;
}

// Fungsi untuk mendecode tipe message AIS (basic)
function getAISMessageType(message) {
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

// Fungsi untuk mendapatkan deskripsi message type
function getMessageTypeDescription(type) {
  const types = {
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
  return types[type] || `Type ${type}`;
}

// Fungsi untuk statistik
function showStats() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const messagesPerMinute = uptime > 0 ? (messageCount / (uptime / 60)).toFixed(2) : 0;
  const messagesPerSecond = uptime > 0 ? (messageCount / uptime).toFixed(2) : 0;
  
  console.log('\n' + '='.repeat(70));
  console.log(`📊 STATISTIK REALTIME`);
  console.log('='.repeat(70));
  console.log(`Total Pesan      : ${messageCount}`);
  console.log(`Sent to WS       : ${wsSentCount}`);
  console.log(`WS Status        : ${wsConnected ? '✓ Connected' : '✗ Disconnected'}`);
  console.log(`Uptime           : ${uptime} detik`);
  console.log(`Rate             : ${messagesPerMinute} pesan/menit`);
  console.log(`Average          : ${messagesPerSecond} pesan/detik`);
  console.log(`Last Update      : ${getTimeStamp()}`);
  console.log('='.repeat(70) + '\n');
}

// Fungsi untuk koneksi ke WebSocket Server
function connectWebSocket() {
  console.log(`[${getTimeStamp()}] Connecting to WebSocket Server: ${WEBSOCKET_SERVER}`);
  
  wsClient = new WebSocket(WEBSOCKET_SERVER);
  
  wsClient.on('open', () => {
    wsConnected = true;
    console.log(`[${getTimeStamp()}] ✓ WebSocket connected!`);
    
    // Kirim identify message sebagai sender
    wsClient.send(JSON.stringify({
      type: 'identify',
      clientType: 'sender',
      app_key: APP_KEY,
      user_key: USER_KEY,
      mac_address: deviceMacAddress
    }));
    console.log(`[${getTimeStamp()}] ✓ Sent identify message as sender`);
  });
  
  wsClient.on('close', () => {
    wsConnected = false;
    console.log(`[${getTimeStamp()}] ⚠️  WebSocket disconnected. Reconnecting in 5s...`);
    handleWebSocketDisconnect();
  });
  
  wsClient.on('error', (error) => {
    wsConnected = false;
    console.error(`[${getTimeStamp()}] ❌ WebSocket error: ${error.message}`);
  });
}

// Fungsi untuk menangani disconnect WebSocket
function handleWebSocketDisconnect() {
  wsClient = null;
  wsConnected = false;
  
  // Reconnect setelah 5 detik
  console.log(`[${getTimeStamp()}] Mencoba reconnect ke WebSocket Server dalam 5 detik...`);
  setTimeout(connectWebSocket, 5000);
}

// Fungsi untuk mendapatkan MAC address
async function getMacAddress() {
  try {
    const mac = await macaddress.one();
    return mac;
  } catch (err) {
    console.error('Error mendapatkan MAC address:', err.message);
    return null;
  }
}

// Fungsi untuk trigger pengiriman data dengan debouncing
function triggerImmediateSend() {
  // Clear timeout sebelumnya jika ada
  if (sendTimeout) {
    clearTimeout(sendTimeout);
  }
  
  // Set timeout baru untuk debouncing
  sendTimeout = setTimeout(() => {
    sendDataToWebSocket();
    sendTimeout = null;
  }, DEBOUNCE_DELAY);
}

// Fungsi untuk mengirim data ke WebSocket Server
function sendDataToWebSocket() {
  if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
    console.log('WebSocket belum siap, skip pengiriman data');
    return;
  }

  if (aisDataBuffer.length === 0) {
    console.log('Tidak ada data AIS untuk dikirim');
    return;
  }

  // Tentukan source dan sourcePort berdasarkan mode koneksi
  let source, sourcePort;
  if (CONNECTION_MODE === 'tcp') {
    source = 'AIS_TCP';
    sourcePort = `${TCP_CONFIG.host}:${TCP_CONFIG.port}`;
  } else if (CONNECTION_MODE === 'udp') {
    source = 'AIS_UDP';
    sourcePort = `${UDP_CONFIG.host}:${UDP_CONFIG.port}`;
  } else {
    source = 'R400NG_Serial';
    sourcePort = SERIAL_CONFIG.path;
  }

  const payload = {
    app_key: APP_KEY,
    mac_address: deviceMacAddress,
    source: source,
    sourcePort: sourcePort,
    receivedAt: new Date().toISOString(),
    dataCount: aisDataBuffer.length,
    aisData: aisDataBuffer
  };

  try {
    wsClient.send(JSON.stringify(payload));
    console.log(`✓ ${aisDataBuffer.length} data AIS terkirim segera ke WebSocket Server`);
    wsSentCount += aisDataBuffer.length;
    
    // Kosongkan buffer setelah berhasil dikirim
    aisDataBuffer = [];
  } catch (err) {
    console.error('Error mengirim data:', err.message);
  }
}

// Fungsi untuk kirim data ke WebSocket (legacy - untuk kompatibilitas)
function sendToWebSocket(decodedData, rawMessage) {
  // Add to buffer instead of sending immediately
  aisDataBuffer.push({
    message: rawMessage,
    timestamp: new Date().toISOString(),
    decoded: decodedData
  });
  
  // Trigger immediate send with debouncing
  triggerImmediateSend();
  
  return wsClient && wsClient.readyState === WebSocket.OPEN;
}

// ============================================
// FUNGSI UNTUK MEMPROSES DATA AIS
// ============================================
function processAISData(msg) {
  const now = Date.now();
  
  if (!msg) return;
  
  // Filter hanya message AIS
  if (msg.startsWith('!AIVDM') || msg.startsWith('!AIVDO')) {
    messageCount++;
    const delay = getDelay();
    lastMessageTime = now;
    
    const msgType = getAISMessageType(msg);
    const msgDesc = getMessageTypeDescription(msgType);
    
    // Decode AIS message
    const decodedData = aisDecoder.decode(msg);
    
    // Kirim ke WebSocket
    const sent = sendToWebSocket(decodedData, msg);
    
    // Format output REALTIME dengan timestamp presisi tinggi
    console.log(`[${getTimeStamp()}] 📡 Pesan #${messageCount} | Delay: ${delay} | WS: ${sent ? '✓' : '✗'}`);
    console.log(`  Type: ${msgDesc}`);
    
    // Tampilkan informasi negara jika ada
    if (decodedData && decodedData.country) {
      console.log(`  Country: ${decodedData.country} (${decodedData.countryCode}) | MMSI: ${decodedData.mmsi}`);
    } else if (decodedData && decodedData.mmsi) {
      console.log(`  MMSI: ${decodedData.mmsi} | Country: Unknown`);
    }
    
    console.log(`  Data: ${msg}`);
    console.log(`  Decoded:`, JSON.stringify(decodedData, null, 2));
    console.log('─'.repeat(70));
      
  } else if (msg.length > 0) {
    // Tampilkan data non-AIS juga REALTIME
    console.log(`[${getTimeStamp()}] 📋 Data lain: ${msg}`);
    console.log('─'.repeat(70));
  }
}

// ============================================
// KONEKSI TCP/IP
// ============================================
function connectToTCP() {
  console.log('\n' + '='.repeat(70));
  console.log('🚢 AIS DATA MONITOR - REALTIME MODE (TCP/IP)');
  console.log('='.repeat(70));
  console.log(`AIS Host      : ${TCP_CONFIG.host}`);
  console.log(`AIS Port      : ${TCP_CONFIG.port}`);
  console.log(`Mode          : REALTIME (Instant Display)`);
  console.log('='.repeat(70));
  console.log(`\n[${getTimeStamp()}] Menghubungkan ke AIS via TCP/IP...`);
  
  tcpClient = new net.Socket();
  
  tcpClient.connect(TCP_CONFIG.port, TCP_CONFIG.host, () => {
    console.log(`[${getTimeStamp()}] ✓ Koneksi TCP/IP berhasil! Stream REALTIME aktif...\n`);
    console.log('─'.repeat(70));
    startTime = Date.now();
  });
  
  tcpClient.on('data', (data) => {
    // Tambahkan data ke buffer
    dataBuffer += data.toString();
    
    // Proses data per baris
    let lines = dataBuffer.split('\n');
    
    // Simpan baris terakhir yang belum lengkap
    dataBuffer = lines.pop() || '';
    
    // Proses setiap baris yang lengkap
    lines.forEach(line => {
      const msg = line.trim();
      processAISData(msg);
    });
  });
  
  tcpClient.on('error', (err) => {
    console.error(`\n[${getTimeStamp()}] ❌ TCP Error: ${err.message}`);
    console.error(`\n💡 Tips: Pastikan:`);
    console.error(`   1. AIS receiver terhubung ke jaringan`);
    console.error(`   2. IP address dan port benar`);
    console.error(`   3. Tidak ada firewall yang memblokir koneksi`);
    handleDisconnect();
  });
  
  tcpClient.on('close', () => {
    console.log(`\n[${getTimeStamp()}] ⚠️  Koneksi TCP/IP terputus`);
    handleDisconnect();
  });
}

// ============================================
// KONEKSI UDP
// ============================================
function connectToUDP() {
  console.log('\n' + '='.repeat(70));
  console.log('🚢 AIS DATA MONITOR - REALTIME MODE (UDP)');
  console.log('='.repeat(70));
  console.log(`AIS Host      : ${UDP_CONFIG.host}`);
  console.log(`AIS Port      : ${UDP_CONFIG.port}`);
  console.log(`Listen Port   : ${UDP_CONFIG.listenPort}`);
  console.log(`Mode          : REALTIME (Instant Display)`);
  console.log('='.repeat(70));
  console.log(`\n[${getTimeStamp()}] Menghubungkan ke AIS via UDP...`);
  
  udpClient = dgram.createSocket('udp4');
  
  udpClient.on('listening', () => {
    const address = udpClient.address();
    console.log(`[${getTimeStamp()}] ✓ UDP listening pada ${address.address}:${address.port}`);
    console.log(`[${getTimeStamp()}] ✓ Stream REALTIME aktif...\n`);
    console.log('─'.repeat(70));
    startTime = Date.now();
  });
  
  udpClient.on('message', (msg, rinfo) => {
    // Tambahkan data ke buffer
    dataBuffer += msg.toString();
    
    // Proses data per baris
    let lines = dataBuffer.split('\n');
    
    // Simpan baris terakhir yang belum lengkap
    dataBuffer = lines.pop() || '';
    
    // Proses setiap baris yang lengkap
    lines.forEach(line => {
      const message = line.trim();
      processAISData(message);
    });
  });
  
  udpClient.on('error', (err) => {
    console.error(`\n[${getTimeStamp()}] ❌ UDP Error: ${err.message}`);
    console.error(`\n💡 Tips: Pastikan:`);
    console.error(`   1. Port UDP tidak digunakan aplikasi lain`);
    console.error(`   2. AIS receiver mengirim data ke port ini`);
    console.error(`   3. Tidak ada firewall yang memblokir UDP`);
    handleDisconnect();
  });
  
  udpClient.bind(UDP_CONFIG.listenPort);
}

// ============================================
// KONEKSI SERIAL USB
// ============================================
function connectToR400NG() {
  console.log('\n' + '='.repeat(70));
  console.log('🚢 AIS DATA MONITOR - REALTIME MODE (SERIAL USB)');
  console.log('='.repeat(70));
  console.log(`R400NG Port   : ${SERIAL_CONFIG.path}`);
  console.log(`Baud Rate     : ${SERIAL_CONFIG.baudRate}`);
  console.log(`Mode          : REALTIME (Instant Display)`);
  console.log('='.repeat(70));
  console.log(`\n[${getTimeStamp()}] Menghubungkan ke R400NG via Serial USB...`);
  
  // Buat koneksi serial port
  serialPort = new SerialPort({
    path: SERIAL_CONFIG.path,
    baudRate: SERIAL_CONFIG.baudRate,
    dataBits: SERIAL_CONFIG.dataBits,
    stopBits: SERIAL_CONFIG.stopBits,
    parity: SERIAL_CONFIG.parity,
    autoOpen: false
  });
  
  // Parser untuk membaca data per baris
  parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
  
  // Event: Port terbuka
  serialPort.on('open', () => {
    console.log(`[${getTimeStamp()}] ✓ Koneksi Serial USB berhasil! Stream REALTIME aktif...\n`);
    console.log('─'.repeat(70));
    startTime = Date.now();
  });

  // Event: Data diterima (REALTIME)
  parser.on('data', (line) => {
    const now = Date.now();
    const msg = line.trim();
    
    if (!msg) return;
    
    // Filter hanya message AIS
    if (msg.startsWith('!AIVDM') || msg.startsWith('!AIVDO')) {
      messageCount++;
      const delay = getDelay();
      lastMessageTime = now;
      
      const msgType = getAISMessageType(msg);
      const msgDesc = getMessageTypeDescription(msgType);
      
      // Decode AIS message
      const decodedData = aisDecoder.decode(msg);
      
      // Kirim ke WebSocket
      const sent = sendToWebSocket(decodedData, msg);
      
      // Format output REALTIME dengan timestamp presisi tinggi
      console.log(`[${getTimeStamp()}] 📡 Pesan #${messageCount} | Delay: ${delay} | WS: ${sent ? '✓' : '✗'}`);
      console.log(`  Type: ${msgDesc}`);
      
      // Tampilkan informasi negara jika ada
      if (decodedData && decodedData.country) {
        console.log(`  Country: ${decodedData.country} (${decodedData.countryCode}) | MMSI: ${decodedData.mmsi}`);
      } else if (decodedData && decodedData.mmsi) {
        console.log(`  MMSI: ${decodedData.mmsi} | Country: Unknown`);
      }
      
      console.log(`  Data: ${msg}`);
      console.log(`  Decoded:`, JSON.stringify(decodedData, null, 2));
      console.log('─'.repeat(70));
        
    } else if (msg.length > 0) {
      // Tampilkan data non-AIS juga REALTIME
      console.log(`[${getTimeStamp()}] 📋 Data lain: ${msg}`);
      console.log('─'.repeat(70));
    }
  });

  // Event: Error
  serialPort.on('error', (err) => {
    console.error(`\n[${getTimeStamp()}] ❌ Error: ${err.message}`);
    if (err.message.includes('cannot open')) {
      console.error(`\n💡 Tips: Pastikan:`);
      console.error(`   1. R400NG terhubung ke USB`);
      console.error(`   2. Port COM benar (cek di Device Manager)`);
      console.error(`   3. Tidak ada aplikasi lain yang menggunakan port ini`);
    }
    handleDisconnect();
  });

  // Event: Port tertutup
  serialPort.on('close', () => {
    console.log(`\n[${getTimeStamp()}] ⚠️  Koneksi Serial USB terputus`);
    handleDisconnect();
  });
  
  // Buka koneksi
  serialPort.open((err) => {
    if (err) {
      console.error(`\n[${getTimeStamp()}] ❌ Gagal membuka port: ${err.message}`);
      handleDisconnect();
    }
  });
}

// Fungsi untuk menangani disconnect
function handleDisconnect() {
  // Tutup koneksi yang aktif
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }
  if (tcpClient) {
    tcpClient.destroy();
  }
  if (udpClient) {
    udpClient.close();
  }
  
  serialPort = null;
  tcpClient = null;
  udpClient = null;
  parser = null;
  dataBuffer = '';
  
  console.log(`[${getTimeStamp()}] 🔄 Mencoba reconnect dalam 5 detik...\n`);
  
  // Reconnect sesuai mode
  setTimeout(() => {
    if (CONNECTION_MODE === 'tcp') {
      connectToTCP();
    } else if (CONNECTION_MODE === 'udp') {
      connectToUDP();
    } else {
      connectToR400NG();
    }
  }, 5000);
}

// Fungsi untuk shutdown
function shutdown() {
  console.log('\n\n' + '='.repeat(70));
  console.log('🛑 MENUTUP APLIKASI');
  console.log('='.repeat(70));
  
  showStats();
  
  // Tutup semua koneksi
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }
  
  if (tcpClient) {
    tcpClient.destroy();
  }
  
  if (udpClient) {
    udpClient.close();
  }
  
  if (wsClient) {
    wsClient.close();
  }
  
  if (sendTimeout) {
    clearTimeout(sendTimeout);
  }
  
  console.log('Terima kasih!\n');
  process.exit(0);
}

// Handle CTRL+C
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Tampilkan stats setiap 30 detik untuk monitoring realtime
setInterval(() => {
  if (messageCount > 0) {
    showStats();
  }
}, 30000);

// Mulai aplikasi
async function startApplication() {
  console.log('=== AIS Data Forwarder ===');
  console.log(`Connection Mode: ${CONNECTION_MODE.toUpperCase()}`);
  
  if (CONNECTION_MODE === 'serial') {
    console.log(`Serial Port: ${SERIAL_CONFIG.path}`);
    console.log(`Baud Rate: ${SERIAL_CONFIG.baudRate}`);
  } else if (CONNECTION_MODE === 'tcp') {
    console.log(`TCP Host: ${TCP_CONFIG.host}`);
    console.log(`TCP Port: ${TCP_CONFIG.port}`);
  } else if (CONNECTION_MODE === 'udp') {
    console.log(`UDP Host: ${UDP_CONFIG.host}`);
    console.log(`UDP Port: ${UDP_CONFIG.port}`);
    console.log(`Listen Port: ${UDP_CONFIG.listenPort}`);
  }
  
  console.log(`WebSocket Server: ${WEBSOCKET_SERVER}`);
  console.log(`Mode: Pengiriman segera saat data diterima (debounce: ${DEBOUNCE_DELAY}ms)\n`);

  // Dapatkan MAC address TERLEBIH DAHULU
  deviceMacAddress = await getMacAddress();
  console.log(`Device MAC Address: ${deviceMacAddress || 'Tidak dapat dideteksi'}`);
  console.log(`APP_KEY: ${APP_KEY}\n`);

  // Jika MAC address tidak bisa dideteksi, gunakan default
  if (!deviceMacAddress) {
    deviceMacAddress = 'DEFAULT_MAC_ADDRESS';
    console.log('⚠️  Using default MAC address\n');
  }

  // SETELAH MAC address siap, baru koneksi ke WebSocket
  console.log('Connecting to WebSocket Server...');
  connectWebSocket();
  
  // Koneksi ke AIS sesuai mode
  if (CONNECTION_MODE === 'tcp') {
    connectToTCP();
  } else if (CONNECTION_MODE === 'udp') {
    connectToUDP();
  } else {
    connectToR400NG();
  }

  console.log(`Aplikasi berjalan. Data akan dikirim segera saat diterima dari ${CONNECTION_MODE.toUpperCase()}.`);
  console.log('Tekan CTRL+C untuk berhenti.');
}

startApplication();