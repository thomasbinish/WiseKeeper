import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { config, transactions } = await req.json();
        const { sheetId, clientEmail, privateKey } = config;

        if (!sheetId || !clientEmail || !privateKey) {
            return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Check if header exists, if not create it
        const headerRow = ["ID", "Date", "Description", "Amount", "Category", "Type", "Tags"];

        // Read first row
        let hasHeader = false;
        try {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: 'A1:G1',
            });
            if (response.data.values && response.data.values.length > 0) {
                hasHeader = true;
            }
        } catch (e) {
            // Likely sheet is empty or permission error
            console.log("Error reading header or empty sheet", e);
        }

        if (!hasHeader) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: 'A1:G1',
                valueInputOption: 'RAW',
                requestBody: { values: [headerRow] },
            });
        }

        // 2. Read all existing data
        const readResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'A2:G', // Assuming data starts from row 2
        });

        const rows = readResponse.data.values || [];
        const remoteIds = new Set(rows.map(r => r[0])); // ID is first column

        // 3. Identify new transactions to push
        const newTransactions = transactions.filter((t: any) => !remoteIds.has(t.id));

        if (newTransactions.length > 0) {
            const newRows = newTransactions.map((t: any) => [
                t.id,
                t.date,
                t.description,
                t.amount,
                t.category,
                t.type,
                t.tags.join(',')
            ]);

            await sheets.spreadsheets.values.append({
                spreadsheetId: sheetId,
                range: 'A2:G',
                valueInputOption: 'RAW',
                requestBody: { values: newRows },
            });
        }

        // 4. (Optional) Pull data back - for now just return success count
        // In a full sync, we would parse `rows` back to Transaction objects and return them

        return NextResponse.json({
            success: true,
            syncedCount: newTransactions.length,
            message: `Synced ${newTransactions.length} new transactions to Sheet.`
        });

    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
