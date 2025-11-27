const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Determinar si usar Cloudinary o MinIO
const useCloudinary = process.env.NODE_ENV === 'production' && process.env.CLOUDINARY_CLOUD_NAME;

let upload, cloudinary, minioClient, BUCKET_NAME;

if (useCloudinary) {
    // Configuración para Cloudinary (Producción)
    const cloudinaryConfig = require('../config/cloudinary');
    upload = cloudinaryConfig.upload;
    cloudinary = cloudinaryConfig.cloudinary;
    console.log('✅ Usando Cloudinary para almacenamiento de imágenes');
} else {
    // Configuración para MinIO (Desarrollo)
    const minioConfig = require('../config/minio');
    minioClient = minioConfig.minioClient;
    BUCKET_NAME = minioConfig.BUCKET_NAME;

    const storage = multer.memoryStorage();
    upload = multer({
        storage,
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB
        },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Solo se permiten imágenes'));
            }
        }
    });
    console.log('✅ Usando MinIO para almacenamiento de imágenes');
}

// ==========================================
// SUBIR IMAGEN
// ==========================================
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No se proporcionó ninguna imagen'
            });
        }

        let imageUrl, fileName;

        if (useCloudinary) {
            // Cloudinary ya subió la imagen automáticamente
            imageUrl = req.file.path;
            fileName = req.file.filename;
        } else {
            // Subir a MinIO
            const timestamp = Date.now();
            fileName = `${timestamp}-${req.file.originalname}`;

            await minioClient.putObject(
                BUCKET_NAME,
                fileName,
                req.file.buffer,
                req.file.size,
                {
                    'Content-Type': req.file.mimetype
                }
            );

            imageUrl = `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${BUCKET_NAME}/${fileName}`;
        }

        res.json({
            message: 'Imagen subida exitosamente',
            imageUrl,
            fileName,
            size: req.file.size,
            mimeType: req.file.mimetype
        });

    } catch (error) {
        console.error('Error al subir imagen:', error);
        res.status(500).json({
            error: 'Error al subir imagen'
        });
    }
});

// ==========================================
// ELIMINAR IMAGEN
// ==========================================
router.delete('/:fileName', authMiddleware, async (req, res) => {
    try {
        const { fileName } = req.params;

        if (useCloudinary) {
            // Extraer public_id de Cloudinary
            const publicId = fileName.includes('/') ? fileName : `residuos-pilcomayo/${fileName}`;
            await cloudinary.uploader.destroy(publicId);
        } else {
            // Eliminar de MinIO
            await minioClient.removeObject(BUCKET_NAME, fileName);
        }

        res.json({
            message: 'Imagen eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar imagen:', error);
        res.status(500).json({
            error: 'Error al eliminar imagen'
        });
    }
});

module.exports = router;
