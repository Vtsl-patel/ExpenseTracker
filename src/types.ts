export interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Cap {
  weekly: number;
  monthly: number;
}

export type Caps = Record<string, Cap>;

export type Tab = 'dashboard' | 'history' | 'reports' | 'caps';

export type ReportMode = 'monthly' | 'quarterly' | 'yearly' | 'range';
