'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canAccessRoute } from '@/utils/roleRedirect';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    redirectTo?: string;
}

export default function RoleGuard({
    children,
    allowedRoles,
    redirectTo = '/dashboard'
}: RoleGuardProps) {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }

        // Si se especifican roles permitidos, verificar
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            router.push(redirectTo);
        }
    }, [isAuthenticated, user, allowedRoles, redirectTo, router]);

    if (!isAuthenticated || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600">No tienes permiso para acceder a esta página</p>
                    <p className="mt-2 text-gray-600">Redirigiendo...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
