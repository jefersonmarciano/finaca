"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Archive, Clock, RefreshCw } from "lucide-react"
import { getMonthlySummaries, archiveCurrentMonth, prepareNextMonth, checkHistoryTablesExist } from "@/lib/database"
import type { MonthlySummary } from "@/types/financial"

interface MonthHistoryProps {
  currentMonth: number
  currentYear: number
  onUpdate: () => void
}

export function MonthHistory({ currentMonth, currentYear, onUpdate }: MonthHistoryProps) {
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [tablesExist, setTablesExist] = useState(true)

  const loadSummaries = async () => {
    try {
      setIsLoading(true)

      // Verificar se as tabelas existem
      const historyTablesExist = await checkHistoryTablesExist()
      setTablesExist(historyTablesExist)

      if (historyTablesExist) {
        const data = await getMonthlySummaries()
        setMonthlySummaries(data)
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSummaries()
  }, [])

  const handleArchiveMonth = async () => {
    if (!confirm(`Deseja realmente arquivar o mês ${currentMonth}/${currentYear}?`)) return

    try {
      setIsArchiving(true)
      await archiveCurrentMonth(currentMonth, currentYear)
      await loadSummaries()
      onUpdate()
    } catch (error) {
      console.error("Erro ao arquivar mês:", error)
      alert("Erro ao arquivar mês. Tente novamente.")
    } finally {
      setIsArchiving(false)
    }
  }

  const handlePrepareNextMonth = async () => {
    if (!confirm(`Deseja preparar o próximo mês com as transações fixas?`)) return

    try {
      setIsPreparing(true)
      await prepareNextMonth(currentMonth, currentYear)
      onUpdate()
    } catch (error) {
      console.error("Erro ao preparar próximo mês:", error)
      alert("Erro ao preparar próximo mês. Tente novamente.")
    } finally {
      setIsPreparing(false)
    }
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("pt-BR", { month: "long" })
  }

  if (!tablesExist) {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-indigo-800 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              As tabelas de histórico foram criadas com sucesso! Agora você pode começar a arquivar seus meses.
            </p>
            <Button onClick={loadSummaries}>Atualizar</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-indigo-800 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Histórico Mensal
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchiveMonth}
            disabled={isArchiving}
            className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 sm:px-3"
          >
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">{isArchiving ? "Arquivando..." : "Arquivar Mês Atual"}</span>
            <span className="sm:hidden">{isArchiving ? "Arquivando..." : "Arquivar"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrepareNextMonth}
            disabled={isPreparing}
            className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 sm:px-3"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">{isPreparing ? "Preparando..." : "Preparar Próximo Mês"}</span>
            <span className="sm:hidden">{isPreparing ? "Preparando..." : "Preparar"}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <Clock className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
            <p className="mt-2 text-indigo-600">Carregando histórico...</p>
          </div>
        ) : monthlySummaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum histórico mensal disponível.</p>
            <p className="text-sm mt-2">Arquive o mês atual para começar a construir seu histórico financeiro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthlySummaries.map((summary) => (
                <div key={summary.id} className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-indigo-900">
                      {getMonthName(summary.month)} {summary.year}
                    </h3>
                    <Badge variant={summary.saldo_mensal >= 0 ? "default" : "destructive"}>
                      {summary.saldo_mensal >= 0 ? "Positivo" : "Negativo"}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Receitas:</span>
                      <span className="font-medium text-green-600">
                        R$ {summary.total_receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Extras:</span>
                      <span className="font-medium text-emerald-600">
                        R$ {summary.total_extras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gastos:</span>
                      <span className="font-medium text-red-600">
                        R$ {summary.total_gastos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">DAS:</span>
                      <span className="font-medium text-purple-600">
                        R$ {summary.das_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IR Mensal:</span>
                      <span className="font-medium text-orange-600">
                        R$ {summary.ir_mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-medium">
                      <span>Saldo Final:</span>
                      <span className={summary.saldo_mensal >= 0 ? "text-blue-600" : "text-red-600"}>
                        R$ {summary.saldo_mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
