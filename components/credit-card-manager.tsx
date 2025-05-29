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

  useEffect(() => {
    loadCardData()
  }, [currentMonth, currentYear])

  const handleAddCard = async () => {
    if (!newCard.name || !newCard.credit_limit || !newCard.closing_day || !newCard.due_day) return

    try {
      await addCreditCard({
        name: newCard.name,
        credit_limit: Number.parseFloat(newCard.credit_limit),
        closing_day: Number.parseInt(newCard.closing_day),
        due_day: Number.parseInt(newCard.due_day),
      })

      setNewCard({ name: "", credit_limit: "", closing_day: "", due_day: "" })
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

      setEditingCard(null)
      await loadCardData()
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
      await loadCardData()
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
          const usagePercentage = (summary.current_balance / summary.card.credit_limit) * 100
          const isHighUsage = usagePercentage > 80

          return (
            <Card
              key={summary.card.id}
              className={`${isHighUsage ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCardIcon className="h-4 w-4" />
                  {summary.card.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usado:</span>
                    <span className="font-medium">R$ {formatCurrency(summary.current_balance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Limite:</span>
                    <span>R$ {formatCurrency(summary.card.credit_limit)}</span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                  <div className="text-xs text-gray-600 text-center">{usagePercentage.toFixed(1)}% utilizado</div>
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
            <div className="flex gap-2">
              <Button onClick={handleAddCard}>Salvar Cartão</Button>
              <Button variant="outline" onClick={() => setShowNewCardForm(false)}>
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
          <TabsTrigger value="transactions">Transações</TabsTrigger>
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
                          <div className="space-y-2">
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
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveEditCard(card.id)}>
                                <Check className="h-3 w-3 mr-1" />
                                Salvar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingCard(null)}>
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
