# AIS Data Forwarder

Aplikasi Node.js untuk menerima data AIS (Automatic Identification System) dari berbagai sumber dan meneruskannya ke WebSocket Server untuk distribusi real-time.

## Fitur

- **Multi-source Support**: Mendukung koneksi via Serial Port (USB), TCP/IP, dan UDP
- **Real-time Processing**: Memproses dan decode data AIS secara real-time
- **WebSocket Integration**: Meneruskan data ke WebSocket Server untuk distribusi ke client
- **TCP Forwarder**: Forward data AIS ke OpenCPN atau aplikasi navigasi lain via TCP/Telnet
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
│   │   ├── websocket-connection.js  # Koneksi WebSocket
│   │   └── tcp-forwarder.js         # TCP Forwarder untuk OpenCPN
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

### Konfigurasi TCP Forwarder (OpenCPN/Telnet)

```env
# Aktifkan TCP Forwarder (true/false)
FORWARDER_ENABLED=true

# IP untuk listen (0.0.0.0 = semua interface)
FORWARDER_HOST=0.0.0.0

# Port untuk koneksi dari OpenCPN
FORWARDER_PORT=10111
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

### Menjalankan dengan PM2 (Production - Recommended)

PM2 adalah process manager untuk Node.js yang memungkinkan aplikasi berjalan di background, auto-restart saat crash, dan auto-start saat komputer restart.

#### 1. Install PM2

```bash
# Install PM2 secara global
npm install -g pm2
```

#### 2. Jalankan Aplikasi dengan PM2

```bash
# Start aplikasi dengan nama "ais-forwarder"
pm2 start src/index.js --name "ais-forwarder"

# Simpan konfigurasi PM2 (agar tidak hilang saat restart)
pm2 save
```

#### 3. Setup Auto-Start saat Komputer Restart

**Untuk Windows:**

```bash
# Install pm2-windows-startup
npm install -g pm2-windows-startup

# Setup auto-start
pm2-startup install

# Simpan konfigurasi aplikasi yang sedang berjalan
pm2 save
```

**Untuk Linux/Mac:**

```bash
# Generate startup script
pm2 startup

# Jalankan command yang muncul (biasanya dengan sudo)
# Contoh: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

# Simpan konfigurasi aplikasi yang sedang berjalan
pm2 save
```

#### 4. Perintah PM2 yang Berguna

```bash
# Lihat status semua aplikasi
pm2 list

# Lihat logs real-time
pm2 logs ais-forwarder

# Lihat logs 100 baris terakhir
pm2 logs ais-forwarder --lines 100

# Stop aplikasi
pm2 stop ais-forwarder

# Restart aplikasi
pm2 restart ais-forwarder

# Restart aplikasi saat file berubah (development)
pm2 restart ais-forwarder --watch

# Hapus aplikasi dari PM2
pm2 delete ais-forwarder

# Monitor resource usage (CPU, Memory)
pm2 monit

# Informasi detail aplikasi
pm2 show ais-forwarder
```

#### 5. Update Konfigurasi (.env)

Jika Anda mengubah file `.env`, restart aplikasi agar perubahan diterapkan:

```bash
pm2 restart ais-forwarder
```

#### Keuntungan Menggunakan PM2

- ✅ **Auto-restart**: Aplikasi otomatis restart jika crash
- ✅ **Auto-start**: Aplikasi otomatis start saat komputer restart
- ✅ **Background process**: Aplikasi berjalan di background
- ✅ **Logs management**: Logs tersimpan dan mudah diakses
- ✅ **Resource monitoring**: Monitor CPU dan memory usage
- ✅ **Zero-downtime reload**: Update aplikasi tanpa downtime

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

## TCP Forwarder untuk OpenCPN

Fitur TCP Forwarder memungkinkan data AIS NMEA diteruskan ke OpenCPN atau aplikasi navigasi lain yang mendukung input NMEA via TCP.

### Cara Kerja

```
┌─────────────┐     ┌──────────────────────┐     ┌──────────────┐
│  R400NG     │────▶│  AIS Data Forwarder  │────▶│   OpenCPN    │
│  (Serial)   │     │  TCP Server :10111   │     │  (TCP Client)│
└─────────────┘     └──────────────────────┘     └──────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  WebSocket Server│
                    └──────────────────┘
```

### Konfigurasi TCP Forwarder

Edit file `.env`:

```env
# Aktifkan forwarder
FORWARDER_ENABLED=true

# IP untuk listen
# 0.0.0.0 = accept dari semua IP (termasuk jaringan lokal)
# 127.0.0.1 = hanya localhost
FORWARDER_HOST=0.0.0.0

# Port untuk listen (pilih port yang tidak digunakan)
FORWARDER_PORT=10111
```

### Konfigurasi OpenCPN

1. **Buka OpenCPN**
2. Pergi ke **Options** (ikon kunci pas) → **Connections**
3. Klik **Add Connection**
4. Pilih **Network**
5. Isi konfigurasi berikut:

   | Setting | Nilai |
   |---------|-------|
   | Protocol | TCP |
   | Address | `localhost` atau IP komputer yang menjalankan AIS Forwarder |
   | DataPort | `10111` (sesuai `FORWARDER_PORT`) |
   | Input filtering | None |

6. Klik **Apply** kemudian **OK**

### Menggunakan Telnet untuk Test

Anda juga bisa test koneksi menggunakan telnet:

```bash
# Windows (aktifkan Telnet Client dulu di Windows Features)
telnet localhost 10111

# Linux/Mac
telnet localhost 10111
# atau
nc localhost 10111
```

Jika berhasil, Anda akan melihat data NMEA AIS streaming:

```
# AIS Data Forwarder - R400NG
# Connected at 2024-01-15T14:30:27.789Z
# Waiting for AIS data...
!AIVDM,1,1,,A,13u><=0P00PlSj0Psm0000000000,0*5B
!AIVDM,1,1,,B,15MsK4PP00P?1i`N4I3QU?vN0<0V,0*52
```

### Commands via Telnet

Ketik command berikut saat terhubung via telnet:

| Command | Fungsi |
|---------|--------|
| `stats` | Menampilkan statistik messages sent dan connected clients |
| `help` | Menampilkan daftar commands |

### Contoh Output Aplikasi dengan TCP Forwarder

```
=== AIS Data Forwarder ===
Connection Mode: SERIAL
Serial Port: COM3
Baud Rate: 38400
WebSocket Server: ws://socket-ais.jasalog.com:8081
Mode: Pengiriman segera saat data diterima (debounce: 100ms)
TCP Forwarder: 0.0.0.0:10111 (OpenCPN/Telnet)

======================================================================
📡 TCP FORWARDER SERVER - FOR OPENCPN / TELNET
======================================================================
Status        : ENABLED
Listen IP     : 0.0.0.0
Listen Port   : 10111
Connect URL   : telnet://localhost:10111
======================================================================

📡 [TCP Forwarder] Client connected: 127.0.0.1:54321 (Total: 1)
```

### Troubleshooting TCP Forwarder

#### Port sudah digunakan

```
❌ TCP Forwarder Error: Port 10111 sudah digunakan
```

**Solusi**: Ganti `FORWARDER_PORT` ke port lain yang tidak digunakan.

#### OpenCPN tidak bisa connect

1. Pastikan `FORWARDER_ENABLED=true`
2. Pastikan firewall tidak memblokir port
3. Jika berbeda komputer, pastikan `FORWARDER_HOST=0.0.0.0`
4. Cek IP address yang benar di OpenCPN

#### Data tidak muncul di OpenCPN

1. Pastikan aplikasi AIS Data Forwarder sudah berjalan
2. Pastikan ada data AIS yang masuk dari R400NG
3. Cek apakah koneksi TCP aktif di log aplikasi

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
- **TCP Forwarder**: Edit `src/connections/tcp-forwarder.js`

## Docker Deployment

Aplikasi ini mendukung deployment menggunakan Docker untuk kemudahan instalasi di komputer client.

### File Docker

| File | Deskripsi |
|------|-----------|
| `Dockerfile` | Multi-stage build untuk image yang optimal |
| `docker-compose.yml` | Konfigurasi untuk deployment mudah |
| `.dockerignore` | File yang tidak di-include dalam image |
| `.env.docker` | Template environment untuk Docker |

### Quick Start dengan Docker

#### 1. Build Image

```bash
# Build image
docker build -t ais-data-forwarder:latest .

# Atau menggunakan docker-compose
docker-compose build
```

#### 2. Jalankan Container

**Mode TCP (paling umum untuk Docker):**

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -p 10111:10111 \
  -e CONNECTION_MODE=tcp \
  -e TCP_HOST=192.168.1.100 \
  -e TCP_PORT=10110 \
  -e WEBSOCKET_SERVER=ws://socket-ais.jasalog.com:8081 \
  -e APP_KEY=your_app_key \
  -e USER_KEY=your_user_key \
  ais-data-forwarder:latest
```

**Mode UDP:**

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -p 10111:10111 \
  -p 10110:10110/udp \
  -e CONNECTION_MODE=udp \
  -e UDP_HOST=192.168.1.100 \
  -e UDP_PORT=10110 \
  -e UDP_LISTEN_PORT=10110 \
  -e WEBSOCKET_SERVER=ws://socket-ais.jasalog.com:8081 \
  -e APP_KEY=your_app_key \
  -e USER_KEY=your_user_key \
  ais-data-forwarder:latest
```

**Mode Serial (perlu device mapping):**

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  --device=/dev/ttyUSB0:/dev/ttyUSB0 \
  -p 10111:10111 \
  -e CONNECTION_MODE=serial \
  -e SERIAL_PORT=/dev/ttyUSB0 \
  -e SERIAL_BAUD_RATE=38400 \
  -e WEBSOCKET_SERVER=ws://socket-ais.jasalog.com:8081 \
  -e APP_KEY=your_app_key \
  -e USER_KEY=your_user_key \
  ais-data-forwarder:latest
```

#### 3. Menggunakan Docker Compose

```bash
# Copy template environment
cp .env.docker .env

# Edit file .env sesuai kebutuhan
nano .env

# Jalankan
docker-compose up -d

# Lihat logs
docker-compose logs -f

# Stop
docker-compose down
```

### Environment Variables untuk Docker

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `CONNECTION_MODE` | `tcp` | Mode koneksi: `serial`, `tcp`, `udp` |
| `TCP_HOST` | `192.168.1.100` | IP AIS receiver (untuk mode TCP) |
| `TCP_PORT` | `10110` | Port AIS receiver (untuk mode TCP) |
| `UDP_HOST` | `192.168.1.100` | IP AIS receiver (untuk mode UDP) |
| `UDP_PORT` | `10110` | Port AIS receiver (untuk mode UDP) |
| `UDP_LISTEN_PORT` | `10110` | Port listen UDP |
| `SERIAL_PORT` | `/dev/ttyUSB0` | Serial port device |
| `SERIAL_BAUD_RATE` | `38400` | Serial baud rate |
| `WEBSOCKET_SERVER` | `ws://socket-ais.jasalog.com:8081` | URL WebSocket server |
| `DEBOUNCE_DELAY` | `100` | Delay debounce (ms) |
| `FORWARDER_ENABLED` | `true` | Enable TCP forwarder |
| `FORWARDER_HOST` | `0.0.0.0` | TCP forwarder listen IP |
| `FORWARDER_PORT` | `10111` | TCP forwarder port |
| `APP_KEY` | - | App key untuk identifikasi |
| `USER_KEY` | - | User key untuk identifikasi |

### Docker Commands

```bash
# Lihat status container
docker ps

# Lihat logs realtime
docker logs -f ais-forwarder

# Restart container
docker restart ais-forwarder

# Stop container
docker stop ais-forwarder

# Remove container
docker rm ais-forwarder

# Remove image
docker rmi ais-data-forwarder:latest
```

### Push ke Docker Registry (Optional)

Jika ingin menyimpan image di registry untuk distribusi:

```bash
# Tag image
docker tag ais-data-forwarder:latest your-registry.com/ais-data-forwarder:latest

# Push ke registry
docker push your-registry.com/ais-data-forwarder:latest

# Di komputer client, pull dan jalankan
docker pull your-registry.com/ais-data-forwarder:latest
docker run -d ... your-registry.com/ais-data-forwarder:latest
```

### Troubleshooting Docker

#### Container tidak bisa connect ke AIS receiver

1. Pastikan IP AIS receiver bisa diakses dari Docker host
2. Jika menggunakan Docker Desktop, pastikan network mode benar
3. Coba gunakan `--network host` untuk troubleshooting

#### Serial port tidak bisa diakses

1. Pastikan device path benar: `--device=/dev/ttyUSB0:/dev/ttyUSB0`
2. Di Linux, user mungkin perlu masuk group `dialout`: `sudo usermod -aG dialout $USER`
3. Cek permission device: `ls -la /dev/ttyUSB0`

#### Logs tidak muncul

```bash
# Cek status container
docker ps -a

# Lihat logs error
docker logs ais-forwarder
```

## License

ISC License

## Kontributor

- WiWIT Project Team
