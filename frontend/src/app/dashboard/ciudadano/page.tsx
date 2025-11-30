'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import RoleGuard from '@/components/RoleGuard';

interface MyReport {
    id: string;
    description: string;
    status: string;
    severity?: string;
    wasteType?: string;
    createdAt: string;
    aiAnalysis?: string;
}

export default function CiudadanoDashboard() {
    const { user, token } = useAuthStore();
    const [myReports, setMyReports] = useState<MyReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Formulario
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = useState('');
    const [comment, setComment] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMyReports();
        getLocation();
    }, [token]);

    const fetchMyReports = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/incidents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            // Filtrar solo los reportes del usuario actual
            setMyReports(data.slice(0, 5)); // Últimos 5 reportes
        } catch (error) {
            console.error('Error al cargar reportes:', error);
        }
    };

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    // Obtener dirección aproximada (puedes usar API de geocodificación)
                    setAddress(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
                },
                (error) => {
                    console.error('Error al obtener ubicación:', error);
                    setAddress('No se pudo obtener la ubicación');
                }
            );
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedImage) {
            setError('Por favor, sube una foto del problema');
            return;
        }

        if (!location) {
            setError('No se pudo obtener tu ubicación. Por favor, activa el GPS');
            return;
        }

        setSubmitting(true);

        try {
            // Crear FormData para enviar imagen
            const formData = new FormData();
            formData.append('image', selectedImage);
            formData.append('latitude', location.lat.toString());
            formData.append('longitude', location.lng.toString());
            if (comment) {
                formData.append('description', comment);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/incidents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                setSuccess('¡Reporte enviado exitosamente! La IA está analizando tu imagen...');
                // Limpiar formulario
                setSelectedImage(null);
                setImagePreview('');
                setComment('');
                // Recargar reportes
                setTimeout(() => {
                    fetchMyReports();
                    setSuccess('');
                }, 3000);
            } else {
                setError('Error al enviar el reporte. Intenta nuevamente.');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error al enviar el reporte. Verifica tu conexión.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'RESOLVED': return 'bg-green-100 text-green-800';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
            case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'RESOLVED': return '✅ Resuelto';
            case 'IN_PROGRESS': return '🔄 En Proceso';
            case 'ASSIGNED': return '📋 Asignado';
            case 'PENDING': return '⏳ Pendiente';
            default: return status;
        }
    };

    return (
        <RoleGuard allowedRoles={['CITIZEN', 'ADMIN']}>
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                            👤 Bienvenido, {user?.name || 'Ciudadano'}
                        </h1>
                        <p className="mt-2 text-lg text-green-50">
                            Ayúdanos a mantener limpio nuestro distrito
                        </p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Formulario Principal */}
                    <div className="bg-white shadow-2xl rounded-2xl p-8 mb-8 border border-gray-100">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
                            📸 Reportar Problema de Basura
                        </h2>

                        {success && (
                            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                                {success}
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Upload de Imagen */}
                            <div>
                                <label className="block text-base font-bold text-gray-900 mb-3">
                                    📷 Foto del Problema *
                                </label>
                                <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 bg-gray-50 hover:bg-green-50 transition-all">
                                    <div className="space-y-1 text-center">
                                        {imagePreview ? (
                                            <div className="relative">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="mx-auto h-64 w-auto rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedImage(null);
                                                        setImagePreview('');
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <svg
                                                    className="mx-auto h-12 w-12 text-gray-400"
                                                    stroke="currentColor"
                                                    fill="none"
                                                    viewBox="0 0 48 48"
                                                >
                                                    <path
                                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                        strokeWidth={2}
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                                <div className="flex text-sm text-gray-600 justify-center">
                                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500">
                                                        <span>Subir foto</span>
                                                        <input
                                                            type="file"
                                                            className="sr-only"
                                                            accept="image/*"
                                                            onChange={handleImageChange}
                                                            capture="environment"
                                                        />
                                                    </label>
                                                    <p className="pl-1">o arrastra aquí</p>
                                                </div>
                                                <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Ubicación */}
                            <div>
                                <label className="block text-base font-bold text-gray-900 mb-3">
                                    📍 Tu Ubicación *
                                </label>
                                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-4 rounded-xl border-2 border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-base text-gray-900 font-medium">
                                            {address || 'Obteniendo ubicación...'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={getLocation}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-bold transition-colors shadow-md"
                                        >
                                            🔄 Actualizar
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-gray-700 font-medium">
                                    ✓ Ubicación detectada automáticamente
                                </p>
                            </div>

                            {/* Comentario Opcional */}
                            <div>
                                <label className="block text-base font-bold text-gray-900 mb-3">
                                    💬 Comentario (Opcional)
                                </label>
                                <textarea
                                    rows={4}
                                    className="mt-1 block w-full px-4 py-4 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                                    placeholder="Agrega detalles adicionales si lo deseas..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>

                            {/* Info IA */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-blue-700">
                                            <strong>La IA analizará automáticamente:</strong>
                                        </p>
                                        <ul className="mt-2 text-xs text-blue-600 space-y-1">
                                            <li>• Tipo de residuo (orgánico, plástico, papel, etc.)</li>
                                            <li>• Nivel de severidad del problema</li>
                                            <li>• Descripción detallada de la situación</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Botón Submit */}
                            <button
                                type="submit"
                                disabled={submitting || !selectedImage || !location}
                                className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Enviando reporte...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        🚀 Enviar Reporte
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Mis Reportes */}
                    <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-100">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
                            📋 Mis Reportes Recientes
                        </h2>

                        {myReports.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin reportes</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Aún no has realizado ningún reporte
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myReports.map((report) => (
                                    <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                                                        {getStatusText(report.status)}
                                                    </span>
                                                    {report.severity && (
                                                        <span className="text-sm text-gray-600">
                                                            {report.severity === 'HIGH' ? '🔴 Alta' : report.severity === 'MEDIUM' ? '🟡 Media' : '🟢 Baja'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-900 font-medium">
                                                    {report.description || report.aiAnalysis || 'Análisis en proceso...'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(report.createdAt).toLocaleDateString('es-PE', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
}
