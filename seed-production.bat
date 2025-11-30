@echo off
echo ========================================
echo   CARGAR DATOS INICIALES EN PRODUCCION
echo ========================================
echo.

cd /d "C:\Users\ACER\Documents\7° SEMESTRE\Modelamiento y Gestion de Procesos de Negocios\sistema-residuos-pilcomayo\backend"

echo Cargando datos iniciales...
echo.

node prisma/seed-production.js

echo.
echo ========================================
echo   LISTO!
echo ========================================
echo.
echo Ahora puedes hacer login con:
echo   Email: admin@pilcomayo.gob.pe
echo   Password: admin123
echo.
pause
