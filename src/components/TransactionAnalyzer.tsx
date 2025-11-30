"use client";

import React, { useState, useEffect } from "react";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/components/Dashboard";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Tag, Filter, Info, X, Download, Check, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProfileSettings } from "./ProfileSettings";
import { FileUploader } from "./FileUploader";
import { useAiClassifier } from "@/hooks/use-ai-classifier";
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { storage } from "@/lib/storage";
import { fileStorage } from "@/lib/fileStorage";
import JSZip from "jszip";

export type Category =
    | "Food & Drink"
    | "Outside Food"
    | "Grocery Shopping"
    | "Commute"
    | "Travel"
    | "Shopping"
    | "Entertainment"
    | "Bills & Utilities"
    | "Health & Wellness"
    | "Personal Care"
    | "Gifts & Donations"
    | "Lending"
    | "Repayment"
    | "EMI"
    | "Income"
    | "Rent"
    | "Maintenance"
    | "Internet"
    | "Insurance"
    | "Investment"
    | "Tax"
    | "Services"
    | "Uncategorized";

const CATEGORIES: Category[] = [
    "Food & Drink",
    "Outside Food",
    "Grocery Shopping",
    "Commute",
    "Travel",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Health & Wellness",
    "Personal Care",
    "Gifts & Donations",
    "Lending",
    "Repayment",
    "EMI",
    "Income",
    "Rent",
    "Maintenance",
    "Internet",
    "Insurance",
    "Investment",
    "Tax",
    "Services",
    "Uncategorized",
];

export interface Transaction {
    id: string;
    date: string;
    amount: number;
    description: string;
    category: Category;
    confidence: number;
    by: string;
    tags: string[];
    type: 'cr' | 'dr';
    attachments?: string[];
}

export interface Trip {
    id: string;
    name: string;
    start: string;
    end: string;
}





export function TransactionAnalyzer() {
    const [input, setInput] = useState("");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Filtering State
    const [filterCategory, setFilterCategory] = useState<string>("All");
    const [filterTag, setFilterTag] = useState<string>("All");
    const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Review Workflow State
    const [reviewBatch, setReviewBatch] = useState<Transaction[]>([]);
    const [showReview, setShowReview] = useState(false);
    const [reviewEditingId, setReviewEditingId] = useState<string | null>(null);
    const [reviewEditForm, setReviewEditForm] = useState<Partial<Transaction>>({});
    const [processingProgress, setProcessingProgress] = useState(0);

    // Trip Management State
    const [trips, setTrips] = useState<Trip[]>([]);
    const [newTripName, setNewTripName] = useState("");
    const [newTripStart, setNewTripStart] = useState("");
    const [newTripEnd, setNewTripEnd] = useState("");
    const [isTripsOpen, setIsTripsOpen] = useState(false);

    // AI Classifier
    const { classify, modelStatus, progress: aiProgress, cancel } = useAiClassifier();
    const [useOfflineAI, setUseOfflineAI] = useState(false);

    const [selectedModel, setSelectedModel] = useState("Xenova/mobilebert-uncased-mnli");
    const [processingCount, setProcessingCount] = useState(0);
    const [officialTags, setOfficialTags] = useState<string[]>([]);
    const [savedTags, setSavedTags] = useState<string[]>([]);

    useEffect(() => {
        setMounted(true);
        // Load data on mount
        const loadedTransactions = storage.loadTransactions();
        const loadedTrips = storage.loadTrips();
        const loadedOfficialTags = storage.getOfficialTags();

        // Migration: Rename MUVATUPURA to Muvattupuzha
        let initialTransactions = loadedTransactions;
        if (initialTransactions.some(t => t.tags.includes("MUVATUPURA"))) {
            initialTransactions = initialTransactions.map(t => ({
                ...t,
                tags: t.tags.map(tag => tag === "MUVATUPURA" ? "Muvattupuzha" : tag)
            }));
            console.log("Migrated MUVATUPURA tags to Muvattupuzha");
        }

        if (initialTransactions.length > 0) setTransactions(initialTransactions);
        if (loadedTrips.length > 0) setTrips(loadedTrips);
        setOfficialTags(loadedOfficialTags);
        setSavedTags(storage.loadTags());
    }, []);

    // Save data on change
    useEffect(() => {
        if (mounted) {
            storage.saveTransactions(transactions);
        }
    }, [transactions, mounted]);

    useEffect(() => {
        if (mounted) {
            storage.saveTrips(trips);
        }
    }, [trips, mounted]);

    const addTrip = () => {
        if (newTripName && newTripStart && newTripEnd) {
            setTrips([...trips, {
                id: Math.random().toString(36).substr(2, 9),
                name: newTripName,
                start: newTripStart,
                end: newTripEnd
            }]);
            setNewTripName("");
            setNewTripStart("");
            setNewTripEnd("");
        }
    };

    const removeTrip = (id: string) => {
        setTrips(trips.filter(t => t.id !== id));
    };

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState("dashboard");

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Transaction>>({});

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds(new Set());
    }, [filterCategory, filterTag, filterMonth, transactions]);



    const deleteSelected = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} transactions?`)) {
            setTransactions(transactions.filter(t => !selectedIds.has(t.id)));
            setSelectedIds(new Set());
        }
    };

    const removeTransaction = (id: string) => {
        setTransactions(transactions.filter(t => t.id !== id));
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    const handleReimburse = async () => {
        const selected = transactions.filter(t => selectedIds.has(t.id));
        if (selected.length === 0) return;

        const zip = new JSZip();
        const folder = zip.folder("reimbursement_docs");

        // 1. Generate CSV Summary
        const csvHeader = "Date,Description,Amount,Category,Tags\n";
        const csvRows = selected.map(t =>
            `${t.date},"${t.description.replace(/"/g, '""')}",${t.amount},${t.category},"${t.tags.join(';')}"`
        ).join("\n");
        folder?.file("summary.csv", csvHeader + csvRows);

        // 2. Add Attachments
        let attachmentCount = 0;
        for (const t of selected) {
            if (t.attachments && t.attachments.length > 0) {
                for (const attachmentId of t.attachments) {
                    const file = await fileStorage.getFile(attachmentId);
                    if (file) {
                        // Use transaction ID + original name or ID to avoid collisions
                        // Since we only store blobs, we'll use ID and try to guess extension or default to bin
                        const ext = file.type.split('/')[1] || 'bin';
                        folder?.file(`${t.date}_${t.id.substr(0, 4)}_${attachmentId}.${ext}`, file);
                        attachmentCount++;
                    }
                }
            }
        }

        // 3. Generate and Download
        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reimbursement_${new Date().toISOString().split('T')[0]}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadCSV = () => {
        const selected = transactions.filter(t => selectedIds.has(t.id));
        if (selected.length === 0) return;

        const csvHeader = "Date,Description,Amount,Category,Type,Tags,By\n";
        const csvRows = selected.map(t =>
            `${t.date},"${t.description.replace(/"/g, '""')}",${t.amount},${t.category},${t.type},"${t.tags.join(';')}",${t.by}`
        ).join("\n");

        const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const startReviewEditing = (t: Transaction) => {
        setReviewEditingId(t.id);
        setReviewEditForm({ ...t });
    };

    const cancelReviewEditing = () => {
        setReviewEditingId(null);
        setReviewEditForm({});
    };

    const saveReviewEdit = () => {
        if (reviewEditingId && reviewEditForm) {
            setReviewBatch(reviewBatch.map(t =>
                t.id === reviewEditingId ? { ...t, ...reviewEditForm } as Transaction : t
            ));
            setReviewEditingId(null);
            setReviewEditForm({});
        }
    };

    const startEditing = (t: Transaction) => {
        setEditingId(t.id);
        setEditForm({ ...t });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = () => {
        if (editingId && editForm) {
            setTransactions(transactions.map(t =>
                t.id === editingId ? { ...t, ...editForm } as Transaction : t
            ));
            setEditingId(null);
            setEditForm({});
        }
    };

    const handleCancel = () => {
        cancel();
        setIsAnalyzing(false);
        setProcessingCount(0);
        setProcessingProgress(0);
    };

    const handleAnalyze = async () => {
        console.log("handleAnalyze started");
        setIsAnalyzing(true);

        const lines = input.split(/\r?\n/).filter((line) => line.trim());
        console.log("Lines found:", lines.length);
        const newTransactions: Transaction[] = lines.map((line, index) => {
            let date = "";
            let description = "";
            let amount = 0;
            let by = "";
            let type: 'dr' | 'cr' = 'dr';

            try {
                // Expected format: Date Item Amount By Type
                // Example: 09/08/2025 Dmart purchase 4,426.03 Binish dr

                // Robust Parsing Strategy
                // 1. Extract Date (Start of line)
                // 2. Extract Type (End of line, optional 'dr'/'cr')
                // 3. Extract By (Word before Type)
                // 4. Extract Amount (Number before By)
                // 5. Everything else is Description

                const dateMatch = line.match(/^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
                date = dateMatch ? dateMatch[1] : "";

                // Remove date from line for further processing
                let remaining = line.replace(date, "").trim();

                // Extract Type (dr/cr at end)
                const typeMatch = remaining.match(/(dr|cr)$/i);
                if (typeMatch) {
                    type = typeMatch[1].toLowerCase() as 'dr' | 'cr';
                    remaining = remaining.substring(0, remaining.length - typeMatch[0].length).trim();
                }

                // Extract By (Last word)
                const byMatch = remaining.match(/\s+([^\s]+)$/);
                if (byMatch) {
                    by = byMatch[1];
                    remaining = remaining.substring(0, remaining.length - byMatch[0].length).trim();
                }

                // Extract Amount (Last number in remaining text)
                // Matches numbers with commas like 1,000 or 1,00,000.00
                const amountMatch = remaining.match(/((?:[\d,]+)(?:\.\d+)?)$/);
                if (amountMatch) {
                    const amountStr = amountMatch[1];
                    amount = parseFloat(amountStr.replace(/,/g, ""));
                    remaining = remaining.substring(0, remaining.length - amountStr.length).trim();
                }

                // Remaining text is description
                description = remaining.trim();

                // Fallback if date is missing (use today)
                if (!date) {
                    date = new Date().toISOString().split("T")[0];
                }

                // Normalize date to YYYY-MM-DD
                if (date.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)) {
                    const parts = date.split(/[\/\-]/);
                    const d = parts[0].padStart(2, '0');
                    const m = parts[1].padStart(2, '0');
                    let y = parts[2];
                    if (y.length === 2) y = "20" + y;
                    date = `${y}-${m}-${d}`;
                }

                // Tagging Logic
                const tags: string[] = [];
                const tDate = new Date(date);
                const lowerDesc = (description || "").toLowerCase();

                // Income Check
                if (type === 'cr') {
                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        date,
                        amount,
                        description: description || "Unknown Income",
                        category: "Income",
                        confidence: 1,
                        by,
                        tags,
                        type
                    };
                }

                // Trip Tags
                // Exclusion: Do NOT tag as Trip if description contains 'recharge' or 'subscription'
                if (!lowerDesc.includes("recharge") && !lowerDesc.includes("subscription")) {
                    trips.forEach(trip => {
                        const start = new Date(trip.start);
                        const end = new Date(trip.end);
                        start.setHours(0, 0, 0, 0);
                        end.setHours(23, 59, 59, 999);
                        const checkDate = new Date(tDate);
                        checkDate.setHours(12, 0, 0, 0);

                        if (checkDate >= start && checkDate <= end) {
                            if (!tags.includes("Trip")) tags.push("Trip");
                            // Add specific trip name tag
                            if (!tags.includes(trip.name)) tags.push(trip.name);
                        }
                    });
                }

                // Gift Tags
                if (lowerDesc.includes("gift") || lowerDesc.includes("pearl") || lowerDesc.includes("fruit biscuit") || lowerDesc.includes("b'day")) {
                    tags.push("Gift");
                }

                // Fixed vs Variable Expense Tagging
                if (lowerDesc.includes("rent") || lowerDesc.includes("maintenance") || lowerDesc.includes("internet") || lowerDesc.includes("broadband") || lowerDesc.includes("insurance") || lowerDesc.includes("lic") || lowerDesc.includes("tata aia") || lowerDesc.includes("emi") || lowerDesc.includes("loan")) {
                    tags.push("Fixed Expense");
                } else if (lowerDesc.includes("current bill") || lowerDesc.includes("water bill") || lowerDesc.includes("gas") || lowerDesc.includes("recharge") || lowerDesc.includes("mobile")) {
                    tags.push("Variable Expense");
                }

                // Mock categorization
                let category: Category = "Uncategorized";
                let confidence = 0.5;

                // Rent
                if (lowerDesc.includes("rent")) {
                    category = "Rent";
                    confidence = 0.95;
                }
                // Maintenance
                else if (lowerDesc.includes("maintenance")) {
                    category = "Maintenance";
                    confidence = 0.95;
                }
                // Internet
                else if (lowerDesc.includes("internet") || lowerDesc.includes("broadband")) {
                    category = "Internet";
                    confidence = 0.95;
                }
                // Insurance
                else if (lowerDesc.includes("insurance") || lowerDesc.includes("lic") || lowerDesc.includes("tata aia")) {
                    category = "Insurance";
                    confidence = 0.95;
                }
                // Investment
                else if (lowerDesc.includes("sip") || lowerDesc.includes("mutual fund") || lowerDesc.includes("ppf") || lowerDesc.includes("investment")) {
                    category = "Investment";
                    confidence = 0.95;
                }
                // Specific Overrides
                else if (lowerDesc.includes("pearl")) {
                    category = "Shopping";
                    confidence = 0.95;
                }
                else if (lowerDesc.includes("onam fest")) {
                    category = "Entertainment";
                    confidence = 0.95;
                }
                // Personal Care
                else if (lowerDesc.includes("toilet") || lowerDesc.includes("iron clothes")) {
                    category = "Personal Care";
                    confidence = 0.95;
                }
                // Gifts & Donations
                else if (lowerDesc.includes("gift") || lowerDesc.includes("donation") || lowerDesc.includes("charity") || lowerDesc.includes("offering") || lowerDesc.includes("b'day")) {
                    category = "Gifts & Donations";
                    confidence = 0.95;
                }
                // Lending
                else if (lowerDesc.includes("exam fees") || lowerDesc.includes("lend")) {
                    category = "Lending";
                    confidence = 0.95;
                }
                // Repayment
                else if (lowerDesc.includes("repayment") || lowerDesc.includes("return money")) {
                    category = "Repayment";
                    confidence = 0.95;
                }
                // EMI
                else if (lowerDesc.includes("emi") || lowerDesc.includes("loan")) {
                    category = "EMI";
                    confidence = 0.95;
                }
                // Grocery Shopping
                else if (lowerDesc.includes("dmart") || lowerDesc.includes("vijetha") || lowerDesc.includes("ratandeep") || lowerDesc.includes("suresh babu") || lowerDesc.includes("shop under flat") || lowerDesc.includes("milk") || lowerDesc.includes("vegetables") || lowerDesc.includes("grocery") || lowerDesc.includes("egg") || lowerDesc.includes("bread") || lowerDesc.includes("fruits") || lowerDesc.includes("blinkit") || lowerDesc.includes("instamart") || lowerDesc.includes("cucumber") || lowerDesc.includes("market") || lowerDesc.includes("banana")) {
                    category = "Grocery Shopping";
                    confidence = 0.9;
                }
                // Outside Food
                else if (lowerDesc.includes("zomato") || lowerDesc.includes("swiggy") || lowerDesc.includes("butter chicken") || lowerDesc.includes("chandramukhi") || lowerDesc.includes("biriyani") || lowerDesc.includes("restaurant") || lowerDesc.includes("bakery") || lowerDesc.includes("cake") || lowerDesc.includes("sweets") || lowerDesc.includes("tea") || lowerDesc.includes("coffee") || lowerDesc.includes("lunch") || lowerDesc.includes("woking") || lowerDesc.includes("theobroma") || lowerDesc.includes("punugulu") || lowerDesc.includes("snacks") || lowerDesc.includes("spices") || lowerDesc.includes("semakodi")) {
                    category = "Outside Food";
                    confidence = 0.85;
                }
                // Travel (Inter-city)
                else if (lowerDesc.includes("redbus") || lowerDesc.includes("flight") || lowerDesc.includes("train") || lowerDesc.includes("trip") || lowerDesc.includes("chennai") || lowerDesc.includes("hyderabad to")) {
                    category = "Travel";
                    confidence = 0.9;
                }
                // Commute (Intra-city)
                else if (lowerDesc.includes("uber") || lowerDesc.includes("rapido") || lowerDesc.includes("cab") || lowerDesc.includes("petrol") || lowerDesc.includes("auto") || lowerDesc.includes("metro") || lowerDesc.includes("parking")) {
                    category = "Commute";
                    confidence = 0.9;
                }
                // Entertainment
                else if (lowerDesc.includes("netflix") || lowerDesc.includes("prime") || lowerDesc.includes("discovery")) {
                    category = "Entertainment";
                    confidence = 0.95;
                }
                // Shopping (General)
                else if (lowerDesc.includes("amazon") || lowerDesc.includes("blinkit") || lowerDesc.includes("myntra") || lowerDesc.includes("nykaa") || lowerDesc.includes("silk emporium") || lowerDesc.includes("clothes")) {
                    category = "Shopping";
                    confidence = 0.8;
                }
                // Health
                else if (lowerDesc.includes("pharmacy") || lowerDesc.includes("doctor") || lowerDesc.includes("meds") || lowerDesc.includes("lab") || lowerDesc.includes("consultation") || lowerDesc.includes("hospital") || lowerDesc.includes("sri holistic") || lowerDesc.includes("tooth") || lowerDesc.includes("root canal") || lowerDesc.includes("dental") || lowerDesc.includes("zirconium")) {
                    category = "Health & Wellness";
                    confidence = 0.9;
                }
                // Bills
                else if (lowerDesc.includes("recharge") || lowerDesc.includes("bill") || lowerDesc.includes("gas")) {
                    category = "Bills & Utilities";
                    confidence = 0.9;
                }

                return {
                    id: Math.random().toString(36).substr(2, 9),
                    date,
                    amount,
                    description: description || "Unknown Transaction",
                    category,
                    confidence,
                    by,
                    tags,
                    type
                };
            } catch (error) {
                console.error("Error parsing line:", line, error);
                // Return error transaction
                return {
                    id: Math.random().toString(36).substr(2, 9),
                    date: new Date().toISOString().split("T")[0],
                    amount: 0,
                    description: "Error Parsing Transaction",
                    category: "Uncategorized",
                    confidence: 0,
                    by: "System",
                    tags: [],
                    type: 'dr'
                };
            }
        });

        // AI Classification Step
        if (useOfflineAI) {
            const total = newTransactions.length;
            let completed = 0;
            setProcessingCount(0);
            setProcessingProgress(0);

            try {
                // Process sequentially to avoid overwhelming the worker/browser
                for (let i = 0; i < newTransactions.length; i++) {
                    const t = newTransactions[i];
                    if (t.category === "Uncategorized" && t.type === 'dr') { // Only classify uncategorized debits
                        try {
                            setProcessingCount(i + 1);
                            const result = await classify(
                                t.description,
                                ["Food & Drink", "Shopping", "Transport", "Bills", "Entertainment", "Health", "Investment", "Salary", "Transfer", "Services", "Tax"],
                                selectedModel
                            );

                            const bestLabel = result.result.labels[0];
                            const score = result.result.scores[0];

                            if (["Food & Drink", "Shopping", "Transport", "Bills", "Entertainment", "Health", "Investment", "Salary", "Transfer", "Services", "Tax"].includes(bestLabel)) {
                                if (score > 0.4) { // Confidence threshold
                                    newTransactions[i].category = bestLabel as Category;
                                    newTransactions[i].confidence = score;
                                }
                            }
                        } catch (e) {
                            console.error("AI Classification failed for:", t.description, e);
                        }
                    }
                    completed++;
                    setProcessingProgress(Math.round((completed / total) * 100));
                }
            } finally {
                setProcessingCount(0);
                setProcessingProgress(0);
                setIsAnalyzing(false);
            }
        } else {
            setIsAnalyzing(false);
        }

        setReviewBatch(newTransactions);
        setShowReview(true);
    };

    const commitBatch = () => {
        const updatedTransactions = [...transactions, ...reviewBatch];
        updatedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(updatedTransactions);
        setReviewBatch([]);
        setShowReview(false);
        setInput("");
    };

    const addTag = (id: string, newTag: string) => {
        if (!newTag.trim()) return;
        setTransactions(transactions.map(t => t.id === id && !t.tags.includes(newTag) ? { ...t, tags: [...t.tags, newTag] } : t));
    };

    const removeTag = (id: string, tagToRemove: string) => {
        setTransactions(transactions.map(t => t.id === id ? { ...t, tags: t.tags.filter(tag => tag !== tagToRemove) } : t));
    };

    const allTags = Array.from(new Set([...transactions.flatMap(t => t.tags), ...savedTags])).sort();

    const filteredTransactions = transactions.filter(t => {
        const categoryMatch = filterCategory === "All" || t.category === filterCategory;
        const tagMatch = filterTag === "All" || t.tags.includes(filterTag);
        const dateMatch = !filterMonth || filterMonth === "All" || t.date.startsWith(filterMonth);
        return categoryMatch && tagMatch && dateMatch;
    });

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedTransactions.length && paginatedTransactions.length > 0) setSelectedIds(new Set());
        else setSelectedIds(new Set(paginatedTransactions.map(t => t.id)));
    };

    // Splash Screen State
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            {(showSplash || modelStatus === 'loading') && (
                <LoadingScreen
                    message={showSplash ? "Welcome to WiseKeeper" : "Initializing AI Model..."}
                />
            )}
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="relative w-12 h-12">
                        {/* Using standard img tag to avoid Next.js Image optimization issues during dev */}
                        <img src="/logo.png" alt="WiseKeeper Logo" className="w-full h-full object-contain dark:invert" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl text-primary">WiseKeeper</CardTitle>
                        <p className="text-sm text-muted-foreground">Household Expense Tracker</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Trip Management */}
                    <div className="rounded-lg border p-4 space-y-4">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setIsTripsOpen(!isTripsOpen)}
                        >
                            <h3 className="font-semibold flex items-center gap-2">
                                <Tag className="h-4 w-4" /> Manage Trips <span className="text-muted-foreground font-normal text-sm">(Optional)</span>
                            </h3>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                {isTripsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </div>

                        {isTripsOpen && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-2"><Label>Trip Name</Label><Input value={newTripName} onChange={(e) => setNewTripName(e.target.value)} placeholder="e.g. Chennai Trip" /></div>
                                    <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={newTripStart} onChange={(e) => setNewTripStart(e.target.value)} /></div>
                                    <div className="space-y-2"><Label>End Date</Label><Input type="date" value={newTripEnd} onChange={(e) => setNewTripEnd(e.target.value)} /></div>
                                    <Button onClick={addTrip} variant="secondary"><Plus className="h-4 w-4 mr-2" /> Add Trip</Button>
                                </div>
                                {trips.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {trips.map(trip => (
                                            <Badge key={trip.id} variant="outline" className="pl-2 pr-1 py-1 flex items-center gap-2">
                                                <span>{trip.name} ({trip.start} - {trip.end})</span>
                                                <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full" onClick={() => removeTrip(trip.id)}><Trash2 className="h-3 w-3" /></Button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transaction-input">Paste Transactions</Label>
                        <Textarea id="transaction-input" placeholder="Date Item Amount By Type" className="h-32 font-mono" value={input} onChange={(e) => setInput(e.target.value)} />
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                        <Switch id="offline-ai" checked={useOfflineAI} onCheckedChange={setUseOfflineAI} />
                        <Label htmlFor="offline-ai">Use Offline AI Categorization</Label>
                    </div>

                    {useOfflineAI && (
                        <div className="mb-4">
                            <Label htmlFor="model-select" className="text-sm font-medium mb-1 block">Select AI Model</Label>
                            <Select value={selectedModel} onValueChange={setSelectedModel}>
                                <SelectTrigger id="model-select"><SelectValue placeholder="Select Model" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Xenova/mobilebert-uncased-mnli">MobileBERT (Fast, Less Accurate)</SelectItem>
                                    <SelectItem value="Xenova/nli-deberta-v3-xsmall">DeBERTa v3 (Slower, More Accurate)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {useOfflineAI && modelStatus !== 'ready' && (
                        <Alert className="bg-blue-50 text-blue-800 border-blue-200 mb-2">
                            <Info className="h-4 w-4" />
                            <AlertTitle>First Time Setup</AlertTitle>
                            <AlertDescription>{modelStatus === 'loading' ? "Downloading AI model... Please wait." : "The AI model will download automatically when you click Analyze."}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-2">
                        <Button onClick={handleAnalyze} disabled={isAnalyzing || !input.trim()} className="flex-1">
                            {isAnalyzing ? (
                                <div className="flex items-center gap-2 w-full">
                                    {modelStatus === 'loading' ? <span>Downloading Model...</span> : (
                                        <div className="flex flex-col w-full gap-1">
                                            <div className="flex justify-between text-xs"><span>Classifying... {processingCount} processed</span><span>{processingProgress}%</span></div>
                                            <Progress value={processingProgress} className="h-2 w-full" />
                                        </div>
                                    )}
                                </div>
                            ) : "Analyze Transactions"}
                        </Button>
                        {isAnalyzing && <Button variant="destructive" onClick={handleCancel}>Cancel</Button>}
                    </div>
                </CardContent>
            </Card>

            {
                showReview && (
                    <Card className="border-2 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Review New Transactions ({reviewBatch.length})</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowReview(false)}>Cancel</Button>
                                <Button onClick={commitBatch}>Commit & Save</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {reviewBatch.map((t) => (
                                    <div key={t.id} className="flex flex-col gap-2 p-4 border rounded-lg bg-muted/50">
                                        {reviewEditingId === t.id ? (
                                            // EDIT MODE
                                            <div className="flex flex-col gap-2 w-full">
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="date"
                                                        value={reviewEditForm.date || ''}
                                                        onChange={(e) => setReviewEditForm({ ...reviewEditForm, date: e.target.value })}
                                                        className="w-32"
                                                    />
                                                    <Input
                                                        value={reviewEditForm.description || ''}
                                                        onChange={(e) => setReviewEditForm({ ...reviewEditForm, description: e.target.value })}
                                                        className="flex-1"
                                                        placeholder="Description"
                                                    />
                                                    <Input
                                                        type="number"
                                                        value={reviewEditForm.amount || ''}
                                                        onChange={(e) => setReviewEditForm({ ...reviewEditForm, amount: parseFloat(e.target.value) })}
                                                        className="w-24"
                                                        placeholder="Amount"
                                                    />
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <Select
                                                        value={reviewEditForm.category}
                                                        onValueChange={(val) => setReviewEditForm({ ...reviewEditForm, category: val as Category })}
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Category" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {CATEGORIES.map(cat => (
                                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Select
                                                        value={reviewEditForm.type}
                                                        onValueChange={(val) => setReviewEditForm({ ...reviewEditForm, type: val as 'cr' | 'dr' })}
                                                    >
                                                        <SelectTrigger className="w-[100px]">
                                                            <SelectValue placeholder="Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="dr">Debit</SelectItem>
                                                            <SelectItem value="cr">Credit</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <div className="flex gap-1 ml-auto">
                                                        <Button size="sm" variant="ghost" onClick={cancelReviewEditing}>
                                                            <X className="h-4 w-4 mr-1" /> Cancel
                                                        </Button>
                                                        <Button size="sm" onClick={saveReviewEdit}>
                                                            <Check className="h-4 w-4 mr-1" /> Save
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // VIEW MODE
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono text-sm text-muted-foreground">{t.date}</span>
                                                        <Badge variant="outline">{t.category}</Badge>
                                                        <Badge variant={t.type === 'cr' ? "default" : "secondary"} className={t.type === 'cr' ? "bg-green-600" : ""}>
                                                            {t.type === 'cr' ? 'Credit' : 'Debit'}
                                                        </Badge>
                                                        <span className="font-bold">{formatCurrency(t.amount)}</span>
                                                        {t.by && <span className="text-xs text-muted-foreground ml-2">by {t.by}</span>}
                                                    </div>
                                                    <p className="text-sm font-medium">{t.description}</p>

                                                    {/* Tags Section */}
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {t.tags.map(tag => (
                                                            <Badge key={tag} variant="outline" className="flex items-center gap-1">
                                                                {tag}
                                                                <X
                                                                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                                                                    onClick={() => setReviewBatch(reviewBatch.map(rt =>
                                                                        rt.id === t.id
                                                                            ? { ...rt, tags: rt.tags.filter(tg => tg !== tag) }
                                                                            : rt
                                                                    ))}
                                                                />
                                                            </Badge>
                                                        ))}
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-6 text-xs">
                                                                    <Plus className="h-3 w-3 mr-1" /> Add Tag
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-64 p-2">
                                                                <div className="space-y-2">
                                                                    <h4 className="font-medium text-xs mb-2">Add Tag</h4>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {trips.map(trip => (
                                                                            <Badge
                                                                                key={trip.id}
                                                                                variant="outline"
                                                                                className="cursor-pointer hover:bg-secondary"
                                                                                onClick={() => {
                                                                                    if (!t.tags.includes(trip.name)) {
                                                                                        setReviewBatch(reviewBatch.map(rt =>
                                                                                            rt.id === t.id
                                                                                                ? { ...rt, tags: [...rt.tags, trip.name] }
                                                                                                : rt
                                                                                        ));
                                                                                    }
                                                                                }}
                                                                            >
                                                                                {trip.name}
                                                                            </Badge>
                                                                        ))}
                                                                        {["Official", "Personal", "Food", "Travel"].map(tag => (
                                                                            <Badge
                                                                                key={tag}
                                                                                variant="outline"
                                                                                className="cursor-pointer hover:bg-secondary"
                                                                                onClick={() => {
                                                                                    if (!t.tags.includes(tag)) {
                                                                                        setReviewBatch(reviewBatch.map(rt =>
                                                                                            rt.id === t.id
                                                                                                ? { ...rt, tags: [...rt.tags, tag] }
                                                                                                : rt
                                                                                        ));
                                                                                    }
                                                                                }}
                                                                            >
                                                                                {tag}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>

                                                    {/* File Upload for Official Expenses */}
                                                    {(t.tags.some(tag => storage.getOfficialTags().includes(tag))) && (
                                                        <div className="border-t pt-2 mt-2">
                                                            <Label className="text-xs text-muted-foreground mb-2 block">Official Expense Attachments</Label>
                                                            <FileUploader
                                                                attachments={t.attachments || []}
                                                                onUpload={(id) => {
                                                                    setReviewBatch(reviewBatch.map(rt =>
                                                                        rt.id === t.id ? { ...rt, attachments: [...(rt.attachments || []), id] } : rt
                                                                    ));
                                                                }}
                                                                onRemove={(id) => {
                                                                    setReviewBatch(reviewBatch.map(rt =>
                                                                        rt.id === t.id ? { ...rt, attachments: (rt.attachments || []).filter(a => a !== id) } : rt
                                                                    ));
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={() => startReviewEditing(t)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10 h-8 w-8"
                                                        onClick={() => setReviewBatch(reviewBatch.filter(rt => rt.id !== t.id))}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {
                !showReview && transactions.length > 0 && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                            <TabsTrigger value="list">Transaction List</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="dashboard">
                            <Dashboard
                                transactions={transactions.filter(t => {
                                    const categoryMatch = filterCategory === "All" || t.category === filterCategory;
                                    const tagMatch = filterTag === "All" || t.tags.includes(filterTag);
                                    return categoryMatch && tagMatch;
                                })}
                                trips={trips}
                            />
                        </TabsContent>

                        <TabsContent value="list">
                            <div className="space-y-4">
                                {/* Filters & Bulk Actions */}
                                <div className="flex flex-col gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div className="flex gap-4 items-center flex-wrap">
                                        <Filter className="h-4 w-4 text-muted-foreground" />

                                        <Input
                                            type="month"
                                            value={filterMonth}
                                            onChange={(e) => setFilterMonth(e.target.value)}
                                            className="w-40"
                                        />

                                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Filter Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All Categories</SelectItem>
                                                {CATEGORIES.map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={filterTag} onValueChange={setFilterTag}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Filter Tag" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All Tags</SelectItem>
                                                {allTags.map(tag => (
                                                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {selectedIds.size > 0 && (
                                            <div className="ml-auto flex gap-2">
                                                <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                                                    <Download className="h-4 w-4 mr-2" /> CSV
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={handleReimburse}>
                                                    <Download className="h-4 w-4 mr-2" /> Reimburse
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={deleteSelected}>
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Selected ({selectedIds.size})
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                                            {selectedIds.size === paginatedTransactions.length ? "Deselect All" : "Select All Page"}
                                        </Button>
                                        <span>{selectedIds.size} selected</span>
                                    </div>
                                </div>

                                {paginatedTransactions.map(t => (
                                    <div key={t.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        {editingId === t.id ? (
                                            // EDIT MODE
                                            <div className="flex flex-col gap-2 w-full">
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="date"
                                                        value={editForm.date || ""}
                                                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                                        className="w-40"
                                                    />
                                                    <Select
                                                        value={editForm.category}
                                                        onValueChange={(val) => setEditForm({ ...editForm, category: val as Category })}
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Category" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {CATEGORIES.map(cat => (
                                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Select
                                                        value={editForm.type}
                                                        onValueChange={(val) => setEditForm({ ...editForm, type: val as 'dr' | 'cr' })}
                                                    >
                                                        <SelectTrigger className="w-24">
                                                            <SelectValue placeholder="Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="dr">Debit</SelectItem>
                                                            <SelectItem value="cr">Credit</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={editForm.description || ""}
                                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                        placeholder="Description"
                                                        className="flex-1"
                                                    />
                                                    <Input
                                                        type="number"
                                                        value={editForm.amount || 0}
                                                        onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                                                        className="w-32"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                                        <X className="h-4 w-4 mr-1" /> Cancel
                                                    </Button>
                                                    <Button size="sm" onClick={saveEdit}>
                                                        <Check className="h-4 w-4 mr-1" /> Save
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            // VIEW MODE
                                            <>
                                                <div className="flex items-start gap-4 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1.5"
                                                        checked={selectedIds.has(t.id)}
                                                        onChange={() => toggleSelection(t.id)}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-mono text-sm text-muted-foreground">{t.date}</span>
                                                            <Badge variant="outline">{t.category}</Badge>
                                                            {t.by && <span className="text-xs text-muted-foreground">by {t.by}</span>}

                                                            {/* Tags Display & Edit */}
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-5 px-1">
                                                                        <Plus className="h-3 w-3" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-64 p-2">
                                                                    <div className="space-y-2">
                                                                        <h4 className="font-medium text-xs mb-2">Manage Tags</h4>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {trips.map(trip => (
                                                                                <Badge
                                                                                    key={trip.id}
                                                                                    variant={t.tags.includes(trip.name) ? "default" : "outline"}
                                                                                    className="cursor-pointer"
                                                                                    onClick={() => {
                                                                                        if (t.tags.includes(trip.name)) removeTag(t.id, trip.name);
                                                                                        else addTag(t.id, trip.name);
                                                                                    }}
                                                                                >
                                                                                    {trip.name}
                                                                                </Badge>
                                                                            ))}
                                                                            {["Official", "Personal", "Food", "Travel"].map(tag => (
                                                                                <Badge
                                                                                    key={tag}
                                                                                    variant={t.tags.includes(tag) ? "default" : "outline"}
                                                                                    className="cursor-pointer"
                                                                                    onClick={() => {
                                                                                        if (t.tags.includes(tag)) removeTag(t.id, tag);
                                                                                        else addTag(t.id, tag);
                                                                                    }}
                                                                                >
                                                                                    {tag}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>

                                                            <div className="flex flex-wrap gap-1">
                                                                {t.tags.map(tag => (
                                                                    <Badge key={tag} variant="secondary" className="text-xs">
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="font-medium">{t.description}</p>

                                                        {/* File Upload for Official Expenses */}
                                                        {(t.tags.some(tag => officialTags.includes(tag))) && (
                                                            <div className="border-t pt-2 mt-2">
                                                                <Label className="text-xs text-muted-foreground mb-2 block">Official Expense Attachments</Label>
                                                                <FileUploader
                                                                    attachments={t.attachments || []}
                                                                    onUpload={(id) => {
                                                                        setTransactions(transactions.map(rt =>
                                                                            rt.id === t.id ? { ...rt, attachments: [...(rt.attachments || []), id] } : rt
                                                                        ));
                                                                    }}
                                                                    onRemove={(id) => {
                                                                        setTransactions(transactions.map(rt =>
                                                                            rt.id === t.id ? { ...rt, attachments: (rt.attachments || []).filter(a => a !== id) } : rt
                                                                        ));
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <p className={`font-bold ${t.type === 'cr' ? 'text-green-600' : ''}`}>
                                                        {formatCurrency(t.amount)}
                                                    </p>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                            onClick={() => startEditing(t)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:bg-destructive/10 h-8 w-8"
                                                            onClick={() => removeTransaction(t.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-4 mt-6">
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="settings">
                            <ProfileSettings transactions={transactions} />
                        </TabsContent>
                    </Tabs>
                )
            }
        </div >
    );
}
