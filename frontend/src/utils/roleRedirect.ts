// Utilidad para redirigir según el rol del usuario
export const getRoleDashboard = (role: string): string => {
    switch (role) {
        case 'ADMIN':
            return '/dashboard/admin';
        case 'BRIGADE':
        case 'DRIVER': // Por compatibilidad
            return '/dashboard/brigada';
        case 'CITIZEN':
            return '/dashboard/ciudadano';
        default:
            return '/dashboard';
    }
};

export const canAccessRoute = (userRole: string, route: string): boolean => {
    // Admin puede acceder a todo
    if (userRole === 'ADMIN') return true;

    // Brigadas solo a su dashboard y mapa
    if (userRole === 'BRIGADE' || userRole === 'DRIVER') {
        return route.startsWith('/dashboard/brigada') ||
            route.startsWith('/dashboard/mapa') ||
            route === '/dashboard';
    }

    // Ciudadanos solo a su dashboard
    if (userRole === 'CITIZEN') {
        return route.startsWith('/dashboard/ciudadano') ||
            route === '/dashboard';
    }

    return false;
};
