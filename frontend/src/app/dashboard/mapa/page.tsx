'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import RoleGuard from '@/components/RoleGuard';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';

const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando mapa...</p>
            </div>
        </div>
    )
});

export default function MapaPage() {
    const { token, user } = useAuthStore();
    const [incidents, setIncidents] = useState([]);
    const [route, setRoute] = useState<any[] | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [optimizing, setOptimizing] = useState(false);
    const [routeSummary, setRouteSummary] = useState<any>(null);

    useEffect(() => {
        if (token) {
            fetchIncidents();
        }
    }, [token]);

    const fetchIncidents = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/incidents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter only pending/assigned/in-progress for map clarity if needed, 
            // but for full map maybe we want all? Let's show active ones.
            const activeIncidents = response.data.filter((i: any) =>
                ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(i.status)
            );
            setIncidents(activeIncidents);
        } catch (error) {
            console.error('Error fetching incidents:', error);
        }
    };

    const handleOptimizeRoute = async () => {
        if (!navigator.geolocation) {
            alert('Se requiere ubicación para optimizar la ruta');
            return;
        }

        setOptimizing(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/routes/optimize`,
                    {
                        params: { latitude, longitude },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                setRoute(response.data.route);
                setRouteSummary(response.data.summary);
            } catch (error) {
                console.error('Error optimizing route:', error);
                alert('Error al optimizar la ruta');
            } finally {
                setOptimizing(false);
            }
        }, (error) => {
            console.error('Geolocation error:', error);
            setOptimizing(false);
            alert('No se pudo obtener tu ubicación');
        });
    };

    return (
        <RoleGuard allowedRoles={['ADMIN', 'BRIGADE', 'DRIVER']}>
            <div className="relative h-[calc(100vh-64px)] w-full bg-gray-100">
                <Map incidents={incidents} route={route} />

                {/* Controls Overlay */}
                <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Mapa de Operaciones</h2>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Incidencias activas:</span>
                            <span className="font-bold">{incidents.length}</span>
                        </div>

                        {(user?.role === 'BRIGADE' || user?.role === 'DRIVER' || user?.role === 'ADMIN') && (
                            <button
                                onClick={handleOptimizeRoute}
                                disabled={optimizing || incidents.length === 0}
                                className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 ${optimizing || incidents.length === 0
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {optimizing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Optimizando...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Optimizar Ruta
                                    </>
                                )}
                            </button>
                        )}

                        {routeSummary && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Resumen de Ruta</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-gray-50 p-2 rounded">
                                        <span className="block text-xs text-gray-500">Distancia</span>
                                        <span className="font-bold text-gray-800">{routeSummary.totalDistance} km</span>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded">
                                        <span className="block text-xs text-gray-500">Tiempo Est.</span>
                                        <span className="font-bold text-gray-800">{routeSummary.totalTime} min</span>
                                    </div>
                                </div>
                                {routeSummary.trafficEvents?.length > 0 && (
                                    <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100">
                                        ⚠️ Se detectaron {routeSummary.trafficEvents.length} eventos de tráfico en la zona.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
}
