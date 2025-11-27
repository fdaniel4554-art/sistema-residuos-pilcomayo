# Guía de Despliegue Gratuito - Paso a Paso

## Stack Seleccionado (100% Gratis)

- 🗄️ **Base de Datos**: Neon PostgreSQL (0.5 GB gratis)
- 🚂 **Backend**: Railway (500 hrs/mes gratis)
- ⚡ **Frontend**: Vercel (ilimitado gratis)
- 📦 **Imágenes**: Cloudinary (25 GB/mes gratis)

---

## Paso 1: Base de Datos (Neon)

### 1.1 Crear cuenta
1. Ve a: https://neon.tech
2. Click en "Sign Up"
3. Usa tu cuenta de GitHub o email

### 1.2 Crear proyecto
1. Click en "Create Project"
2. Nombre: `residuos-pilcomayo`
3. Región: `US East (Ohio)` (la más cercana)
4. PostgreSQL version: 15 o superior

### 1.3 Habilitar PostGIS
1. En el dashboard, ve a "SQL Editor"
2. Ejecuta:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 1.4 Copiar connection string
1. Ve a "Dashboard" → "Connection Details"
2. Copia el `Connection string`
3. Guárdalo, lo necesitarás después

---

## Paso 2: Preparar el Código

### 2.1 Crear archivo .env.production en backend
Crea este archivo con tus credenciales (las obtendrás en los siguientes pasos):

```env
NODE_ENV=production
DATABASE_URL=postgresql://... (de Neon)
JWT_SECRET=tu_secret_super_seguro_cambiar_esto
JWT_EXPIRES_IN=7d

# Cloudinary (lo configuraremos después)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Redis (opcional, lo omitiremos por ahora)
# REDIS_URL=
```

### 2.2 Subir código a GitHub
```bash
cd "C:\Users\ACER\Documents\7° SEMESTRE\Modelamiento y Gestion de Procesos de Negocios\sistema-residuos-pilcomayo"

# Inicializar git si no lo has hecho
git init
git add .
git commit -m "Preparar para deploy en producción"

# Crear repositorio en GitHub y subir
git remote add origin https://github.com/TU_USUARIO/sistema-residuos-pilcomayo.git
git branch -M main
git push -u origin main
```

---

## Paso 3: Backend (Railway)

### 3.1 Crear cuenta
1. Ve a: https://railway.app
2. Click en "Login with GitHub"
3. Autoriza Railway

### 3.2 Crear proyecto
1. Click en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Busca y selecciona tu repositorio
4. Railway detectará automáticamente el proyecto

### 3.3 Configurar el servicio
1. Click en el servicio creado
2. Ve a "Settings"
3. En "Root Directory" pon: `backend`
4. En "Build Command" pon: `npm install && npx prisma generate && npx prisma migrate deploy`
5. En "Start Command" pon: `npm start`

### 3.4 Configurar variables de entorno
1. Ve a "Variables"
2. Agrega cada variable:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (pega el connection string de Neon)
   - `JWT_SECRET` = `pilcomayo_secret_2024_cambiar_en_produccion`
   - `JWT_EXPIRES_IN` = `7d`
   - `PORT` = `4000`

### 3.5 Deploy
1. Railway hará deploy automáticamente
2. Espera 2-3 minutos
3. Ve a "Settings" → "Domains"
4. Click en "Generate Domain"
5. Copia la URL (ej: `https://sistema-residuos-production.up.railway.app`)

---

## Paso 4: Frontend (Vercel)

### 4.1 Crear cuenta
1. Ve a: https://vercel.com
2. Click en "Sign Up"
3. Usa tu cuenta de GitHub

### 4.2 Importar proyecto
1. Click en "Add New..." → "Project"
2. Selecciona tu repositorio
3. Vercel detectará Next.js automáticamente

### 4.3 Configurar proyecto
1. Framework Preset: `Next.js`
2. Root Directory: `frontend`
3. Build Command: (dejar por defecto)
4. Output Directory: (dejar por defecto)

### 4.4 Configurar variables de entorno
Click en "Environment Variables" y agrega:
- `NEXT_PUBLIC_API_URL` = (URL de Railway del paso 3.5)
- `NEXT_PUBLIC_APP_NAME` = `Sistema Residuos Pilcomayo`
- `NEXT_PUBLIC_DEFAULT_LAT` = `-12.0464`
- `NEXT_PUBLIC_DEFAULT_LNG` = `-75.2137`
- `NEXT_PUBLIC_DEFAULT_ZOOM` = `14`

### 4.5 Deploy
1. Click en "Deploy"
2. Espera 2-3 minutos
3. Vercel te dará una URL (ej: `https://residuos-pilcomayo.vercel.app`)

---

## Paso 5: Almacenamiento (Cloudinary)

### 5.1 Crear cuenta
1. Ve a: https://cloudinary.com
2. Click en "Sign Up Free"
3. Completa el registro

### 5.2 Obtener credenciales
1. Ve al Dashboard
2. Copia:
   - Cloud Name
   - API Key
   - API Secret

### 5.3 Actualizar Railway
1. Ve a tu proyecto en Railway
2. Variables → Agregar:
   - `CLOUDINARY_CLOUD_NAME` = (tu cloud name)
   - `CLOUDINARY_API_KEY` = (tu api key)
   - `CLOUDINARY_API_SECRET` = (tu api secret)

---

## Paso 6: Verificación

### 6.1 Probar backend
1. Abre: `https://TU-BACKEND.up.railway.app/health`
2. Deberías ver: `{"status":"OK",...}`

### 6.2 Probar frontend
1. Abre: `https://TU-APP.vercel.app`
2. Deberías ver la página de login

### 6.3 Probar login
1. Usuario: `admin@pilcomayo.gob.pe`
2. Password: `admin123`
3. Deberías entrar al dashboard

---

## 🎉 ¡Listo!

Tu aplicación está en producción y accesible desde cualquier lugar.

### URLs de tu aplicación:
- **Frontend**: https://TU-APP.vercel.app
- **Backend**: https://TU-BACKEND.up.railway.app

### Próximos pasos:
1. Cambiar el `JWT_SECRET` a algo más seguro
2. Crear usuarios de prueba
3. Probar todas las funcionalidades
4. (Opcional) Configurar dominio personalizado
