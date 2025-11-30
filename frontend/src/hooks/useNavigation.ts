import { useState, useEffect, useCallback } from 'react';

interface Task {
    id: number;
    latitude: number;
    longitude: number;
    address: string;
    description: string;
    status: string;
}

interface NavigationState {
    currentTaskIndex: number;
    tasks: Task[];
    userLocation: { lat: number; lng: number } | null;
    isNavigating: boolean;
}

export function useNavigation() {
    const [state, setState] = useState<NavigationState>({
        currentTaskIndex: 0,
        tasks: [],
        userLocation: null,
        isNavigating: false,
    });

    // Calcular distancia entre dos puntos (fórmula de Haversine)
    const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    // Obtener ubicación actual del usuario
    const updateUserLocation = useCallback(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setState(prev => ({
                        ...prev,
                        userLocation: {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        },
                    }));
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    }, []);

    // Iniciar navegación
    const startNavigation = useCallback((tasks: Task[]) => {
        setState(prev => ({
            ...prev,
            tasks,
            currentTaskIndex: 0,
            isNavigating: true,
        }));
        updateUserLocation();
    }, [updateUserLocation]);

    // Ir a la siguiente parada
    const nextStop = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentTaskIndex: Math.min(prev.currentTaskIndex + 1, prev.tasks.length - 1),
        }));
    }, []);

    // Ir a la parada anterior
    const previousStop = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentTaskIndex: Math.max(prev.currentTaskIndex - 1, 0),
        }));
    }, []);

    // Detener navegación
    const stopNavigation = useCallback(() => {
        setState(prev => ({
            ...prev,
            isNavigating: false,
        }));
    }, []);

    // Obtener tarea actual
    const getCurrentTask = useCallback((): Task | null => {
        if (state.tasks.length === 0) return null;
        return state.tasks[state.currentTaskIndex] || null;
    }, [state.tasks, state.currentTaskIndex]);

    // Obtener distancia a la siguiente parada
    const getDistanceToCurrentTask = useCallback((): number | null => {
        const currentTask = getCurrentTask();
        if (!currentTask || !state.userLocation) return null;

        return calculateDistance(
            state.userLocation.lat,
            state.userLocation.lng,
            currentTask.latitude,
            currentTask.longitude
        );
    }, [getCurrentTask, state.userLocation, calculateDistance]);

    // Verificar si está cerca de la parada actual (menos de 100m)
    const isNearCurrentTask = useCallback((): boolean => {
        const distance = getDistanceToCurrentTask();
        return distance !== null && distance < 0.1; // 100 metros
    }, [getDistanceToCurrentTask]);

    // Actualizar ubicación cada 10 segundos cuando está navegando
    useEffect(() => {
        if (!state.isNavigating) return;

        const interval = setInterval(() => {
            updateUserLocation();
        }, 10000);

        return () => clearInterval(interval);
    }, [state.isNavigating, updateUserLocation]);

    return {
        ...state,
        startNavigation,
        stopNavigation,
        nextStop,
        previousStop,
        getCurrentTask,
        getDistanceToCurrentTask,
        isNearCurrentTask,
        updateUserLocation,
    };
}
