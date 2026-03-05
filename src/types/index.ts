// User & Auth
export interface User {
  id: number;
  fullname: string;
  email: string;
  profileImageUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  fullname: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Category
export interface Category {
  id: number;
  profileId: number;
  name: string;
  icon: string;
  type: 'EXPENSE' | 'INCOME';
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  name: string;
  icon: string;
  type: 'EXPENSE' | 'INCOME';
}

// Expense
export interface Expense {
  id: number;
  name: string;
  icon: string;
  categoryName: string;
  categoryId: number;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  name: string;
  icon?: string;
  categoryId: number;
  amount: number;
  date: string;
}

// Income
export interface Income {
  id: number;
  name: string;
  icon: string;
  categoryName: string;
  categoryId: number;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeFormData {
  name: string;
  icon?: string;
  categoryId: number;
  amount: number;
  date: string;
}

// Dashboard
export interface DashboardData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  recentExpenses: Expense[];
  recentIncomes: Income[];
  categoryBreakdown: Record<string, number>;
}

// Analytics
export interface DailyData {
  date: string;
  amount: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

export interface AnalyticsData {
  dailySpending: DailyData[];
  dailyIncome: DailyData[];
  categoryBreakdown: Record<string, number>;
  monthlyTrends: MonthlyData[];
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  averageDailySpending: number;
  highestSpendingDay: number;
  topSpendingCategory: string;
  savingsRate: number;
}

// Budget Goals
export interface BudgetGoal {
  id: number;
  categoryId: number | null;
  categoryName: string;
  month: number;
  year: number;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  alertThreshold: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
  isRecurring: boolean;
}

export interface BudgetFormData {
  categoryId: number | null;
  amount: number;
  alertThreshold?: number;
  isRecurring?: boolean;
}

// Recurring Transactions
export interface RecurringTransaction {
  id: number;
  name: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  categoryId: number;
  categoryName: string;
  icon: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  dayOfPeriod: number;
  startDate: string;
  endDate: string | null;
  nextExecution: string;
  lastExecuted: string | null;
  isActive: boolean;
  sendReminder: boolean;
  reminderDaysBefore: number;
}

export interface RecurringFormData {
  name: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  categoryId: number;
  icon?: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  dayOfPeriod: number;
  startDate: string;
  endDate?: string | null;
  sendReminder?: boolean;
  reminderDaysBefore?: number;
}

// Smart Insights
export interface SpendingPrediction {
  predictedTotal: number;
  categoryPredictions: Record<string, number>;
  basedOnMonths: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  nextMonth: string;
  generatedAt: string;
}

export interface Anomaly {
  transactionId: number;
  name: string;
  amount: number;
  category: string;
  date: string;
  categoryAverage: number;
  percentageAboveAverage: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

export interface AiTips {
  tips: string;
  basedOnSpending: number;
  topCategory: string;
  topCategorySpending: number;
  generatedAt: string;
}

export interface SpendingSummary {
  currentMonthSpending: number;
  lastMonthSpending: number;
  dailyAverage: number;
  projectedMonthTotal: number;
  comparedToLastMonth: number;
  trend: 'UP' | 'DOWN' | 'SAME';
  daysPassed: number;
  daysRemaining: number;
}

export interface SpendingAnalysis {
  analysis: string;
  totalIncome: number;
  totalExpense: number;
  categoryBreakdown: Record<string, number>;
  savingsRate: number;
  potentialSavings: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  analyzedAt: string;
}

export interface FinancialHealth {
  analysis: string;
  healthScore: number;
  healthStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  savingsRate: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  calculatedAt: string;
  cached?: boolean;
}

export interface AiQueryResponse {
  question: string;
  answer: string;
  answeredAt: string;
}

export interface RemainingQueries {
  used: number;
  limit: number;
  remaining: number;
}

// Bank Import
export interface BankTransaction {
  id: number;
  transactionDate: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  balance: number;
  merchantName: string;
  suggestedCategory: string;
  categoryId: number | null;
  isConverted: boolean;
}

export interface ImportResult {
  success: boolean;
  message: string;
  totalImported: number;
  totalSkipped: number;
  skippedReasons: string[];
}

export interface ImportUsage {
  used: number;
  limit: number;
  remaining: number;
}

// Subscription
export interface SubscriptionPlan {
  id: number;
  name: 'FREE' | 'BASIC' | 'PREMIUM';
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxCategories: number;
  maxBankImports: number;
  aiQueriesPerMonth: number;
}

export interface Subscription {
  id: number;
  planType: 'FREE' | 'BASIC' | 'PREMIUM';
  planName: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  autoRenew: boolean;
  daysRemaining: number;
  aiQueriesUsed: number;
  aiQueriesLimit: number;
  csvImportsUsed: number;
  csvImportsLimit: number;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
  planName: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
}

export interface PaymentHistory {
  id: number;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  failureReason?: string;
  createdAt: string;
}

export interface FilterData {
  type: 'EXPENSE' | 'INCOME' | 'expence' | 'income';
  startDate?: string;
  endDate?: string;
  keyword?: string;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}
