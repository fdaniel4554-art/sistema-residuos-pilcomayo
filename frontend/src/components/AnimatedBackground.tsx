import React from 'react';

export default function AnimatedBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Círculos flotantes */}
            <div className="absolute top-20 left-10 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-40 right-10 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

            {/* Formas geométricas */}
            <div className="absolute top-1/4 right-1/4 w-32 h-32 border-4 border-green-300 rounded-lg opacity-20 animate-spin-slow"></div>
            <div className="absolute bottom-1/4 left-1/4 w-24 h-24 border-4 border-emerald-300 rounded-full opacity-20 animate-pulse-slow"></div>

            {/* Partículas pequeñas */}
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 bg-green-400 rounded-full opacity-30 animate-float"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${5 + Math.random() * 10}s`
                    }}
                ></div>
            ))}

            {/* Ondas de fondo */}
            <svg className="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 1440 320">
                <path
                    fill="#10b981"
                    fillOpacity="0.3"
                    d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    className="animate-wave"
                ></path>
            </svg>

            <style jsx>{`
                @keyframes blob {
                    0%, 100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                }
                
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }
                
                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                
                @keyframes pulse-slow {
                    0%, 100% {
                        opacity: 0.2;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.4;
                        transform: scale(1.05);
                    }
                }
                
                @keyframes wave {
                    0% {
                        transform: translateX(0);
                    }
                    50% {
                        transform: translateX(-25%);
                    }
                    100% {
                        transform: translateX(0);
                    }
                }
                
                .animate-blob {
                    animation: blob 7s infinite;
                }
                
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
                
                .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                }
                
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                
                .animate-wave {
                    animation: wave 10s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
