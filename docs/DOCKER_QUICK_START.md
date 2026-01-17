# Quick Start - Docker Setup

Panduan cepat untuk memulai AIS Data Forwarder dengan Docker.

## Setup Awal (Pertama Kali)

```bash
# 1. Masuk ke folder project
cd ws_client_new

# 2. Konfigurasi environment
cp .env .env.local
# Edit .env.local dan ubah APP_KEY dan USER_KEY

# 3. Build dan jalankan
docker-compose up -d

# 4. Verifikasi
docker-compose ps
```

## Perintah Sehari-hari

```bash
# Lihat status
docker-compose ps

# Lihat log
docker-compose logs -f

# Stop
docker-compose stop

# Start
docker-compose start

# Restart
docker-compose restart

# Hentikan dan hapus
docker-compose down
```

## Konfigurasi Penting

Edit `.env.local` dan ubah:

```env
APP_KEY=your_app_key_here
USER_KEY=your_user_key_here
CONNECTION_MODE=tcp
TCP_HOST=192.168.1.100
TCP_PORT=10110
```

Kemudian restart:

```bash
docker-compose restart
```

## Lihat Dokumentasi Lengkap

Baca `DOCKER_INSTALLATION.md` untuk panduan detail dan troubleshooting.
