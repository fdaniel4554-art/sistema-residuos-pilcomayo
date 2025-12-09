'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { brigadeLocationAPI } from '@/lib/api';

interface BrigadeLocation {
    id: string;
    brigade: {
        id: string;
        name: string;
        email: string;
    };
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    currentIncident?: {
        id: string;
        description: string;
        address: string;
        status: string;
        latitude: number;
        longitude: number;
    };
    timestamp: string;
    lastUpdate: string;
}

const mapContainerStyle = {
    width: '100%',
    height: '600px'
};

const defaultCenter = {
    lat: -12.0464, // Lima, Perú (ajustar según tu ubicación)
    lng: -77.0428
};

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: true,
};

export default function BrigadeTrackingMap() {
    const [locations, setLocations] = useState<BrigadeLocation[]>([]);
    const [selectedBrigade, setSelectedBrigade] = useState<BrigadeLocation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Cargar ubicaciones
    const fetchLocations = useCallback(async () => {
        try {
            const response = await brigadeLocationAPI.getAllLocations();
            setLocations(response.data.locations || []);
            setLastRefresh(new Date());
            setError('');
        } catch (err: any) {
            console.error('Error al cargar ubicaciones:', err);
            setError('Error al cargar ubicaciones de brigadas');
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar al montar y configurar auto-refresh
    useEffect(() => {
        fetchLocations();

        if (autoRefresh) {
            const interval = setInterval(fetchLocations, 30000); // Cada 30 segundos
            return () => clearInterval(interval);
        }
    }, [fetchLocations, autoRefresh]);

    // Obtener color del marcador según estado
    const getBrigadeMarkerColor = (location: BrigadeLocation) => {
        if (location.currentIncident) {
            if (location.currentIncident.status === 'IN_PROGRESS') {
                return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'; // En ruta
            }
            return 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'; // Asignado
        }
        return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'; // Disponible
    };

    // Calcular centro del mapa basado en ubicaciones
    const getMapCenter = () => {
        if (locations.length === 0) return defaultCenter;

        const avgLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
        const avgLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;

        return { lat: avgLat, lng: avgLng };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando mapa...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Controles */}
            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">En Ruta</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Asignado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Incidente</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                        Última actualización: {lastRefresh.toLocaleTimeString('es-PE')}
                    </span>
                    <button
                        onClick={fetchLocations}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        🔄 Actualizar
                    </button>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">Auto-actualizar</span>
                    </label>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500">Total Brigadas</p>
                    <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500">Disponibles</p>
                    <p className="text-2xl font-bold text-green-600">
                        {locations.filter(l => !l.currentIncident).length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500">En Ruta</p>
                    <p className="text-2xl font-bold text-yellow-600">
                        {locations.filter(l => l.currentIncident?.status === 'IN_PROGRESS').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500">Asignadas</p>
                    <p className="text-2xl font-bold text-orange-600">
                        {locations.filter(l => l.currentIncident && l.currentIncident.status !== 'IN_PROGRESS').length}
                    </p>
                </div>
            </div>

            {/* Mapa */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={getMapCenter()}
                        zoom={13}
                        options={mapOptions}
                    >
                        {/* Marcadores de brigadas */}
                        {locations.map((location) => (
                            <React.Fragment key={location.id}>
                                <Marker
                                    position={{ lat: location.latitude, lng: location.longitude }}
                                    icon={getBrigadeMarkerColor(location)}
                                    title={location.brigade.name}
                                    onClick={() => setSelectedBrigade(location)}
                                />

                                {/* Marcador de incidente si existe */}
                                {location.currentIncident && (
                                    <>
                                        <Marker
                                            position={{
                                                lat: location.currentIncident.latitude,
                                                lng: location.currentIncident.longitude
                                            }}
                                            icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                            title={location.currentIncident.description}
                                        />

                                        {/* Línea de ruta */}
                                        <Polyline
                                            path={[
                                                { lat: location.latitude, lng: location.longitude },
                                                { lat: location.currentIncident.latitude, lng: location.currentIncident.longitude }
                                            ]}
                                            options={{
                                                strokeColor: '#3B82F6',
                                                strokeOpacity: 0.8,
                                                strokeWeight: 3,
                                                geodesic: true
                                            }}
                                        />
                                    </>
                                )}
                            </React.Fragment>
                        ))}

                        {/* Info Window */}
                        {selectedBrigade && (
                            <InfoWindow
                                position={{ lat: selectedBrigade.latitude, lng: selectedBrigade.longitude }}
                                onCloseClick={() => setSelectedBrigade(null)}
                            >
                                <div className="p-2 max-w-xs">
                                    <h3 className="font-bold text-lg mb-2">🚛 {selectedBrigade.brigade.name}</h3>
                                    <div className="space-y-1 text-sm">
                                        <p><strong>Estado:</strong> {selectedBrigade.currentIncident ? 'En servicio' : 'Disponible'}</p>
                                        <p><strong>Última actualización:</strong> {selectedBrigade.lastUpdate}</p>
                                        {selectedBrigade.speed && (
                                            <p><strong>Velocidad:</strong> {Math.round(selectedBrigade.speed * 3.6)} km/h</p>
                                        )}
                                        {selectedBrigade.currentIncident && (
                                            <div className="mt-2 pt-2 border-t">
                                                <p className="font-semibold">Incidente Asignado:</p>
                                                <p className="text-gray-600">{selectedBrigade.currentIncident.description}</p>
                                                <p className="text-gray-500 text-xs">{selectedBrigade.currentIncident.address}</p>
                                                <p className="text-xs mt-1">
                                                    <span className={`px-2 py-1 rounded-full ${selectedBrigade.currentIncident.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                                            selectedBrigade.currentIncident.status === 'ASSIGNED' ? 'bg-orange-100 text-orange-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {selectedBrigade.currentIncident.status}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                </LoadScript>
            </div>

            {/* Lista de brigadas */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Brigadas Activas</h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {locations.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-500">
                            No hay brigadas compartiendo su ubicación actualmente
                        </div>
                    ) : (
                        locations.map((location) => (
                            <div
                                key={location.id}
                                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => setSelectedBrigade(location)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${location.currentIncident
                                                ? location.currentIncident.status === 'IN_PROGRESS'
                                                    ? 'bg-yellow-500'
                                                    : 'bg-orange-500'
                                                : 'bg-green-500'
                                            }`}></div>
                                        <div>
                                            <p className="font-medium text-gray-900">{location.brigade.name}</p>
                                            <p className="text-sm text-gray-500">{location.lastUpdate}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {location.currentIncident ? (
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {location.currentIncident.description}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {location.currentIncident.status}
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-green-600 font-medium">Disponible</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
