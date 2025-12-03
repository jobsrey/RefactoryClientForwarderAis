# AIS Data Forwarder

Aplikasi Node.js untuk menerima data AIS (Automatic Identification System) dari berbagai sumber dan meneruskannya ke WebSocket Server untuk distribusi real-time.

## Fitur

- **Multi-source Support**: Mendukung koneksi via Serial Port (USB), TCP/IP, dan UDP
- **Real-time Processing**: Memproses dan decode data AIS secara real-time
- **WebSocket Integration**: Meneruskan data ke WebSocket Server untuk distribusi ke client
- **Auto-reconnect**: Otomatis reconnect jika koneksi terputus
- **Debouncing**: Mengurangi overhead dengan menggabungkan pengiriman data
- **Statistics**: Menampilkan statistik real-time setiap 30 detik
- **Device Identification**: Identifikasi perangkat menggunakan MAC address

## Struktur Proyek

```
ws_client_new/
├── src/
│   ├── config.js                    # Konfigurasi aplikasi
│   ├── index.js                     # Entry point utama
│   ├── connections/
│   │   ├── index.js                 # Export semua koneksi
│   │   ├── base-connection.js       # Base class koneksi
│   │   ├── serial-connection.js     # Koneksi Serial Port
│   │   ├── tcp-connection.js        # Koneksi TCP/IP
│   │   ├── udp-connection.js        # Koneksi UDP
│   │   └── websocket-connection.js  # Koneksi WebSocket
│   ├── core/
│   │   ├── index.js                 # Export semua core modules
│   │   ├── ais-processor.js         # Processor data AIS
│   │   └── data-buffer.js           # Buffer dan debouncing
│   └── utils/
│       ├── logger.js                # Utilitas logging
│       └── helpers.js               # Fungsi helper
├── client-serial-port.js            # File legacy (backup)
├── .env                             # Konfigurasi environment (buat sendiri)
├── .env.example.txt                 # Template konfigurasi
├── package.json
└── README.md
```

## Persyaratan

- Node.js >= 18.0.0
- NPM atau Yarn
- AIS Receiver (R400NG atau kompatibel)
- WebSocket Server (untuk menerima data)

## Instalasi

1. **Clone atau download proyek**:
   ```bash
   cd ws_client_new
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Buat file konfigurasi**:
   ```bash
   cp .env.example.txt .env
   ```

4. **Edit file `.env`** sesuai kebutuhan (lihat bagian Konfigurasi)

## Konfigurasi

Buat file `.env` di root proyek dengan konfigurasi berikut:

### Mode Koneksi

```env
# Mode koneksi: 'serial', 'tcp', atau 'udp'
CONNECTION_MODE=serial
```

### Konfigurasi Serial Port (R400NG)

```env
SERIAL_PORT=COM3
SERIAL_BAUD_RATE=38400
SERIAL_DATA_BITS=8
SERIAL_STOP_BITS=1
SERIAL_PARITY=none
```

**Catatan untuk Windows**: Gunakan format `COM3`, `COM4`, dll.  
**Catatan untuk Linux**: Gunakan format `/dev/ttyUSB0`, `/dev/ttyACM0`, dll.

### Konfigurasi TCP/IP

```env
TCP_HOST=192.168.1.100
TCP_PORT=10110
```

### Konfigurasi UDP

```env
UDP_HOST=192.168.1.100
UDP_PORT=10110
UDP_LISTEN_PORT=10110
```

### Konfigurasi WebSocket Server

```env
WEBSOCKET_SERVER=ws://localhost:8081
DEBOUNCE_DELAY=100
```

### Konfigurasi Identifikasi

```env
APP_KEY=your_app_key_here
USER_KEY=your_user_key_here
```

## Penggunaan

### Menjalankan Aplikasi (Versi Baru - Modular)

```bash
# Mode production
npm start

# Mode development (auto-reload)
npm run dev
```

### Menjalankan Versi Legacy

```bash
npm run start:legacy
```

### Contoh Output

```
=== AIS Data Forwarder ===
Connection Mode: SERIAL
Serial Port: COM3
Baud Rate: 38400
WebSocket Server: ws://socket-ais.jasalog.com:8081
Mode: Pengiriman segera saat data diterima (debounce: 100ms)

Device MAC Address: 00:1A:2B:3C:4D:5E
APP_KEY: 69271d6712014205800cda63ooo

Connecting to WebSocket Server...
[14:30:25.123] ✓ WebSocket connected!
[14:30:25.125] ✓ Sent identify message as sender

======================================================================
🚢 AIS DATA MONITOR - REALTIME MODE (SERIAL USB)
======================================================================
R400NG Port   : COM3
Baud Rate     : 38400
Mode          : REALTIME (Instant Display)
======================================================================

[14:30:26.456] ✓ Koneksi Serial USB berhasil! Stream REALTIME aktif...
──────────────────────────────────────────────────────────────────────
[14:30:27.789] 📡 Pesan #1 | Delay: First message | WS: ✓
  Type: Position Report (Class A)
  Country: Indonesia (ID) | MMSI: 525123456
  Data: !AIVDM,1,1,,A,13u><=0P00PlSj0Psm0000000000,0*5B
  Decoded: { ... }
──────────────────────────────────────────────────────────────────────
```

## Mode Koneksi

### 1. Serial Port (USB)

Gunakan mode ini jika AIS receiver terhubung via USB ke komputer.

```env
CONNECTION_MODE=serial
SERIAL_PORT=COM3
SERIAL_BAUD_RATE=38400
```

**Langkah-langkah**:
1. Hubungkan AIS receiver ke port USB
2. Cek port yang tersedia di Device Manager (Windows) atau `ls /dev/tty*` (Linux)
3. Set `SERIAL_PORT` sesuai port yang terdeteksi

### 2. TCP/IP

Gunakan mode ini jika AIS receiver terhubung via jaringan dengan protokol TCP.

```env
CONNECTION_MODE=tcp
TCP_HOST=192.168.1.100
TCP_PORT=10110
```

**Langkah-langkah**:
1. Pastikan AIS receiver terhubung ke jaringan yang sama
2. Set `TCP_HOST` ke IP address AIS receiver
3. Set `TCP_PORT` ke port data AIS (biasanya 10110)

### 3. UDP

Gunakan mode ini jika AIS receiver mengirim data via UDP broadcast.

```env
CONNECTION_MODE=udp
UDP_HOST=192.168.1.100
UDP_PORT=10110
UDP_LISTEN_PORT=10110
```

**Langkah-langkah**:
1. Pastikan tidak ada aplikasi lain yang menggunakan port UDP
2. Set `UDP_LISTEN_PORT` ke port yang dikonfigurasi di AIS receiver

## Tipe Pesan AIS yang Didukung

| Type | Deskripsi |
|------|-----------|
| 1, 2, 3 | Position Report (Class A) |
| 4 | Base Station Report |
| 5 | Static and Voyage Data |
| 18 | Position Report (Class B) |
| 19 | Extended Position Report (Class B) |
| 21 | Aid-to-Navigation Report |
| 24 | Static Data Report |

## Format Data WebSocket

Data yang dikirim ke WebSocket Server memiliki format:

```json
{
  "app_key": "your_app_key",
  "mac_address": "00:1A:2B:3C:4D:5E",
  "source": "R400NG_Serial",
  "sourcePort": "COM3",
  "receivedAt": "2024-01-15T14:30:27.789Z",
  "dataCount": 5,
  "aisData": [
    {
      "message": "!AIVDM,1,1,,A,13u><=0P00PlSj0Psm0000000000,0*5B",
      "timestamp": "2024-01-15T14:30:27.789Z",
      "decoded": {
        "mmsi": "525123456",
        "type": 1,
        "country": "Indonesia",
        "countryCode": "ID",
        "latitude": -6.123456,
        "longitude": 106.789012,
        "speed": 12.5,
        "course": 180.5,
        "heading": 179
      }
    }
  ]
}
```

## Troubleshooting

### Serial Port tidak terdeteksi

1. Pastikan driver USB terinstall dengan benar
2. Cek di Device Manager (Windows) atau `dmesg | grep tty` (Linux)
3. Pastikan tidak ada aplikasi lain yang menggunakan port

### Koneksi TCP gagal

1. Pastikan IP address dan port benar
2. Cek apakah AIS receiver online dengan `ping <ip_address>`
3. Pastikan tidak ada firewall yang memblokir koneksi

### WebSocket tidak terhubung

1. Pastikan WebSocket server berjalan
2. Cek URL dan port WebSocket
3. Pastikan tidak ada proxy yang memblokir WebSocket

### Error "Cannot open port"

1. Port mungkin sudah digunakan aplikasi lain
2. Tutup aplikasi lain yang menggunakan port tersebut
3. Restart komputer jika diperlukan

## Pengembangan

### Menambah Mode Koneksi Baru

1. Buat file baru di `src/connections/`, extend dari `BaseConnection`
2. Implementasikan method `connect()` dan `disconnect()`
3. Register di `src/connections/index.js`
4. Update factory function `createConnection()`

### Menambah Fitur Baru

Arsitektur modular memudahkan penambahan fitur:

- **Logger baru**: Edit `src/utils/logger.js`
- **Statistik tambahan**: Edit `src/utils/helpers.js` class `Statistics`
- **Processing AIS tambahan**: Edit `src/core/ais-processor.js`

## License

ISC License

## Kontributor

- WiWIT Project Team
