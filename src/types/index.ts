export interface IncomeSource {
  id: string
  name: string
  amount: number
  frequency: 'monthly' | 'biweekly' | 'weekly' | 'annual'
}

export interface ExpenseCategory {
  id: string
  name: string
  budgeted: number
  actual: number
  category:
    | 'housing'
    | 'food'
    | 'transport'
    | 'utilities'
    | 'entertainment'
    | 'healthcare'
    | 'other'
}

export interface Transaction {
  id: string
  date: string
  amount: number
  category: string
  notes: string
  type: 'income' | 'expense'
}

export interface Debt {
  id: string
  name: string
  type: 'credit_card' | 'auto' | 'student' | 'personal' | 'other'
  balance: number
  interestRate: number
  minPayment: number
  dueDate: number
}

export interface Mortgage {
  loanAmount: number
  interestRate: number
  termYears: number
  startDate: string
  extraPayment: number
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  color: string
}

export interface AppData {
  incomes: IncomeSource[]
  expenses: ExpenseCategory[]
  transactions: Transaction[]
  debts: Debt[]
  mortgage: Mortgage | null
  goals: SavingsGoal[]
}
