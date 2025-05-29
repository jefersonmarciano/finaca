"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { CreditCardIcon, Plus, Edit, Trash2, AlertTriangle, Check, X } from "lucide-react"
import {
  getCreditCards,
  addCreditCard,
  updateCreditCard,
  deleteCreditCard,
  getCardTransactions,
  addCardTransaction,
  deleteCardTransaction,
  getCardInstallments,
  updateInstallmentPaid,
  getCardsSummary,
  checkCardTablesExist,
} from "@/lib/database"
import type { CreditCard, CardTransaction, CardInstallment, CardSummary } from "@/types/financial"

interface CreditCardManagerProps {
  currentMonth: number
  currentYear: number
  onUpdate?: () => void
}

export function CreditCardManager({ currentMonth, currentYear, onUpdate }: CreditCardManagerProps) {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [cardsSummary, setCardsSummary] = useState<CardSummary[]>([])
  const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>([])
  const [cardInstallments, setCardInstallments] = useState<CardInstallment[]>([])
  const [tablesExist, setTablesExist] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Estados para formulários
  const [showNewCardForm, setShowNewCardForm] = useState(false)
  const [showNewTransactionForm, setShowNewTransactionForm] = useState(false)
  const [editingCard, setEditingCard] = useState<string | null>(null)

  const [newCard, setNewCard] = useState({
    name: "",
    credit_limit: "",
    closing_day: "",
    due_day: "",
  })

  const [newTransaction, setNewTransaction] = useState({
    card_id: "",
    description: "",
    amount: "",
    installments: "1",
    date: "",
    category: "",
  })

  const [editingCardData, setEditingCardData] = useState({
    name: "",
    credit_limit: "",
    closing_day: "",
    due_day: "",
  })

  // Adicionar após os estados existentes
  const [cardExpenses, setCardExpenses] = useState<
    Array<{
      description: string
      amount: string
      installments: string
      date: string
      category: string
    }>
  >([])

  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    installments: "1",
    date: "",
    category: "",
  })

  const loadCardData = async () => {
    try {
      setIsLoading(true)
      setHasError(false)

      // Verificar se as tabelas existem
      const cardTablesExist = await checkCardTablesExist()
      setTablesExist(cardTablesExist)

      if (!cardTablesExist) {
        console.log("Tabelas de cartão não existem ainda")
        return
      }

      // Carregar dados
      const [cardsData, summaryData, transactionsData, installmentsData] = await Promise.all([
        getCreditCards(),
        getCardsSummary(),
        getCardTransactions(currentMonth, currentYear),
        getCardInstallments(undefined, currentMonth, currentYear),
      ])

      setCards(cardsData)
      setCardsSummary(summaryData)
      setCardTransactions(transactionsData)
      setCardInstallments(installmentsData)
    } catch (error) {
      console.error("Erro ao carregar dados dos cartões:", error)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Adicionar após loadCardData
  const addExpenseToList = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.date) {
      alert("Preencha pelo menos descrição, valor e data")
      return
    }

    setCardExpenses([...cardExpenses, { ...newExpense }])
    setNewExpense({
      description: "",
      amount: "",
      installments: "1",
      date: "",
      category: "",
    })
  }

  const removeExpenseFromList = (index: number) => {
    setCardExpenses(cardExpenses.filter((_, i) => i !== index))
  }

  const getCardTransactionsByCard = (cardId: string) => {
    return cardTransactions.filter((t) => t.card_id === cardId)
  }

  const getCardInstallmentsByCard = (cardId: string) => {
    return cardInstallments.filter((i) => i.transaction?.card_id === cardId)
  }

  useEffect(() => {
    loadCardData()
  }, [currentMonth, currentYear])

  const handleAddCard = async () => {
    if (!newCard.name || !newCard.credit_limit || !newCard.closing_day || !newCard.due_day) {
      alert("Preencha todos os campos do cartão")
      return
    }

    try {
      // Adicionar cartão
      const addedCard = await addCreditCard({
        name: newCard.name,
        credit_limit: Number.parseFloat(newCard.credit_limit),
        closing_day: Number.parseInt(newCard.closing_day),
        due_day: Number.parseInt(newCard.due_day),
      })

      // Adicionar gastos se houver
      for (const expense of cardExpenses) {
        await addCardTransaction({
          card_id: addedCard.id,
          description: expense.description,
          amount: Number.parseFloat(expense.amount),
          installments: Number.parseInt(expense.installments),
          current_installment: 1,
          date: expense.date,
          category: expense.category || "Geral",
        })
      }

      // Limpar formulários
      setNewCard({ name: "", credit_limit: "", closing_day: "", due_day: "" })
      setCardExpenses([])
      setShowNewCardForm(false)

      await loadCardData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Erro ao adicionar cartão:", error)
      alert("Erro ao adicionar cartão.")
    }
  }

  const handleEditCard = (card: CreditCard) => {
    setEditingCard(card.id)
    setEditingCardData({
      name: card.name,
      credit_limit: card.credit_limit.toString(),
      closing_day: card.closing_day.toString(),
      due_day: card.due_day.toString(),
    })

    // Carregar gastos existentes do cartão
    const existingTransactions = cardTransactions.filter((t) => t.card_id === card.id)
    const existingExpenses = existingTransactions.map((t) => ({
      description: t.description,
      amount: t.amount.toString(),
      installments: t.installments.toString(),
      date: t.date,
      category: t.category,
    }))
    setCardExpenses(existingExpenses)
  }

  const refreshCardData = async () => {
    try {
      const [summaryData, transactionsData] = await Promise.all([
        getCardsSummary(),
        getCardTransactions(currentMonth, currentYear),
      ])

      setCardsSummary(summaryData)
      setCardTransactions(transactionsData)
    } catch (error) {
      console.error("Erro ao atualizar dados dos cartões:", error)
    }
  }

  const handleSaveEditCard = async (cardId: string) => {
    if (!editingCardData.name || !editingCardData.credit_limit) return

    try {
      await updateCreditCard(cardId, {
        name: editingCardData.name,
        credit_limit: Number.parseFloat(editingCardData.credit_limit),
        closing_day: Number.parseInt(editingCardData.closing_day),
        due_day: Number.parseInt(editingCardData.due_day),
      })

      // Remover transações antigas do cartão
      const existingTransactions = cardTransactions.filter((t) => t.card_id === cardId)
      for (const transaction of existingTransactions) {
        await deleteCardTransaction(transaction.id)
      }

      // Adicionar novas transações
      for (const expense of cardExpenses) {
        await addCardTransaction({
          card_id: cardId,
          description: expense.description,
          amount: Number.parseFloat(expense.amount),
          installments: Number.parseInt(expense.installments),
          current_installment: 1,
          date: expense.date,
          category: expense.category || "Geral",
        })
      }

      setEditingCard(null)
      setCardExpenses([])
      await refreshCardData() // Usar refreshCardData em vez de loadCardData para atualização mais rápida
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Erro ao atualizar cartão:", error)
      alert("Erro ao atualizar cartão.")
    }
  }

  const handleDeleteCard = async (e: React.MouseEvent, cardId: string) => {
    // Prevenir comportamento padrão do evento
    e.preventDefault()
    e.stopPropagation()

    if (!confirm("Deseja realmente excluir este cartão? Todas as transações serão perdidas.")) return

    try {
      await deleteCreditCard(cardId)
      await loadCardData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Erro ao excluir cartão:", error)
      alert("Erro ao excluir cartão.")
    }
  }

  const handleAddTransaction = async () => {
    if (!newTransaction.card_id || !newTransaction.description || !newTransaction.amount || !newTransaction.date) return

    try {
      await addCardTransaction({
        card_id: newTransaction.card_id,
        description: newTransaction.description,
        amount: Number.parseFloat(newTransaction.amount),
        installments: Number.parseInt(newTransaction.installments),
        current_installment: 1,
        date: newTransaction.date,
        category: newTransaction.category || "Geral",
      })

      setNewTransaction({
        card_id: "",
        description: "",
        amount: "",
        installments: "1",
        date: "",
        category: "",
      })
      setShowNewTransactionForm(false)
      await refreshCardData() // Usar refreshCardData em vez de loadCardData para atualização mais rápida
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Erro ao adicionar transação:", error)
      alert("Erro ao adicionar transação.")
    }
  }

  const handleDeleteTransaction = async (e: React.MouseEvent, transactionId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm("Deseja realmente excluir esta transação?")) return

    try {
      await deleteCardTransaction(transactionId)
      await loadCardData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Erro ao excluir transação:", error)
      alert("Erro ao excluir transação.")
    }
  }

  const handleToggleInstallmentPaid = async (installmentId: string, currentPaid: boolean) => {
    try {
      await updateInstallmentPaid(installmentId, !currentPaid)
      await loadCardData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Erro ao atualizar parcela:", error)
      alert("Erro ao atualizar parcela.")
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("pt-BR", { month: "long" })
  }

  const getCardBrandInfo = (cardName: string) => {
    const name = cardName.toLowerCase()

    if (name.includes("nubank") || name.includes("nu")) {
      return {
        colors: "border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100",
        textColor: "text-purple-800",
        accentColor: "text-purple-600",
        logo: "💜", // Nubank purple heart
      }
    }

    if (name.includes("bradesco")) {
      return {
        colors: "border-red-400 bg-gradient-to-br from-red-50 to-red-100",
        textColor: "text-red-800",
        accentColor: "text-red-600",
        logo: "🔴", // Bradesco red
      }
    }

    if (name.includes("itau") || name.includes("itaú")) {
      return {
        colors: "border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100",
        textColor: "text-orange-800",
        accentColor: "text-orange-600",
        logo: "🧡", // Itaú orange
      }
    }

    if (name.includes("santander")) {
      return {
        colors: "border-red-300 bg-gradient-to-br from-red-50 to-pink-50",
        textColor: "text-red-700",
        accentColor: "text-red-500",
        logo: "❤️", // Santander light red
      }
    }

    if (name.includes("c6") || name.includes("c6 bank")) {
      return {
        colors: "border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100",
        textColor: "text-gray-800",
        accentColor: "text-gray-600",
        logo: "⚫", // C6 Bank gray/black
      }
    }

    if (name.includes("inter")) {
      return {
        colors: "border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50",
        textColor: "text-orange-800",
        accentColor: "text-orange-600",
        logo: "🟠", // Inter orange
      }
    }

    if (name.includes("caixa")) {
      return {
        colors: "border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100",
        textColor: "text-blue-800",
        accentColor: "text-blue-600",
        logo: "🔵", // Caixa blue
      }
    }

    if (name.includes("bb") || name.includes("banco do brasil")) {
      return {
        colors: "border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100",
        textColor: "text-yellow-800",
        accentColor: "text-yellow-600",
        logo: "🟡", // Banco do Brasil yellow
      }
    }

    // Default for unknown cards
    return {
      colors: "border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50",
      textColor: "text-blue-800",
      accentColor: "text-blue-600",
      logo: "💳", // Generic card
    }
  }

  if (!tablesExist) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Sistema de Cartões de Crédito
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-yellow-700">
            As tabelas de cartões de crédito precisam ser criadas. Execute o script SQL para cartões primeiro.
          </p>
          <Button onClick={loadCardData} className="bg-yellow-600 hover:bg-yellow-700">
            Verificar Novamente
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
            Erro no Sistema de Cartões
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-red-700">Houve um erro ao carregar os dados dos cartões.</p>
          <Button onClick={loadCardData} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumo dos Cartões */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cardsSummary.map((summary) => {
          const actualUsed = getCardTransactionsByCard(summary.card.id).reduce((sum, t) => sum + t.amount, 0)
          const usagePercentage = (actualUsed / summary.card.credit_limit) * 100
          const isHighUsage = usagePercentage > 80
          const brandInfo = getCardBrandInfo(summary.card.name)

          return (
            <Card
              key={summary.card.id}
              className={`${isHighUsage ? "border-red-400 bg-gradient-to-br from-red-50 to-red-100" : brandInfo.colors} transition-all duration-200 hover:shadow-md`}
            >
              <CardHeader className="pb-3">
                <CardTitle
                  className={`text-sm font-medium flex items-center gap-2 ${isHighUsage ? "text-red-800" : brandInfo.textColor}`}
                >
                  <span className="text-lg">{brandInfo.logo}</span>
                  {summary.card.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usado:</span>
                    <span className={`font-medium ${isHighUsage ? "text-red-700" : brandInfo.accentColor}`}>
                      R${" "}
                      {formatCurrency(getCardTransactionsByCard(summary.card.id).reduce((sum, t) => sum + t.amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Limite:</span>
                    <span className={isHighUsage ? "text-red-600" : brandInfo.accentColor}>
                      R$ {formatCurrency(summary.card.credit_limit)}
                    </span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{usagePercentage.toFixed(1)}% utilizado</span>
                    <span>R$ {formatCurrency(summary.card.credit_limit - actualUsed)} disponível</span>
                  </div>
                </div>

                {summary.next_due_date && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-600">Próximo vencimento:</div>
                    <div className="text-sm font-medium">
                      {new Date(summary.next_due_date).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="text-sm text-red-600">R$ {formatCurrency(summary.next_due_amount)}</div>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full mt-1 text-xs hover:${brandInfo.colors.split(" ")[1]} ${isHighUsage ? "text-red-700 hover:text-red-800" : brandInfo.accentColor}`}
                  onClick={() => handleEditCard(summary.card)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar gastos
                </Button>
              </CardContent>
            </Card>
          )
        })}

        {/* Card para adicionar novo cartão */}
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex items-center justify-center h-full min-h-[200px]">
            <Button
              variant="ghost"
              onClick={() => setShowNewCardForm(true)}
              className="flex flex-col items-center gap-2 h-full w-full"
            >
              <Plus className="h-8 w-8 text-gray-400" />
              <span className="text-gray-600">Adicionar Cartão</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Formulário para novo cartão */}
      {showNewCardForm && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Novo Cartão de Crédito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="card-name">Nome do Cartão</Label>
                <Input
                  id="card-name"
                  placeholder="Ex: Nubank, Itaú..."
                  value={newCard.name}
                  onChange={(e) => setNewCard((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="card-limit">Limite (R$)</Label>
                <Input
                  id="card-limit"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={newCard.credit_limit}
                  onChange={(e) => setNewCard((prev) => ({ ...prev, credit_limit: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="closing-day">Dia do Fechamento</Label>
                <Input
                  id="closing-day"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 15"
                  value={newCard.closing_day}
                  onChange={(e) => setNewCard((prev) => ({ ...prev, closing_day: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="due-day">Dia do Vencimento</Label>
                <Input
                  id="due-day"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 10"
                  value={newCard.due_day}
                  onChange={(e) => setNewCard((prev) => ({ ...prev, due_day: e.target.value }))}
                />
              </div>
            </div>
            {/* Seção de gastos */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Gastos Já Realizados (Opcional)</h4>

              {/* Formulário para adicionar gasto */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Ex: Compra no supermercado"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Parcelas</Label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    placeholder="1"
                    value={newExpense.installments}
                    onChange={(e) => setNewExpense((prev) => ({ ...prev, installments: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Input
                    placeholder="Ex: Alimentação"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense((prev) => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={addExpenseToList} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Lista de gastos adicionados */}
              {cardExpenses.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Gastos Adicionados:</h5>
                  {cardExpenses.map((expense, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                      <div className="flex-1">
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-gray-600">
                          R$ {Number.parseFloat(expense.amount).toFixed(2)}
                          {Number.parseInt(expense.installments) > 1 && ` em ${expense.installments}x`}
                          {expense.category && ` • ${expense.category}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExpenseFromList(index)}
                        className="text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-sm text-gray-600">
                    Total: R${" "}
                    {cardExpenses.reduce((sum, exp) => sum + Number.parseFloat(exp.amount || "0"), 0).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCard}>Salvar Cartão</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewCardForm(false)
                  setCardExpenses([])
                  setNewExpense({
                    description: "",
                    amount: "",
                    installments: "1",
                    date: "",
                    category: "",
                  })
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principais */}
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cards">Cartões</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="installments">Parcelas</TabsTrigger>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Cartões</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Carregando cartões...</div>
              ) : cards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum cartão cadastrado ainda.</p>
                  <p className="text-sm mt-2">Adicione seu primeiro cartão!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map((card) => (
                    <div key={card.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex-1">
                        {editingCard === card.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <Input
                                placeholder="Nome do cartão"
                                value={editingCardData.name}
                                onChange={(e) => setEditingCardData((prev) => ({ ...prev, name: e.target.value }))}
                              />
                              <Input
                                type="number"
                                placeholder="Limite"
                                value={editingCardData.credit_limit}
                                onChange={(e) =>
                                  setEditingCardData((prev) => ({ ...prev, credit_limit: e.target.value }))
                                }
                              />
                              <Input
                                type="number"
                                placeholder="Dia fechamento"
                                value={editingCardData.closing_day}
                                onChange={(e) =>
                                  setEditingCardData((prev) => ({ ...prev, closing_day: e.target.value }))
                                }
                              />
                              <Input
                                type="number"
                                placeholder="Dia vencimento"
                                value={editingCardData.due_day}
                                onChange={(e) => setEditingCardData((prev) => ({ ...prev, due_day: e.target.value }))}
                              />
                            </div>

                            {/* Seção de gastos do cartão */}
                            <div className="border-t pt-4">
                              <h5 className="font-medium mb-3">Gastos do Cartão</h5>

                              {/* Formulário para adicionar gasto */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                <div>
                                  <Label className="text-xs">Descrição</Label>
                                  <Input
                                    placeholder="Ex: Compra no supermercado"
                                    value={newExpense.description}
                                    onChange={(e) =>
                                      setNewExpense((prev) => ({ ...prev, description: e.target.value }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Valor (R$)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense((prev) => ({ ...prev, amount: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Parcelas</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="24"
                                    placeholder="1"
                                    value={newExpense.installments}
                                    onChange={(e) =>
                                      setNewExpense((prev) => ({ ...prev, installments: e.target.value }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Data</Label>
                                  <Input
                                    type="date"
                                    value={newExpense.date}
                                    onChange={(e) => setNewExpense((prev) => ({ ...prev, date: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Categoria</Label>
                                  <Input
                                    placeholder="Ex: Alimentação"
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense((prev) => ({ ...prev, category: e.target.value }))}
                                  />
                                </div>
                                <div className="flex items-end">
                                  <Button type="button" onClick={addExpenseToList} size="sm" className="w-full">
                                    <Plus className="h-3 w-3 mr-1" />
                                    Adicionar
                                  </Button>
                                </div>
                              </div>

                              {/* Lista de gastos */}
                              {cardExpenses.length > 0 && (
                                <div className="space-y-2">
                                  <h6 className="font-medium text-xs">Gastos Atuais:</h6>
                                  {cardExpenses.map((expense, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                                    >
                                      <div className="flex-1">
                                        <p className="font-medium">{expense.description}</p>
                                        <p className="text-xs text-gray-600">
                                          R$ {Number.parseFloat(expense.amount).toFixed(2)}
                                          {Number.parseInt(expense.installments) > 1 && ` em ${expense.installments}x`}
                                          {expense.category && ` • ${expense.category}`}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeExpenseFromList(index)}
                                        className="text-red-600 h-6 w-6 p-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                  <div className="text-xs text-gray-600 text-right">
                                    Total: R${" "}
                                    {cardExpenses
                                      .reduce((sum, exp) => sum + Number.parseFloat(exp.amount || "0"), 0)
                                      .toFixed(2)}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveEditCard(card.id)}>
                                <Check className="h-3 w-3 mr-1" />
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCard(null)
                                  setCardExpenses([])
                                  setNewExpense({
                                    description: "",
                                    amount: "",
                                    installments: "1",
                                    date: "",
                                    category: "",
                                  })
                                }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">{card.name}</p>
                            <p className="text-sm text-gray-600">
                              Limite: R$ {formatCurrency(card.credit_limit)} | Fechamento: {card.closing_day} |
                              Vencimento: {card.due_day}
                            </p>
                          </div>
                        )}
                      </div>
                      {editingCard !== card.id && (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditCard(card)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteCard(e, card.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Cartão</CardTitle>
            </CardHeader>
            <CardContent>
              {cards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum cartão cadastrado ainda.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cards.map((card) => {
                    const cardTransactionsForCard = getCardTransactionsByCard(card.id)
                    return (
                      <div key={card.id} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <CreditCardIcon className="h-4 w-4" />
                          {card.name}
                        </h4>
                        {cardTransactionsForCard.length === 0 ? (
                          <p className="text-gray-500 text-sm">Nenhum gasto registrado neste cartão.</p>
                        ) : (
                          <div className="space-y-2">
                            {cardTransactionsForCard.map((transaction) => (
                              <div
                                key={transaction.id}
                                className="flex justify-between items-center p-2 bg-gray-50 rounded"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{transaction.description}</p>
                                  <p className="text-xs text-gray-600">
                                    {transaction.category} | {new Date(transaction.date).toLocaleDateString("pt-BR")}
                                    {transaction.installments > 1 && ` | ${transaction.installments}x`}
                                  </p>
                                </div>
                                <span className="font-bold text-red-600 text-sm">
                                  R$ {formatCurrency(transaction.amount)}
                                </span>
                              </div>
                            ))}
                            <div className="text-right text-sm font-medium pt-2 border-t">
                              Total: R$ {formatCurrency(cardTransactionsForCard.reduce((sum, t) => sum + t.amount, 0))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transações do Mês</CardTitle>
              <Button onClick={() => setShowNewTransactionForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </CardHeader>
            <CardContent>
              {showNewTransactionForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                  <h4 className="font-medium">Nova Transação</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Cartão</Label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={newTransaction.card_id}
                        onChange={(e) => setNewTransaction((prev) => ({ ...prev, card_id: e.target.value }))}
                      >
                        <option value="">Selecione um cartão</option>
                        {cards.map((card) => (
                          <option key={card.id} value={card.id}>
                            {card.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Input
                        placeholder="Ex: Compra no supermercado"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction((prev) => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Parcelas</Label>
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        placeholder="1"
                        value={newTransaction.installments}
                        onChange={(e) => setNewTransaction((prev) => ({ ...prev, installments: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <Input
                        placeholder="Ex: Alimentação, Transporte"
                        value={newTransaction.category}
                        onChange={(e) => setNewTransaction((prev) => ({ ...prev, category: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddTransaction}>Salvar Transação</Button>
                    <Button variant="outline" onClick={() => setShowNewTransactionForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {cardTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma transação registrada este mês.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cardTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {transaction.card?.name} | {transaction.category} |{" "}
                          {new Date(transaction.date).toLocaleDateString("pt-BR")}
                        </p>
                        {transaction.installments > 1 && (
                          <Badge variant="outline" className="mt-1">
                            {transaction.installments}x de R${" "}
                            {formatCurrency(transaction.amount / transaction.installments)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-600">R$ {formatCurrency(transaction.amount)}</span>
                        <Button variant="ghost" size="sm" onClick={(e) => handleDeleteTransaction(e, transaction.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Parcelas de {getMonthName(currentMonth)} {currentYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cardInstallments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma parcela para este mês.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cardInstallments.map((installment) => (
                    <div
                      key={installment.id}
                      className={`flex justify-between items-center p-3 border rounded-lg ${
                        installment.paid ? "bg-green-50 border-green-200" : "bg-white"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{installment.transaction?.description}</p>
                        <p className="text-sm text-gray-600">
                          {installment.transaction?.card?.name} | Parcela {installment.installment_number} |{" "}
                          {new Date(installment.due_date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">R$ {formatCurrency(installment.amount)}</span>
                        <Button
                          variant={installment.paid ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleInstallmentPaid(installment.id, installment.paid)}
                        >
                          {installment.paid ? "Pago" : "Marcar como Pago"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardsSummary.map((summary) => (
              <Card key={summary.card.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{summary.card.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Saldo Atual:</span>
                      <span className="font-bold text-red-600">R$ {formatCurrency(summary.current_balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Limite Disponível:</span>
                      <span className="font-bold text-green-600">R$ {formatCurrency(summary.available_limit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Limite Total:</span>
                      <span>R$ {formatCurrency(summary.card.credit_limit)}</span>
                    </div>
                  </div>

                  {summary.next_due_date && (
                    <div className="pt-2 border-t space-y-1">
                      <div className="flex justify-between">
                        <span>Próximo Vencimento:</span>
                        <span>{new Date(summary.next_due_date).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor a Pagar:</span>
                        <span className="font-bold text-red-600">R$ {formatCurrency(summary.next_due_amount)}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total de Transações:</span>
                      <span>{summary.transactions_count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
