'use client';

import { useState, useEffect } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { useNavigation } from '@/hooks/useNavigation';

interface VoiceAssistantProps {
    onMessage?: (message: string) => void;
    tasks?: any[];
}

export default function VoiceAssistant({ onMessage, tasks = [] }: VoiceAssistantProps) {
    const {
        speak,
        stop,
        isSpeaking,
        isSupported,
        voices,
        selectedVoice,
        setVoice,
        rate,
        setRate,
        volume,
        setVolume,
        enabled,
        setEnabled,
    } = useSpeech();

    const {
        startNavigation,
        stopNavigation,
        nextStop,
        previousStop,
        getCurrentTask,
        getDistanceToCurrentTask,
        isNearCurrentTask,
        isNavigating,
        currentTaskIndex,
        tasks: navTasks
    } = useNavigation();

    const [showSettings, setShowSettings] = useState(false);
    const [lastProximityAlert, setLastProximityAlert] = useState<number>(0);

    // Iniciar navegación cuando hay tareas
    useEffect(() => {
        if (tasks.length > 0 && !isNavigating) {
            startNavigation(tasks);
        }
    }, [tasks]);

    // Alertas de proximidad automáticas
    useEffect(() => {
        if (!enabled || !isNavigating) return;

        const checkProximity = setInterval(() => {
            if (isNearCurrentTask()) {
                const now = Date.now();
                // Solo alertar cada 2 minutos
                if (now - lastProximityAlert > 120000) {
                    const currentTask = getCurrentTask();
                    if (currentTask) {
                        speak(`Estás cerca de tu destino: ${currentTask.address || currentTask.description}`);
                        setLastProximityAlert(now);
                    }
                }
            }
        }, 10000); // Verificar cada 10 segundos

        return () => clearInterval(checkProximity);
    }, [enabled, isNavigating, lastProximityAlert]);

    if (!isSupported) {
        return null;
    }

    const handleToggle = () => {
        const newEnabled = !enabled;
        setEnabled(newEnabled);

        if (newEnabled) {
            speak('Asistente de voz activado');
            if (isNavigating) {
                const currentTask = getCurrentTask();
                if (currentTask) {
                    speak(`Dirigiéndote a: ${currentTask.address || currentTask.description}`);
                }
            }
        } else {
            speak('Asistente de voz desactivado');
        }
    };

    const handleNextStop = () => {
        nextStop();
        const task = getCurrentTask();
        if (task) {
            speak(`Siguiente parada: ${task.address || task.description}`);
        } else {
            speak('No hay más paradas');
        }
    };

    const handlePreviousStop = () => {
        previousStop();
        const task = getCurrentTask();
        if (task) {
            speak(`Parada anterior: ${task.address || task.description}`);
        }
    };

    const handleWhereAmI = () => {
        const distance = getDistanceToCurrentTask();
        const currentTask = getCurrentTask();

        if (distance !== null && currentTask) {
            const distanceText = distance < 1
                ? `${Math.round(distance * 1000)} metros`
                : `${distance.toFixed(1)} kilómetros`;

            speak(`Estás a ${distanceText} de ${currentTask.address || 'tu destino'}`);
        } else {
            speak('No se pudo determinar tu ubicación');
        }
    };

    const handleRouteInfo = () => {
        if (navTasks.length === 0) {
            speak('No hay ruta activa');
            return;
        }

        const pending = navTasks.length - currentTaskIndex;
        speak(`Tienes ${pending} paradas pendientes. Parada actual: ${currentTaskIndex + 1} de ${navTasks.length}`);
    };

    return (
        <>
            {/* Botón Flotante */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
                {/* Botón Principal */}
                <button
                    onClick={handleToggle}
                    className={`relative group flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all transform hover:scale-110 ${enabled
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                            : 'bg-gray-400 hover:bg-gray-500'
                        } ${isSpeaking ? 'animate-pulse' : ''}`}
                    title={enabled ? 'Desactivar asistente de voz' : 'Activar asistente de voz'}
                >
                    {isSpeaking ? (
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    ) : (
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}

                    {/* Indicador de estado */}
                    <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${enabled ? 'bg-green-400 animate-ping' : 'bg-gray-600'
                        }`} />
                    <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${enabled ? 'bg-green-400' : 'bg-gray-600'
                        }`} />
                </button>

                {/* Botones de Navegación */}
                {enabled && isNavigating && (
                    <div className="flex flex-col gap-2 animate-fade-in">
                        <button
                            onClick={handleWhereAmI}
                            className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg transition-all transform hover:scale-110"
                            title="¿Dónde estoy?"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>

                        <button
                            onClick={handleNextStop}
                            className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500 hover:bg-purple-600 shadow-lg transition-all transform hover:scale-110"
                            title="Siguiente parada"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={handleRouteInfo}
                            className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg transition-all transform hover:scale-110"
                            title="Info de ruta"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Botón de Configuración */}
                {enabled && (
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl transition-all transform hover:scale-110"
                        title="Configuración de voz"
                    >
                        <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Panel de Configuración */}
            {showSettings && enabled && (
                <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl p-6 border-2 border-gray-100 animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">⚙️ Configuración de Voz</h3>
                        <button
                            onClick={() => setShowSettings(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Selector de Voz */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                🎤 Voz
                            </label>
                            <select
                                value={selectedVoice?.name || ''}
                                onChange={(e) => {
                                    const voice = voices.find(v => v.name === e.target.value);
                                    if (voice) setVoice(voice);
                                }}
                                className="w-full px-3 py-2 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                {voices
                                    .filter(v => v.lang.startsWith('es'))
                                    .map(voice => (
                                        <option key={voice.name} value={voice.name}>
                                            {voice.name} ({voice.lang})
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Control de Velocidad */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                ⚡ Velocidad: {rate.toFixed(1)}x
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={rate}
                                onChange={(e) => setRate(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                        </div>

                        {/* Control de Volumen */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                🔊 Volumen: {Math.round(volume * 100)}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                        </div>

                        {/* Botón de Prueba */}
                        <button
                            onClick={() => speak('Esta es una prueba del asistente de voz mejorado')}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg transition-all font-bold shadow-md transform hover:scale-105"
                        >
                            🎵 Probar Voz
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </>
    );
}
