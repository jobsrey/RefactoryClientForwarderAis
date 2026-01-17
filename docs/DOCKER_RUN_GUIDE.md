# Docker Run Command Guide - AIS Data Forwarder

Panduan lengkap untuk menjalankan AIS Data Forwarder menggunakan Docker dengan berbagai mode koneksi.

## Quick Start - One Line Command

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_actual_key \
  -p 10111:10111 \
  --device /dev/ttyUSB0:/dev/ttyUSB0 \
  --device /dev/ttyACM0:/dev/ttyACM0 \
  arlintas-ais-fwd:v1
```

---

## CONNECTION_MODE: SERIAL (Default)

Mode ini digunakan untuk menerima data AIS dari perangkat serial port (R400NG atau receiver AIS lainnya).

### Konfigurasi

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=serial \
  -e SERIAL_PORT=/dev/ttyUSB0 \
  -e SERIAL_BAUD_RATE=38400 \
  -e SERIAL_DATA_BITS=8 \
  -e SERIAL_STOP_BITS=1 \
  -e SERIAL_PARITY=none \
  -e WEBSOCKET_SERVER=ws://socket-ais.jasalog.com:8081 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  --device /dev/ttyUSB0:/dev/ttyUSB0 \
  --device /dev/ttyACM0:/dev/ttyACM0 \
  arlintas-ais-fwd:v1
```

### Parameter Penjelasan

| Parameter | Default | Deskripsi |
|-----------|---------|-----------|
| `CONNECTION_MODE` | `serial` | Mode koneksi (serial/tcp/udp) |
| `SERIAL_PORT` | `/dev/ttyUSB0` | Port serial device (Linux/Docker) atau `COM3` (Windows) |
| `SERIAL_BAUD_RATE` | `38400` | Kecepatan baud rate |
| `SERIAL_DATA_BITS` | `8` | Jumlah data bits |
| `SERIAL_STOP_BITS` | `1` | Jumlah stop bits |
| `SERIAL_PARITY` | `none` | Paritas: `none`, `even`, `odd` |

### Contoh Kasus - Linux/Mac

**Kasus 1: Serial Port di `/dev/ttyACM0` dengan baud rate 9600**

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=serial \
  -e SERIAL_PORT=/dev/ttyACM0 \
  -e SERIAL_BAUD_RATE=9600 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  --device /dev/ttyUSB0:/dev/ttyUSB0 \
  --device /dev/ttyACM0:/dev/ttyACM0 \
  arlintas-ais-fwd:v1
```

### Windows Installation

Di Windows, serial port biasanya bernama `COM3`, `COM4`, dll. Gunakan Docker Desktop dengan WSL2 backend.

**Kasus 1: Serial Port COM3 dengan baud rate 38400**

```powershell
docker run -d `
  --name ais-forwarder `
  --restart unless-stopped `
  -e CONNECTION_MODE=serial `
  -e SERIAL_PORT=COM3 `
  -e SERIAL_BAUD_RATE=38400 `
  -e SERIAL_DATA_BITS=8 `
  -e SERIAL_STOP_BITS=1 `
  -e SERIAL_PARITY=none `
  -e APP_KEY=your_actual_key `
  -e USER_KEY=your_user_key `
  -p 10111:10111 `
  arlintas-ais-fwd:v1
```

**Kasus 2: Serial Port COM4 dengan baud rate 9600**

```powershell
docker run -d `
  --name ais-forwarder `
  --restart unless-stopped `
  -e CONNECTION_MODE=serial `
  -e SERIAL_PORT=COM4 `
  -e SERIAL_BAUD_RATE=9600 `
  -e APP_KEY=your_actual_key `
  -e USER_KEY=your_user_key `
  -p 10111:10111 `
  arlintas-ais-fwd:v1
```

**Catatan untuk Windows:**
- Ganti backslash `\` dengan backtick `` ` `` untuk line continuation di PowerShell
- Cek COM port di Device Manager: `Ports (COM & LPT)`
- Pastikan Docker Desktop menggunakan WSL2 backend

---

## CONNECTION_MODE: TCP

Mode ini digunakan untuk menerima data AIS dari server TCP (misalnya dari receiver AIS yang terhubung ke network).

### Konfigurasi

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=tcp \
  -e TCP_HOST=192.168.1.100 \
  -e TCP_PORT=10110 \
  -e WEBSOCKET_SERVER=ws://socket-ais.jasalog.com:8081 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  arlintas-ais-fwd:v1
```

### Parameter Penjelasan

| Parameter | Default | Deskripsi |
|-----------|---------|-----------|
| `CONNECTION_MODE` | - | Harus diset ke `tcp` |
| `TCP_HOST` | `192.168.1.100` | IP address server AIS |
| `TCP_PORT` | `10110` | Port server AIS |

### Contoh Kasus - Linux/Mac

**Kasus 1: Koneksi ke AIS Server di IP 192.168.100.50 port 5000**

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=tcp \
  -e TCP_HOST=192.168.100.50 \
  -e TCP_PORT=5000 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  arlintas-ais-fwd:v1
```

**Kasus 2: Koneksi ke localhost (untuk testing)**

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=tcp \
  -e TCP_HOST=127.0.0.1 \
  -e TCP_PORT=10110 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  arlintas-ais-fwd:v1
```

### Windows Installation

**Kasus 1: Koneksi ke AIS Server di IP 192.168.100.50 port 5000**

```powershell
docker run -d `
  --name ais-forwarder `
  --restart unless-stopped `
  -e CONNECTION_MODE=tcp `
  -e TCP_HOST=192.168.100.50 `
  -e TCP_PORT=5000 `
  -e APP_KEY=your_actual_key `
  -e USER_KEY=your_user_key `
  -p 10111:10111 `
  arlintas-ais-fwd:v1
```

**Kasus 2: Koneksi ke localhost (untuk testing)**

```powershell
docker run -d `
  --name ais-forwarder `
  --restart unless-stopped `
  -e CONNECTION_MODE=tcp `
  -e TCP_HOST=127.0.0.1 `
  -e TCP_PORT=10110 `
  -e APP_KEY=your_actual_key `
  -e USER_KEY=your_user_key `
  -p 10111:10111 `
  arlintas-ais-fwd:v1
```

**Catatan untuk Windows:**
- Gunakan backtick `` ` `` untuk line continuation di PowerShell
- Untuk koneksi ke host machine dari container, gunakan `host.docker.internal` sebagai ganti `127.0.0.1`
- Contoh: `-e TCP_HOST=host.docker.internal`

---

## CONNECTION_MODE: UDP

Mode ini digunakan untuk menerima data AIS dari UDP broadcast atau unicast.

### Konfigurasi

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=udp \
  -e UDP_HOST=192.168.1.100 \
  -e UDP_PORT=10110 \
  -e UDP_LISTEN_PORT=10110 \
  -e WEBSOCKET_SERVER=ws://socket-ais.jasalog.com:8081 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  arlintas-ais-fwd:v1
```

### Parameter Penjelasan

| Parameter | Default | Deskripsi |
|-----------|---------|-----------|
| `CONNECTION_MODE` | - | Harus diset ke `udp` |
| `UDP_HOST` | `192.168.1.100` | IP address source UDP |
| `UDP_PORT` | `10110` | Port source UDP |
| `UDP_LISTEN_PORT` | `10110` | Port untuk listen UDP |

### Contoh Kasus - Linux/Mac

**Kasus 1: Menerima UDP dari broadcast di network 192.168.1.0/24**

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=udp \
  -e UDP_HOST=192.168.1.255 \
  -e UDP_PORT=10110 \
  -e UDP_LISTEN_PORT=10110 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  arlintas-ais-fwd:v1
```

**Kasus 2: Menerima UDP dari specific host**

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=udp \
  -e UDP_HOST=192.168.100.50 \
  -e UDP_PORT=5000 \
  -e UDP_LISTEN_PORT=5000 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 5000:5000/udp \
  arlintas-ais-fwd:v1
```

### Windows Installation

**Kasus 1: Menerima UDP dari broadcast di network 192.168.1.0/24**

```powershell
docker run -d `
  --name ais-forwarder `
  --restart unless-stopped `
  -e CONNECTION_MODE=udp `
  -e UDP_HOST=192.168.1.255 `
  -e UDP_PORT=10110 `
  -e UDP_LISTEN_PORT=10110 `
  -e APP_KEY=your_actual_key `
  -e USER_KEY=your_user_key `
  -p 10111:10111 `
  arlintas-ais-fwd:v1
```

**Kasus 2: Menerima UDP dari specific host**

```powershell
docker run -d `
  --name ais-forwarder `
  --restart unless-stopped `
  -e CONNECTION_MODE=udp `
  -e UDP_HOST=192.168.100.50 `
  -e UDP_PORT=5000 `
  -e UDP_LISTEN_PORT=5000 `
  -e APP_KEY=your_actual_key `
  -e USER_KEY=your_user_key `
  -p 5000:5000/udp `
  arlintas-ais-fwd:v1
```

**Catatan untuk Windows:**
- Gunakan backtick `` ` `` untuk line continuation di PowerShell
- Untuk menerima dari host machine, gunakan `host.docker.internal`
- Contoh: `-e UDP_HOST=host.docker.internal`

---

## Advanced Configuration

### TCP Forwarder (OpenCPN/Telnet Server)

Aktifkan untuk menerima koneksi dari aplikasi seperti OpenCPN.

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=tcp \
  -e TCP_HOST=192.168.1.100 \
  -e TCP_PORT=10110 \
  -e FORWARDER_ENABLED=true \
  -e FORWARDER_HOST=0.0.0.0 \
  -e FORWARDER_PORT=10111 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  arlintas-ais-fwd:v1
```

**Parameter:**
- `FORWARDER_ENABLED`: `true` atau `false` (default: `false`)
- `FORWARDER_HOST`: `0.0.0.0` (listen di semua interface)
- `FORWARDER_PORT`: Port untuk OpenCPN/Telnet

### TCP Sender (Forward ke Remote Server)

Aktifkan untuk mengirim data ke server remote.

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=tcp \
  -e TCP_HOST=192.168.1.100 \
  -e TCP_PORT=10110 \
  -e SENDER_ENABLED=true \
  -e SENDER_HOST=194.233.93.64 \
  -e SENDER_PORT=13030 \
  -e SENDER_RECONNECT_DELAY=500 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  arlintas-ais-fwd:v1
```

**Parameter:**
- `SENDER_ENABLED`: `true` atau `false` (default: `true`)
- `SENDER_HOST`: IP address server tujuan
- `SENDER_PORT`: Port server tujuan
- `SENDER_RECONNECT_DELAY`: Delay reconnect dalam ms (default: 500)

### WebSocket Configuration

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=tcp \
  -e TCP_HOST=192.168.1.100 \
  -e TCP_PORT=10110 \
  -e WEBSOCKET_SERVER=ws://custom-server.com:8081 \
  -e DEBOUNCE_DELAY=100 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  arlintas-ais-fwd:v1
```

**Parameter:**
- `WEBSOCKET_SERVER`: URL WebSocket server
- `DEBOUNCE_DELAY`: Delay debounce dalam ms (default: 100)

---

## Complete Example - Production Setup

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=tcp \
  -e TCP_HOST=192.168.1.100 \
  -e TCP_PORT=10110 \
  -e WEBSOCKET_SERVER=ws://socket-ais.jasalog.com:8081 \
  -e DEBOUNCE_DELAY=100 \
  -e FORWARDER_ENABLED=true \
  -e FORWARDER_HOST=0.0.0.0 \
  -e FORWARDER_PORT=10111 \
  -e SENDER_ENABLED=true \
  -e SENDER_HOST=194.233.93.64 \
  -e SENDER_PORT=13030 \
  -e SENDER_RECONNECT_DELAY=500 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  arlintas-ais-fwd:v1
```

---

## Useful Commands

### Lihat Status Container

```bash
docker ps
```

### Lihat Log Real-time

```bash
docker logs -f ais-forwarder
```

### Lihat 50 Baris Log Terakhir

```bash
docker logs --tail=50 ais-forwarder
```

### Stop Container

```bash
docker stop ais-forwarder
```

### Start Container

```bash
docker start ais-forwarder
```

### Restart Container

```bash
docker restart ais-forwarder
```

### Hapus Container

```bash
docker rm ais-forwarder
```

### Masuk ke Container Shell

```bash
docker exec -it ais-forwarder sh
```

### Check Resource Usage

```bash
docker stats ais-forwarder
```

---

## Troubleshooting

### Container Tidak Bisa Connect ke TCP Server

**Solusi:**
1. Verifikasi TCP_HOST dan TCP_PORT benar
2. Pastikan server TCP sudah running
3. Test koneksi dari host:
   ```bash
   telnet 192.168.1.100 10110
   ```

### Serial Port Not Found

**Solusi:**
1. Verifikasi device serial port tersedia:
   ```bash
   ls -la /dev/tty*
   ```
2. Pastikan device sudah di-mount dengan `--device` flag
3. Cek permission: `docker exec ais-forwarder ls -la /dev/ttyUSB0`

### WebSocket Connection Failed

**Solusi:**
1. Verifikasi WEBSOCKET_SERVER URL benar
2. Cek koneksi internet
3. Pastikan firewall tidak memblokir port WebSocket
4. Lihat log: `docker logs ais-forwarder`

### High CPU Usage

**Solusi:**
1. Naikkan DEBOUNCE_DELAY
2. Kurangi frekuensi data input
3. Check resource limits

---

## Environment Variables Reference

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `CONNECTION_MODE` | `serial` | Mode koneksi: serial, tcp, udp |
| `SERIAL_PORT` | `/dev/ttyUSB0` | Serial port path |
| `SERIAL_BAUD_RATE` | `38400` | Baud rate |
| `SERIAL_DATA_BITS` | `8` | Data bits |
| `SERIAL_STOP_BITS` | `1` | Stop bits |
| `SERIAL_PARITY` | `none` | Parity: none, even, odd |
| `TCP_HOST` | `192.168.1.100` | TCP server host |
| `TCP_PORT` | `10110` | TCP server port |
| `UDP_HOST` | `192.168.1.100` | UDP source host |
| `UDP_PORT` | `10110` | UDP source port |
| `UDP_LISTEN_PORT` | `10110` | UDP listen port |
| `WEBSOCKET_SERVER` | `ws://socket-ais.jasalog.com:8081` | WebSocket server URL |
| `DEBOUNCE_DELAY` | `100` | Debounce delay (ms) |
| `FORWARDER_ENABLED` | `false` | Enable TCP Forwarder |
| `FORWARDER_HOST` | `0.0.0.0` | Forwarder listen host |
| `FORWARDER_PORT` | `10111` | Forwarder listen port |
| `SENDER_ENABLED` | `true` | Enable TCP Sender |
| `SENDER_HOST` | `194.233.93.64` | Remote server host |
| `SENDER_PORT` | `13030` | Remote server port |
| `SENDER_RECONNECT_DELAY` | `500` | Reconnect delay (ms) |
| `APP_KEY` | `your_app_key_here` | Application key |
| `USER_KEY` | `your_user_key_here` | User key |

---

**Dibuat untuk:** WiWIT Project AIS Data Forwarder  
**Versi:** 1.0.0  
**Last Updated:** 2026
