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
