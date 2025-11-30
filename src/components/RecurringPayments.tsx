"use client";

import { useMemo } from "react";
import { Transaction, RecurringPayment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CalendarClock, AlertCircle, CheckCircle2 } from "lucide-react";

interface RecurringPaymentsProps {
    transactions: Transaction[];
}

export function RecurringPayments({ transactions }: RecurringPaymentsProps) {
    const recurringPayments = useMemo(() => {
        const groups: Record<string, Transaction[]> = {};

        // 1. Group by normalized description
        transactions.forEach(t => {
            // Simple normalization: lowercase and remove numbers/dates
            // This helps group "Netflix Jan" and "Netflix Feb" together
            const key = t.description.toLowerCase()
                .replace(/\d{2}\/\d{2}\/\d{4}/g, '') // Remove dates
                .replace(/\d+/g, '') // Remove numbers
                .trim();

            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });

        const detected: RecurringPayment[] = [];

        Object.entries(groups).forEach(([name, group]) => {
            // Filter out groups with only 1 transaction
            if (group.length < 2) return;

            // Sort by date
            group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // Check amount consistency
            const amounts = group.map(t => t.amount);
            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const isAmountConsistent = amounts.every(a => Math.abs(a - avgAmount) < avgAmount * 0.1); // 10% variance

            if (!isAmountConsistent) return;

            // Calculate frequency
            let totalDays = 0;
            for (let i = 1; i < group.length; i++) {
                const diffTime = Math.abs(new Date(group[i].date).getTime() - new Date(group[i - 1].date).getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                totalDays += diffDays;
            }
            const avgDays = totalDays / (group.length - 1);

            let frequency: 'Monthly' | 'Yearly' | 'Irregular' = 'Irregular';
            if (avgDays >= 25 && avgDays <= 35) frequency = 'Monthly';
            else if (avgDays >= 360 && avgDays <= 370) frequency = 'Yearly';

            if (frequency === 'Irregular') return;

            // Calculate next due date
            const lastTx = group[group.length - 1];
            const lastDate = new Date(lastTx.date);
            const nextDate = new Date(lastDate);
            if (frequency === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            if (frequency === 'Yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

            const today = new Date();
            const status = nextDate < today ? 'Overdue' : 'Active';

            detected.push({
                id: `${name.replace(/\s+/g, '-').toLowerCase()}-${Math.round(avgAmount)}`,
                name: group[0].description, // Use the first description as the name
                amount: avgAmount,
                frequency,
                lastDate: lastTx.date,
                nextDueDate: nextDate.toISOString().split('T')[0],
                confidence: 0.9,
                status
            });
        });

        return detected;
    }, [transactions]);

    const totalMonthlyFixed = recurringPayments
        .filter(p => p.frequency === 'Monthly')
        .reduce((sum, p) => sum + p.amount, 0);

    if (recurringPayments.length === 0) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-indigo-500" />
                    Recurring Payments
                </CardTitle>
                <Badge variant="secondary" className="text-lg">
                    {formatCurrency(totalMonthlyFixed)} / month
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recurringPayments.map(payment => (
                        <div key={payment.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                            <div>
                                <p className="font-medium">{payment.name}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">{payment.frequency}</Badge>
                                    <span>Due: {payment.nextDueDate}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="font-bold">{formatCurrency(payment.amount)}</span>
                                {payment.status === 'Overdue' ? (
                                    <Badge variant="destructive" className="text-xs flex gap-1">
                                        <AlertCircle className="h-3 w-3" /> Overdue
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="text-xs flex gap-1 bg-green-100 text-green-800 hover:bg-green-200">
                                        <CheckCircle2 className="h-3 w-3" /> Active
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
