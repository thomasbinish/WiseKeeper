"use client";

import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Documentation } from "@/components/Documentation";
import { ModeToggle } from "@/components/mode-toggle";

export function GlobalHeaderActions() {
    return (
        <div className="flex items-center gap-2">
            <TutorialButton />
            <Documentation />
            <div className="w-px h-6 bg-border mx-2" />
            <ModeToggle />
        </div>
    );
}

function TutorialButton() {
    return (
        <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => window.dispatchEvent(new Event('trigger-tutorial'))}
        >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Tutorial</span>
        </Button>
    );
}
