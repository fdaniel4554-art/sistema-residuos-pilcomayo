'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Incident {
    id: string;
    description: string;
    latitude: number;
    longitude: number;
    wasteType?: string;
    severity?: string;
    status?: string;
    createdAt: string;
}

interface MapProps {
    incidents: Incident[];
    route?: Incident[];
}

export default function EnhancedMap({ incidents, route }: MapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !mapContainerRef.current) return;

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.log('Location access denied, using default location');
                }
            );
        }

        // Initialize map
        const defaultCenter: [number, number] = [-12.0464, -75.2139]; // Pilcomayo
        const map = L.map(mapContainerRef.current).setView(defaultCenter, 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Draw route if available
    useEffect(() => {
        if (!mapRef.current || !route || route.length === 0) return;

        // Clear existing route layers
        mapRef.current.eachLayer((layer: any) => {
            if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) { // Avoid removing polygons if any
                mapRef.current?.removeLayer(layer);
            }
        });

        const latlngs: L.LatLngExpression[] = [];

        // Add user location as start point if available
        if (userLocation) {
            latlngs.push(userLocation);
        }

        route.forEach(point => {
            latlngs.push([point.latitude, point.longitude]);
        });

        if (latlngs.length > 1) {
            const polyline = L.polyline(latlngs, {
                color: '#3b82f6',
                weight: 4,
                opacity: 0.7,
                dashArray: '10, 10',
                lineCap: 'round'
            }).addTo(mapRef.current);

            mapRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        }
    }, [route, userLocation]);

    useEffect(() => {
        if (!mapRef.current || typeof window === 'undefined') return;

        // Clear existing markers
        mapRef.current.eachLayer((layer: any) => {
            if (layer instanceof L.Marker) {
                mapRef.current?.removeLayer(layer);
            }
        });

        // Add user location marker
        if (userLocation) {
            const userIcon = L.divIcon({
                className: 'custom-user-marker',
                html: `<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            });

            L.marker(userLocation, { icon: userIcon })
                .addTo(mapRef.current)
                .bindPopup('<b>Tu ubicación</b>');
        }

        // Add incident markers
        incidents.forEach((incident) => {
            const color =
                incident.severity === 'HIGH' ? '#ef4444' :
                    incident.severity === 'MEDIUM' ? '#f59e0b' :
                        '#22c55e';

            // Check if this incident is part of the route to add order number
            const routeIndex = route ? route.findIndex(r => r.id === incident.id) : -1;
            const orderBadge = routeIndex !== -1
                ? `<div style="position: absolute; top: -5px; right: -5px; background: #2563eb; color: white; width: 18px; height: 18px; border-radius: 50%; font-size: 10px; display: flex; align-items: center; justify-content: center; border: 2px solid white;">${routeIndex + 1}</div>`
                : '';

            const icon = L.divIcon({
                className: 'custom-marker',
                html: `
          <div style="position: relative;">
            <div style="
                background: ${color};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
            </div>
            ${orderBadge}
          </div>
        `,
                iconSize: [30, 30],
                iconAnchor: [15, 15],
            });

            const marker = L.marker([incident.latitude, incident.longitude], { icon })
                .addTo(mapRef.current!)
                .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px;">${incident.description}</h3>
            <p style="margin: 4px 0;"><strong>Tipo:</strong> ${incident.wasteType || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Severidad:</strong> 
              <span style="
                background: ${color};
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
              ">${incident.severity || 'N/A'}</span>
            </p>
            <p style="margin: 4px 0;"><strong>Estado:</strong> ${incident.status || 'N/A'}</p>
            ${routeIndex !== -1 ? `<p style="margin: 4px 0; color: #2563eb; font-weight: bold;">Parada #${routeIndex + 1} en la ruta</p>` : ''}
          </div>
        `);

            marker.on('click', () => {
                setSelectedIncident(incident);
                setShowSidebar(true);
            });
        });

        // Fit bounds to show all markers if no route is active
        if (incidents.length > 0 && (!route || route.length === 0)) {
            const bounds = L.latLngBounds(
                incidents.map((i) => [i.latitude, i.longitude])
            );
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [incidents, userLocation, route]);

    const goToMyLocation = () => {
        if (userLocation && mapRef.current) {
            mapRef.current.setView(userLocation, 16);
        } else {
            alert('Ubicación no disponible. Por favor, permite el acceso a tu ubicación.');
        }
    };

    const getSeverityColor = (severity?: string) => {
        switch (severity) {
            case 'HIGH': return 'bg-red-100 text-red-800';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
            case 'LOW': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="relative w-full h-full">
            {/* Map Container */}
            <div ref={mapContainerRef} className="w-full h-full rounded-lg" />

            {/* Custom Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <button
                    onClick={goToMyLocation}
                    className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-lg shadow-lg transition-all hover:scale-105"
                    title="Mi ubicación"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
                <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-lg shadow-lg transition-all hover:scale-105"
                    title={showSidebar ? 'Ocultar panel' : 'Mostrar panel'}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Sidebar */}
            {showSidebar && selectedIncident && (
                <div className="absolute top-0 left-0 z-[1000] w-80 h-full bg-white shadow-2xl overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Detalles de Incidencia</h3>
                            <button
                                onClick={() => setSelectedIncident(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Descripción</label>
                                <p className="mt-1 text-gray-900">{selectedIncident.description}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Tipo de Residuo</label>
                                <p className="mt-1 text-gray-900">{selectedIncident.wasteType || 'N/A'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Severidad</label>
                                <div className="mt-1">
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getSeverityColor(selectedIncident.severity)}`}>
                                        {selectedIncident.severity || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Estado</label>
                                <p className="mt-1 text-gray-900">{selectedIncident.status || 'N/A'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Fecha de Reporte</label>
                                <p className="mt-1 text-gray-900">
                                    {new Date(selectedIncident.createdAt).toLocaleDateString('es-PE', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Ubicación</label>
                                <p className="mt-1 text-sm text-gray-600">
                                    Lat: {selectedIncident.latitude.toFixed(6)}<br />
                                    Lng: {selectedIncident.longitude.toFixed(6)}
                                </p>
                            </div>

                            {userLocation && (
                                <button
                                    onClick={() => {
                                        const url = `https://www.google.com/maps/dir/${userLocation[0]},${userLocation[1]}/${selectedIncident.latitude},${selectedIncident.longitude}`;
                                        window.open(url, '_blank');
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    Cómo llegar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Leyenda</h4>
                <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span>Severidad Alta</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                        <span>Severidad Media</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span>Severidad Baja</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                        <span>Tu ubicación</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
