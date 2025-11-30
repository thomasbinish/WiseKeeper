import { Transaction } from "@/types";
import { GoogleSheetsConfig } from "@/lib/storage";

export interface SyncResult {
    success: boolean;
    syncedCount: number;
    message: string;
}

export async function syncWithGoogle(config: GoogleSheetsConfig, transactions: Transaction[]): Promise<SyncResult> {
    const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config, transactions }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
    }

    return await response.json();
}
