'use client';

import React, { useState, useEffect, useRef } from 'react';
import { brigadeLocationAPI } from '@/lib/api';

interface LocationSharingProps {
    currentIncidentId?: string;
}

export default function LocationSharing({ currentIncidentId }: LocationSharingProps) {
    const [isSharing, setIsSharing] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [position, setPosition] = useState<GeolocationPosition | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Función para enviar ubicación al servidor
    const sendLocation = async (pos: GeolocationPosition) => {
        try {
            await brigadeLocationAPI.updateLocation({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                speed: pos.coords.speed || undefined,
                heading: pos.coords.heading || undefined,
                currentIncidentId: currentIncidentId
            });
            setLastUpdate(new Date());
            setError('');
        } catch (err: any) {
            console.error('Error al enviar ubicación:', err);
            setError('Error al enviar ubicación');
        }
    };

    // Iniciar compartir ubicación
    const startSharing = () => {
        if (!navigator.geolocation) {
            setError('Tu navegador no soporta geolocalización');
            return;
        }

        // Solicitar permiso y obtener ubicación inicial
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition(pos);
                sendLocation(pos);
                setIsSharing(true);

                // Configurar seguimiento continuo
                const watchId = navigator.geolocation.watchPosition(
                    (newPos) => {
                        setPosition(newPos);
                    },
                    (err) => {
                        console.error('Error de geolocalización:', err);
                        setError('Error al obtener ubicación');
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );

                watchIdRef.current = watchId;

                // Enviar ubicación cada 30 segundos
                const interval = setInterval(() => {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            sendLocation(pos);
                        },
                        (err) => console.error('Error al obtener ubicación:', err),
                        { enableHighAccuracy: true }
                    );
                }, 30000); // 30 segundos

                intervalRef.current = interval;
            },
            (err) => {
                console.error('Error al obtener ubicación inicial:', err);
                if (err.code === err.PERMISSION_DENIED) {
                    setError('Permiso de ubicación denegado. Por favor, habilita la ubicación en tu navegador.');
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                    setError('Ubicación no disponible. Verifica tu conexión GPS.');
                } else {
                    setError('Error al obtener ubicación');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000
            }
        );
    };

    // Detener compartir ubicación
    const stopSharing = async () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        try {
            await brigadeLocationAPI.deactivateLocation();
        } catch (err) {
            console.error('Error al desactivar ubicación:', err);
        }

        setIsSharing(false);
        setPosition(null);
        setLastUpdate(null);
    };

    // Limpiar al desmontar
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Actualizar incidente actual si cambia
    useEffect(() => {
        if (isSharing && position) {
            sendLocation(position);
        }
    }, [currentIncidentId]);

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Compartir Ubicación</h3>
                    <p className="text-sm text-gray-500">
                        Permite que el administrador vea tu ubicación en tiempo real
                    </p>
                </div>
                <button
                    onClick={isSharing ? stopSharing : startSharing}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${isSharing
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                >
                    {isSharing ? (
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            Detener
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            📍 Activar
                        </span>
                    )}
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {isSharing && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <div>
                                <p className="text-sm font-medium text-green-900">Ubicación activa</p>
                                <p className="text-xs text-green-600">
                                    {lastUpdate
                                        ? `Última actualización: ${lastUpdate.toLocaleTimeString('es-PE')}`
                                        : 'Enviando ubicación...'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {position && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">Latitud</p>
                                <p className="text-sm font-mono text-gray-900">
                                    {position.coords.latitude.toFixed(6)}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">Longitud</p>
                                <p className="text-sm font-mono text-gray-900">
                                    {position.coords.longitude.toFixed(6)}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">Precisión</p>
                                <p className="text-sm font-medium text-gray-900">
                                    ±{Math.round(position.coords.accuracy)}m
                                </p>
                            </div>
                            {position.coords.speed !== null && position.coords.speed > 0 && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Velocidad</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {Math.round(position.coords.speed * 3.6)} km/h
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-800">
                            💡 <strong>Nota:</strong> Tu ubicación se actualiza automáticamente cada 30 segundos
                            mientras esta función esté activa. Asegúrate de tener una buena señal GPS.
                        </p>
                    </div>
                </div>
            )}

            {!isSharing && (
                <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                        Al activar esta función, tu ubicación será visible para el administrador en el mapa de rastreo.
                        Esto permite una mejor coordinación y asignación de incidentes.
                    </p>
                </div>
            )}
        </div>
    );
}
