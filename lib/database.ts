import { supabase } from "./supabase"
import type {
  Transaction,
  MonthlySettings,
  ExtraIncome,
  MonthlySummary,
  MonthlySavings,
  TotalSavings,
  CreditCard,
  CardTransaction,
  CardInstallment,
  CardSummary,
} from "@/types/financial"

// Função para verificar se as tabelas existem
export async function checkTablesExist() {
  try {
    const { error } = await supabase.from("transactions").select("id").limit(1)
    return !error
  } catch {
    return false
  }
}

// Função para verificar se a tabela de histórico existe
export async function checkHistoryTablesExist() {
  try {
    const { error } = await supabase.from("monthly_summary").select("id").limit(1)
    return !error
  } catch {
    return false
  }
}

// Função para verificar se a tabela de reservas existe
export async function checkSavingsTablesExist() {
  try {
    const { error } = await supabase.from("monthly_savings").select("id").limit(1)
    return !error
  } catch {
    return false
  }
}

// Função para verificar se as tabelas de cartão existem
export async function checkCardTablesExist() {
  try {
    const { error } = await supabase.from("credit_cards").select("id").limit(1)
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

// Histórico mensal
export async function getMonthlySummaries() {
  try {
    // Verificar se a tabela existe antes de consultar
    const tableExists = await checkHistoryTablesExist()
    if (!tableExists) {
      console.log("Tabela de histórico não existe ainda")
      return []
    }

    const { data, error } = await supabase
      .from("monthly_summary")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false })

    if (error) {
      console.error("Erro ao buscar histórico mensal:", error)
      return []
    }
    return data as MonthlySummary[]
  } catch (error) {
    console.error("Erro na conexão:", error)
    return []
  }
}

export async function getMonthlySummary(month: number, year: number) {
  try {
    // Verificar se a tabela existe antes de consultar
    const tableExists = await checkHistoryTablesExist()
    if (!tableExists) {
      return null
    }

    const { data, error } = await supabase
      .from("monthly_summary")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Erro ao buscar resumo mensal:", error)
      return null
    }
    return data as MonthlySummary | null
  } catch (error) {
    console.error("Erro na conexão:", error)
    return null
  }
}

// Reservas mensais
export async function getMonthlySavings() {
  try {
    // Verificar se a tabela existe antes de consultar
    const tableExists = await checkSavingsTablesExist()
    if (!tableExists) {
      console.log("Tabela de reservas não existe ainda")
      return []
    }

    const { data, error } = await supabase
      .from("monthly_savings")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false })

    if (error) {
      console.error("Erro ao buscar reservas mensais:", error)
      return []
    }
    return data as MonthlySavings[]
  } catch (error) {
    console.error("Erro na conexão:", error)
    return []
  }
}

export async function getMonthlySaving(month: number, year: number) {
  try {
    // Verificar se a tabela existe antes de consultar
    const tableExists = await checkSavingsTablesExist()
    if (!tableExists) {
      return null
    }

    const { data, error } = await supabase
      .from("monthly_savings")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Erro ao buscar reserva mensal:", error)
      return null
    }
    return data as MonthlySavings | null
  } catch (error) {
    console.error("Erro na conexão:", error)
    return null
  }
}

export async function upsertMonthlySaving(saving: Omit<MonthlySavings, "id" | "created_at">) {
  try {
    // Verificar se a tabela existe antes de inserir
    const tableExists = await checkSavingsTablesExist()
    if (!tableExists) {
      throw new Error("Tabela de reservas não existe. Execute o script SQL primeiro.")
    }

    const { data, error } = await supabase.from("monthly_savings").upsert([saving]).select().single()

    if (error) throw error
    return data as MonthlySavings
  } catch (error) {
    console.error("Erro ao salvar reserva:", error)
    throw error
  }
}

// Adicionar função para deletar reserva mensal
export async function deleteMonthlySaving(id: string) {
  try {
    const { error } = await supabase.from("monthly_savings").delete().eq("id", id)
    if (error) throw error
  } catch (error) {
    console.error("Erro ao deletar reserva:", error)
    throw error
  }
}

export async function getTotalSavings() {
  try {
    // Verificar se a tabela existe antes de consultar
    const tableExists = await checkSavingsTablesExist()
    if (!tableExists) {
      return { total_accumulated: 0, months_count: 0, last_update: new Date().toISOString() }
    }

    const { data, error } = await supabase.from("total_savings_view").select("*").single()

    if (error) {
      console.error("Erro ao buscar total de reservas:", error)
      return { total_accumulated: 0, months_count: 0, last_update: new Date().toISOString() }
    }
    return data as TotalSavings
  } catch (error) {
    console.error("Erro na conexão:", error)
    return { total_accumulated: 0, months_count: 0, last_update: new Date().toISOString() }
  }
}

// Arquivar mês atual
export async function archiveCurrentMonth(month: number, year: number) {
  try {
    // Verificar se as tabelas de histórico existem
    const tableExists = await checkHistoryTablesExist()
    if (!tableExists) {
      throw new Error("Tabelas de histórico não existem. Execute o script SQL primeiro.")
    }

    const { data, error } = await supabase.rpc("archive_month_data", {
      target_month: month,
      target_year: year,
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error("Erro ao arquivar mês:", error)
    throw error
  }
}

// Obter transações arquivadas
export async function getArchivedTransactions(month: number, year: number) {
  try {
    const { data, error } = await supabase
      .from("archived_transactions")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .order("date", { ascending: true })

    if (error) {
      console.error("Erro ao buscar transações arquivadas:", error)
      return []
    }
    return data as Transaction[]
  } catch (error) {
    console.error("Erro na conexão:", error)
    return []
  }
}

// Obter valores extras arquivados
export async function getArchivedExtraIncome(month: number, year: number) {
  try {
    const { data, error } = await supabase
      .from("archived_extra_income")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .order("date", { ascending: false })

    if (error) {
      console.error("Erro ao buscar valores extras arquivados:", error)
      return []
    }
    return data as ExtraIncome[]
  } catch (error) {
    console.error("Erro na conexão:", error)
    return []
  }
}

// Preparar novo mês (copia transações fixas para o próximo mês)
export async function prepareNextMonth(currentMonth: number, currentYear: number) {
  try {
    // Calcular próximo mês e ano
    let nextMonth = currentMonth + 1
    let nextYear = currentYear

    if (nextMonth > 12) {
      nextMonth = 1
      nextYear++
    }

    // Buscar transações fixas do mês atual
    const { data: fixedTransactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("is_fixed", true)
      .gte("date", `${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`)
      .lt("date", `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-01`)

    if (error) throw error

    // Criar novas transações para o próximo mês
    if (fixedTransactions && fixedTransactions.length > 0) {
      const newTransactions = fixedTransactions.map((transaction: any) => {
        const oldDate = new Date(transaction.date)
        const newDate = new Date(nextYear, nextMonth - 1, oldDate.getDate())

        return {
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          date: newDate.toISOString().split("T")[0],
          description: transaction.description,
          is_fixed: transaction.is_fixed,
        }
      })

      const { error: insertError } = await supabase.from("transactions").insert(newTransactions)
      if (insertError) throw insertError
    }

    // Criar configuração para o próximo mês
    const { data: currentSettings } = await supabase
      .from("monthly_settings")
      .select("*")
      .eq("month", currentMonth)
      .eq("year", currentYear)
      .single()

    if (currentSettings) {
      await upsertMonthlySettings({
        month: nextMonth,
        year: nextYear,
        das_value: currentSettings.das_value,
      })
    }

    return true
  } catch (error) {
    console.error("Erro ao preparar próximo mês:", error)
    throw error
  }
}

// ==================== FUNÇÕES DE CARTÃO DE CRÉDITO ====================

// Cartões de crédito
export async function getCreditCards() {
  try {
    const tableExists = await checkCardTablesExist()
    if (!tableExists) {
      console.log("Tabelas de cartão não existem ainda")
      return []
    }

    const { data, error } = await supabase.from("credit_cards").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Erro ao buscar cartões:", error)
      return []
    }
    return data as CreditCard[]
  } catch (error) {
    console.error("Erro na conexão:", error)
    return []
  }
}

export async function addCreditCard(card: Omit<CreditCard, "id" | "created_at">) {
  try {
    const { data, error } = await supabase.from("credit_cards").insert([card]).select().single()

    if (error) throw error
    return data as CreditCard
  } catch (error) {
    console.error("Erro ao adicionar cartão:", error)
    throw error
  }
}

export async function updateCreditCard(id: string, card: Partial<Omit<CreditCard, "id" | "created_at">>) {
  try {
    const { data, error } = await supabase.from("credit_cards").update(card).eq("id", id).select().single()

    if (error) throw error
    return data as CreditCard
  } catch (error) {
    console.error("Erro ao atualizar cartão:", error)
    throw error
  }
}

export async function deleteCreditCard(id: string) {
  try {
    const { error } = await supabase.from("credit_cards").delete().eq("id", id)
    if (error) throw error
  } catch (error) {
    console.error("Erro ao deletar cartão:", error)
    throw error
  }
}

// Transações de cartão
export async function getCardTransactions(month?: number, year?: number) {
  try {
    const tableExists = await checkCardTablesExist()
    if (!tableExists) {
      return []
    }

    let query = supabase.from("card_transactions").select(`
      *,
      card:credit_cards(*)
    `)

    if (month && year) {
      query = query
        .gte("date", `${year}-${month.toString().padStart(2, "0")}-01`)
        .lt("date", `${year}-${(month + 1).toString().padStart(2, "0")}-01`)
    }

    const { data, error } = await query.order("date", { ascending: false })

    if (error) {
      console.error("Erro ao buscar transações de cartão:", error)
      return []
    }
    return data as CardTransaction[]
  } catch (error) {
    console.error("Erro na conexão:", error)
    return []
  }
}

export async function addCardTransaction(transaction: Omit<CardTransaction, "id" | "created_at" | "card">) {
  try {
    const { data, error } = await supabase.from("card_transactions").insert([transaction]).select().single()

    if (error) throw error

    // Criar parcelas se for parcelado
    if (transaction.installments > 1) {
      await createInstallments(data.id, transaction.amount, transaction.installments, transaction.date)
    }

    return data as CardTransaction
  } catch (error) {
    console.error("Erro ao adicionar transação de cartão:", error)
    throw error
  }
}

export async function deleteCardTransaction(id: string) {
  try {
    // Deletar parcelas primeiro
    await supabase.from("card_installments").delete().eq("card_transaction_id", id)

    // Deletar transação
    const { error } = await supabase.from("card_transactions").delete().eq("id", id)
    if (error) throw error
  } catch (error) {
    console.error("Erro ao deletar transação de cartão:", error)
    throw error
  }
}

// Parcelas
async function createInstallments(transactionId: string, totalAmount: number, installments: number, firstDate: string) {
  try {
    const installmentAmount = totalAmount / installments
    const installmentsData = []

    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date(firstDate)
      dueDate.setMonth(dueDate.getMonth() + i - 1)

      installmentsData.push({
        card_transaction_id: transactionId,
        installment_number: i,
        amount: installmentAmount,
        due_date: dueDate.toISOString().split("T")[0],
        paid: false,
      })
    }

    const { error } = await supabase.from("card_installments").insert(installmentsData)
    if (error) throw error
  } catch (error) {
    console.error("Erro ao criar parcelas:", error)
    throw error
  }
}

export async function getCardInstallments(cardId?: string, month?: number, year?: number) {
  try {
    const tableExists = await checkCardTablesExist()
    if (!tableExists) {
      return []
    }

    let query = supabase.from("card_installments").select(`
      *,
      transaction:card_transactions(
        *,
        card:credit_cards(*)
      )
    `)

    if (month && year) {
      query = query
        .gte("due_date", `${year}-${month.toString().padStart(2, "0")}-01`)
        .lt("due_date", `${year}-${(month + 1).toString().padStart(2, "0")}-01`)
    }

    const { data, error } = await query.order("due_date", { ascending: true })

    if (error) {
      console.error("Erro ao buscar parcelas:", error)
      return []
    }

    let result = data as CardInstallment[]

    // Filtrar por cartão se especificado
    if (cardId) {
      result = result.filter((installment) => installment.transaction?.card_id === cardId)
    }

    return result
  } catch (error) {
    console.error("Erro na conexão:", error)
    return []
  }
}

export async function updateInstallmentPaid(id: string, paid: boolean) {
  try {
    const { error } = await supabase.from("card_installments").update({ paid }).eq("id", id)
    if (error) throw error
  } catch (error) {
    console.error("Erro ao atualizar parcela:", error)
    throw error
  }
}

// Resumo dos cartões
export async function getCardsSummary(): Promise<CardSummary[]> {
  try {
    const tableExists = await checkCardTablesExist()
    if (!tableExists) {
      return []
    }

    const cards = await getCreditCards()
    const summaries: CardSummary[] = []

    for (const card of cards) {
      // Buscar parcelas não pagas
      const { data: unpaidInstallments, error } = await supabase
        .from("card_installments")
        .select(`
          *,
          transaction:card_transactions!inner(card_id)
        `)
        .eq("transaction.card_id", card.id)
        .eq("paid", false)

      if (error) {
        console.error("Erro ao buscar parcelas não pagas:", error)
        continue
      }

      const currentBalance = unpaidInstallments?.reduce((sum, installment) => sum + installment.amount, 0) || 0
      const availableLimit = card.credit_limit - currentBalance

      // Próximo vencimento
      const nextInstallment = unpaidInstallments
        ?.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .find((installment) => new Date(installment.due_date) >= new Date())

      const nextDueDate = nextInstallment?.due_date || ""
      const nextDueAmount =
        unpaidInstallments
          ?.filter((installment) => installment.due_date === nextDueDate)
          .reduce((sum, installment) => sum + installment.amount, 0) || 0

      // Contar transações
      const { count } = await supabase
        .from("card_transactions")
        .select("*", { count: "exact", head: true })
        .eq("card_id", card.id)

      summaries.push({
        card,
        current_balance: currentBalance,
        available_limit: availableLimit,
        next_due_date: nextDueDate,
        next_due_amount: nextDueAmount,
        transactions_count: count || 0,
      })
    }

    return summaries
  } catch (error) {
    console.error("Erro ao gerar resumo dos cartões:", error)
    return []
  }
}
