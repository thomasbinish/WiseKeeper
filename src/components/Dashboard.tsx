"use client";

import { useMemo, useState } from "react";
import { Transaction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { IndianRupee, TrendingUp, ShoppingBag, Utensils, Wallet, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { RecurringPayments } from "@/components/RecurringPayments";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface DashboardProps {
    transactions: Transaction[];
    trips?: Array<{ id: string, name: string }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

type DateRange = "all" | "this-month" | "last-month" | "this-year" | "last-year" | "specific-month";

export function Dashboard({ transactions, trips = [] }: DashboardProps) {
    const [dateRange, setDateRange] = useState<DateRange>("all");
    const [specificMonth, setSpecificMonth] = useState<string>(new Date().toISOString().slice(0, 7));

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return transactions.filter(t => {
            const tDate = new Date(t.date);
            const tMonth = tDate.getMonth();
            const tYear = tDate.getFullYear();

            switch (dateRange) {
                case "this-month":
                    return tMonth === currentMonth && tYear === currentYear;
                case "last-month":
                    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                    return tMonth === lastMonth && tYear === lastMonthYear;
                case "this-year":
                    return tYear === currentYear;
                case "last-year":
                    return tYear === currentYear - 1;
                case "specific-month":
                    if (!specificMonth) return true;
                    return t.date.startsWith(specificMonth);
                default:
                    return true;
            }
        });
    }, [transactions, dateRange, specificMonth]);

    const metrics = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.type === 'dr' && t.category !== 'Investment' && t.category !== 'Insurance');
        const income = filteredTransactions.filter(t => t.type === 'cr');
        const investments = filteredTransactions.filter(t => t.category === 'Investment' || t.category === 'Insurance');

        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
        const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
        const totalInvestment = investments.reduce((sum, t) => sum + t.amount, 0);

        // Category breakdown (Expenses only)
        const categoryTotals: Record<string, number> = {};
        expenses.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        const topCategory = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)[0] || ["None", 0];

        const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
            name,
            value
        }));

        // Daily spending for bar chart (Expenses only)
        const dailyTotals: Record<string, number> = {};
        expenses.forEach(t => {
            dailyTotals[t.date] = (dailyTotals[t.date] || 0) + t.amount;
        });

        const dailyData = Object.entries(dailyTotals)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, amount]) => ({
                date,
                amount
            }));

        // Tag Analysis (Expenses only)
        const tagTotals: Record<string, number> = {};
        const tripTotals: Record<string, number> = {};

        expenses.forEach(t => {
            if (t.tags) {
                t.tags.forEach(tag => {
                    tagTotals[tag] = (tagTotals[tag] || 0) + t.amount;

                    // Check if this tag is a known trip name
                    if (trips.some(trip => trip.name === tag)) {
                        tripTotals[tag] = (tripTotals[tag] || 0) + t.amount;
                    }
                });
            }
        });

        const tagData = Object.entries(tagTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const tripData = Object.entries(tripTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Financial Overview Data
        const financialData = [
            { name: 'Income', value: totalIncome, fill: '#22c55e' },
            { name: 'Expenses', value: totalExpenses, fill: '#ef4444' },
            { name: 'Investment', value: totalInvestment, fill: '#3b82f6' },
        ];

        return { totalExpenses, totalIncome, totalInvestment, topCategory, categoryData, dailyData, tagData, tripData, financialData };
    }, [filteredTransactions, trips]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="this-month">This Month</SelectItem>
                            <SelectItem value="last-month">Last Month</SelectItem>
                            <SelectItem value="this-year">This Year</SelectItem>
                            <SelectItem value="last-year">Last Year</SelectItem>
                            <SelectItem value="specific-month">Specific Month</SelectItem>
                        </SelectContent>
                    </Select>
                    {dateRange === 'specific-month' && (
                        <input
                            type="month"
                            value={specificMonth}
                            onChange={(e) => setSpecificMonth(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-[180px]"
                        />
                    )}
                    {dateRange !== 'all' && dateRange !== 'specific-month' && (
                        <span className="text-sm text-muted-foreground font-medium">
                            {(() => {
                                const now = new Date();
                                const currentMonth = now.getMonth();
                                const currentYear = now.getFullYear();
                                let start, end;

                                switch (dateRange) {
                                    case "this-month":
                                        start = new Date(currentYear, currentMonth, 1);
                                        end = new Date(currentYear, currentMonth + 1, 0);
                                        break;
                                    case "last-month":
                                        start = new Date(currentYear, currentMonth - 1, 1);
                                        end = new Date(currentYear, currentMonth, 0);
                                        break;
                                    case "this-year":
                                        start = new Date(currentYear, 0, 1);
                                        end = new Date(currentYear, 11, 31);
                                        break;
                                    case "last-year":
                                        start = new Date(currentYear - 1, 0, 1);
                                        end = new Date(currentYear - 1, 11, 31);
                                        break;
                                }
                                return start && end ? `${start.toLocaleDateString()} - ${end.toLocaleDateString()}` : "";
                            })()}
                        </span>
                    )}
                </div>
                <Button variant="outline" onClick={handlePrint} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Report
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <Wallet className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalIncome)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <IndianRupee className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalExpenses)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.totalInvestment)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate" title={metrics.topCategory[0]}>{metrics.topCategory[0]}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(metrics.topCategory[1])}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Overview Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.financialData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                            <Bar dataKey="value">
                                {metrics.financialData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Recurring Payments Section */}
            <RecurringPayments transactions={filteredTransactions} />

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Spending by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={metrics.categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {metrics.categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Daily Spending Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.dailyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                                <Bar dataKey="amount" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Tag Analysis Chart */}
            <div className="grid gap-4 md:grid-cols-2">
                {metrics.tagData.length > 0 && (
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Expenses by Tag</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.tagData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} />
                                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="value" fill="#82ca9d">
                                        {metrics.tagData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={
                                                entry.name === 'Fixed Expense' ? '#f97316' :
                                                    entry.name === 'Variable Expense' ? '#3b82f6' :
                                                        '#82ca9d'
                                            } />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Trip Analysis Chart */}
                {metrics.tripData.length > 0 && (
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Expenses by Trip</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.tripData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="value" fill="#6366f1" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>
            <style jsx global>{`
                @media print {
                    header, footer, .print\\:hidden {
                        display: none !important;
                    }
                    body {
                        background: white;
                        color: black;
                    }
                    .card {
                        border: 1px solid #ddd;
                        box-shadow: none;
                        break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}
