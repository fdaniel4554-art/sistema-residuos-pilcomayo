'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import RoleGuard from '@/components/RoleGuard';
import { CreateUserModal, ChangePasswordModal } from '@/components/AdminModals';
import AnimatedBackground from '@/components/AnimatedBackground';
import BrigadeTrackingMap from '@/components/BrigadeTrackingMap';
import { usersAPI, incidentsAPI, statsAPI } from '@/lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    createdAt?: string;
}

interface Incident {
    id: string;
    description: string;
    status: string;
    severity?: string;
    wasteType?: string;
    createdAt: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
    reportedBy?: { name: string; email: string };
    assignments?: any[];
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
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'incidents' | 'tracking'>('overview');
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
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'user' | 'incident', id: string } | null>(null);

    // Edit forms
    const [editUserForm, setEditUserForm] = useState({ name: '', email: '', role: '' });
    const [createUserForm, setCreateUserForm] = useState({ name: '', email: '', password: '', role: 'CITIZEN', phone: '' });
    const [changePasswordForm, setChangePasswordForm] = useState({ newPassword: '', confirmPassword: '' });
    const [formErrors, setFormErrors] = useState<string>('');

    useEffect(() => {
        loadData();
    }, [token]);

    const loadData = async () => {
        try {
            console.log('🔍 Loading data...');

            // Use the API helpers instead of raw fetch
            const [usersRes, incidentsRes, statsRes] = await Promise.all([
                usersAPI.getAll(),
                incidentsAPI.getAll(),
                statsAPI.getGeneral()
            ]);

            console.log('📦 Raw responses:', { usersRes, incidentsRes, statsRes });

            // Extract data from responses - backend returns { users: [], pagination: {} }
            const usersData = usersRes.data.users || usersRes.data || [];
            const incidentsData = incidentsRes.data.incidents || incidentsRes.data || [];
            const statsData = statsRes.data;

            console.log('👥 Users loaded:', usersData);
            console.log('📋 Incidents loaded:', incidentsData);
            console.log('📊 Stats loaded:', statsData);

            // Log user roles to debug
            if (Array.isArray(usersData)) {
                console.log('🔍 User roles found:', usersData.map(u => ({ name: u.name, role: u.role })));
                console.log('📊 Role counts:', {
                    BRIGADE: usersData.filter(u => u.role === 'BRIGADE').length,
                    DRIVER: usersData.filter(u => u.role === 'DRIVER').length,
                    CITIZEN: usersData.filter(u => u.role === 'CITIZEN').length,
                    ADMIN: usersData.filter(u => u.role === 'ADMIN').length,
                    total: usersData.length
                });
            }

            setUsers(Array.isArray(usersData) ? usersData : []);
            setIncidents(Array.isArray(incidentsData) ? incidentsData : []);

            setStats({
                totalIncidents: statsData?.incidents?.total || 0,
                pendingIncidents: statsData?.incidents?.pending || 0,
                resolvedIncidents: statsData?.incidents?.resolved || 0,
                totalUsers: statsData?.users?.total || 0,
                activeBrigades: statsData?.users?.brigades || 0
            });

            console.log('✅ Data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ active: !currentStatus })
            });

            if (response.ok) {
                loadData();
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    const updateIncidentStatus = async (incidentId: string, newStatus: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/incidents/${incidentId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                loadData();
                setShowIncidentModal(false);
            }
        } catch (error) {
            console.error('Error updating incident status:', error);
        }
    };

    const assignIncidentToBrigade = async (incidentId: string, brigadeId: string) => {
        if (!brigadeId) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

            // Mostrar estado de carga temporalmente (idealmente usar un toast)
            const prevIncidents = [...incidents];
            setIncidents(incidents.map(inc =>
                inc.id === incidentId
                    ? { ...inc, status: 'ASSIGNED' } // Optimistic update
                    : inc
            ));

            const response = await fetch(`${apiUrl}/api/incidents/${incidentId}/assign`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ brigadeId })
            });

            if (response.ok) {
                await loadData(); // Recargar datos reales
                alert('Incidente asignado exitosamente');
            } else {
                // Revertir si hay error
                setIncidents(prevIncidents);
                const errorData = await response.json();
                alert(`Error al asignar: ${errorData.error || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error assigning incident:', error);
            alert('Error de conexión al asignar incidente');
            loadData(); // Revertir cambios
        }
    };

    const deleteItem = async () => {
        if (!itemToDelete) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const endpoint = itemToDelete.type === 'user'
                ? `${apiUrl}/api/users/${itemToDelete.id}`
                : `${apiUrl}/api/incidents/${itemToDelete.id}`;

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                loadData();
                setShowDeleteConfirm(false);
                setItemToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const openEditUserModal = (user: User) => {
        setSelectedUser(user);
        setEditUserForm({ name: user.name, email: user.email, role: user.role });
        setShowEditUserModal(true);
    };

    const updateUser = async () => {
        if (!selectedUser) return;

        try {
            await usersAPI.update(selectedUser.id, editUserForm);
            loadData();
            setShowEditUserModal(false);
            setFormErrors('');
        } catch (error: any) {
            console.error('Error updating user:', error);
            setFormErrors(error.response?.data?.error || 'Error al actualizar usuario');
        }
    };

    const createUser = async () => {
        // Validate form
        if (!createUserForm.name || !createUserForm.email || !createUserForm.password) {
            setFormErrors('Todos los campos son requeridos');
            return;
        }

        if (createUserForm.password.length < 6) {
            setFormErrors('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            await usersAPI.create(createUserForm);
            loadData();
            setShowCreateUserModal(false);
            setCreateUserForm({ name: '', email: '', password: '', role: 'CITIZEN', phone: '' });
            setFormErrors('');
        } catch (error: any) {
            console.error('Error creating user:', error);
            setFormErrors(error.response?.data?.error || 'Error al crear usuario');
        }
    };

    const changePassword = async () => {
        if (!selectedUser) return;

        if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
            setFormErrors('Las contraseñas no coinciden');
            return;
        }

        if (changePasswordForm.newPassword.length < 6) {
            setFormErrors('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            await usersAPI.update(selectedUser.id, { password: changePasswordForm.newPassword });
            setShowChangePasswordModal(false);
            setChangePasswordForm({ newPassword: '', confirmPassword: '' });
            setFormErrors('');
            alert('Contraseña actualizada exitosamente');
        } catch (error: any) {
            console.error('Error changing password:', error);
            setFormErrors(error.response?.data?.error || 'Error al cambiar contraseña');
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        const colors = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'ASSIGNED': 'bg-purple-100 text-purple-800',
            'IN_PROGRESS': 'bg-blue-100 text-blue-800',
            'RESOLVED': 'bg-green-100 text-green-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getRoleBadge = (role: string) => {
        const colors = {
            'ADMIN': 'bg-red-100 text-red-800',
            'BRIGADE': 'bg-blue-100 text-blue-800',
            'DRIVER': 'bg-indigo-100 text-indigo-800',
            'CITIZEN': 'bg-green-100 text-green-800'
        };
        return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-700 font-medium">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['ADMIN']}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
                <AnimatedBackground />

                {/* Header */}
                <div className="bg-white shadow-lg border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    🎯 Panel de Administración
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    Gestión completa del sistema de residuos
                                </p>
                            </div>
                            <button
                                onClick={loadData}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Actualizando...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Actualizar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                        <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 border border-blue-100">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-3">
                                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Incidentes</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalIncidents}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 border border-yellow-100">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-3">
                                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Pendientes</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.pendingIncidents}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 border border-green-100">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-3">
                                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Resueltos</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.resolvedIncidents}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 border border-purple-100">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-3">
                                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 border border-indigo-100">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl p-3">
                                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`${activeTab === 'overview'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    📊 Resumen
                                </button>
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={`${activeTab === 'users'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    👥 Usuarios ({users.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('incidents')}
                                    className={`${activeTab === 'incidents'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    📋 Incidentes ({incidents.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('tracking')}
                                    className={`${activeTab === 'tracking'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    🗺️ Rastreo en Vivo
                                </button>
                            </nav>
                        </div>

                        <div className="mt-6">
                            {/* Tracking Tab */}
                            {activeTab === 'tracking' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-gray-900">Rastreo de Brigadas en Tiempo Real</h2>
                                    </div>
                                    <BrigadeTrackingMap />
                                </div>
                            )}

                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Resumen del Sistema</h2>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
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

                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
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

                                    {/* Brigades Status Section */}
                                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Estado de Brigadas
                                        </h3>
                                        {users.filter(u => u.role === 'BRIGADE' || u.role === 'DRIVER').length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {users.filter(u => u.role === 'BRIGADE' || u.role === 'DRIVER').map((brigade) => {
                                                    const assignedIncidents = incidents.filter(inc =>
                                                        inc.assignments?.some((a: any) => a.assignedToId === brigade.id)
                                                    );
                                                    const activeIncidents = assignedIncidents.filter(inc =>
                                                        inc.status === 'ASSIGNED' || inc.status === 'IN_PROGRESS'
                                                    );

                                                    return (
                                                        <div key={brigade.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                                    {brigade.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="font-semibold text-gray-900">{brigade.name}</h4>
                                                                    <p className="text-xs text-gray-600">{brigade.role}</p>
                                                                </div>
                                                                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${brigade.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {brigade.active ? '🟢 Activo' : '🔴 Inactivo'}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Tareas Activas:</span>
                                                                    <span className="font-bold text-blue-600">{activeIncidents.length}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Total Asignadas:</span>
                                                                    <span className="font-bold text-gray-900">{assignedIncidents.length}</span>
                                                                </div>
                                                                {activeIncidents.length > 0 && (
                                                                    <div className="mt-2 pt-2 border-t border-blue-200">
                                                                        <p className="text-xs text-gray-600 mb-1">Última tarea:</p>
                                                                        <p className="text-xs font-medium text-gray-900 truncate">
                                                                            📍 {activeIncidents[0].address || activeIncidents[0].description}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                <p className="font-medium">No hay brigadas registradas</p>
                                                <p className="text-sm mt-1">Crea usuarios con rol BRIGADE para verlos aquí</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recent Incidents Section */}
                                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Últimos Incidentes Reportados
                                        </h3>
                                        {incidents.length > 0 ? (
                                            <div className="space-y-3">
                                                {incidents.slice(0, 5).map((incident) => (
                                                    <div key={incident.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-medium text-gray-900">{incident.description}</h4>
                                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(incident.status)}`}>
                                                                    {incident.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600">
                                                                👤 {incident.reportedBy?.name || 'Desconocido'} •
                                                                📅 {new Date(incident.createdAt).toLocaleDateString('es-PE')}
                                                                {incident.address && ` • 📍 ${incident.address}`}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedIncident(incident);
                                                                setShowIncidentModal(true);
                                                            }}
                                                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                                        >
                                                            Ver
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="font-medium">No hay incidentes reportados</p>
                                                <p className="text-sm mt-1">Los incidentes aparecerán aquí cuando sean reportados</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Activity Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Usuarios Activos</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {users.filter(u => u.active).length}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">En Progreso</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {incidents.filter(i => i.status === 'IN_PROGRESS').length}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Asignados</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {incidents.filter(i => i.status === 'ASSIGNED').length}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Users Tab */}
                            {activeTab === 'users' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                placeholder="Buscar usuario..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            />
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
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredUsers.map((user) => (
                                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                                    {user.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                {user.active ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setShowUserModal(true);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                                                title="Ver detalles"
                                                            >
                                                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => openEditUserModal(user)}
                                                                className="text-green-600 hover:text-green-900 transition-colors"
                                                                title="Editar"
                                                            >
                                                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => toggleUserStatus(user.id, user.active)}
                                                                className={`${user.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} transition-colors`}
                                                                title={user.active ? 'Desactivar' : 'Activar'}
                                                            >
                                                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setItemToDelete({ type: 'user', id: user.id });
                                                                    setShowDeleteConfirm(true);
                                                                }}
                                                                className="text-red-600 hover:text-red-900 transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Incidents Tab */}
                            {activeTab === 'incidents' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Incidentes</h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {incidents.slice(0, 20).map((incident) => (
                                            <div key={incident.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-semibold text-gray-900">{incident.description}</h3>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(incident.status)}`}>
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
                                                        <p className="text-sm text-gray-600">
                                                            Reportado por: {incident.reportedBy?.name || 'Desconocido'}
                                                        </p>
                                                        {incident.address && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                📍 {incident.address}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(incident.createdAt).toLocaleDateString('es-PE')}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedIncident(incident);
                                                                setShowIncidentModal(true);
                                                            }}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                                        >
                                                            Ver Detalles
                                                        </button>
                                                        {(incident.status === 'PENDING' || incident.status === 'ASSIGNED') && (
                                                            <select
                                                                onChange={(e) => {
                                                                    if (e.target.value) {
                                                                        const confirmAssign = window.confirm('¿Estás seguro de asignar este incidente a esta brigada?');
                                                                        if (confirmAssign) {
                                                                            assignIncidentToBrigade(incident.id, e.target.value);
                                                                        }
                                                                        e.target.value = ''; // Reset select
                                                                    }
                                                                }}
                                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm max-w-[200px]"
                                                                defaultValue=""
                                                            >
                                                                <option value="" disabled>Asignar brigada...</option>
                                                                {users
                                                                    .filter((u: User) => u.role === 'BRIGADE' || u.role === 'DRIVER')
                                                                    .map((brigade: User) => (
                                                                        <option key={brigade.id} value={brigade.id}>
                                                                            {brigade.name} {brigade.active ? '🟢' : '🔴'}
                                                                        </option>
                                                                    ))
                                                                }
                                                            </select>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setItemToDelete({ type: 'incident', id: incident.id });
                                                                setShowDeleteConfirm(true);
                                                            }}
                                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* User Details Modal */}
                {showUserModal && selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Detalles del Usuario</h2>
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-20 w-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                        {selectedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                                        <p className="text-gray-600">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Rol</p>
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(selectedUser.role)}`}>
                                            {selectedUser.role}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Estado</p>
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedUser.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {selectedUser.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setShowUserModal(false);
                                            openEditUserModal(selectedUser);
                                        }}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Editar Usuario
                                    </button>
                                    <button
                                        onClick={() => setShowUserModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {showEditUserModal && selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Editar Usuario</h2>
                                <button
                                    onClick={() => setShowEditUserModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                                    <input
                                        type="text"
                                        value={editUserForm.name}
                                        onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={editUserForm.email}
                                        onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                                    <select
                                        value={editUserForm.role}
                                        onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="ADMIN">Administrador</option>
                                        <option value="BRIGADE">Brigada</option>
                                        <option value="DRIVER">Conductor</option>
                                        <option value="CITIZEN">Ciudadano</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={updateUser}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Guardar Cambios
                                    </button>
                                    <button
                                        onClick={() => setShowEditUserModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Incident Details Modal */}
                {showIncidentModal && selectedIncident && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Detalles del Incidente</h2>
                                <button
                                    onClick={() => setShowIncidentModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="space-y-4">
                                {selectedIncident.imageUrl && (
                                    <img
                                        src={selectedIncident.imageUrl}
                                        alt="Incidente"
                                        className="w-full h-64 object-cover rounded-lg"
                                    />
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedIncident.description}</h3>
                                    <div className="flex gap-2 mb-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedIncident.status)}`}>
                                            {selectedIncident.status}
                                        </span>
                                        {selectedIncident.severity && (
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedIncident.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                                                selectedIncident.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {selectedIncident.severity}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Reportado por</p>
                                        <p className="font-medium">{selectedIncident.reportedBy?.name || 'Desconocido'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Fecha</p>
                                        <p className="font-medium">{new Date(selectedIncident.createdAt).toLocaleDateString('es-PE')}</p>
                                    </div>
                                    {selectedIncident.address && (
                                        <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                                            <p className="text-sm text-gray-500 mb-1">Ubicación</p>
                                            <p className="font-medium">📍 {selectedIncident.address}</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cambiar Estado</label>
                                    <select
                                        value={selectedIncident.status}
                                        onChange={(e) => updateIncidentStatus(selectedIncident.id, e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="PENDING">Pendiente</option>
                                        <option value="ASSIGNED">Asignado</option>
                                        <option value="IN_PROGRESS">En Progreso</option>
                                        <option value="RESOLVED">Resuelto</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => setShowIncidentModal(false)}
                                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* Create User Modal */}
                <CreateUserModal
                    show={showCreateUserModal}
                    onClose={() => {
                        setShowCreateUserModal(false);
                        setFormErrors('');
                        setCreateUserForm({ name: '', email: '', password: '', role: 'CITIZEN', phone: '' });
                    }}
                    onCreate={createUser}
                    form={createUserForm}
                    setForm={setCreateUserForm}
                    errors={formErrors}
                />

                {/* Change Password Modal */}
                <ChangePasswordModal
                    show={showChangePasswordModal}
                    onClose={() => {
                        setShowChangePasswordModal(false);
                        setFormErrors('');
                        setChangePasswordForm({ newPassword: '', confirmPassword: '' });
                    }}
                    onChange={changePassword}
                    userName={selectedUser?.name || ''}
                    form={changePasswordForm}
                    setForm={setChangePasswordForm}
                    errors={formErrors}
                />

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && itemToDelete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">¿Estás seguro?</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Esta acción no se puede deshacer. El {itemToDelete.type === 'user' ? 'usuario' : 'incidente'} será eliminado permanentemente.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={deleteItem}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                    >
                                        Eliminar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setItemToDelete(null);
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </RoleGuard>
    );
}


