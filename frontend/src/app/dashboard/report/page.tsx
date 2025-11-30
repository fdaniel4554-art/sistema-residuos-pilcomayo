'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import { incidentsAPI, uploadAPI } from '@/lib/api';

export default function ReportPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        description: '',
        latitude: -12.0464,
        longitude: -75.2137,
        address: '',
        image: null as File | null,
    });

    // Obtener ubicación actual
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    }));
                },
                (error) => {
                    console.error('Error obteniendo ubicación:', error);
                }
            );
        }
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, image: file });

            // Preview
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
        setLoading(true);

        try {
            let imageUrl = '';

            // Subir imagen si existe
            if (formData.image) {
                const uploadRes = await uploadAPI.uploadImage(formData.image);
                imageUrl = uploadRes.data.imageUrl;
            }

            // Crear incidencia
            await incidentsAPI.create({
                description: formData.description,
                latitude: formData.latitude,
                longitude: formData.longitude,
                address: formData.address,
                imageUrl,
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al crear reporte');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center transform animate-scale-in">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 mb-6 animate-bounce-slow">
                        <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                        ¡Reporte Enviado!
                    </h2>
                    <p className="text-gray-700 text-lg mb-2">
                        Gracias por ayudar a mantener limpio Pilcomayo
                    </p>
                    <p className="text-gray-600">
                        Tu reporte será procesado por nuestro sistema
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-2 text-green-600">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-medium">Redirigiendo...</span>
                    </div>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                        Reportar Incidencia
                    </h1>
                    <p className="text-gray-700 text-lg">
                        Ayúdanos a mantener limpio Pilcomayo
                    </p>
                </div >

            {/* Form Card */ }
            < div className = "bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100" >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-shake">
                            <div className="flex items-center">
                                <svg className="h-6 w-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-red-800 font-medium">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Descripción */}
                    <div>
                        <label htmlFor="description" className="block text-base font-bold text-gray-900 mb-3">
                            📝 Descripción del problema *
                        </label>
                        <textarea
                            id="description"
                            required
                            rows={5}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-4 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base"
                            placeholder="Describe detalladamente la acumulación de residuos que encontraste..."
                        />
                    </div>

                    {/* Imagen */}
                    <div>
                        <label className="block text-base font-bold text-gray-900 mb-3">
                            📷 Fotografía (opcional)
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 bg-gray-50 hover:bg-green-50 transition-all">
                            <div className="space-y-2 text-center w-full">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="mx-auto h-64 w-auto rounded-xl shadow-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImagePreview(null);
                                                setFormData({ ...formData, image: null });
                                            }}
                                            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                                        >
                                            🗑️ Eliminar imagen
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <svg
                                            className="mx-auto h-16 w-16 text-gray-400"
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
                                        <div className="flex flex-col items-center text-base text-gray-700">
                                            <label
                                                htmlFor="image"
                                                className="relative cursor-pointer bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
                                            >
                                                <span>📁 Seleccionar foto</span>
                                                <input
                                                    id="image"
                                                    name="image"
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="sr-only"
                                                    onChange={handleImageChange}
                                                />
                                            </label>
                                            <p className="mt-3 text-gray-600">o arrastra y suelta aquí</p>
                                        </div>
                                        <p className="text-sm text-gray-600 font-medium">PNG, JPG hasta 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                        <div className="flex items-center mb-4">
                            <svg className="h-6 w-6 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <h3 className="text-lg font-bold text-gray-900">Ubicación</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="latitude" className="block text-sm font-bold text-gray-900 mb-2">
                                    Latitud
                                </label>
                                <input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    required
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-blue-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-medium"
                                />
                            </div>
                            <div>
                                <label htmlFor="longitude" className="block text-sm font-bold text-gray-900 mb-2">
                                    Longitud
                                </label>
                                <input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    required
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-blue-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-medium"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-100 rounded-lg p-3">
                            <p className="text-sm text-blue-900 font-medium">
                                ℹ️ La ubicación se detectó automáticamente usando tu GPS
                            </p>
                        </div>
                    </div>

                    {/* Dirección */}
                    <div>
                        <label htmlFor="address" className="block text-base font-bold text-gray-900 mb-3">
                            📍 Dirección o referencia (opcional)
                        </label>
                        <input
                            id="address"
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-4 py-4 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                            placeholder="Ej: Av. Mariscal Castilla esquina con Jr. Ayacucho"
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl text-gray-900 text-base font-bold hover:bg-gray-50 transition-all shadow-md"
                        >
                            ← Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-base font-bold hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg transform hover:scale-105 active:scale-95"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Enviando...
                                </span>
                            ) : (
                                '📤 Enviar Reporte'
                            )}
                        </button>
                    </div>
                </form>
                </div >
            </div >

            <style jsx>{`
                @keyframes scale-in {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-scale-in {
                    animation: scale-in 0.3s ease-out;
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div >
    );
    }
