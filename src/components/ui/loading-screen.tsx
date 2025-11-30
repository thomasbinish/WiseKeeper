"use client";

import React from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({ message = "Preparing your WiseKeeper..." }: LoadingScreenProps) {
    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4 transition-colors duration-500">
            <div className="relative w-64 h-64 mb-8 animate-in fade-in zoom-in duration-700">
                <img
                    src="/loading-art.png"
                    alt="WiseKeeper Loading"
                    className="w-full h-full object-contain drop-shadow-xl rounded-full"
                />
            </div>
            <h2 className="text-3xl font-serif text-primary mb-4 animate-pulse">WiseKeeper</h2>
            <p className="text-muted-foreground text-lg font-medium">{message}</p>
            <div className="mt-8 flex gap-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-3 h-3 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-3 h-3 bg-accent rounded-full animate-bounce"></div>
            </div>
        </div>
    );
}
