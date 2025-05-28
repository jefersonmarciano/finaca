"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthSelectorProps {
  currentMonth: number
  currentYear: number
  onChange: (month: number, year: number) => void
}

export function MonthSelector({ currentMonth, currentYear, onChange }: MonthSelectorProps) {
  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString("pt-BR", { month: "long" })

  const handlePreviousMonth = () => {
    let newMonth = currentMonth - 1
    let newYear = currentYear

    if (newMonth < 1) {
      newMonth = 12
      newYear--
    }

    onChange(newMonth, newYear)
  }

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1
    let newYear = currentYear

    if (newMonth > 12) {
      newMonth = 1
      newYear++
    }

    onChange(newMonth, newYear)
  }

  const handleCurrentMonth = () => {
    const now = new Date()
    onChange(now.getMonth() + 1, now.getFullYear())
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex flex-col items-center">
        <h2 className="text-xl font-semibold capitalize">{monthName}</h2>
        <p className="text-sm text-gray-500">{currentYear}</p>
      </div>

      <Button variant="outline" size="icon" onClick={handleNextMonth}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={handleCurrentMonth} className="ml-2">
        Mês Atual
      </Button>
    </div>
  )
}
