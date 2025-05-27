import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle } from "lucide-react"
import type { Transaction, ExtraIncome } from "@/types/financial"

interface AlertsPanelProps {
  transactions: Transaction[]
  extraIncome: ExtraIncome[]
  dasValue: number
  currentMonth: number
}

export function AlertsPanel({ transactions, extraIncome, dasValue, currentMonth }: AlertsPanelProps) {
  const totalReceitas = transactions.filter((t) => t.type === "receita").reduce((sum, t) => sum + t.amount, 0)

  const totalExtras = extraIncome.reduce((sum, e) => sum + e.amount, 0)
  const totalReceitasComExtras = totalReceitas + totalExtras

  const totalGastos = transactions.filter((t) => t.type === "gasto").reduce((sum, t) => sum + t.amount, 0)

  const saldoMensal = totalReceitasComExtras - totalGastos - dasValue

  const receitaAnual = totalReceitasComExtras * 12
  const isencaoIR = 28559.7

  const gastosFixos =
    transactions.filter((t) => t.type === "gasto" && t.is_fixed).reduce((sum, t) => sum + t.amount, 0) + dasValue

  const sobrariaComGastosFixos = totalReceitasComExtras - gastosFixos

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={dasValue > 0 ? "destructive" : "default"}>DAS MEI: R$ {dasValue}</Badge>
            <span className="text-sm text-gray-600">Vencimento todo dia 20</span>
          </div>

          {receitaAnual > isencaoIR && (
            <div className="p-3 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-800">
                ⚠️ Receita anual projetada: R$ {receitaAnual.toLocaleString("pt-BR")}
                <br />
                Acima da faixa de isenção do IR. Prepare-se para declarar!
              </p>
            </div>
          )}

          {saldoMensal < 500 && (
            <div className="p-3 bg-red-100 rounded-lg">
              <p className="text-sm text-red-800">⚠️ Saldo mensal baixo. Considere revisar os gastos.</p>
            </div>
          )}

          {totalExtras > 0 && (
            <div className="p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Você recebeu R$ {totalExtras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} extras este mês!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Projeção de Fluxo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Gastos Fixos Cobertos</span>
              <span>{((gastosFixos / totalReceitasComExtras) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(gastosFixos / totalReceitasComExtras) * 100} className="h-2" />
          </div>

          <div className="text-sm space-y-1">
            <p>
              <strong>Sobra após gastos fixos:</strong> R${" "}
              {sobrariaComGastosFixos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p>
              <strong>Reserva sugerida (20%):</strong> R${" "}
              {(totalReceitasComExtras * 0.2).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p>
              <strong>Disponível para gastos variáveis:</strong> R${" "}
              {(sobrariaComGastosFixos - totalReceitasComExtras * 0.2).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
