# Serial Port Access in Docker - Complete Guide

Panduan lengkap untuk mengakses serial port (COM3, COM4, dll) dari dalam Docker container.

---

## Overview

Serial port di Docker memerlukan konfigurasi khusus karena container berjalan dalam isolated environment. Anda perlu:
1. Mount serial device ke container
2. Set permission yang tepat
3. Konfigurasi environment variable dengan port yang benar

---

## Windows Setup

### Prasyarat

- Docker Desktop dengan WSL2 backend
- Serial device sudah terdeteksi di Windows (cek di Device Manager)
- PowerShell atau Command Prompt

### Langkah 1: Identifikasi Serial Port

**Di Windows Device Manager:**
1. Buka `Device Manager`
2. Cari `Ports (COM & LPT)`
3. Lihat port yang tersedia (contoh: `COM3`, `COM4`)

**Via PowerShell:**
```powershell
Get-WmiObject Win32_SerialPort | Select-Object Name, Description
```

Output contoh:
```
Name Description
---- -----------
COM3 USB Serial Device
```

### Langkah 2: Jalankan Container dengan Serial Port

**Untuk COM3 dengan baud rate 38400:**

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
  -e WEBSOCKET_SERVER=wss://socket-ais.jasalog.com `
  -e DEBOUNCE_DELAY=500 `
  -e APP_KEY=your_actual_key `
  -e USER_KEY=your_user_key `
  -p 10111:10111 `
  arlintas-ais-fwd:v1
```

### Langkah 3: Verifikasi Container Berjalan

```powershell
# Lihat status container
docker ps

# Lihat log real-time
docker logs -f ais-forwarder
```

Output yang diharapkan:
```
=== AIS Data Forwarder ===
Connection Mode: SERIAL
Serial Port: COM3
Baud Rate: 38400
WebSocket Server: wss://socket-ais.jasalog.com
...
Aplikasi berjalan. Data akan dikirim segera saat diterima dari SERIAL.
```

---

## Linux/Mac Setup

### Prasyarat

- Docker sudah terinstall
- Serial device terdeteksi (biasanya `/dev/ttyUSB0` atau `/dev/ttyACM0`)
- User memiliki akses ke serial port

### Langkah 1: Identifikasi Serial Port

**Cek serial device yang tersedia:**

```bash
ls -la /dev/tty*
```

Output contoh:
```
crw-rw---- 1 root dialout 188, 0 Jan 12 14:00 /dev/ttyUSB0
crw-rw---- 1 root dialout 166, 0 Jan 12 14:00 /dev/ttyACM0
```

### Langkah 2: Set Permission (Jika Diperlukan)

Jika user bukan root, tambahkan ke group `dialout`:

```bash
sudo usermod -a -G dialout $USER
```

Logout dan login kembali agar perubahan berlaku.

### Langkah 3: Jalankan Container dengan Serial Port

**Untuk `/dev/ttyUSB0` dengan baud rate 38400:**

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
  -e WEBSOCKET_SERVER=wss://socket-ais.jasalog.com \
  -e DEBOUNCE_DELAY=500 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  --device /dev/ttyUSB0:/dev/ttyUSB0 \
  --device /dev/ttyACM0:/dev/ttyACM0 \
  arlintas-ais-fwd:v1
```

**Untuk `/dev/ttyACM0`:**

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=serial \
  -e SERIAL_PORT=/dev/ttyACM0 \
  -e SERIAL_BAUD_RATE=38400 \
  -e WEBSOCKET_SERVER=wss://socket-ais.jasalog.com \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  --device /dev/ttyUSB0:/dev/ttyUSB0 \
  --device /dev/ttyACM0:/dev/ttyACM0 \
  arlintas-ais-fwd:v1
```

### Langkah 4: Verifikasi Container Berjalan

```bash
# Lihat status container
docker ps

# Lihat log real-time
docker logs -f ais-forwarder
```

---

## Docker Compose Setup

Jika menggunakan `docker-compose.yml`, tambahkan konfigurasi serial port:

### Linux/Mac

```yaml
version: '3.8'

services:
  ais-forwarder:
    image: arlintas-ais-fwd:v1
    container_name: ais-data-forwarder
    restart: unless-stopped
    environment:
      - CONNECTION_MODE=serial
      - SERIAL_PORT=/dev/ttyUSB0
      - SERIAL_BAUD_RATE=38400
      - SERIAL_DATA_BITS=8
      - SERIAL_STOP_BITS=1
      - SERIAL_PARITY=none
      - WEBSOCKET_SERVER=wss://socket-ais.jasalog.com
      - DEBOUNCE_DELAY=500
      - APP_KEY=your_actual_key
      - USER_KEY=your_user_key
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0
      - /dev/ttyACM0:/dev/ttyACM0
    ports:
      - "10111:10111"
    networks:
      - ais-network

networks:
  ais-network:
    driver: bridge
```

### Windows

```yaml
version: '3.8'

services:
  ais-forwarder:
    image: arlintas-ais-fwd:v1
    container_name: ais-data-forwarder
    restart: unless-stopped
    environment:
      - CONNECTION_MODE=serial
      - SERIAL_PORT=COM3
      - SERIAL_BAUD_RATE=38400
      - SERIAL_DATA_BITS=8
      - SERIAL_STOP_BITS=1
      - SERIAL_PARITY=none
      - WEBSOCKET_SERVER=wss://socket-ais.jasalog.com
      - DEBOUNCE_DELAY=500
      - APP_KEY=your_actual_key
      - USER_KEY=your_user_key
    ports:
      - "10111:10111"
    networks:
      - ais-network

networks:
  ais-network:
    driver: bridge
```

Jalankan dengan:
```bash
docker-compose up -d
```

---

## Troubleshooting

### Error: "Cannot open port COM3"

**Solusi:**
1. Verifikasi COM port benar di Device Manager
2. Pastikan device tidak digunakan aplikasi lain
3. Coba port berbeda (COM4, COM5, dll)

### Error: "Permission denied /dev/ttyUSB0" (Linux)

**Solusi:**
1. Tambah user ke group dialout:
   ```bash
   sudo usermod -a -G dialout $USER
   ```
2. Logout dan login kembali
3. Atau jalankan docker dengan sudo:
   ```bash
   sudo docker run ...
   ```

### Container Berjalan Tapi Tidak Menerima Data

**Solusi:**
1. Verifikasi baud rate sesuai dengan device:
   ```bash
   docker logs ais-forwarder | grep "Baud Rate"
   ```

2. Test koneksi serial dengan tool lain terlebih dahulu:
   - Windows: PuTTY, Tera Term
   - Linux: `minicom`, `screen`

3. Cek kabel serial dan koneksi fisik

### Device Tidak Terdeteksi di Container

**Solusi:**
1. Pastikan `--device` flag digunakan saat menjalankan container
2. Verifikasi device path benar:
   ```bash
   # Linux
   ls -la /dev/ttyUSB0
   
   # Windows (di PowerShell)
   Get-WmiObject Win32_SerialPort
   ```

3. Coba dengan full path di docker run

---

## Advanced Configuration

### Multiple Serial Ports

Jika perlu mengakses multiple serial ports:

```powershell
docker run -d `
  --name ais-forwarder `
  --restart unless-stopped `
  -e CONNECTION_MODE=serial `
  -e SERIAL_PORT=COM3 `
  -e SERIAL_BAUD_RATE=38400 `
  -e WEBSOCKET_SERVER=wss://socket-ais.jasalog.com `
  -e APP_KEY=your_actual_key `
  -e USER_KEY=your_user_key `
  -p 10111:10111 `
  arlintas-ais-fwd:v1
```

Untuk multiple container, gunakan nama berbeda:

```powershell
# Container 1 - COM3
docker run -d --name ais-forwarder-1 ... -e SERIAL_PORT=COM3 arlintas-ais-fwd:v1

# Container 2 - COM4
docker run -d --name ais-forwarder-2 ... -e SERIAL_PORT=COM4 arlintas-ais-fwd:v1
```

### Custom Baud Rates

Sesuaikan `SERIAL_BAUD_RATE` dengan device Anda:

```powershell
# 9600 baud
-e SERIAL_BAUD_RATE=9600

# 19200 baud
-e SERIAL_BAUD_RATE=19200

# 115200 baud
-e SERIAL_BAUD_RATE=115200
```

---

## Verifikasi Data Diterima

### Lihat Log Container

```bash
# Real-time log
docker logs -f ais-forwarder

# Last 100 lines
docker logs --tail=100 ais-forwarder

# Log dari 5 menit terakhir
docker logs --since=5m ais-forwarder
```

### Cek Statistics

```bash
docker stats ais-forwarder
```

### Masuk ke Container Shell

```bash
docker exec -it ais-forwarder sh
```

Di dalam container, cek serial port:
```bash
# List devices
ls -la /dev/tty*

# Check if port is readable
cat /dev/ttyUSB0
```

---

## Quick Reference

### Windows - COM3 dengan Default Settings

```powershell
docker run -d `
  --name ais-forwarder `
  --restart unless-stopped `
  -e CONNECTION_MODE=serial `
  -e SERIAL_PORT=COM3 `
  -e APP_KEY=your_actual_key `
  -e USER_KEY=your_user_key `
  -p 10111:10111 `
  arlintas-ais-fwd:v1
```

### Linux - /dev/ttyUSB0 dengan Default Settings

```bash
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=serial \
  -e SERIAL_PORT=/dev/ttyUSB0 \
  -e APP_KEY=your_actual_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  --device /dev/ttyUSB0:/dev/ttyUSB0 \
  --device /dev/ttyACM0:/dev/ttyACM0 \
  arlintas-ais-fwd:v1
```

### Stop Container

```bash
docker stop ais-forwarder
```

### Restart Container

```bash
docker restart ais-forwarder
```

### Remove Container

```bash
docker rm ais-forwarder
```

---

## Environment Variables Reference

| Variable | Windows | Linux | Default |
|----------|---------|-------|---------|
| `CONNECTION_MODE` | `serial` | `serial` | `serial` |
| `SERIAL_PORT` | `COM3`, `COM4`, etc | `/dev/ttyUSB0`, `/dev/ttyACM0` | `/dev/ttyUSB0` |
| `SERIAL_BAUD_RATE` | `38400` | `38400` | `38400` |
| `SERIAL_DATA_BITS` | `8` | `8` | `8` |
| `SERIAL_STOP_BITS` | `1` | `1` | `1` |
| `SERIAL_PARITY` | `none` | `none` | `none` |

---

**Dibuat untuk:** WiWIT Project AIS Data Forwarder  
**Versi:** 1.0.0  
**Last Updated:** 2026
