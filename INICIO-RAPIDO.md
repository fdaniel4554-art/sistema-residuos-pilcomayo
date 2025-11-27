# 🚀 Guía de Inicio Rápido

## Ejecutar el Proyecto

### 1. Copiar variables de entorno
```bash
cd "C:\Users\ACER\Documents\7° SEMESTRE\Modelamiento y Gestion de Procesos de Negocios\sistema-residuos-pilcomayo"
copy .env.example .env
```

### 2. Levantar servicios con Docker
```bash
docker compose up -d
```

### 3. Esperar a que PostgreSQL esté listo (30-60 segundos)
Verifica el estado:
```bash
docker compose ps
```

### 4. Ejecutar migraciones de base de datos
```bash
docker compose exec backend npx prisma migrate dev --name init
```

### 5. Cargar datos de prueba
```bash
docker compose exec backend npm run prisma:seed
```

### 6. Acceder a la aplicación
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **AI Service**: http://localhost:8000
- **MinIO Console**: http://localhost:9001 (admin/minioadmin)

---

## Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@pilcomayo.gob.pe | admin123 |
| Brigada 1 | brigada1@pilcomayo.gob.pe | admin123 |
| Brigada 2 | brigada2@pilcomayo.gob.pe | admin123 |
| Chofer | chofer1@pilcomayo.gob.pe | admin123 |
| Ciudadano | ciudadano@example.com | admin123 |

---

## Comandos Útiles

### Ver logs de un servicio
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f ai-service
```

### Reiniciar un servicio
```bash
docker compose restart backend
```

### Detener todos los servicios
```bash
docker compose down
```

### Limpiar y reiniciar todo
```bash
docker compose down -v
docker compose up -d
```

### Acceder al contenedor backend
```bash
docker compose exec backend sh
```

---

## Verificar que todo funciona

### 1. Health Check del Backend
```bash
curl http://localhost:4000/health
```

### 2. Health Check del AI Service
```bash
curl http://localhost:8000/health
```

### 3. Probar login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pilcomayo.gob.pe","password":"admin123"}'
```

---

## Solución de Problemas

### Error: Puerto ya en uso
```bash
# Ver qué está usando el puerto
netstat -ano | findstr :3000
netstat -ano | findstr :4000

# Cambiar puertos en docker-compose.yml si es necesario
```

### Error: Base de datos no conecta
```bash
# Verificar que PostgreSQL esté corriendo
docker compose ps postgres

# Ver logs
docker compose logs postgres
```

### Error: Migraciones fallan
```bash
# Resetear base de datos
docker compose down -v
docker compose up -d
# Esperar 60 segundos
docker compose exec backend npx prisma migrate dev --name init
```

---

## Desarrollo Local (sin Docker)

Si prefieres desarrollar sin Docker:

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Nota**: Necesitarás PostgreSQL, Redis y MinIO corriendo localmente.

---

## Próximos Pasos

1. ✅ Ejecutar el proyecto
2. ✅ Probar login
3. ✅ Crear un reporte de incidencia
4. ✅ Ver el dashboard con el mapa
5. ⚠️ Completar panel de administración (opcional)
6. 🎯 Personalizar con datos reales de Pilcomayo
