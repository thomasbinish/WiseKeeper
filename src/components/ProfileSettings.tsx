"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { storage, GoogleSheetsConfig } from '@/lib/storage';
import { Save, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Transaction, UserProfile } from '@/types';
import { syncWithGoogle } from '@/lib/googleSheets';

interface ProfileSettingsProps {
    transactions?: Transaction[];
}

export function ProfileSettings({ transactions = [] }: ProfileSettingsProps) {
    const [profile, setProfile] = useState<UserProfile>({
        name: '',
        monthlyIncome: 0,
        familySize: 1,
        currency: 'INR',
        savingsGoal: 0
    });
    const [officialTags, setOfficialTags] = useState<string[]>([]);
    const [generalTags, setGeneralTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [newGeneralTag, setNewGeneralTag] = useState("");
    const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>({
        sheetId: '',
        clientEmail: '',
        privateKey: ''
    });
    const [isSaved, setIsSaved] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState("");

    useEffect(() => {
        const savedProfile = storage.getProfile();
        if (savedProfile) {
            setProfile(savedProfile);
        }
        setOfficialTags(storage.getOfficialTags());
        setGeneralTags(storage.loadTags());
        const savedConfig = storage.getGoogleSheetsConfig();
        if (savedConfig) {
            setSheetsConfig(savedConfig);
        }
    }, []);

    const handleSave = () => {
        storage.saveProfile(profile);
        storage.saveOfficialTags(officialTags);
        storage.saveTags(generalTags);
        storage.saveGoogleSheetsConfig(sheetsConfig);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleSync = async () => {
        if (!sheetsConfig.sheetId || !sheetsConfig.clientEmail || !sheetsConfig.privateKey) {
            setSyncMessage("Please save configuration first.");
            return;
        }
        setIsSyncing(true);
        setSyncMessage("");
        try {
            const result = await syncWithGoogle(sheetsConfig, transactions);
            setSyncMessage(result.message);
        } catch (error: any) {
            setSyncMessage(`Error: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const addOfficialTag = () => {
        if (newTag && !officialTags.includes(newTag)) {
            setOfficialTags([...officialTags, newTag]);
            setNewTag("");
        }
    };

    const removeOfficialTag = (tagToRemove: string) => {
        setOfficialTags(officialTags.filter(tag => tag !== tagToRemove));
    };

    const addGeneralTag = () => {
        if (newGeneralTag && !generalTags.includes(newGeneralTag)) {
            setGeneralTags([...generalTags, newGeneralTag]);
            setNewGeneralTag("");
        }
    };

    const removeGeneralTag = (tagToRemove: string) => {
        setGeneralTags(generalTags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>User Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                placeholder="Your Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input
                                id="currency"
                                value={profile.currency}
                                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                                placeholder="e.g. INR, USD"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="income">Monthly Income</Label>
                            <Input
                                id="income"
                                type="number"
                                value={profile.monthlyIncome}
                                onChange={(e) => setProfile({ ...profile, monthlyIncome: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="savings">Target Monthly Savings</Label>
                            <Input
                                id="savings"
                                type="number"
                                value={profile.savingsGoal}
                                onChange={(e) => setProfile({ ...profile, savingsGoal: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="family">Family Size</Label>
                            <Input
                                id="family"
                                type="number"
                                value={profile.familySize}
                                onChange={(e) => setProfile({ ...profile, familySize: parseInt(e.target.value) || 1 })}
                                min={1}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>General Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            value={newGeneralTag}
                            onChange={(e) => setNewGeneralTag(e.target.value)}
                            placeholder="Add new tag (e.g. Delhi)"
                            onKeyDown={(e) => e.key === 'Enter' && addGeneralTag()}
                        />
                        <Button onClick={addGeneralTag} variant="secondary">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {generalTags.map(tag => (
                            <div key={tag} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full text-sm">
                                <span>{tag}</span>
                                <button
                                    onClick={() => removeGeneralTag(tag)}
                                    className="text-muted-foreground hover:text-destructive ml-1"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Google Sheets Integration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="sheetId">Google Sheet ID</Label>
                        <Input
                            id="sheetId"
                            value={sheetsConfig.sheetId}
                            onChange={(e) => setSheetsConfig({ ...sheetsConfig, sheetId: e.target.value })}
                            placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                        />
                        <p className="text-xs text-muted-foreground">The ID from your Google Sheet URL.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clientEmail">Service Account Email</Label>
                        <Input
                            id="clientEmail"
                            value={sheetsConfig.clientEmail}
                            onChange={(e) => setSheetsConfig({ ...sheetsConfig, clientEmail: e.target.value })}
                            placeholder="expense-bot@project-id.iam.gserviceaccount.com"
                        />
                        <p className="text-xs text-muted-foreground">Share your sheet with this email as 'Editor'.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="privateKey">Private Key</Label>
                        <Textarea
                            id="privateKey"
                            value={sheetsConfig.privateKey}
                            onChange={(e) => setSheetsConfig({ ...sheetsConfig, privateKey: e.target.value })}
                            placeholder="-----BEGIN PRIVATE KEY-----\n..."
                            className="font-mono text-xs h-24"
                        />
                        <p className="text-xs text-muted-foreground">Copy the entire private key from your JSON key file.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={handleSync} disabled={isSyncing} variant="outline">
                            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                        {syncMessage && <span className="text-sm text-muted-foreground">{syncMessage}</span>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Official Expense Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add new official tag (e.g. Client A)"
                            onKeyDown={(e) => e.key === 'Enter' && addOfficialTag()}
                        />
                        <Button onClick={addOfficialTag} variant="secondary">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {officialTags.map(tag => (
                            <div key={tag} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full text-sm">
                                <span>{tag}</span>
                                <button
                                    onClick={() => removeOfficialTag(tag)}
                                    className="text-muted-foreground hover:text-destructive ml-1"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Button onClick={handleSave} className="w-full md:w-auto">
                <Save className="mr-2 h-4 w-4" />
                {isSaved ? 'Saved!' : 'Save All Settings'}
            </Button>
        </div>
    );
}
