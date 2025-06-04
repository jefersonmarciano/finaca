"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Download, TrendingUp, TrendingDown, BarChart3, PieChart, Save, Trash2 } from "lucide-react"
import {
  getMonthlySummaries,
  archiveCurrentMonth,
  deleteMonthlySummary,
  deleteAllMonthlySummaries,
} from "@/lib/database"
import type { MonthlySummary } from "@/types/financial"
import { HistoryTable } from "./history-table"
import { HistoryCharts } from "./history-charts"

interface HistoryDashboardProps {
  currentMonth: number
  currentYear: number
  onUpdate: () => void
}

export function HistoryDashboard({ currentMonth, currentYear, onUpdate }: HistoryDashboardProps) {
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadHistoryData = async () => {
    try {
      setIsLoading(true)
      const data = await getMonthlySummaries()
      setMonthlySummaries(data)
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistoryData()
  }, [])

  const handleSaveCurrentMonth = async () => {
    if (!confirm(`Deseja salvar o histórico do mês ${currentMonth}/${currentYear}?`)) return

    try {
      setIsSaving(true)
      await archiveCurrentMonth(currentMonth, currentYear)
      await loadHistoryData()
      onUpdate()
      alert("Histórico do mês salvo com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar histórico:", error)
      alert("Erro ao salvar histórico. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportToExcel = async () => {
    try {
      setIsExporting(true)

      // Preparar dados para exportação
      const exportData = monthlySummaries.map((summary) => ({
        "Mês/Ano": `${summary.month.toString().padStart(2, "0")}/${summary.year}`,
        Receitas: summary.total_receitas,
        Gastos: summary.total_gastos,
        Extras: summary.total_extras,
        DAS: summary.das_value,
        "IR Mensal": summary.ir_mensal,
        "Saldo Final": summary.saldo_mensal,
        Status: summary.saldo_mensal >= 0 ? "Positivo" : "Negativo",
      }))

      // Converter para CSV (simulando Excel)
      const headers = Object.keys(exportData[0] || {})
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) => headers.map((header) => row[header]).join(",")),
      ].join("\n")

      // Download do arquivo
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `historico-financeiro-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erro ao exportar:", error)
      alert("Erro ao exportar dados. Tente novamente.")
    } finally {
      setIsExporting(false)
    }
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("pt-BR", { month: "long" })
  }

  // Calcular estatísticas
  const totalMeses = monthlySummaries.length
  const mesesPositivos = monthlySummaries.filter((s) => s.saldo_mensal >= 0).length
  const mesesNegativos = totalMeses - mesesPositivos
  const mediaReceitas = totalMeses > 0 ? monthlySummaries.reduce((sum, s) => sum + s.total_receitas, 0) / totalMeses : 0
  const mediaGastos = totalMeses > 0 ? monthlySummaries.reduce((sum, s) => sum + s.total_gastos, 0) / totalMeses : 0

  const handleDeleteHistory = async (id: string) => {
    try {
      setIsDeleting(true)
      await deleteMonthlySummary(id)
      await loadHistoryData()
      alert("Histórico deletado com sucesso!")
    } catch (error) {
      console.error("Erro ao deletar histórico:", error)
      alert("Erro ao deletar histórico. Tente novamente.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteAllHistory = async () => {
    if (!confirm("⚠️ ATENÇÃO: Deseja realmente DELETAR TODOS os históricos? Esta ação não pode ser desfeita!")) return
    if (!confirm("Tem certeza absoluta? Digite 'DELETAR TUDO' para confirmar:")) return

    try {
      setIsDeleting(true)
      await deleteAllMonthlySummaries()
      await loadHistoryData()
      alert("Todos os históricos foram deletados!")
    } catch (error) {
      console.error("Erro ao deletar todos os históricos:", error)
      alert("Erro ao deletar históricos. Tente novamente.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Histórico Financeiro
              </CardTitle>
              <p className="text-gray-600 mt-1">Análise completa dos seus dados financeiros mensais</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={handleSaveCurrentMonth} disabled={isSaving} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? "Salvando..." : `Salvar ${currentMonth}/${currentYear}`}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportToExcel}
                disabled={isExporting || monthlySummaries.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exportando..." : "Exportar Excel"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAllHistory}
                disabled={isDeleting || monthlySummaries.length === 0}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deletando..." : "Zerar Tudo"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Meses</p>
                <p className="text-2xl font-bold text-blue-600">{totalMeses}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Meses Positivos</p>
                <p className="text-2xl font-bold text-green-600">{mesesPositivos}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Meses Negativos</p>
                <p className="text-2xl font-bold text-red-600">{mesesNegativos}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Média Receitas</p>
                <p className="text-2xl font-bold text-purple-600">
                  R$ {mediaReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes visualizações */}
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Tabela Detalhada</TabsTrigger>
          <TabsTrigger value="charts">Gráficos e Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <HistoryTable
            summaries={monthlySummaries}
            isLoading={isLoading || isDeleting}
            onRefresh={loadHistoryData}
            onDelete={handleDeleteHistory}
          />
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <HistoryCharts summaries={monthlySummaries} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
