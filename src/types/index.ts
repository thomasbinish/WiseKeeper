

export interface RecurringPayment {
    id: string;
    name: string;
    amount: number;
    frequency: 'Monthly' | 'Yearly' | 'Irregular';
    lastDate: string;
    nextDueDate: string;
    confidence: number;
    status: 'Active' | 'Overdue';
}

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

export interface UserProfile {
    name: string;
    monthlyIncome: number;
    familySize: number;
    currency: string;
    savingsGoal: number;
}

export interface Trip {
    id: string;
    name: string;
    start: string;
    end: string;
}

export interface Attachment {
    id: string;
    transactionId: string;
    fileName: string;
    fileType: string;
    size: number;
    createdAt: string;
}

export interface Transaction {
    id: string;
    date: string;
    amount: number;
    description: string;
    category: Category;
    confidence: number; // 0 to 1
    by: string;
    tags: string[];
    type: 'dr' | 'cr';
    attachments?: string[]; // Array of Attachment IDs
}
