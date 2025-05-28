"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PiggyBank, TrendingUp, Calendar, Plus, AlertTriangle, Edit, Trash2, Check, X } from "lucide-react"
import { SavingsChart } from "@/components/savings-chart"
import { SavingsGoals } from "@/components/savings-goals"
import {
  getMonthlySavings,
  getMonthlySaving,
  upsertMonthlySaving,
  deleteMonthlySaving,
  getTotalSavings,
  checkSavingsTablesExist,
} from "@/lib/database"
import type { MonthlySavings, TotalSavings } from "@/types/financial"

interface SavingsTrackerProps {
  currentMonth: number
  currentYear: number
  onUpdate?: () => void
}

export function SavingsTracker({ currentMonth, currentYear, onUpdate }: SavingsTrackerProps) {
  const [monthlySavings, setMonthlySavings] = useState<MonthlySavings[]>([])
  const [currentSaving, setCurrentSaving] = useState<MonthlySavings | null>(null)
  const [totalSavings, setTotalSavings] = useState<TotalSavings>({
    total_accumulated: 0,
    months_count: 0,
    last_update: new Date().toISOString(),
  })
  const [newSaving, setNewSaving] = useState({
    amount: "",
    description: "",
  })
  const [editingSaving, setEditingSaving] = useState<string | null>(null)
  const [editingData, setEditingData] = useState({
    amount: "",
    description: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [tablesExist, setTablesExist] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadSavingsData = async () => {
    try {
      setIsLoading(true)
      setHasError(false)

      // Verificar se as tabelas existem
      const savingsTablesExist = await checkSavingsTablesExist()
      setTablesExist(savingsTablesExist)

      if (!savingsTablesExist) {
        console.log("Tabelas de reservas não existem ainda")
        return
      }

      // Carregar todas as reservas
      const allSavings = await getMonthlySavings()
      setMonthlySavings(allSavings)

      // Carregar reserva do mês atual
      const currentMonthSaving = await getMonthlySaving(currentMonth, currentYear)
      setCurrentSaving(currentMonthSaving)

      // Carregar total acumulado
      const total = await getTotalSavings()
      setTotalSavings(total)

      // Pré-preencher formulário se já existe reserva do mês
      if (currentMonthSaving) {
        setNewSaving({
          amount: currentMonthSaving.amount.toString(),
          description: currentMonthSaving.description || "",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar dados de reservas:", error)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSavingsData()
  }, [currentMonth, currentYear])

  const handleSaveSaving = async () => {
    if (!newSaving.amount) return

    try {
      setIsSaving(true)
      await upsertMonthlySaving({
        month: currentMonth,
        year: currentYear,
        amount: Number.parseFloat(newSaving.amount),
        description: newSaving.description || `Reserva de ${getMonthName(currentMonth)}/${currentYear}`,
      })

      await loadSavingsData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Erro ao salvar reserva:", error)
      alert("Erro ao salvar reserva. Verifique se as tabelas foram criadas corretamente.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditSaving = (saving: MonthlySavings) => {
    setEditingSaving(saving.id)
    setEditingData({
      amount: saving.amount.toString(),
      description: saving.description || "",
    })
  }

  const handleSaveEdit = async (saving: MonthlySavings) => {
    if (!editingData.amount) return

    try {
      await upsertMonthlySaving({
        month: saving.month,
        year: saving.year,
        amount: Number.parseFloat(editingData.amount),
        description: editingData.description || `Reserva de ${getMonthName(saving.month)}/${saving.year}`,
      })

      setEditingSaving(null)
      await loadSavingsData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Erro ao atualizar reserva:", error)
      alert("Erro ao atualizar reserva.")
    }
  }

  const handleDeleteSaving = async (e: React.MouseEvent, saving: MonthlySavings) => {
    // Prevenir comportamento padrão do evento
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`Deseja realmente excluir a reserva de ${getMonthName(saving.month)}/${saving.year}?`)) return

    try {
      await deleteMonthlySaving(saving.id)
      await loadSavingsData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Erro ao excluir reserva:", error)
      alert("Erro ao excluir reserva.")
    }
  }

  const handleCancelEdit = () => {
    setEditingSaving(null)
    setEditingData({ amount: "", description: "" })
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("pt-BR", { month: "long" })
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  }

  if (!tablesExist) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Sistema de Reservas
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-yellow-700">
            As tabelas de reservas foram criadas com sucesso! Agora você pode começar a registrar suas reservas mensais.
          </p>
          <Button onClick={loadSavingsData} className="bg-yellow-600 hover:bg-yellow-700">
            Atualizar Sistema
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (hasError) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Erro no Sistema de Reservas
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-red-700">
            Houve um erro ao carregar os dados de reservas. Verifique se as tabelas foram criadas corretamente.
          </p>
          <Button onClick={loadSavingsData} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Total Acumulado */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <PiggyBank className="h-6 w-6" />
            Total Reservado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-green-900">R$ {formatCurrency(totalSavings.total_accumulated)}</div>
            <div className="flex justify-center gap-4 text-sm text-green-700">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{totalSavings.months_count} meses</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>
                  Média: R$ {formatCurrency(totalSavings.total_accumulated / Math.max(totalSavings.months_count, 1))}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reserva do Mês Atual */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Reserva de {getMonthName(currentMonth)} {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="saving-amount">Valor Reservado (R$)</Label>
              <Input
                id="saving-amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={newSaving.amount}
                onChange={(e) => setNewSaving((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="saving-description">Descrição (opcional)</Label>
              <Input
                id="saving-description"
                placeholder="Ex: Reserva de emergência, Investimento..."
                value={newSaving.description}
                onChange={(e) => setNewSaving((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <Button onClick={handleSaveSaving} disabled={isSaving || !newSaving.amount} className="w-full">
            {isSaving ? "Salvando..." : currentSaving ? "Atualizar Reserva" : "Salvar Reserva"}
          </Button>

          {currentSaving && (
            <div className="p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Reserva atual:</strong> R$ {formatCurrency(currentSaving.amount)}
              </p>
              {currentSaving.description && <p className="text-sm text-blue-700">{currentSaving.description}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Evolução */}
      <SavingsChart monthlySavings={monthlySavings} totalAccumulated={totalSavings.total_accumulated} />

      {/* Metas de Reserva */}
      <SavingsGoals totalAccumulated={totalSavings.total_accumulated} />

      {/* Histórico de Reservas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-800">Histórico de Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">Carregando histórico...</div>
          ) : monthlySavings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma reserva registrada ainda.</p>
              <p className="text-sm mt-2">Comece salvando a reserva do mês atual!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {monthlySavings.map((saving) => (
                <div key={saving.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex-1">
                    {editingSaving === saving.id ? (
                      // Modo de edição
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Valor (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editingData.amount}
                              onChange={(e) => setEditingData((prev) => ({ ...prev, amount: e.target.value }))}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Descrição</Label>
                            <Input
                              value={editingData.description}
                              onChange={(e) => setEditingData((prev) => ({ ...prev, description: e.target.value }))}
                              className="h-8"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveEdit(saving)} className="h-7 px-2">
                            <Check className="h-3 w-3 mr-1" />
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-7 px-2">
                            <X className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Modo de visualização
                      <div>
                        <p className="font-medium">
                          {getMonthName(saving.month)} {saving.year}
                        </p>
                        <p className="text-sm text-gray-600">{saving.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(saving.created_at || "").toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingSaving !== saving.id && (
                      <>
                        <Badge variant="secondary" className="text-green-700 bg-green-100">
                          R$ {formatCurrency(saving.amount)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSaving(saving)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteSaving(e, saving)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
