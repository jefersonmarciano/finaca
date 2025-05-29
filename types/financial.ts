export interface Transaction {
  id: string
  type: "receita" | "gasto"
  category: string
  amount: number
  date: string
  description: string
  is_fixed: boolean
  created_at?: string
  updated_at?: string
}

export interface MonthlySettings {
  id: string
  month: number
  year: number
  das_value: number
  created_at?: string
  updated_at?: string
}

export interface ExtraIncome {
  id: string
  amount: number
  description: string
  date: string
  month: number
  year: number
  created_at?: string
}

export interface MonthlySummary {
  id: string
  month: number
  year: number
  total_receitas: number
  total_gastos: number
  total_extras: number
  das_value: number
  saldo_mensal: number
  ir_mensal: number
  created_at?: string
}

export interface MonthlySavings {
  id: string
  month: number
  year: number
  amount: number
  description: string
  created_at?: string
}

export interface TotalSavings {
  total_accumulated: number
  months_count: number
  last_update: string
}

// Novos tipos para cartões de crédito
export interface CreditCard {
  id: string
  name: string
  credit_limit: number
  closing_day: number
  due_day: number
  created_at?: string
}

export interface CardTransaction {
  id: string
  card_id: string
  description: string
  amount: number
  installments: number
  current_installment: number
  date: string
  category: string
  created_at?: string
  card?: CreditCard
}

export interface CardInstallment {
  id: string
  card_transaction_id: string
  installment_number: number
  amount: number
  due_date: string
  paid: boolean
  created_at?: string
  transaction?: CardTransaction
}

export interface CardSummary {
  card: CreditCard
  current_balance: number
  available_limit: number
  next_due_date: string
  next_due_amount: number
  transactions_count: number
}
