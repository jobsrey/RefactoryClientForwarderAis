# Docker ARM64 / Raspberry Pi Deployment Guide

Panduan ini menjelaskan cara build dan deploy Docker image untuk arsitektur ARM64 (Raspberry Pi).

## Masalah Umum

Jika Anda mendapatkan error seperti berikut saat menjalankan container di Raspberry Pi:

```
exec /usr/local/bin/docker-entrypoint.sh: exec format error
```

Ini berarti Docker image di-build untuk arsitektur x86/amd64, bukan ARM64. Image harus di-rebuild untuk arsitektur yang sesuai.

---

## Solusi

### Opsi 1: Build Langsung di Raspberry Pi

Cara paling mudah adalah build image langsung di Raspberry Pi:

```bash
# Clone repository atau copy source code ke Raspberry Pi
cd /path/to/ws_client_new

# Build image
docker build -t kireniusdena/arlintas-ais-fwd:v1 .

# Jalankan container
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=serial \
  -e SERIAL_PORT=/dev/ttyACM0 \
  -e SERIAL_BAUD_RATE=38400 \
  -e SERIAL_DATA_BITS=8 \
  -e SERIAL_STOP_BITS=1 \
  -e SERIAL_PARITY=none \
  -e APP_KEY=your_app_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  --device=/dev/ttyACM0:/dev/ttyACM0 \
  kireniusdena/arlintas-ais-fwd:v1
```

---

### Opsi 2: Build dari PC dengan Docker Buildx

Jika ingin build dari PC (Windows/Mac/Linux x86) untuk target ARM64:

#### 1. Setup Docker Buildx

```bash
# Buat builder baru
docker buildx create --name mybuilder --use

# Verifikasi dan bootstrap
docker buildx inspect --bootstrap
```

#### 2. Build untuk ARM64 Saja

```bash
docker buildx build --platform linux/arm64 -t kireniusdena/arlintas-ais-fwd:v1-arm64 --push .
```

#### 3. Di Raspberry Pi

```bash
# Pull image ARM64
docker pull kireniusdena/arlintas-ais-fwd:v1-arm64

# Jalankan container
docker run -d \
  --name ais-forwarder \
  --restart unless-stopped \
  -e CONNECTION_MODE=serial \
  -e SERIAL_PORT=/dev/ttyACM0 \
  -e SERIAL_BAUD_RATE=38400 \
  -e SERIAL_DATA_BITS=8 \
  -e SERIAL_STOP_BITS=1 \
  -e SERIAL_PARITY=none \
  -e APP_KEY=your_app_key \
  -e USER_KEY=your_user_key \
  -p 10111:10111 \
  --device=/dev/ttyACM0:/dev/ttyACM0 \
  kireniusdena/arlintas-ais-fwd:v1-arm64
```

---

### Opsi 3: Build Multi-Platform (Rekomendasi)

Build satu image yang support AMD64 dan ARM64 sekaligus:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t kireniusdena/arlintas-ais-fwd:v1 --push .
```

Dengan cara ini, tag `v1` akan otomatis memilih arsitektur yang sesuai saat di-pull di device manapun.

---

## Verifikasi Arsitektur Image

Untuk memeriksa arsitektur image yang sudah di-push:

```bash
docker manifest inspect kireniusdena/arlintas-ais-fwd:v1
```

Output akan menampilkan platform yang didukung:

```json
{
  "manifests": [
    {
      "platform": {
        "architecture": "amd64",
        "os": "linux"
      }
    },
    {
      "platform": {
        "architecture": "arm64",
        "os": "linux"
      }
    }
  ]
}
```

---

## Troubleshooting

### Error: "buildx" is not a docker command

Install Docker Buildx:

```bash
# Linux
mkdir -p ~/.docker/cli-plugins
curl -Lo ~/.docker/cli-plugins/docker-buildx https://github.com/docker/buildx/releases/latest/download/buildx-v0.11.2.linux-amd64
chmod +x ~/.docker/cli-plugins/docker-buildx
```

### Error: "failed to solve: failed to load cache key"

Pastikan Anda sudah login ke Docker Hub:

```bash
docker login
```

### Build Sangat Lambat

Build ARM64 dari PC x86 menggunakan QEMU emulation, sehingga lebih lambat. Untuk build cepat, gunakan Opsi 1 (build langsung di Raspberry Pi).

---

## Referensi

- [Docker Buildx Documentation](https://docs.docker.com/buildx/working-with-buildx/)
- [Multi-platform Images](https://docs.docker.com/build/building/multi-platform/)
