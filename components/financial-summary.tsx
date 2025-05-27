import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react"
import type { Transaction, ExtraIncome } from "@/types/financial"

interface FinancialSummaryProps {
  transactions: Transaction[]
  extraIncome: ExtraIncome[]
  dasValue: number
}

export function FinancialSummary({ transactions, extraIncome, dasValue }: FinancialSummaryProps) {
  const totalReceitas = transactions.filter((t) => t.type === "receita").reduce((sum, t) => sum + t.amount, 0)

  const totalExtras = extraIncome.reduce((sum, e) => sum + e.amount, 0)
  const totalReceitasComExtras = totalReceitas + totalExtras

  const totalGastos = transactions.filter((t) => t.type === "gasto").reduce((sum, t) => sum + t.amount, 0)

  const saldoMensal = totalReceitasComExtras - totalGastos - dasValue

  // Cálculo do IR anual
  const receitaAnual = totalReceitasComExtras * 12
  const isencaoIR = 28559.7
  const impostoRendaAnual = receitaAnual > isencaoIR ? (receitaAnual - isencaoIR) * 0.075 : 0
  const impostoRendaMensal = impostoRendaAnual / 12

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Receitas + Extras</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">
            R$ {totalReceitasComExtras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          {totalExtras > 0 && (
            <p className="text-xs text-green-600 mt-1">
              + R$ {totalExtras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} extras
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-red-50 border-red-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-800">Gastos + DAS</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900">
            R$ {(totalGastos + dasValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      <Card className={`${saldoMensal >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${saldoMensal >= 0 ? "text-blue-800" : "text-orange-800"}`}>
            Saldo Mensal
          </CardTitle>
          <DollarSign className={`h-4 w-4 ${saldoMensal >= 0 ? "text-blue-600" : "text-orange-600"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${saldoMensal >= 0 ? "text-blue-900" : "text-orange-900"}`}>
            R$ {saldoMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-purple-50 border-purple-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-800">IR Mensal Estimado</CardTitle>
          <AlertTriangle className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">
            R$ {impostoRendaMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-purple-600 mt-1">{receitaAnual <= isencaoIR ? "Isento" : "Sujeito ao IR"}</p>
        </CardContent>
      </Card>
    </div>
  )
}
