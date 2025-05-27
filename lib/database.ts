import { supabase } from "./supabase"
import type { Transaction, MonthlySettings, ExtraIncome } from "@/types/financial"

// Função para verificar se as tabelas existem
export async function checkTablesExist() {
  try {
    const { error } = await supabase.from("transactions").select("id").limit(1)
    return !error
  } catch {
    return false
  }
}

// Transações
export async function getTransactions(month: number, year: number) {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", `${year}-${month.toString().padStart(2, "0")}-01`)
      .lt("date", `${year}-${(month + 1).toString().padStart(2, "0")}-01`)
      .order("date", { ascending: true })

    if (error) {
      console.error("Erro ao buscar transações:", error)
      return []
    }
    return data as Transaction[]
  } catch (error) {
    console.error("Erro na conexão:", error)
    return []
  }
}

export async function addTransaction(transaction: Omit<Transaction, "id" | "created_at" | "updated_at">) {
  try {
    const { data, error } = await supabase.from("transactions").insert([transaction]).select().single()

    if (error) throw error
    return data as Transaction
  } catch (error) {
    console.error("Erro ao adicionar transação:", error)
    throw error
  }
}

export async function deleteTransaction(id: string) {
  try {
    const { error } = await supabase.from("transactions").delete().eq("id", id)
    if (error) throw error
  } catch (error) {
    console.error("Erro ao deletar transação:", error)
    throw error
  }
}

// Configurações mensais
export async function getMonthlySettings(month: number, year: number) {
  try {
    const { data, error } = await supabase
      .from("monthly_settings")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Erro ao buscar configurações:", error)
      return null
    }
    return data as MonthlySettings | null
  } catch (error) {
    console.error("Erro na conexão:", error)
    return null
  }
}

export async function upsertMonthlySettings(settings: Omit<MonthlySettings, "id" | "created_at" | "updated_at">) {
  try {
    const { data, error } = await supabase.from("monthly_settings").upsert([settings]).select().single()

    if (error) throw error
    return data as MonthlySettings
  } catch (error) {
    console.error("Erro ao salvar configurações:", error)
    throw error
  }
}

// Valores extras
export async function getExtraIncome(month: number, year: number) {
  try {
    const { data, error } = await supabase
      .from("extra_income")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .order("date", { ascending: false })

    if (error) {
      console.error("Erro ao buscar valores extras:", error)
      return []
    }
    return data as ExtraIncome[]
  } catch (error) {
    console.error("Erro na conexão:", error)
    return []
  }
}

export async function addExtraIncome(extraIncome: Omit<ExtraIncome, "id" | "created_at">) {
  try {
    const { data, error } = await supabase.from("extra_income").insert([extraIncome]).select().single()

    if (error) throw error
    return data as ExtraIncome
  } catch (error) {
    console.error("Erro ao adicionar valor extra:", error)
    throw error
  }
}

export async function deleteExtraIncome(id: string) {
  try {
    const { error } = await supabase.from("extra_income").delete().eq("id", id)
    if (error) throw error
  } catch (error) {
    console.error("Erro ao deletar valor extra:", error)
    throw error
  }
}
