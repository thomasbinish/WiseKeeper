"use client";

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Book, Cloud, Tag, Receipt, Map, Heart } from 'lucide-react';

export function Documentation() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Book className="h-4 w-4" />
                    <span className="hidden sm:inline">Docs</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif text-primary flex items-center gap-2">
                        <Book className="h-6 w-6" /> WiseKeeper Guide
                    </DialogTitle>
                    <DialogDescription>
                        Everything you need to know to manage your household finances.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-4">
                    <div className="space-y-8 py-4">
                        {/* Google Drive / Sheets */}
                        <section className="space-y-3">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                <Cloud className="h-5 w-5 text-secondary-foreground" /> Google Drive & Sheets
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Connect your Google account to sync transactions to a Google Sheet. This allows for real-time backup and collaboration.
                                Go to <strong>Settings</strong> to authenticate. Once connected, your data will automatically sync, ensuring you never lose track of your expenses.
                            </p>
                        </section>

                        {/* Tagging */}
                        <section className="space-y-3">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                <Tag className="h-5 w-5 text-secondary-foreground" /> Smart Tagging
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Use tags to organize your spending. Standard tags include <em>Food, Travel, Personal</em>.
                                <br />
                                <strong>Important:</strong> Tagging an expense as <strong>"Official"</strong> (or using a custom official tag) unlocks the ability to upload bills and receipts, making it eligible for reimbursement.
                            </p>
                        </section>

                        {/* Reimbursement */}
                        <section className="space-y-3">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                <Receipt className="h-5 w-5 text-secondary-foreground" /> Reimbursement
                            </h3>
                            <div className="text-muted-foreground text-sm leading-relaxed">
                                Easily claim official expenses.
                                <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
                                    <li>Filter your transaction list by "Official" tags.</li>
                                    <li>Select the transactions you want to claim.</li>
                                    <li>Click <strong>"Send for Reimbursement"</strong>.</li>
                                </ol>
                                This will generate a pre-filled email with all your receipts attached as a ZIP file.
                            </div>
                        </section>

                        {/* Trips */}
                        <section className="space-y-3">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                <Map className="h-5 w-5 text-secondary-foreground" /> Manage Trips
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Planning a vacation? Create a "Trip" in the dashboard with a start and end date.
                                Any expense occurring during that period will automatically be tagged with the trip name, giving you a clear view of your vacation spending.
                            </p>
                        </section>

                        {/* Credits */}
                        <div className="mt-8 pt-8 border-t border-border">
                            <div className="bg-secondary/20 p-4 rounded-lg flex items-start gap-3">
                                <Heart className="h-5 w-5 text-primary mt-1" />
                                <div>
                                    <p className="font-medium text-foreground">Credits</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        This tool was created using <strong>Antigravity</strong> and conceptualised by <strong>Binish THOMAS</strong> and <strong>Jiya JACOB</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
