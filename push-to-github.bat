@echo off
echo ========================================
echo   SUBIR CAMBIOS A GITHUB
echo ========================================
echo.

cd /d "C:\Users\ACER\Documents\7° SEMESTRE\Modelamiento y Gestion de Procesos de Negocios\sistema-residuos-pilcomayo"

echo Agregando archivos...
git add .

echo.
echo Haciendo commit...
git commit -m "Fix: Corregir llamada API de optimizacion de rutas"

echo.
echo Subiendo a GitHub...
echo.
echo IMPORTANTE: Cuando pida credenciales:
echo   Username: fdaniel4554-art
echo   Password: ghp_Vybv7VHdm0OZvf718hLtKiaiWWyy5w2ZTMpi
echo.

git push -u origin main

echo.
echo ========================================
echo   LISTO!
echo ========================================
pause
