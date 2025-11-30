"use client";

import { useState, useEffect } from "react";
import { TutorialOverlay } from "@/components/TutorialOverlay";

export function GlobalTutorialWrapper() {
    const [key, setKey] = useState(0);

    useEffect(() => {
        const handleTrigger = () => {
            localStorage.removeItem('tutorial_seen');
            setKey(prev => prev + 1);
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('trigger-tutorial', handleTrigger);
            return () => window.removeEventListener('trigger-tutorial', handleTrigger);
        }
    }, []);

    return <TutorialOverlay key={key} onComplete={() => { }} />;
}
