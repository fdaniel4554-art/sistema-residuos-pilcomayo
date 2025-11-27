'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import RoleGuard from '@/components/RoleGuard';
import VoiceAssistant from '@/components/VoiceAssistant';
import { useSpeech } from '@/hooks/useSpeech';
import Link from 'next/link';
import { routesAPI } from '@/lib/api';

interface Incident {
    id: string;
    description: string;
    latitude: number;
    longitude: number;
    wasteType?: string;
    severity?: string;
    status: string;
    createdAt: string;
    address?: string;
}

export default function BrigadaDashboard() {
    const { user, token } = useAuthStore();
    const { speak } = useSpeech();
    const [tasks, setTasks] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS'>('all');
    const [optimizedRoute, setOptimizedRoute] = useState<any[]>([]);
    const [routeSummary, setRouteSummary] = useState<any>(null);
    const [optimizing, setOptimizing] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, [token]);

    // 🎤 Saludo al cargar
    useEffect(() => {
        if (!loading && tasks.length > 0) {
            const pending = tasks.filter(t => t.status === 'PENDING' || t.status === 'ASSIGNED').length;
            speak(`Bienvenido ${user?.name || 'brigadista'}. Tienes ${pending} tareas pendientes`);
        }
    }, [loading]);

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/incidents`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            // El backend ya filtra por brigada asignada
            setTasks(data.incidents || data);
        } catch (error) {
            console.error('Error al cargar tareas:', error);
            speak('Error al cargar las tareas');
        } finally {
            setLoading(false);
        }
    };

    const updateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${taskId}/status`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: newStatus })
                }
            );

            if (response.ok) {
                fetchTasks();

                // 🎤 Confirmación por voz
                if (newStatus === 'IN_PROGRESS') {
                    speak('Tarea iniciada');
                } else if (newStatus === 'RESOLVED') {
                    speak('Tarea completada exitosamente');

                    // Anunciar siguiente tarea
                    const nextTask = tasks.find(t =>
                        t.id !== taskId && (t.status === 'PENDING' || t.status === 'ASSIGNED')
                    );
                    if (nextTask) {
                        setTimeout(() => {
                            speak(`Siguiente parada: ${nextTask.address || nextTask.description}`);
                        }, 2000);
                    }
                }
            }
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            speak('Error al actualizar el estado de la tarea');
        }
    };

    const handleOptimizeRoute = async () => {
        try {
            setOptimizing(true);

            const pendingTasks = tasks.filter(
                t => t.status === 'PENDING' || t.status === 'ASSIGNED'
            );

            if (pendingTasks.length === 0) {
                speak('No hay tareas pendientes para optimizar');
                return;
            }

            const response = await routesAPI.optimize(pendingTasks);

            if (response.success) {
                setOptimizedRoute(response.data.optimizedRoute);
                setRouteSummary(response.data.summary);

                // 🎤 Confirmación de optimización
                speak(`Ruta optimizada exitosamente. Distancia total: ${response.data.summary.totalDistance.toFixed(2)} kilómetros. ${response.data.optimizedRoute.length} paradas. Primera parada: ${response.data.optimizedRoute[0]?.address || response.data.optimizedRoute[0]?.description}`);
            }
        } catch (error) {
            console.error('Error al optimizar ruta:', error);
            speak('Error al optimizar la ruta');
        } finally {
            setOptimizing(false);
        }
    };

    const filteredTasks = filter === 'all'
        ? tasks
        : tasks.filter(task => task.status === filter);

    const stats = {
        completed: tasks.filter(t => t.status === 'RESOLVED').length,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        pending: tasks.filter(t => t.status === 'PENDING' || t.status === 'ASSIGNED').length
    };

    const getSeverityColor = (severity?: string) => {
        switch (severity) {
            case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getSeverityIcon = (severity?: string) => {
        switch (severity) {
            case 'HIGH': return '🔴';
            case 'MEDIUM': return '🟡';
            case 'LOW': return '🟢';
            default: return '⚪';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando tareas...</p>
                </div>
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['BRIGADE', 'DRIVER', 'ADMIN']}>
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
                {/* 🎤 Asistente de Voz */}
                <VoiceAssistant />

                {/* Header */}
                <div className="bg-white shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                    🚛 Panel de Brigada
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    Bienvenido, {user?.name || 'Brigadista'}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleOptimizeRoute}
                                    disabled={optimizing || stats.pending === 0}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg ${optimizing || stats.pending === 0
                                        ? 'bg-gray-400 cursor-not-allowed text-white'
                                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transform hover:scale-105'
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
                                <Link
                                    href="/dashboard/mapa"
                                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg transform hover:scale-105"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    Ver Mapa
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Route Summary */}
                    {routeSummary && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-6 mb-6 shadow-xl">
                            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                📍 Ruta Optimizada
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white rounded-xl p-4 shadow-md">
                                    <p className="text-sm text-blue-700 font-medium">Distancia Total</p>
                                    <p className="text-3xl font-bold text-blue-900">{routeSummary.totalDistance.toFixed(2)} km</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-md">
                                    <p className="text-sm text-blue-700 font-medium">Tiempo Estimado</p>
                                    <p className="text-3xl font-bold text-blue-900">{routeSummary.totalTime.toFixed(0)} min</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-md">
                                    <p className="text-sm text-blue-700 font-medium">Paradas</p>
                                    <p className="text-3xl font-bold text-blue-900">{optimizedRoute.length}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-3">
                                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Completadas
                                        </dt>
                                        <dd className="text-4xl font-bold text-gray-900">
                                            {stats.completed}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-3">
                                    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            En Proceso
                                        </dt>
                                        <dd className="text-4xl font-bold text-gray-900">
                                            {stats.inProgress}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-3">
                                    <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Pendientes
                                        </dt>
                                        <dd className="text-4xl font-bold text-gray-900">
                                            {stats.pending}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="bg-white rounded-2xl shadow-xl p-4 mb-6">
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-sm font-medium text-gray-700">Filtrar:</span>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all'
                                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg transform scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Todas ({tasks.length})
                                </button>
                                <button
                                    onClick={() => setFilter('PENDING')}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'PENDING'
                                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg transform scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Pendientes ({stats.pending})
                                </button>
                                <button
                                    onClick={() => setFilter('IN_PROGRESS')}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'IN_PROGRESS'
                                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg transform scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    En Proceso ({stats.inProgress})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Tareas */}
                    <div className="space-y-4">
                        {filteredTasks.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="mt-4 text-gray-500 text-lg">No hay tareas {filter !== 'all' ? filter.toLowerCase() : ''}</p>
                            </div>
                        ) : (
                            filteredTasks.map((task, index) => (
                                <div key={task.id} className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-102 transition-all hover:shadow-2xl">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                {optimizedRoute.length > 0 && (
                                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm">
                                                        {index + 1}
                                                    </span>
                                                )}
                                                <span className="text-3xl">{getSeverityIcon(task.severity)}</span>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {task.description}
                                                </h3>
                                            </div>
                                            <div className="space-y-2 text-sm text-gray-600 ml-11">
                                                <p className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {task.address || `${task.latitude}, ${task.longitude}`}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Tipo: {task.wasteType || 'No especificado'}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {new Date(task.createdAt).toLocaleDateString('es-PE')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-md ${getSeverityColor(task.severity)}`}>
                                                {task.severity || 'NORMAL'}
                                            </span>
                                            {task.status === 'PENDING' && (
                                                <button
                                                    onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg transform hover:scale-105 transition-all"
                                                >
                                                    ▶️ Iniciar
                                                </button>
                                            )}
                                            {task.status === 'IN_PROGRESS' && (
                                                <button
                                                    onClick={() => updateTaskStatus(task.id, 'RESOLVED')}
                                                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm hover:from-green-700 hover:to-green-800 font-medium shadow-lg transform hover:scale-105 transition-all"
                                                >
                                                    ✅ Completar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
}
