'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface VoiceAssistantProps {
    onMessage?: (message: string) => void;
}

export default function VoiceAssistant({ onMessage }: VoiceAssistantProps) {
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

    const [showSettings, setShowSettings] = useState(false);

    if (!isSupported) {
        return null; // No mostrar si el navegador no soporta speech
    }

    const handleToggle = () => {
        const newEnabled = !enabled;
        setEnabled(newEnabled);

        if (newEnabled) {
            speak('Asistente de voz activado');
        }
    };

    return (
        <>
            {/* Botón Flotante */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
                {/* Botón Principal */}
                <button
                    onClick={handleToggle}
                    className={`relative group flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all ${enabled
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-400 hover:bg-gray-500'
                        } ${isSpeaking ? 'animate-pulse' : ''}`}
                    title={enabled ? 'Desactivar asistente de voz' : 'Activar asistente de voz'}
                >
                    {isSpeaking ? (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}

                    {/* Indicador de estado */}
                    <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${enabled ? 'bg-green-400' : 'bg-gray-600'
                        }`} />
                </button>

                {/* Botón de Configuración */}
                {enabled && (
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-all"
                        title="Configuración de voz"
                    >
                        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Panel de Configuración */}
            {showSettings && enabled && (
                <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-lg shadow-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Configuración de Voz</h3>
                        <button
                            onClick={() => setShowSettings(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Selector de Voz */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Voz
                            </label>
                            <select
                                value={selectedVoice?.name || ''}
                                onChange={(e) => {
                                    const voice = voices.find(v => v.name === e.target.value);
                                    if (voice) setVoice(voice);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Velocidad: {rate.toFixed(1)}x
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={rate}
                                onChange={(e) => setRate(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        {/* Control de Volumen */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Volumen: {Math.round(volume * 100)}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        {/* Botón de Prueba */}
                        <button
                            onClick={() => speak('Esta es una prueba del asistente de voz')}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
                        >
                            Probar Voz
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
