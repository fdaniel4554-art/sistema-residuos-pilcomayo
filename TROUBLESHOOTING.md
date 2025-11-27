# 🔧 Guía de Solución de Problemas (Troubleshooting)

Esta guía te ayudará a resolver los problemas más comunes del Sistema de Gestión de Residuos Sólidos - Pilcomayo cuando se ejecuta en Docker con WSL2/Ubuntu.

## 📋 Tabla de Contenidos

1. [Problemas con Docker](#problemas-con-docker)
2. [Problemas con Base de Datos](#problemas-con-base-de-datos)
3. [Problemas con Volúmenes](#problemas-con-volúmenes)
4. [Problemas de Red](#problemas-de-red)
5. [Problemas de Rendimiento](#problemas-de-rendimiento)
6. [Comandos Útiles](#comandos-útiles)

---

## 🐳 Problemas con Docker

### El sistema no inicia correctamente

**Síntomas:**
- Los contenedores no se inician
- Error "cannot connect to Docker daemon"

**Soluciones:**

```bash
# 1. Verificar que Docker Desktop esté corriendo
# En Windows, asegúrate de que Docker Desktop esté iniciado

# 2. En WSL, verificar la conexión a Docker
docker ps

# 3. Si Docker no responde, reiniciar el servicio Docker en Windows
# Desde PowerShell como administrador:
Restart-Service docker

# 4. Reiniciar WSL si es necesario
wsl --shutdown
# Luego volver a abrir tu terminal WSL
```

### Los contenedores se reinician continuamente

**Síntomas:**
- `docker ps` muestra contenedores con status "Restarting"
- Los servicios no están disponibles

**Soluciones:**

```bash
# 1. Ver los logs del contenedor problemático
docker logs residuos-backend --tail=50

# 2. Verificar el healthcheck
docker inspect residuos-backend | grep -A 10 Health

# 3. Detener y eliminar todo para empezar de nuevo
docker compose down -v
docker compose up -d

# 4. Ver logs en tiempo real
docker compose logs -f
```

---

## 🗄️ Problemas con Base de Datos

### Error: "Can't connect to PostgreSQL"

**Síntomas:**
- Backend muestra errores de conexión
- No se pueden ejecutar migraciones

**Soluciones:**

```bash
# 1. Verificar que PostgreSQL esté corriendo y healthy
docker ps --filter "name=residuos-postgres"
docker exec residuos-postgres pg_isready -U postgres

# 2. Verificar las variables de entorno
docker exec residuos-backend env | grep DATABASE_URL

# 3. Si la URL está incorrecta, editar .env y recrear
docker compose down
docker compose up -d

# 4. Conectar manualmente para probar
docker exec -it residuos-postgres psql -U postgres -d residuos_db
# Dentro de psql:
\dt  # Ver tablas
\q   # Salir
```

### Las migraciones de Prisma no se ejecutan

**Síntomas:**
- Tablas no existen en la base de datos
- Error "Table X doesn't exist"

**Soluciones:**

```bash
# 1. Ejecutar migraciones manualmente
docker compose exec backend npx prisma migrate deploy

# 2. Si falla, resetear la base de datos (¡CUIDADO: borra todos los datos!)
docker compose exec backend npx prisma migrate reset

# 3. Ver el estado de las migraciones
docker compose exec backend npx prisma migrate status

# 4. Generar el cliente de Prisma nuevamente
docker compose exec backend npx prisma generate
```

### Error: "Prisma Client is not generated"

**Solución:**

```bash
# Regenerar el cliente dentro del contenedor
docker compose exec backend npx prisma generate

# Reiniciar el contenedor
docker compose restart backend
```

---

## 💾 Problemas con Volúmenes

### Los cambios en el código no se reflejan

**Síntomas:**
- Modificas archivos pero el sistema no detecta los cambios
- Hot reload no funciona

**Soluciones:**

```bash
# 1. Verificar que los volúmenes estén montados correctamente
docker inspect residuos-backend | grep -A 20 Mounts

# 2. En WSL, asegúrate de estar en la ruta correcta
pwd
# Debe mostrar: /mnt/c/Users/ACER/Documents/7° SEMESTRE/...

# 3. Reconstruir los contenedores
docker compose down
docker compose build --no-cache
docker compose up -d

# 4. Para Next.js específicamente
docker compose exec frontend rm -rf .next
docker compose restart frontend
```

### Error: "Permission denied" en volúmenes

**Síntomas:**
- Errores de permisos al escribir archivos
- EACCES errors

**Soluciones:**

```bash
# 1. En WSL, cambiar permisos del directorio
cd "/mnt/c/Users/ACER/Documents/7° SEMESTRE/Modelamiento y Gestion de Procesos de Negocios/sistema-residuos-pilcomayo"
chmod -R 755 .

# 2. Si persiste, eliminar node_modules y reinstalar
docker compose down
rm -rf backend/node_modules frontend/node_modules
docker compose build --no-cache
docker compose up -d

# 3. Alternativa: usar volúmenes nombrados en lugar de bind mounts
# (modificar docker-compose.yml)
```

### Los datos se pierden al reiniciar

**Síntomas:**
- Los datos de PostgreSQL/MinIO desaparecen después de `docker compose down`

**Solución:**

```bash
# NO uses la opción -v si quieres conservar los datos
docker compose down  # ✅ Correcto
docker compose down -v  # ❌ Esto borra los volúmenes

# Ver los volúmenes existentes
docker volume ls | grep residuos

# Hacer backup de la base de datos
docker exec residuos-postgres pg_dump -U postgres residuos_db > backup.sql

# Restaurar backup
docker exec -i residuos-postgres psql -U postgres residuos_db < backup.sql
```

---

## 🌐 Problemas de Red

### No puedo acceder a http://localhost:3000

**Síntomas:**
- El navegador no carga la aplicación
- "Cannot connect" o timeout

**Soluciones:**

```bash
# 1. Verificar que el contenedor esté corriendo
docker ps | grep frontend

# 2. Verificar que el puerto esté mapeado correctamente
docker port residuos-frontend

# 3. Intentar desde WSL
curl http://localhost:3000

# 4. Si funciona en WSL pero no en Windows, puede ser firewall
# Agregar regla en Windows Firewall para el puerto 3000

# 5. Verificar en la configuración de Docker Desktop
# Settings > Resources > WSL Integration
# Asegúrate de que tu distro WSL esté habilitada
```

### Backend no puede conectarse a MinIO, PostgreSQL o Redis

**Síntomas:**
- Error "ECONNREFUSED" en los logs del backend

**Soluciones:**

```bash
# 1. Verificar que todos los servicios estén en la misma red
docker network inspect sistema-residuos-pilcomayo_residuos-network

# 2. Verificar nombres de host en .env
# Deben ser los nombres de los servicios, NO localhost:
# ✅ Correcto:
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/residuos_db
REDIS_URL=redis://redis:6379
MINIO_ENDPOINT=minio

# ❌ Incorrecto:
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/residuos_db

# 3. Reconstruir con las variables correctas
docker compose down
docker compose up -d
```

### Frontend no puede conectarse al Backend

**Síntomas:**
- Errores CORS en la consola del navegador
- Requests fallan con network error

**Soluciones:**

```bash
# 1. Verificar la variable NEXT_PUBLIC_API_URL
docker compose exec frontend env | grep NEXT_PUBLIC_API_URL

# Debe ser: http://localhost:4000 (para acceso desde el navegador)

# 2. Verificar CORS en el backend
docker compose logs backend | grep CORS

# 3. El frontend debe usar localhost, NO el nombre del contenedor
# En .env:
NEXT_PUBLIC_API_URL=http://localhost:4000  # ✅ Correcto

# 4. Reiniciar frontend si se cambió la variable
docker compose restart frontend
```

---

## ⚡ Problemas de Rendimiento

### El sistema está muy lento

**Soluciones:**

```bash
# 1. Verificar uso de recursos
docker stats

# 2. Aumentar recursos en Docker Desktop
# Settings > Resources
# - CPU: mínimo 4
# - Memory: mínimo 4 GB

# 3. Limpiar imágenes y contenedores no usados
docker system prune -a

# 4. Optimizar WSL2
# En Windows PowerShell como administrador:
wsl --shutdown
# Editar C:\Users\ACER\.wslconfig:
```

Crear/editar `.wslconfig` en `C:\Users\ACER\.wslconfig`:

```ini
[wsl2]
memory=4GB
processors=4
swap=2GB
```

### La compilación de Next.js tarda mucho

**Solución:**

```bash
# Eliminar caché y reconstruir
docker compose exec frontend rm -rf .next
docker compose exec frontend npm run build
```

---

## 🛠️ Comandos Útiles

### Diagnóstico General

```bash
# Ver estado de todos los servicios
docker compose ps

# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend

# Ejecutar el script de health check
chmod +x docker-health.sh
./docker-health.sh
```

### Reconstruir desde Cero

```bash
# ⚠️ ADVERTENCIA: Esto eliminará TODOS los datos
cd "/mnt/c/Users/ACER/Documents/7° SEMESTRE/Modelamiento y Gestion de Procesos de Negocios/sistema-residuos-pilcomayo"

# Detener y eliminar todo
docker compose down -v

# Eliminar imágenes
docker compose rm -f

# Reconstruir sin caché
docker compose build --no-cache

# Iniciar todo
docker compose up -d

# Ver logs
docker compose logs -f
```

### Acceso a Contenedores

```bash
# Acceder al bash del backend
docker compose exec backend sh

# Acceder al bash del frontend
docker compose exec frontend sh

# Acceder a PostgreSQL
docker compose exec postgres psql -U postgres -d residuos_db

# Ejecutar comandos npm en el backend
docker compose exec backend npm run prisma:studio
```

### Limpieza y Mantenimiento

```bash
# Limpiar contenedores detenidos
docker container prune

# Limpiar imágenes no usadas
docker image prune -a

# Limpiar volúmenes no usados (¡CUIDADO!)
docker volume prune

# Limpiar todo el sistema de Docker
docker system prune -a --volumes
```

---

## 📱 Contacto y Soporte

Si ninguna de estas soluciones funciona:

1. Revisa los logs completos: `docker compose logs > logs.txt`
2. Verifica la versión de Docker: `docker --version`
3. Verifica la versión de Docker Compose: `docker compose version`
4. Asegúrate de estar en WSL2, no WSL1: `wsl -l -v`

Para obtener más ayuda, consulta:
- [Documentación de Docker](https://docs.docker.com/)
- [Documentación de WSL](https://docs.microsoft.com/en-us/windows/wsl/)
- [Documentación de Prisma](https://www.prisma.io/docs/)

---

**Última actualización:** 2025-11-23
