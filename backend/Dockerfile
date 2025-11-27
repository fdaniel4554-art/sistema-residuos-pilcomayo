FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema necesarias
# - openssl: requerido por Prisma
# - bash: para ejecutar scripts de shell
# - netcat-openbsd: para wait-for-it.sh (verificar disponibilidad de servicios)
RUN apk add --no-cache openssl bash netcat-openbsd

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install

# Generar Prisma Client
RUN npx prisma generate

# Copiar scripts de inicialización
COPY scripts ./scripts/

# Dar permisos de ejecución a los scripts
RUN chmod +x scripts/*.sh

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 4000

# Healthcheck para Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio usando el script de inicialización
# El script init.sh se encargará de:
# 1. Esperar a PostgreSQL
# 2. Ejecutar migraciones de Prisma
# 3. Iniciar el servidor
CMD ["./scripts/init.sh", "npm", "run", "dev"]

