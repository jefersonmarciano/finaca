"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { addExtraIncome, deleteExtraIncome } from "@/lib/database"
import type { ExtraIncome } from "@/types/financial"

interface ExtraIncomeFormProps {
  extraIncome: ExtraIncome[]
  month: number
  year: number
  onUpdate: () => void
}

export function ExtraIncomeForm({ extraIncome, month, year, onUpdate }: ExtraIncomeFormProps) {
  const [newExtra, setNewExtra] = useState({
    amount: "",
    description: "",
    date: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExtra.amount || !newExtra.description || !newExtra.date) return

    setIsLoading(true)
    try {
      await addExtraIncome({
        amount: Number.parseFloat(newExtra.amount),
        description: newExtra.description,
        date: newExtra.date,
        month,
        year,
      })

      setNewExtra({ amount: "", description: "", date: "" })
      onUpdate()
    } catch (error) {
      console.error("Erro ao adicionar valor extra:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteExtraIncome(id)
      onUpdate()
    } catch (error) {
      console.error("Erro ao remover valor extra:", error)
    }
  }

  const totalExtras = extraIncome.reduce((sum, e) => sum + e.amount, 0)

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-800 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Valores Extras Recebidos
        </CardTitle>
        <CardDescription>Registre valores adicionais que recebeu além da sua receita fixa mensal</CardDescription>
        {totalExtras > 0 && (
          <Badge variant="secondary" className="w-fit">
            Total de Extras: R$ {totalExtras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="extra-amount">Valor (R$)</Label>
              <Input
                id="extra-amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={newExtra.amount}
                onChange={(e) => setNewExtra((prev) => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="extra-date">Data</Label>
              <Input
                id="extra-date"
                type="date"
                value={newExtra.date}
                onChange={(e) => setNewExtra((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="md:col-span-1">
              <Label htmlFor="extra-description">Descrição</Label>
              <Input
                id="extra-description"
                placeholder="Ex: Freelance, Bônus, Venda..."
                value={newExtra.description}
                onChange={(e) => setNewExtra((prev) => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? "Adicionando..." : "Adicionar Valor Extra"}
          </Button>
        </form>

        {/* Lista de valores extras */}
        {extraIncome.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-emerald-800">Valores Extras do Mês:</h4>
            <div className="space-y-2">
              {extraIncome.map((extra) => (
                <div
                  key={extra.id}
                  className="flex justify-between items-center p-3 bg-white rounded-lg border border-emerald-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-emerald-900">{extra.description}</p>
                    <p className="text-sm text-emerald-600">{new Date(extra.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-700">
                      + R$ {extra.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(extra.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
