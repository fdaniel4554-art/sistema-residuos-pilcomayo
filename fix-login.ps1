# PowerShell Script para solucionar el error de login en Docker

Write-Host "Solucionando error de login en Docker..." -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Users\ACER\Documents\7 SEMESTRE\Modelamiento y Gestion de Procesos de Negocios\sistema-residuos-pilcomayo"
Set-Location $projectPath

Write-Host "Deteniendo contenedores..." -ForegroundColor Yellow
docker-compose down

Write-Host "Limpiando cache del frontend..." -ForegroundColor Yellow
if (Test-Path "frontend\.next") {
    Remove-Item -Recurse -Force "frontend\.next"
}

Write-Host "Reconstruyendo contenedores..." -ForegroundColor Yellow
docker-compose build --no-cache frontend backend

Write-Host "Iniciando contenedores..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "Esperando a que los servicios esten listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "Estado de los contenedores:" -ForegroundColor Green
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "Configuracion completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Accede a la aplicacion en: http://localhost" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor Cyan
Write-Host "  Admin: admin@pilcomayo.gob.pe / admin123" -ForegroundColor White
Write-Host "  Brigada: brigada1@pilcomayo.gob.pe / admin123" -ForegroundColor White
