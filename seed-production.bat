@echo off
echo ========================================
echo   CARGAR DATOS INICIALES EN PRODUCCION
echo ========================================
echo.

cd /d "C:\Users\ACER\Documents\7° SEMESTRE\Modelamiento y Gestion de Procesos de Negocios\sistema-residuos-pilcomayo\backend"

echo IMPORTANTE: Configurando conexion a base de datos de produccion...
echo.

REM Configura aqui tu DATABASE_URL de Neon
set DATABASE_URL=postgresql://neondb_owner:************@ep-wandering-pine-ac2v9y06-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require

echo Cargando datos iniciales...
echo.

node prisma/seed-production.js

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo   LISTO!
    echo ========================================
    echo.
    echo Ahora puedes hacer login con:
    echo   Email: admin@pilcomayo.gob.pe
    echo   Password: admin123
) else (
    echo ========================================
    echo   ERROR!
    echo ========================================
    echo.
    echo Hubo un error al cargar los datos.
    echo Verifica el DATABASE_URL en el archivo.
)
echo.
pause
