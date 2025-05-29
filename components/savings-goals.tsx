"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Target, Check, X, Edit, Trash2 } from "lucide-react"

interface SavingsGoal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  deadline: string
  description?: string
  created_at?: string
}

interface SavingsGoalsProps {
  totalAccumulated: number
}

export function SavingsGoals({ totalAccumulated }: SavingsGoalsProps) {
  const [goals, setGoals] = useState<SavingsGoal[]>([])

  const [newGoal, setNewGoal] = useState({
    title: "",
    targetAmount: "",
    deadline: "",
    description: "",
  })

  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [editingGoalData, setEditingGoalData] = useState({
    title: "",
    targetAmount: "",
    deadline: "",
    description: "",
  })

  const [showNewGoalForm, setShowNewGoalForm] = useState(false)

  // Helper functions for localStorage
  const saveGoalsToStorage = (goalsToSave: SavingsGoal[]) => {
    try {
      localStorage.setItem("savings_goals", JSON.stringify(goalsToSave))
    } catch (error) {
      console.error("Erro ao salvar metas no localStorage:", error)
    }
  }

  const loadGoalsFromStorage = (): SavingsGoal[] => {
    try {
      const stored = localStorage.getItem("savings_goals")
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error("Erro ao carregar metas do localStorage:", error)
    }
    return []
  }

  // Load goals from localStorage on component mount
  useEffect(() => {
    const loadedGoals = loadGoalsFromStorage()
    // Update current amount for all goals
    const updatedGoals = loadedGoals.map((goal) => ({
      ...goal,
      currentAmount: totalAccumulated,
    }))
    setGoals(updatedGoals)
  }, [])

  // Update currentAmount when totalAccumulated changes
  useEffect(() => {
    setGoals((prevGoals) => {
      const updatedGoals = prevGoals.map((goal) => ({
        ...goal,
        currentAmount: totalAccumulated,
      }))
      saveGoalsToStorage(updatedGoals)
      return updatedGoals
    })
  }, [totalAccumulated])

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal.id)
    setEditingGoalData({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      deadline: goal.deadline,
      description: goal.description || "",
    })
  }

  const handleSaveEditGoal = () => {
    if (!editingGoal || !editingGoalData.title || !editingGoalData.targetAmount || !editingGoalData.deadline) return

    const updatedGoals = goals.map((goal) =>
      goal.id === editingGoal
        ? {
            ...goal,
            title: editingGoalData.title,
            targetAmount: Number.parseFloat(editingGoalData.targetAmount),
            deadline: editingGoalData.deadline,
            description: editingGoalData.description,
          }
        : goal,
    )

    setGoals(updatedGoals)
    saveGoalsToStorage(updatedGoals)

    // Reset editing state
    setEditingGoal(null)
    setEditingGoalData({
      title: "",
      targetAmount: "",
      deadline: "",
      description: "",
    })
  }

  const handleDeleteGoal = (id: string) => {
    if (!confirm("Deseja realmente excluir esta meta?")) return

    const updatedGoals = goals.filter((goal) => goal.id !== id)
    setGoals(updatedGoals)
    saveGoalsToStorage(updatedGoals)
  }

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.deadline) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    const goal: SavingsGoal = {
      id: Date.now().toString(),
      title: newGoal.title,
      targetAmount: Number.parseFloat(newGoal.targetAmount),
      currentAmount: totalAccumulated,
      deadline: newGoal.deadline,
      description: newGoal.description,
      created_at: new Date().toISOString(),
    }

    const updatedGoals = [...goals, goal]
    setGoals(updatedGoals)
    saveGoalsToStorage(updatedGoals)

    setNewGoal({ title: "", targetAmount: "", deadline: "", description: "" })
    setShowNewGoalForm(false)
  }

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const getStatusBadge = (current: number, target: number, deadline: string) => {
    const percentage = getProgressPercentage(current, target)
    const isOverdue = new Date(deadline) < new Date()

    if (percentage >= 100) return <Badge className="bg-green-500">Concluída</Badge>
    if (isOverdue) return <Badge variant="destructive">Atrasada</Badge>
    if (percentage >= 75) return <Badge className="bg-blue-500">Quase lá</Badge>
    return <Badge variant="secondary">Em andamento</Badge>
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas de Reserva
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewGoalForm(!showNewGoalForm)}
          className="flex items-center gap-1"
        >
          <Target className="h-4 w-4" />
          Nova Meta
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário para nova meta */}
        {showNewGoalForm && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goal-title">Título da Meta</Label>
                  <Input
                    id="goal-title"
                    placeholder="Ex: Reserva de Emergência"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="goal-amount">Valor Alvo (R$)</Label>
                  <Input
                    id="goal-amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, targetAmount: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="goal-deadline">Prazo</Label>
                  <Input
                    id="goal-deadline"
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="goal-description">Descrição (opcional)</Label>
                  <Input
                    id="goal-description"
                    placeholder="Descrição da meta"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddGoal} size="sm">
                  <Check className="h-4 w-4 mr-1" />
                  Salvar Meta
                </Button>
                <Button variant="outline" onClick={() => setShowNewGoalForm(false)} size="sm">
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulário para editar meta */}
        {editingGoal && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-goal-title">Título da Meta</Label>
                  <Input
                    id="edit-goal-title"
                    placeholder="Ex: Reserva de Emergência"
                    value={editingGoalData.title}
                    onChange={(e) => setEditingGoalData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-goal-amount">Valor Alvo (R$)</Label>
                  <Input
                    id="edit-goal-amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={editingGoalData.targetAmount}
                    onChange={(e) => setEditingGoalData((prev) => ({ ...prev, targetAmount: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-goal-deadline">Prazo</Label>
                  <Input
                    id="edit-goal-deadline"
                    type="date"
                    value={editingGoalData.deadline}
                    onChange={(e) => setEditingGoalData((prev) => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-goal-description">Descrição (opcional)</Label>
                  <Input
                    id="edit-goal-description"
                    placeholder="Descrição da meta"
                    value={editingGoalData.description}
                    onChange={(e) => setEditingGoalData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveEditGoal} size="sm">
                  <Check className="h-4 w-4 mr-1" />
                  Atualizar Meta
                </Button>
                <Button variant="outline" onClick={() => setEditingGoal(null)} size="sm">
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de metas */}
        <div className="space-y-4">
          {goals.map((goal) => {
            const percentage = getProgressPercentage(goal.currentAmount, goal.targetAmount)
            const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)

            return (
              <div key={goal.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{goal.title}</h3>
                      {getStatusBadge(goal.currentAmount, goal.targetAmount, goal.deadline)}
                    </div>
                    {goal.description && <p className="text-sm text-gray-600">{goal.description}</p>}
                    <p className="text-sm text-gray-500">
                      Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditGoal(goal)}
                      className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso: {percentage.toFixed(1)}%</span>
                    <span>
                      R$ {formatCurrency(goal.currentAmount)} / R$ {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  {remaining > 0 && <p className="text-sm text-gray-600">Faltam: R$ {formatCurrency(remaining)}</p>}
                </div>
              </div>
            )
          })}

          {goals.length === 0 && !showNewGoalForm && (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhuma meta definida ainda.</p>
              <p className="text-sm mt-2">Crie suas primeiras metas de reserva!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
