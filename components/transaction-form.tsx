"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { addTransaction, deleteTransaction } from "@/lib/database"
import type { Transaction } from "@/types/financial"

interface TransactionFormProps {
  transactions: Transaction[]
  onUpdate: () => void
}

export function TransactionForm({ transactions, onUpdate }: TransactionFormProps) {
  const [newTransaction, setNewTransaction] = useState({
    type: "gasto" as "receita" | "gasto",
    category: "",
    amount: "",
    date: "",
    description: "",
    is_fixed: false,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTransaction.category || !newTransaction.amount || !newTransaction.date) return

    setIsLoading(true)
    try {
      await addTransaction({
        type: newTransaction.type,
        category: newTransaction.category,
        amount: Number.parseFloat(newTransaction.amount),
        date: newTransaction.date,
        description: newTransaction.description,
        is_fixed: newTransaction.is_fixed,
      })

      setNewTransaction({
        type: "gasto",
        category: "",
        amount: "",
        date: "",
        description: "",
        is_fixed: false,
      })
      onUpdate()
    } catch (error) {
      console.error("Erro ao adicionar transação:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id)
      onUpdate()
    } catch (error) {
      console.error("Erro ao remover transação:", error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Nova Transação</CardTitle>
          <CardDescription>Registre suas receitas e gastos para manter o controle atualizado</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  className="w-full p-2 border rounded-md"
                  value={newTransaction.type}
                  onChange={(e) =>
                    setNewTransaction((prev) => ({ ...prev, type: e.target.value as "receita" | "gasto" }))
                  }
                >
                  <option value="gasto">Gasto</option>
                  <option value="receita">Receita</option>
                </select>
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  placeholder="Ex: Alimentação, Transporte..."
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction((prev) => ({ ...prev, category: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Descrição opcional"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="is_fixed"
                  checked={newTransaction.is_fixed}
                  onChange={(e) => setNewTransaction((prev) => ({ ...prev, is_fixed: e.target.checked }))}
                />
                <Label htmlFor="is_fixed">Gasto/Receita Fixa</Label>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? "Adicionando..." : "Adicionar Transação"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={transaction.type === "receita" ? "default" : "destructive"}>
                      {transaction.type}
                    </Badge>
                    {transaction.is_fixed && <Badge variant="outline">Fixo</Badge>}
                  </div>
                  <p className="font-medium">{transaction.category}</p>
                  <p className="text-sm text-gray-600">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${transaction.type === "receita" ? "text-green-600" : "text-red-600"}`}>
                    {transaction.type === "receita" ? "+" : "-"}R${" "}
                    {transaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(transaction.id)}>
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
