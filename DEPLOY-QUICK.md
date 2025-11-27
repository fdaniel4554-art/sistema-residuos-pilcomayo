# 🚀 Guía Rápida de Despliegue

## Antes de Empezar

1. **Instalar dependencias de Cloudinary**
```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

2. **Subir código a GitHub**
```bash
# Desde la raíz del proyecto
git init
git add .
git commit -m "Preparar para despliegue en producción"

# Crear repositorio en GitHub (https://github.com/new)
# Luego:
git remote add origin https://github.com/TU_USUARIO/sistema-residuos-pilcomayo.git
git branch -M main
git push -u origin main
```

---

## Paso 1: Base de Datos (Neon) - 5 minutos

1. Ir a https://neon.tech y crear cuenta
2. Crear proyecto "residuos-pilcomayo"
3. En SQL Editor ejecutar:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
4. Copiar el `Connection string` (DATABASE_URL)

---

## Paso 2: Backend (Railway) - 10 minutos

1. Ir a https://railway.app
2. Login con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Seleccionar tu repositorio
5. Configurar:
   - Root Directory: `backend`
   - Variables de entorno:
     ```
     NODE_ENV=production
     DATABASE_URL=(pegar de Neon)
     JWT_SECRET=pilcomayo_secret_2024_cambiar
     JWT_EXPIRES_IN=7d
     PORT=4000
     ```
6. Generar dominio y copiar URL

---

## Paso 3: Frontend (Vercel) - 5 minutos

1. Ir a https://vercel.com
2. Login con GitHub
3. "Add New Project"
4. Seleccionar repositorio
5. Configurar:
   - Framework: Next.js
   - Root Directory: `frontend`
   - Variables:
     ```
     NEXT_PUBLIC_API_URL=(URL de Railway)
     NEXT_PUBLIC_APP_NAME=Sistema Residuos Pilcomayo
     NEXT_PUBLIC_DEFAULT_LAT=-12.0464
     NEXT_PUBLIC_DEFAULT_LNG=-75.2137
     NEXT_PUBLIC_DEFAULT_ZOOM=14
     ```
6. Deploy

---

## Paso 4: Cloudinary - 5 minutos

1. Ir a https://cloudinary.com
2. Crear cuenta gratuita
3. Copiar del Dashboard:
   - Cloud Name
   - API Key
   - API Secret
4. Agregar en Railway:
   ```
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
   ```

---

## ✅ Verificar

1. Backend: https://TU-BACKEND.up.railway.app/health
2. Frontend: https://TU-APP.vercel.app
3. Login: admin@pilcomayo.gob.pe / admin123

---

## 📝 Guardar URLs

- **Frontend**: _________________________
- **Backend**: _________________________
- **Base de Datos**: Neon Dashboard

**Tiempo total**: ~25 minutos
**Costo**: $0 (100% gratis)
