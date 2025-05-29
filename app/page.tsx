"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { FinancialSummary } from "@/components/financial-summary"
import { ExtraIncomeForm } from "@/components/extra-income-form"
import { TransactionForm } from "@/components/transaction-form"
import { AlertsPanel } from "@/components/alerts-panel"
import { MonthHistory } from "@/components/month-history"
import { MonthSelector } from "@/components/month-selector"
import { SavingsTracker } from "@/components/savings-tracker"
import { CreditCardManager } from "@/components/credit-card-manager"
import {
  getTransactions,
  getMonthlySettings,
  getExtraIncome,
  upsertMonthlySettings,
  checkTablesExist,
  getCardTransactions,
} from "@/lib/database"
import type { Transaction, MonthlySettings, ExtraIncome } from "@/types/financial"

export default function FinancialControl() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [extraIncome, setExtraIncome] = useState<ExtraIncome[]>([])
  const [monthlySettings, setMonthlySettings] = useState<MonthlySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [cardTransactions, setCardTransactions] = useState<any[]>([])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setHasError(false)
      setErrorMessage("")

      // Verificar se as tabelas existem
      const tablesExist = await checkTablesExist()
      if (!tablesExist) {
        setHasError(true)
        setErrorMessage("As tabelas do banco de dados não foram criadas ainda. Execute o script SQL primeiro.")
        return
      }

      // Carregar transações
      const transactionsData = await getTransactions(currentMonth, currentYear)
      setTransactions(transactionsData)

      // Carregar valores extras
      const extraIncomeData = await getExtraIncome(currentMonth, currentYear)
      setExtraIncome(extraIncomeData)

      // Carregar configurações mensais
      let settingsData = await getMonthlySettings(currentMonth, currentYear)
      if (!settingsData) {
        // Criar configuração padrão se não existir
        try {
          settingsData = await upsertMonthlySettings({
            month: currentMonth,
            year: currentYear,
            das_value: 67,
          })
        } catch (error) {
          console.error("Erro ao criar configurações:", error)
          // Usar configuração padrão local se não conseguir salvar
          settingsData = {
            id: "temp",
            month: currentMonth,
            year: currentYear,
            das_value: 67,
          }
        }
      }
      setMonthlySettings(settingsData)

      // Add this line inside the loadData function after loading other data
      const cardTransactionsData = await getCardTransactions(currentMonth, currentYear)
      setCardTransactions(cardTransactionsData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setHasError(true)
      setErrorMessage("Erro ao conectar com o banco de dados. Verifique sua conexão.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentMonth, currentYear])

  const handleMonthChange = (month: number, year: number) => {
    setCurrentMonth(month)
    setCurrentYear(year)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Erro de Conexão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">{errorMessage}</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Para resolver:</p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Execute o script SQL para criar as tabelas</li>
                <li>Verifique se o Supabase está configurado corretamente</li>
                <li>Tente recarregar a página</li>
              </ol>
            </div>
            <Button onClick={loadData} className="w-full">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Controle Financeiro MEI</h1>
          <MonthSelector currentMonth={currentMonth} currentYear={currentYear} onChange={handleMonthChange} />
        </div>

        {/* Resumo Financeiro */}
        <FinancialSummary
          transactions={transactions}
          extraIncome={extraIncome}
          dasValue={monthlySettings?.das_value || 67}
        />

        {/* Valores Extras */}
        <ExtraIncomeForm extraIncome={extraIncome} month={currentMonth} year={currentYear} onUpdate={loadData} />

        {/* Histórico Mensal */}
        <MonthHistory currentMonth={currentMonth} currentYear={currentYear} onUpdate={loadData} />

        {/* Alertas e Projeções */}
        <AlertsPanel
          transactions={transactions}
          extraIncome={extraIncome}
          dasValue={monthlySettings?.das_value || 67}
          currentMonth={currentMonth}
        />

        {/* Tabs principais */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="savings">Reservas</TabsTrigger>
            <TabsTrigger value="cards">Cartões</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Receitas do Mês */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-green-700 mb-4">Receitas do Mês</h3>
                <div className="space-y-3">
                  {transactions.filter((t) => t.type === "receita").length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhuma receita registrada ainda</p>
                  ) : (
                    transactions
                      .filter((t) => t.type === "receita")
                      .map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex justify-between items-center p-3 bg-green-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{transaction.category}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(transaction.date).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <span className="font-bold text-green-700">
                            R$ {transaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Gastos do Mês */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-red-700 mb-4">Gastos do Mês</h3>
                <div className="space-y-3">
                  {/* Gastos regulares */}
                  {transactions
                    .filter((t) => t.type === "gasto")
                    .map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium">{transaction.category}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <span className="font-bold text-red-700">
                          R$ {transaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}

                  {/* Gastos dos cartões */}
                  {cardTransactions.map((transaction) => (
                    <div
                      key={`card-${transaction.id}`}
                      className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400"
                    >
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {transaction.card?.name} • {new Date(transaction.date).toLocaleDateString("pt-BR")}
                          {transaction.installments > 1 && ` • ${transaction.installments}x`}
                        </p>
                        <p className="text-xs text-orange-600">{transaction.category}</p>
                      </div>
                      <span className="font-bold text-orange-700">
                        R$ {transaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}

                  {/* Mostrar mensagem se não houver gastos */}
                  {transactions.filter((t) => t.type === "gasto").length === 0 && cardTransactions.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Nenhum gasto registrado ainda</p>
                  )}

                  {/* DAS MEI */}
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <div>
                      <p className="font-medium">DAS MEI</p>
                      <p className="text-sm text-gray-600">Vencimento: 20/{String(currentMonth).padStart(2, "0")}</p>
                    </div>
                    <span className="font-bold text-purple-700">
                      R$ {(monthlySettings?.das_value || 67).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <TransactionForm transactions={transactions} onUpdate={loadData} />
          </TabsContent>

          <TabsContent value="savings" className="space-y-4">
            <SavingsTracker currentMonth={currentMonth} currentYear={currentYear} onUpdate={loadData} />
          </TabsContent>

          <TabsContent value="cards" className="space-y-4">
            <CreditCardManager currentMonth={currentMonth} currentYear={currentYear} onUpdate={loadData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
