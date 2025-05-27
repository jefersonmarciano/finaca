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
