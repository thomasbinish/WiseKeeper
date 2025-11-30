"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronRight, Check } from 'lucide-react';

interface TutorialOverlayProps {
    onComplete: () => void;
}

const TUTORIAL_STEPS = [
    {
        title: "Welcome to WiseKeeper",
        description: "Your smart, family-focused expense tracker. Manage household finances with harmony and ease.",
        image: "/tutorial-welcome.png",
        alt: "WiseKeeper Dashboard Illustration"
    },
    {
        title: "Smart Tagging",
        description: "Use tags like 'Official', 'Food', or 'Travel'. Marking expenses as 'Official' unlocks bill uploads for reimbursement.",
        image: "/tutorial-tags.png",
        alt: "Tagging and Upload Illustration"
    },
    {
        title: "Automatic Insights",
        description: "Your transactions are automatically categorized. View beautiful monthly dashboards and track spending trends.",
        image: "/tutorial-insights.png",
        alt: "Insights and Charts Illustration"
    },
    {
        title: "Easy Reimbursement",
        description: "Select official expenses, attach bills, and generate a reimbursement email in one click.",
        image: "/tutorial-reimburse.png",
        alt: "Reimbursement Workflow Illustration"
    },
    {
        title: "Manage Trips",
        description: "Create trips with dates to automatically tag expenses. Perfect for tracking vacation or work travel spending.",
        image: "/tutorial-tags.png",
        alt: "Manage Trips Illustration"
    }
];

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('tutorial_seen');
        if (!hasSeenTutorial) {
            setIsVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        localStorage.setItem('tutorial_seen', 'true');
        setIsVisible(false);
        setTimeout(onComplete, 300); // Allow animation to finish
    };

    if (!isVisible) return null;

    const step = TUTORIAL_STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="w-full max-w-md mx-4 overflow-hidden border-none shadow-2xl">
                <div className="relative h-64 bg-secondary/20">
                    <img
                        src={step.image}
                        alt={step.alt}
                        className="w-full h-full object-cover"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 rounded-full bg-white/50 hover:bg-white/80"
                        onClick={handleComplete}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <CardContent className="p-6 text-center space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-serif text-primary">{step.title}</h2>
                        <p className="text-muted-foreground">{step.description}</p>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                        {TUTORIAL_STEPS.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentStep ? "w-8 bg-primary" : "w-2 bg-secondary"
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={handleComplete}>
                            Skip
                        </Button>
                        <Button className="flex-1" onClick={handleNext}>
                            {currentStep === TUTORIAL_STEPS.length - 1 ? (
                                <>Let's Get Started <Check className="w-4 h-4 ml-2" /></>
                            ) : (
                                <>Next <ChevronRight className="w-4 h-4 ml-2" /></>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
