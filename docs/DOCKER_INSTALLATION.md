# Panduan Instalasi AIS Data Forwarder dengan Docker

## Prasyarat

Sebelum memulai, pastikan tim Anda telah menginstal:

- **Docker** (versi 20.10 atau lebih baru)
  - Download: https://www.docker.com/products/docker-desktop
  - Verifikasi: `docker --version`

- **Docker Compose** (versi 1.29 atau lebih baru) - *Hanya jika menggunakan docker-compose*
  - Biasanya sudah termasuk dalam Docker Desktop
  - Verifikasi: `docker-compose --version`

## Langkah-Langkah Instalasi

### Opsi 1: Menggunakan Docker Hub (RECOMMENDED untuk Tim)

Metode ini paling sederhana - tim Anda hanya perlu pull image dari Docker Hub dan menyesuaikan file `.env`.

#### 1. Dapatkan File `.env`

Minta file `.env` dari tim development Anda atau download dari repository.

#### 2. Konfigurasi Environment Variables

Edit file `.env` dan ubah nilai-nilai berikut sesuai kebutuhan:

```env
# Mode koneksi: serial, tcp, atau udp
CONNECTION_MODE=tcp

# Konfigurasi TCP/IP
TCP_HOST=192.168.1.100
TCP_PORT=10110

# Konfigurasi UDP
UDP_HOST=192.168.1.100
UDP_PORT=10110
UDP_LISTEN_PORT=10110

# WebSocket Server
WEBSOCKET_SERVER=ws://socket-ais.jasalog.com:8081

# TCP Forwarder (untuk OpenCPN)
FORWARDER_ENABLED=false
FORWARDER_HOST=0.0.0.0
FORWARDER_PORT=10111

# TCP Sender (Forward ke Remote Server)
SENDER_ENABLED=true
SENDER_HOST=194.233.93.64
SENDER_PORT=13030

# Identifikasi Device & User (WAJIB DIUBAH)
APP_KEY=your_app_key_here
USER_KEY=your_user_key_here
```

#### 3. Pull Image dari Docker Hub

```bash
docker pull <your-dockerhub-username>/ais-data-forwarder:latest
```

Ganti `<your-dockerhub-username>` dengan username Docker Hub Anda.

#### 4. Jalankan Container

```bash
docker run -d \
  --name ais-data-forwarder \
  --restart unless-stopped \
  --env-file .env \
  -p 10111:10111 \
  --device /dev/ttyUSB0:/dev/ttyUSB0 \
  --device /dev/ttyACM0:/dev/ttyACM0 \
  <your-dockerhub-username>/ais-data-forwarder:latest
```

#### 5. Verifikasi Container Berjalan

```bash
docker ps
```

Output yang diharapkan:
```
CONTAINER ID   IMAGE                                    STATUS
abc123def456   <username>/ais-data-forwarder:latest    Up X minutes
```

---

### Opsi 2: Menggunakan Docker Compose (Untuk Development)

Metode ini cocok jika tim ingin build image sendiri atau melakukan development.

#### 1. Clone atau Download Project

```bash
git clone <repository-url>
cd ws_client_new
```

#### 2. Konfigurasi Environment Variables

Salin file `.env` dan sesuaikan dengan kebutuhan tim Anda:

```bash
cp .env .env.local
```

Edit file `.env.local` dan ubah nilai-nilai berikut sesuai konfigurasi (lihat Opsi 1 untuk detail parameter).

#### 3. Build Docker Image

```bash
docker-compose build
```

Atau jika ingin rebuild tanpa cache:

```bash
docker-compose build --no-cache
```

#### 4. Jalankan Container

```bash
docker-compose up -d
```

Opsi:
- `-d` : Jalankan di background (detached mode)
- Tanpa `-d` : Lihat log secara real-time

#### 5. Verifikasi Container Berjalan

```bash
docker-compose ps
```

Output yang diharapkan:
```
NAME                    STATUS
ais-data-forwarder      Up X minutes
```

## Melihat Log

### Jika menggunakan Docker Hub (Docker CLI)

```bash
# Real-time log
docker logs -f ais-data-forwarder

# 50 baris terakhir
docker logs --tail=50 ais-data-forwarder

# Log dari 5 menit terakhir
docker logs --since=5m ais-data-forwarder
```

### Jika menggunakan Docker Compose

```bash
# Real-time log
docker-compose logs -f

# 50 baris terakhir
docker-compose logs --tail=50

# Log dari 5 menit terakhir
docker-compose logs --since=5m
```

## Menghentikan Container

### Jika menggunakan Docker Hub (Docker CLI)

```bash
# Stop container
docker stop ais-data-forwarder

# Hapus container
docker rm ais-data-forwarder
```

### Jika menggunakan Docker Compose

```bash
# Stop container
docker-compose stop

# Stop dan hapus container
docker-compose down

# Stop dan hapus semua (termasuk volume)
docker-compose down -v
```

## Restart Container

### Jika menggunakan Docker Hub (Docker CLI)

```bash
docker restart ais-data-forwarder
```

### Jika menggunakan Docker Compose

```bash
docker-compose restart
```

## Mengubah Konfigurasi

### Jika menggunakan Docker Hub (Docker CLI)

1. Edit file `.env`
2. Stop dan hapus container lama:
   ```bash
   docker stop ais-data-forwarder
   docker rm ais-data-forwarder
   ```
3. Jalankan container baru dengan konfigurasi terbaru:
   ```bash
   docker run -d \
     --name ais-data-forwarder \
     --restart unless-stopped \
     --env-file .env \
     -p 10111:10111 \
     --device /dev/ttyUSB0:/dev/ttyUSB0 \
     --device /dev/ttyACM0:/dev/ttyACM0 \
     <your-dockerhub-username>/ais-data-forwarder:latest
   ```

### Jika menggunakan Docker Compose

1. Edit file `.env.local`
2. Restart container:
   ```bash
   docker-compose restart
   ```

Atau rebuild jika ada perubahan dependencies:

```bash
docker-compose down
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Container tidak bisa start

**Solusi:**
1. Cek log error:
   ```bash
   # Jika menggunakan Docker CLI
   docker logs ais-data-forwarder
   
   # Jika menggunakan Docker Compose
   docker-compose logs
   ```

2. Verifikasi file `.env` sudah dikonfigurasi dengan benar

3. Pastikan port tidak digunakan aplikasi lain:
   ```bash
   # Linux/Mac
   lsof -i :10111
   
   # Windows
   netstat -ano | findstr :10111
   ```

### Koneksi Serial Port Error

**Untuk Linux/Docker:**
- Serial port harus di-mount ke container
- Pastikan user memiliki akses ke `/dev/ttyUSB0` atau `/dev/ttyACM0`

```bash
# Berikan permission
sudo usermod -a -G dialout $USER
```

### WebSocket Connection Error

**Solusi:**
1. Verifikasi `WEBSOCKET_SERVER` URL benar
2. Cek koneksi internet
3. Pastikan firewall tidak memblokir koneksi

### Out of Memory

Jika container sering crash, tambahkan memory limit di `docker-compose.yml`:

```yaml
services:
  ais-forwarder:
    # ... konfigurasi lainnya
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## Perintah Berguna

### Masuk ke container shell

```bash
# Jika menggunakan Docker CLI
docker exec -it ais-data-forwarder sh

# Jika menggunakan Docker Compose
docker-compose exec ais-forwarder sh
```

### Update image dari Docker Hub

```bash
# Pull image terbaru
docker pull <your-dockerhub-username>/ais-data-forwarder:latest

# Stop container lama
docker stop ais-data-forwarder
docker rm ais-data-forwarder

# Jalankan container baru
docker run -d \
  --name ais-data-forwarder \
  --restart unless-stopped \
  --env-file .env \
  -p 10111:10111 \
  --device /dev/ttyUSB0:/dev/ttyUSB0 \
  --device /dev/ttyACM0:/dev/ttyACM0 \
  <your-dockerhub-username>/ais-data-forwarder:latest
```

### Rebuild dan restart (Docker Compose)

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Hapus semua container dan image

```bash
# Docker CLI
docker stop ais-data-forwarder
docker rm ais-data-forwarder
docker rmi <your-dockerhub-username>/ais-data-forwarder:latest

# Docker Compose
docker-compose down
docker rmi ais-data-forwarder
```

### Check resource usage

```bash
docker stats
```

## Deployment di Production

### Rekomendasi

1. **Gunakan `.env` yang berbeda untuk production**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

2. **Aktifkan restart policy**
   - Sudah dikonfigurasi: `restart: unless-stopped`

3. **Setup monitoring dan logging**
   - Log rotation sudah dikonfigurasi
   - Max size: 10MB, max file: 3

4. **Backup data penting**
   ```bash
   docker-compose exec ais-forwarder tar czf /backup/data.tar.gz /app/data
   ```

## Support

Jika ada masalah, hubungi tim development dengan informasi:

```bash
# Kumpulkan info sistem
docker-compose ps
docker-compose logs --tail=100
docker --version
docker-compose --version
```

---

**Dibuat untuk:** WiWIT Project AIS Data Forwarder  
**Versi:** 1.0.0  
**Last Updated:** 2026
