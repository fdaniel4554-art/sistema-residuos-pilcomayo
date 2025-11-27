const getTrafficLevel = () => {
    const hour = new Date().getHours();
    // Horas pico: 7-9 AM y 6-8 PM
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 20);

    if (isRushHour) {
        // 70% probabilidad de tráfico alto en hora pico
        return Math.random() > 0.3 ? 'HIGH' : 'MEDIUM';
    }

    // Tráfico normal el resto del día
    return Math.random() > 0.8 ? 'MEDIUM' : 'LOW';
};

const getSimulatedEvents = () => {
    // Simular eventos aleatorios (accidentes, obras)
    const events = [];

    // Coordenadas base de Pilcomayo (aprox)
    const baseLat = -12.05;
    const baseLon = -75.21;

    if (Math.random() > 0.7) {
        events.push({
            id: 'evt_1',
            type: 'ACCIDENT',
            severity: 'HIGH',
            description: 'Accidente vehicular leve',
            latitude: baseLat + (Math.random() * 0.01 - 0.005),
            longitude: baseLon + (Math.random() * 0.01 - 0.005),
            createdAt: new Date()
        });
    }

    if (Math.random() > 0.8) {
        events.push({
            id: 'evt_2',
            type: 'CONSTRUCTION',
            severity: 'MEDIUM',
            description: 'Obras en la vía',
            latitude: baseLat + (Math.random() * 0.01 - 0.005),
            longitude: baseLon + (Math.random() * 0.01 - 0.005),
            createdAt: new Date()
        });
    }

    return events;
};

const calculateTravelTime = (distanceKm, trafficLevel) => {
    // Velocidad promedio en km/h
    let speed = 40; // Base speed

    switch (trafficLevel) {
        case 'HIGH': speed = 15; break;
        case 'MEDIUM': speed = 25; break;
        case 'LOW': speed = 40; break;
    }

    const timeHours = distanceKm / speed;
    return Math.round(timeHours * 60); // Retornar en minutos
};

module.exports = {
    getTrafficLevel,
    getSimulatedEvents,
    calculateTravelTime
};
