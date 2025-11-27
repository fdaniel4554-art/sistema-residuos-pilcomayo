# Comandos Rápidos - Sistema de Residuos Pilcomayo

## 🚀 Inicio Rápido

```bash
# 1. Navegar al proyecto en WSL
cd "/mnt/c/Users/ACER/Documents/7° SEMESTRE/Modelamiento y Gestion de Procesos de Negocios/sistema-residuos-pilcomayo"

# 2. Detener todo (si está corriendo)
docker compose down

# 3. Reconstruir imágenes (primera vez o después de cambios)
docker compose build --no-cache

# 4. Iniciar todos los servicios
docker compose up -d

# 5. Ver logs en tiempo real
docker compose logs -f

# 6. Verificar estado de salud
chmod +x docker-health.sh
./docker-health.sh
```

## 📊 Verificación Rápida

```bash
# Ver estado de contenedores
docker compose ps

# Ver solo los que están con problemas
docker compose ps --filter "health=unhealthy"

# Ver logs de un servicio específico
docker compose logs backend
docker compose logs frontend
docker compose logs postgres

# Revisar últimos 50 líneas de logs
docker compose logs --tail=50 backend
```

## 🔧 Comandos de Mantenimiento

```bash
# Reiniciar un servicio específico
docker compose restart backend
docker compose restart frontend

# Reconstruir solo un servicio
docker compose build backend
docker compose up -d backend

# Ver uso de recursos
docker stats

# Limpiar todo y empezar de cero (¡BORRA DATOS!)
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

## 🗄️ Comandos de Base de Datos

```bash
# Acceder a PostgreSQL
docker compose exec postgres psql -U postgres -d residuos_db

# Ver tablas
docker compose exec postgres psql -U postgres -d residuos_db -c "\dt"

# Ejecutar migraciones manualmente
docker compose exec backend npx prisma migrate deploy

# Ver estado de migraciones
docker compose exec backend npx prisma migrate status

# Abrir Prisma Studio (UI para ver datos)
docker compose exec backend npx prisma studio
# Luego abre: http://localhost:5555

# Resetear base de datos (desarrollo)
docker compose exec backend npx prisma migrate reset
```

## 🌐 Accesos Web

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Backend Health: http://localhost:4000/health
- MinIO Console: http://localhost:9001 (user: minioadmin / pass: minioadmin)
- AI Service: http://localhost:8000
- AI Service Health: http://localhost:8000/health
- Nginx: http://localhost:80

## 🐛 Solución de Problemas

```bash
# Si algo no funciona, consultar la guía
cat TROUBLESHOOTING.md

# O abrirla en tu editor
code TROUBLESHOOTING.md

# Script de health check completo
./docker-health.sh
```

## 📦 Backup y Restore

```bash
# Hacer backup de la base de datos
docker exec residuos-postgres pg_dump -U postgres residuos_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i residuos-postgres psql -U postgres residuos_db < backup_20241123.sql
```

## 🛑 Detener Todo

```bash
# Detener sin borrar datos
docker compose down

# Detener Y borrar volúmenes (¡ELIMINA TODOS LOS DATOS!)
docker compose down -v
```
