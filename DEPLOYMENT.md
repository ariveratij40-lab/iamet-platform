# Guía de Deployment — IAMET Platform en VPS

## Requisitos del servidor

| Componente | Versión mínima |
|---|---|
| **Node.js** | 20 LTS o superior |
| **pnpm** | 9+ |
| **MySQL** | 8.0+ (o MariaDB 10.6+) |
| **RAM** | 1 GB mínimo, 2 GB recomendado |
| **OS** | Ubuntu 22.04 / 24.04 LTS |

---

## 1. Preparar el servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar PM2 (gestor de procesos)
npm install -g pm2

# Instalar MySQL (si no tienes uno externo)
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

---

## 2. Crear la base de datos MySQL

```sql
-- Conectarse como root
sudo mysql -u root -p

-- Crear base de datos y usuario
CREATE DATABASE iamet_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'iamet_user'@'localhost' IDENTIFIED BY 'TU_PASSWORD_SEGURO';
GRANT ALL PRIVILEGES ON iamet_platform.* TO 'iamet_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 3. Clonar el repositorio

```bash
# En tu VPS, como usuario no-root (ej. ubuntu o deploy)
cd /var/www
git clone https://github.com/ariveratij40-lab/iamet-platform.git
cd iamet-platform
```

---

## 4. Instalar dependencias

```bash
pnpm install --frozen-lockfile
```

---

## 5. Configurar variables de entorno

Crea el archivo `.env` en la raíz del proyecto:

```bash
nano .env
```

Contenido del `.env`:

```env
# Base de datos MySQL
DATABASE_URL=mysql://iamet_user:TU_PASSWORD_SEGURO@localhost:3306/iamet_platform

# Seguridad
JWT_SECRET=genera_una_clave_aleatoria_larga_aqui

# Manus OAuth (mantener los mismos valores del proyecto Manus)
VITE_APP_ID=TU_APP_ID_DE_MANUS
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
OWNER_OPEN_ID=TU_OWNER_OPEN_ID
OWNER_NAME=IAMET

# URL del sitio (tu dominio VPS)
VITE_APP_URL=https://tudominio.com

# Resend (correos de verificación)
RESEND_API_KEY=re_TU_API_KEY_DE_RESEND

# Manus Forge API (para el agente IA)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=TU_FORGE_API_KEY

# Storage S3 (para imágenes de productos)
# Si usas el storage de Manus, estos valores vienen del proyecto
AWS_ACCESS_KEY_ID=TU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=TU_SECRET_KEY
AWS_REGION=us-east-1
AWS_BUCKET_NAME=TU_BUCKET

NODE_ENV=production
```

> **Importante:** Obtén los valores de `VITE_APP_ID`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_KEY` y los de S3 desde la sección **Secrets** del panel de Manus (Settings → Secrets).

---

## 6. Ejecutar migraciones de base de datos

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

---

## 7. Build de producción

```bash
pnpm build
```

Esto genera:
- `dist/` — servidor Node.js compilado
- `client/dist/` — frontend React compilado

---

## 8. Iniciar con PM2

```bash
# Crear archivo de configuración PM2
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'iamet-platform',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env'
  }]
}
EOF

# Iniciar la aplicación
pm2 start ecosystem.config.cjs

# Guardar configuración para reinicio automático
pm2 save
pm2 startup
```

---

## 9. Configurar Nginx como proxy inverso

```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/iamet-platform
```

Contenido del archivo Nginx:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Redirigir a HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # SSL (Certbot lo configura automáticamente)
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # Proxy a Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 180s;
    }
}
```

```bash
# Activar el sitio
sudo ln -s /etc/nginx/sites-available/iamet-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 10. SSL con Let's Encrypt (HTTPS gratuito)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

---

## 11. Actualizar el sitio (deploy de nuevas versiones)

```bash
cd /var/www/iamet-platform

# Obtener últimos cambios de GitHub
git pull origin main

# Instalar nuevas dependencias (si las hay)
pnpm install --frozen-lockfile

# Ejecutar migraciones (si hay cambios en el schema)
pnpm drizzle-kit migrate

# Rebuild
pnpm build

# Reiniciar la aplicación
pm2 restart iamet-platform
```

---

## Comandos útiles de PM2

```bash
pm2 status              # Ver estado de la app
pm2 logs iamet-platform # Ver logs en tiempo real
pm2 restart iamet-platform
pm2 stop iamet-platform
pm2 monit               # Monitor de CPU/RAM
```

---

## Notas importantes

- El proyecto usa **MySQL** — asegúrate de que `DATABASE_URL` apunte a tu instancia MySQL del VPS.
- El **storage de archivos** (imágenes de productos) usa S3 de Manus — si quieres usar tu propio S3, necesitarás actualizar `server/storage.ts`.
- El **agente IA** usa la API de Manus (`BUILT_IN_FORGE_API_KEY`) — este servicio requiere créditos activos en tu cuenta Manus.
- Para el **OAuth de Manus** funcionando en tu dominio propio, necesitas registrar el nuevo dominio en la configuración de tu aplicación Manus.
