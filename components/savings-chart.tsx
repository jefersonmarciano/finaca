"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import type { MonthlySavings } from "@/types/financial"

interface SavingsChartProps {
  monthlySavings: MonthlySavings[]
  totalAccumulated: number
}

export function SavingsChart({ monthlySavings, totalAccumulated }: SavingsChartProps) {
  // Ordenar por data para o gráfico
  const sortedSavings = [...monthlySavings].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.month - b.month
  })

  // Calcular valores acumulados
  let accumulated = 0
  const chartData = sortedSavings.map((saving) => {
    accumulated += saving.amount
    return {
      ...saving,
      accumulated,
      monthYear: `${saving.month.toString().padStart(2, "0")}/${saving.year}`,
    }
  })

  const maxValue = Math.max(...chartData.map((d) => d.accumulated), 1000)
  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("pt-BR", { month: "short" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Evolução das Reservas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum dado para exibir ainda.</p>
            <p className="text-sm mt-2">Registre algumas reservas para ver a evolução!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Gráfico simples com barras */}
            <div className="relative h-64 bg-gray-50 rounded-lg p-4">
              <div className="flex items-end justify-between h-full gap-2">
                {chartData.slice(-12).map((data, index) => {
                  const height = (data.accumulated / maxValue) * 100
                  return (
                    <div key={data.id} className="flex flex-col items-center flex-1">
                      <div className="relative flex-1 flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-sm min-h-[4px] transition-all duration-300 hover:from-green-600 hover:to-green-500"
                          style={{ height: `${height}%` }}
                          title={`${getMonthName(data.month)}/${data.year}: R$ ${data.accumulated.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 },
                          )}`}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-2 text-center">
                        <div>{getMonthName(data.month)}</div>
                        <div>{data.year}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-700">
                  R$ {totalAccumulated.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-green-600">Total Acumulado</div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-700">
                  R${" "}
                  {(totalAccumulated / Math.max(chartData.length, 1)).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div className="text-sm text-blue-600">Média Mensal</div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-700">
                  R${" "}
                  {chartData.length > 0
                    ? Math.max(...chartData.map((d) => d.amount)).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })
                    : "0,00"}
                </div>
                <div className="text-sm text-purple-600">Maior Reserva</div>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-700">{chartData.length}</div>
                <div className="text-sm text-orange-600">Meses Ativos</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
