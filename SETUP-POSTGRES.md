# PostgreSQL Setup Guide

## Verificar que PostgreSQL está Corriendo

### Paso 1: Verificar el Estado de PostgreSQL

```bash
# En Linux/Mac
sudo systemctl status postgresql

# O intenta conectar directamente
psql -h localhost -p 5432 -U postgres
```

### Paso 2: Si PostgreSQL no está corriendo

```bash
# Iniciar PostgreSQL
sudo systemctl start postgresql

# Habilitarlo para que inicie automáticamente
sudo systemctl enable postgresql
```

### Paso 3: Verificar el Puerto

```bash
# Ver en qué puerto está corriendo PostgreSQL
sudo netstat -tulpn | grep postgres

# O
sudo ss -tulpn | grep postgres
```

## Configurar el Backend

### Paso 1: Edita `/backend/.env` con tus credenciales

```bash
cd backend
nano .env
```

Configura:
```env
PORT=3001

# TUS CREDENCIALES DE POSTGRESQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=TU_BASE_DE_DATOS
POSTGRES_USER=TU_USUARIO
POSTGRES_PASSWORD=TU_CONTRASEÑA
```

### Paso 2: Inicia el Backend

```bash
cd backend
npm run dev
```

Deberías ver:
```
🚀 Backend server running on http://localhost:3001
📊 Database API available at http://localhost:3001/api/db/
```

### Paso 3: Prueba la Conexión

```bash
# Desde otra terminal
curl http://localhost:3001/health
```

## Problemas Comunes

### PostgreSQL en Docker

Si tu PostgreSQL está en Docker, necesitas usar:
- Host: `host.docker.internal` (Mac/Windows)
- Host: `172.17.0.1` (Linux)

### Firewall Bloqueando

```bash
# Permitir conexiones a PostgreSQL
sudo ufw allow 5432/tcp
```

### PostgreSQL Solo Acepta Conexiones Locales

Edita `/etc/postgresql/<version>/main/postgresql.conf`:
```conf
listen_addresses = 'localhost'
```

Edita `/etc/postgresql/<version>/main/pg_hba.conf`:
```conf
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
```

Luego reinicia:
```bash
sudo systemctl restart postgresql
```

## Verificación Rápida

```bash
# 1. ¿PostgreSQL está corriendo?
ps aux | grep postgres

# 2. ¿Puedo conectarme?
psql -h localhost -p 5432 -U tu_usuario -d tu_base_de_datos

# 3. ¿El backend está escuchando?
curl http://localhost:3001/health
```

## Conectar desde el Frontend

1. Abre la aplicación: http://localhost:5173
2. Click en Settings (⚙️)
3. Tab "Database Connection"
4. Selecciona "PostgreSQL"
5. Ingresa:
   - Host: `localhost`
   - Port: `5432`
   - Database: tu nombre de BD
   - User: tu usuario
   - Password: tu contraseña
   - Backend URL: `http://localhost:3001`
6. Save Settings

¡Listo!
