import { useState, useEffect, useCallback } from 'react';

interface UseSpeechReturn {
    speak: (text: string) => void;
    stop: () => void;
    isSpeaking: boolean;
    isSupported: boolean;
    voices: SpeechSynthesisVoice[];
    selectedVoice: SpeechSynthesisVoice | null;
    setVoice: (voice: SpeechSynthesisVoice) => void;
    rate: number;
    setRate: (rate: number) => void;
    volume: number;
    setVolume: (volume: number) => void;
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
}

export const useSpeech = (): UseSpeechReturn => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [rate, setRate] = useState(1.0);
    const [volume, setVolume] = useState(0.8);
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setIsSupported(true);

            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                setVoices(availableVoices);

                // Intentar seleccionar voz en español
                const spanishVoice = availableVoices.find(
                    voice => voice.lang.startsWith('es')
                );
                if (spanishVoice && !selectedVoice) {
                    setSelectedVoice(spanishVoice);
                }
            };

            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;

            // Cargar preferencias guardadas
            const savedEnabled = localStorage.getItem('voiceEnabled');
            const savedRate = localStorage.getItem('voiceRate');
            const savedVolume = localStorage.getItem('voiceVolume');

            if (savedEnabled) setEnabled(savedEnabled === 'true');
            if (savedRate) setRate(parseFloat(savedRate));
            if (savedVolume) setVolume(parseFloat(savedVolume));
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!isSupported || !enabled) return;

        // Cancelar cualquier habla en curso
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.rate = rate;
        utterance.volume = volume;
        utterance.lang = 'es-PE'; // Español de Perú

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [isSupported, enabled, selectedVoice, rate, volume]);

    const stop = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isSupported]);

    const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
        setSelectedVoice(voice);
    }, []);

    const updateRate = useCallback((newRate: number) => {
        setRate(newRate);
        localStorage.setItem('voiceRate', newRate.toString());
    }, []);

    const updateVolume = useCallback((newVolume: number) => {
        setVolume(newVolume);
        localStorage.setItem('voiceVolume', newVolume.toString());
    }, []);

    const updateEnabled = useCallback((newEnabled: boolean) => {
        setEnabled(newEnabled);
        localStorage.setItem('voiceEnabled', newEnabled.toString());
        if (!newEnabled) {
            stop();
        }
    }, [stop]);

    return {
        speak,
        stop,
        isSpeaking,
        isSupported,
        voices,
        selectedVoice,
        setVoice,
        rate,
        setRate: updateRate,
        volume,
        setVolume: updateVolume,
        enabled,
        setEnabled: updateEnabled,
    };
};
