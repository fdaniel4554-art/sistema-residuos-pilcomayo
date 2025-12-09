const mongoose = require('mongoose');

const brigadeLocationSchema = new mongoose.Schema({
    brigadeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
    },
    longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
    },
    accuracy: {
        type: Number, // Precisión en metros
        default: null
    },
    speed: {
        type: Number, // Velocidad en m/s
        default: null
    },
    heading: {
        type: Number, // Dirección en grados (0-360)
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    currentIncidentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Incident',
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Índice compuesto para consultas eficientes
brigadeLocationSchema.index({ brigadeId: 1, timestamp: -1 });

// Índice geoespacial para consultas de proximidad
brigadeLocationSchema.index({ location: '2dsphere' });

// Virtual para obtener la ubicación en formato GeoJSON
brigadeLocationSchema.virtual('location').get(function () {
    return {
        type: 'Point',
        coordinates: [this.longitude, this.latitude]
    };
});

// Método para obtener la última ubicación de una brigada
brigadeLocationSchema.statics.getLatestLocation = async function (brigadeId) {
    return await this.findOne({ brigadeId, isActive: true })
        .sort({ timestamp: -1 })
        .populate('brigadeId', 'name email')
        .populate('currentIncidentId', 'description address status');
};

// Método para obtener todas las ubicaciones activas
brigadeLocationSchema.statics.getAllActiveLocations = async function () {
    const locations = await this.aggregate([
        { $match: { isActive: true } },
        { $sort: { timestamp: -1 } },
        {
            $group: {
                _id: '$brigadeId',
                latestLocation: { $first: '$$ROOT' }
            }
        },
        { $replaceRoot: { newRoot: '$latestLocation' } }
    ]);

    return await this.populate(locations, [
        { path: 'brigadeId', select: 'name email role' },
        { path: 'currentIncidentId', select: 'description address status latitude longitude' }
    ]);
};

// Limpiar ubicaciones antiguas (más de 24 horas)
brigadeLocationSchema.statics.cleanOldLocations = async function () {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await this.deleteMany({ timestamp: { $lt: oneDayAgo } });
};

module.exports = mongoose.model('BrigadeLocation', brigadeLocationSchema);
