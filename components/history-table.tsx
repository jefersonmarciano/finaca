"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, RefreshCw, Calendar, Trash2 } from "lucide-react"
import type { MonthlySummary } from "@/types/financial"

interface HistoryTableProps {
  summaries: MonthlySummary[]
  isLoading: boolean
  onRefresh: () => void
  onDelete?: (id: string) => void
}

export function HistoryTable({ summaries, isLoading, onRefresh, onDelete }: HistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof MonthlySummary>("year")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("pt-BR", { month: "long" })
  }

  const handleSort = (field: keyof MonthlySummary) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const filteredAndSortedSummaries = summaries
    .filter((summary) => {
      const monthYear = `${getMonthName(summary.month)} ${summary.year}`
      return monthYear.toLowerCase().includes(searchTerm.toLowerCase())
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleDelete = async (summary: MonthlySummary) => {
    const monthName = getMonthName(summary.month)

    if (!summary.id) {
      alert("Erro: ID do histórico não encontrado")
      return
    }

    if (!confirm(`Deseja realmente deletar o histórico de ${monthName} ${summary.year}?`)) return

    if (onDelete) {
      onDelete(summary.id)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Carregando histórico...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (summaries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum histórico encontrado</h3>
            <p className="text-gray-600 mb-4">Comece salvando o histórico do mês atual para ver os dados aqui.</p>
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Histórico Detalhado ({summaries.length} meses)
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por mês/ano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("month")}>
                  Período {sortField === "month" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 text-right"
                  onClick={() => handleSort("total_receitas")}
                >
                  Receitas {sortField === "total_receitas" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 text-right"
                  onClick={() => handleSort("total_gastos")}
                >
                  Gastos {sortField === "total_gastos" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 text-right"
                  onClick={() => handleSort("total_extras")}
                >
                  Extras {sortField === "total_extras" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="text-right">DAS</TableHead>
                <TableHead className="text-right">IR</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 text-right"
                  onClick={() => handleSort("saldo_mensal")}
                >
                  Saldo Final {sortField === "saldo_mensal" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSummaries.map((summary) => (
                <TableRow key={summary.id || `${summary.month}-${summary.year}`} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {getMonthName(summary.month)} {summary.year}
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    R$ {summary.total_receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-red-600 font-medium">
                    R$ {summary.total_gastos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600 font-medium">
                    R$ {summary.total_extras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-purple-600">
                    R$ {summary.das_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-orange-600">
                    R$ {summary.ir_mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold ${summary.saldo_mensal >= 0 ? "text-blue-600" : "text-red-600"}`}
                  >
                    R$ {summary.saldo_mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={summary.saldo_mensal >= 0 ? "default" : "destructive"}>
                      {summary.saldo_mensal >= 0 ? "Positivo" : "Negativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(summary)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={!summary.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredAndSortedSummaries.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum resultado encontrado para "{searchTerm}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
