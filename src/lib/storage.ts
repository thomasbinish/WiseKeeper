import { Transaction, UserProfile, Trip } from "@/types";

export interface StorageAdapter {
    saveTransactions(transactions: Transaction[]): void;
    loadTransactions(): Transaction[];
    saveTrips(trips: Trip[]): void;
    loadTrips(): Trip[];
    saveTags(tags: string[]): void;
    loadTags(): string[];
    saveProfile(profile: UserProfile): void;
    getProfile(): UserProfile | null;
    saveOfficialTags(tags: string[]): void;
    getOfficialTags(): string[];
    saveGoogleSheetsConfig(config: GoogleSheetsConfig): void;
    getGoogleSheetsConfig(): GoogleSheetsConfig | null;
}

export interface GoogleSheetsConfig {
    sheetId: string;
    clientEmail: string;
    privateKey: string;
}

class LocalStorageAdapter implements StorageAdapter {
    private readonly KEYS = {
        STORAGE_KEY: 'expense_analyzer_transactions',
        TRIPS_KEY: 'expense_analyzer_trips',
        TAGS_KEY: 'expense_analyzer_tags',
        PROFILE_KEY: 'expense_analyzer_profile',
        OFFICIAL_TAGS: 'expense_analyzer_official_tags',
        GOOGLE_SHEETS_CONFIG: 'expense_analyzer_google_sheets_config'
    };

    saveTransactions(transactions: Transaction[]): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(this.KEYS.STORAGE_KEY, JSON.stringify(transactions));
        } catch (error) {
            console.error('Error saving transactions:', error);
        }
    }

    loadTransactions(): Transaction[] {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(this.KEYS.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading transactions:', error);
            return [];
        }
    }

    saveTrips(trips: Trip[]): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(this.KEYS.TRIPS_KEY, JSON.stringify(trips));
        } catch (error) {
            console.error('Error saving trips:', error);
        }
    }

    loadTrips(): Trip[] {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(this.KEYS.TRIPS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading trips:', error);
            return [];
        }
    }

    saveTags(tags: string[]): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(this.KEYS.TAGS_KEY, JSON.stringify(tags));
        } catch (error) {
            console.error('Error saving tags:', error);
        }
    }

    loadTags(): string[] {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(this.KEYS.TAGS_KEY);
            const defaults = ["Official", "Food", "Travel", "Personal", "Trivandrum", "Muvattupuzha", "Delhi"];
            if (!stored) return defaults;

            const parsed = JSON.parse(stored);
            // Ensure defaults are always present
            const uniqueTags = Array.from(new Set([...defaults, ...parsed]));
            return uniqueTags.sort();
        } catch (error) {
            console.error('Error loading tags:', error);
            return ["Official", "Food", "Travel", "Personal", "Trivandrum", "Muvattupuzha", "Delhi"];
        }
    }

    saveProfile(profile: UserProfile): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(this.KEYS.PROFILE_KEY, JSON.stringify(profile));
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    }

    getProfile(): UserProfile | null {
        if (typeof window === 'undefined') return null;
        try {
            const stored = localStorage.getItem(this.KEYS.PROFILE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading profile:', error);
            return null;
        }
    }

    saveOfficialTags(tags: string[]): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(this.KEYS.OFFICIAL_TAGS, JSON.stringify(tags));
        } catch (error) {
            console.error('Error saving official tags:', error);
        }
    }

    getOfficialTags(): string[] {
        if (typeof window === 'undefined') return ["Official"];
        try {
            const stored = localStorage.getItem(this.KEYS.OFFICIAL_TAGS);
            return stored ? JSON.parse(stored) : ["Official"];
        } catch (error) {
            console.error('Error loading official tags:', error);
            return ["Official"];
        }
    }

    saveGoogleSheetsConfig(config: GoogleSheetsConfig): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(this.KEYS.GOOGLE_SHEETS_CONFIG, JSON.stringify(config));
        } catch (error) {
            console.error('Error saving google sheets config:', error);
        }
    }

    getGoogleSheetsConfig(): GoogleSheetsConfig | null {
        if (typeof window === 'undefined') return null;
        try {
            const stored = localStorage.getItem(this.KEYS.GOOGLE_SHEETS_CONFIG);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading google sheets config:', error);
            return null;
        }
    }
}

export const storage = new LocalStorageAdapter();
