"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, BarChart3, PieChart } from "lucide-react"
import type { MonthlySummary } from "@/types/financial"

interface HistoryChartsProps {
  summaries: MonthlySummary[]
  isLoading: boolean
}

export function HistoryCharts({ summaries, isLoading }: HistoryChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-8">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (summaries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sem dados para gráficos</h3>
            <p className="text-gray-600">Salve alguns meses de histórico para ver análises gráficas aqui.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("pt-BR", { month: "short" })
  }

  // Preparar dados para gráficos
  const chartData = summaries
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
    .slice(-12) // Últimos 12 meses

  const maxValue = Math.max(
    ...chartData.map((s) => Math.max(s.total_receitas, s.total_gastos, Math.abs(s.saldo_mensal))),
  )

  // Calcular tendências
  const receitasTrend =
    chartData.length >= 2
      ? chartData[chartData.length - 1].total_receitas - chartData[chartData.length - 2].total_receitas
      : 0

  const gastosTrend =
    chartData.length >= 2
      ? chartData[chartData.length - 1].total_gastos - chartData[chartData.length - 2].total_gastos
      : 0

  // Estatísticas
  const totalReceitas = chartData.reduce((sum, s) => sum + s.total_receitas, 0)
  const totalGastos = chartData.reduce((sum, s) => sum + s.total_gastos, 0)
  const totalExtras = chartData.reduce((sum, s) => sum + s.total_extras, 0)
  const mediaReceitas = totalReceitas / chartData.length
  const mediaGastos = totalGastos / chartData.length

  return (
    <div className="space-y-6">
      {/* Gráfico de Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Mensal (Últimos 12 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((summary, index) => {
              const receitasWidth = (summary.total_receitas / maxValue) * 100
              const gastosWidth = (summary.total_gastos / maxValue) * 100
              const saldoWidth = (Math.abs(summary.saldo_mensal) / maxValue) * 100

              return (
                <div key={summary.id} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">
                      {getMonthName(summary.month)} {summary.year}
                    </span>
                    <Badge variant={summary.saldo_mensal >= 0 ? "default" : "destructive"}>
                      R$ {summary.saldo_mensal.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    {/* Receitas */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600 w-16">Receitas</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${receitasWidth}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-green-600 w-20 text-right">
                        R$ {summary.total_receitas.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </span>
                    </div>

                    {/* Gastos */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 w-16">Gastos</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${gastosWidth}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-red-600 w-20 text-right">
                        R$ {summary.total_gastos.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas e Tendências */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Média</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {mediaReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </p>
                {receitasTrend !== 0 && (
                  <div className={`flex items-center text-xs ${receitasTrend > 0 ? "text-green-600" : "text-red-600"}`}>
                    {receitasTrend > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    R$ {Math.abs(receitasTrend).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </div>
                )}
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gasto Médio</p>
                <p className="text-xl font-bold text-red-600">
                  R$ {mediaGastos.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </p>
                {gastosTrend !== 0 && (
                  <div className={`flex items-center text-xs ${gastosTrend > 0 ? "text-red-600" : "text-green-600"}`}>
                    {gastosTrend > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    R$ {Math.abs(gastosTrend).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </div>
                )}
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Receitas</p>
                <p className="text-xl font-bold text-blue-600">
                  R$ {totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-500">{chartData.length} meses</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Extras</p>
                <p className="text-xl font-bold text-purple-600">
                  R$ {totalExtras.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-500">Valores extras</p>
              </div>
              <PieChart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Gastos vs Receitas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Distribuição Financeira (Período Total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-medium">Total Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-green-600">
                  {((totalReceitas / (totalReceitas + totalGastos)) * 100).toFixed(1)}% do total
                </p>
              </div>

              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700 font-medium">Total Gastos</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalGastos.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-red-600">
                  {((totalGastos / (totalReceitas + totalGastos)) * 100).toFixed(1)}% do total
                </p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Saldo Acumulado</p>
                <p
                  className={`text-2xl font-bold ${(totalReceitas - totalGastos) >= 0 ? "text-blue-600" : "text-red-600"}`}
                >
                  R$ {(totalReceitas - totalGastos).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-blue-600">Diferença total</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
