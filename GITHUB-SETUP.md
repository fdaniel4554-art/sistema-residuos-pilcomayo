# 📝 Instrucciones para Conectar GitHub

## ✅ Lo que ya hicimos:
- ✅ Inicializado repositorio Git
- ✅ Agregados todos los archivos (89 archivos)
- ✅ Creado commit inicial
- ✅ Configurada rama main

## 🔗 Próximos pasos:

### 1. Crear repositorio en GitHub

1. Ve a: https://github.com/new
2. **Repository name**: `sistema-residuos-pilcomayo`
3. **Description**: Sistema de Gestión de Residuos Sólidos - Pilcomayo
4. **Visibility**: Público o Privado (como prefieras)
5. **NO marques** "Add a README file"
6. Click en **"Create repository"**

### 2. Conectar y subir el código

Después de crear el repositorio, GitHub te mostrará una página con instrucciones.

Copia tu **nombre de usuario de GitHub** y ejecuta estos comandos:

```bash
# Reemplaza TU_USUARIO con tu nombre de usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/sistema-residuos-pilcomayo.git
git push -u origin main
```

**Ejemplo:**
Si tu usuario es `danielpilcomayo`, sería:
```bash
git remote add origin https://github.com/danielpilcomayo/sistema-residuos-pilcomayo.git
git push -u origin main
```

### 3. Autenticación

GitHub te pedirá autenticación. Tienes 2 opciones:

**Opción A: Personal Access Token (Recomendado)**
1. Ve a: https://github.com/settings/tokens
2. Click en "Generate new token" → "Generate new token (classic)"
3. Nombre: `Railway Deploy`
4. Expiration: 90 days
5. Marca: `repo` (todos los permisos de repositorio)
6. Click en "Generate token"
7. **Copia el token** (solo se muestra una vez)
8. Cuando hagas `git push`, usa el token como contraseña

**Opción B: GitHub CLI**
```bash
# Instalar GitHub CLI
winget install GitHub.cli

# Autenticar
gh auth login
```

---

## 📋 Información necesaria:

**¿Cuál es tu nombre de usuario de GitHub?**

Una vez que me lo digas, puedo ejecutar los comandos por ti.

Si no tienes cuenta en GitHub, créala aquí: https://github.com/signup
