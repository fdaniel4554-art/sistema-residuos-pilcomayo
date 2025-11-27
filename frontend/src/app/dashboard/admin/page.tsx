'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import RoleGuard from '@/components/RoleGuard';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
}

interface Incident {
    id: string;
    description: string;
    status: string;
    severity?: string;
    wasteType?: string;
    createdAt: string;
    reportedBy: { name: string };
}

interface Stats {
    totalIncidents: number;
    pendingIncidents: number;
    resolvedIncidents: number;
    totalUsers: number;
    activeBrigades: number;
}

export default function AdminDashboard() {
    const { token } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'incidents' | 'events'>('overview');
    const [users, setUsers] = useState<User[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalIncidents: 0,
        pendingIncidents: 0,
        resolvedIncidents: 0,
        totalUsers: 0,
        activeBrigades: 0
    });
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState<string>('all');

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                const [usersRes, incidentsRes, statsRes] = await Promise.all([
                    fetch(`${apiUrl}/users`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${apiUrl}/incidents`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${apiUrl}/stats`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const usersData = await usersRes.json();
                const incidentsData = await incidentsRes.json();
                const statsData = await statsRes.json();

                // Ensure users is an array
                setUsers(Array.isArray(usersData) ? usersData : []);
                setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
                setStats(statsData || {
                    totalIncidents: 0,
                    pendingIncidents: 0,
                    resolvedIncidents: 0,
                    totalUsers: 0,
                    activeBrigades: 0
                });
            } catch (error) {
                console.error('Error loading data:', error);
                setUsers([]);
                setIncidents([]);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            loadData();
        }
    }, [token]);

    // Filter users based on selected role
    const filteredUsers = filterRole === 'all'
        ? users
        : users.filter((u: User) => u.role === filterRole);

    // Toggle user active status
    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${apiUrl}/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ active: !currentStatus })
            });

            if (response.ok) {
                // Update local state
                setUsers(users.map((u: User) =>
                    u.id === userId ? { ...u, active: !currentStatus } : u
                ));
            }
        } catch (error) {
            console.error('Error toggling user status:', error)
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['ADMIN']}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                {/* Header */}
                <div className="bg-white shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            🎯 Panel de Administración
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Gestión completa del sistema
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                        <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-3">
                                    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Incidentes</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalIncidents}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-3">
                                    <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Pendientes</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.pendingIncidents}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-3">
                                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Resueltos</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.resolvedIncidents}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-3">
                                    <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Usuarios</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl p-3">
                                    <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Brigadas Activas</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.activeBrigades}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    📊 Resumen
                                </button>
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    👥 Usuarios
                                </button>
                                <button
                                    onClick={() => setActiveTab('incidents')}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'incidents'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    📋 Incidentes
                                </button>
                                <button
                                    onClick={() => setActiveTab('events')}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'events'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    ⚠️ Eventos Externos
                                </button>
                            </nav>
                        </div>

                        <div className="p-6">
                            {/* Tab: Overview */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Resumen del Sistema</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Incidentes por Estado</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Pendientes</span>
                                                    <span className="text-lg font-bold text-yellow-600">{stats.pendingIncidents}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Resueltos</span>
                                                    <span className="text-lg font-bold text-green-600">{stats.resolvedIncidents}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Tasa de Resolución</span>
                                                    <span className="text-lg font-bold text-blue-600">
                                                        {stats.totalIncidents > 0 ? ((stats.resolvedIncidents / stats.totalIncidents) * 100).toFixed(1) : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usuarios por Rol</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Brigadas</span>
                                                    <span className="text-lg font-bold text-indigo-600">
                                                        {users.filter(u => u.role === 'BRIGADE').length}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Ciudadanos</span>
                                                    <span className="text-lg font-bold text-purple-600">
                                                        {users.filter(u => u.role === 'CITIZEN').length}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Administradores</span>
                                                    <span className="text-lg font-bold text-pink-600">
                                                        {users.filter(u => u.role === 'ADMIN').length}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab: Users */}
                            {activeTab === 'users' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
                                        <select
                                            value={filterRole}
                                            onChange={(e) => setFilterRole(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">Todos los roles</option>
                                            <option value="ADMIN">Administradores</option>
                                            <option value="BRIGADE">Brigadas</option>
                                            <option value="DRIVER">Conductores</option>
                                            <option value="CITIZEN">Ciudadanos</option>
                                        </select>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredUsers.map((user) => (
                                                    <tr key={user.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                                                user.role === 'BRIGADE' ? 'bg-blue-100 text-blue-800' :
                                                                    user.role === 'DRIVER' ? 'bg-indigo-100 text-indigo-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {user.active ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <button
                                                                onClick={() => toggleUserStatus(user.id, user.active)}
                                                                className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${user.active
                                                                    ? 'bg-red-600 hover:bg-red-700'
                                                                    : 'bg-green-600 hover:bg-green-700'
                                                                    }`}
                                                            >
                                                                {user.active ? 'Desactivar' : 'Activar'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Tab: Incidents */}
                            {activeTab === 'incidents' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Incidentes</h2>
                                    <div className="space-y-4">
                                        {incidents.slice(0, 10).map((incident) => (
                                            <div key={incident.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-900">{incident.description}</h3>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Reportado por: {incident.reportedBy?.name || 'Desconocido'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(incident.createdAt).toLocaleDateString('es-PE')}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${incident.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                                                            incident.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {incident.status}
                                                        </span>
                                                        {incident.severity && (
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${incident.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                                                                incident.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-green-100 text-green-800'
                                                                }`}>
                                                                {incident.severity}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tab: Events */}
                            {activeTab === 'events' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-gray-900">Eventos Externos</h2>
                                        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
                                            + Registrar Evento
                                        </button>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                        <p className="text-blue-800">
                                            Aquí podrás registrar eventos externos como paros, construcciones, accidentes o cierres de vías que afecten las rutas de las brigadas.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
}
