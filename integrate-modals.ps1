# Script para integrar los modales de administración
# Este script modifica el archivo page.tsx para agregar los modales

$filePath = "frontend\src\app\dashboard\admin\page.tsx"
$content = Get-Content $filePath -Raw

Write-Host "🔧 Integrando modales de administración..." -ForegroundColor Cyan

# 1. Agregar import de los modales
if ($content -notmatch "AdminModals") {
    Write-Host "✓ Agregando import de AdminModals..." -ForegroundColor Green
    $content = $content -replace "(import AnimatedBackground from '@/components/AnimatedBackground';)", "`$1`nimport { CreateUserModal, ChangePasswordModal } from '@/components/AdminModals';"
}

# 2. Agregar botón de crear usuario
$createButtonPattern = 'onClick=\{\(\) => setShowCreateUserModal\(true\)\}'
if ($content -notmatch $createButtonPattern) {
    Write-Host "✓ Agregando botón 'Crear Usuario'..." -ForegroundColor Green
    
    $oldHeader = '<h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>\s+<div className="flex gap-4">'
    $newHeader = @'
<div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
                                        <button
                                            onClick={() => setShowCreateUserModal(true)}
                                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Crear Usuario
                                        </button>
                                    </div>
                                    <div className="flex gap-4">
'@
    $content = $content -replace $oldHeader, $newHeader
}

# 3. Agregar modales antes del Delete Confirmation Modal
if ($content -notmatch "CreateUserModal") {
    Write-Host "✓ Agregando componentes de modales..." -ForegroundColor Green
    
    $modalsCode = @'

                {/* Create User Modal */}
                <CreateUserModal
                    show={showCreateUserModal}
                    onClose={() => {
                        setShowCreateUserModal(false);
                        setFormErrors('');
                        setCreateUserForm({ name: '', email: '', password: '', role: 'CITIZEN', phone: '' });
                    }}
                    onCreate={createUser}
                    form={createUserForm}
                    setForm={setCreateUserForm}
                    errors={formErrors}
                />

                {/* Change Password Modal */}
                <ChangePasswordModal
                    show={showChangePasswordModal}
                    onClose={() => {
                        setShowChangePasswordModal(false);
                        setFormErrors('');
                        setChangePasswordForm({ newPassword: '', confirmPassword: '' });
                    }}
                    onChange={changePassword}
                    userName={selectedUser?.name || ''}
                    form={changePasswordForm}
                    setForm={setChangePasswordForm}
                    errors={formErrors}
                />

'@
    
    $content = $content -replace '(\s+\{/\* Delete Confirmation Modal \*/\})', "$modalsCode`$1"
}

# Guardar cambios
Set-Content $filePath -Value $content

Write-Host "`n✅ ¡Integración completada!" -ForegroundColor Green
Write-Host "Los modales han sido agregados al dashboard de administración." -ForegroundColor Cyan
Write-Host "`nPróximos pasos:" -ForegroundColor Yellow
Write-Host "1. Verifica que el archivo se haya modificado correctamente" -ForegroundColor White
Write-Host "2. Ejecuta: npm run dev (si estás en desarrollo local)" -ForegroundColor White
Write-Host "3. Haz commit y push de los cambios" -ForegroundColor White
