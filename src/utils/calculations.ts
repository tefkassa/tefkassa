import type { Debt, Mortgage } from '../types'

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (principal <= 0 || termMonths <= 0) return 0
  if (annualRate === 0) return principal / termMonths
  const rate = annualRate / 100 / 12
  return (
    (principal * (rate * Math.pow(1 + rate, termMonths))) /
    (Math.pow(1 + rate, termMonths) - 1)
  )
}

export interface AmortizationRow {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export function generateAmortizationSchedule(mortgage: Mortgage): AmortizationRow[] {
  const { loanAmount, interestRate, termYears, extraPayment } = mortgage
  if (loanAmount <= 0 || termYears <= 0) return []

  const monthlyRate = interestRate / 100 / 12
  const totalMonths = termYears * 12
  const basePayment = calculateMonthlyPayment(loanAmount, interestRate, totalMonths)
  const payment = basePayment + (extraPayment || 0)

  const rows: AmortizationRow[] = []
  let balance = loanAmount
  let month = 0

  while (balance > 0 && month < totalMonths) {
    month += 1
    const interest = balance * monthlyRate
    const principalPaid = Math.min(Math.max(payment - interest, 0), balance)
    balance = Math.max(0, balance - principalPaid)

    rows.push({
      month,
      payment: principalPaid + interest,
      principal: principalPaid,
      interest,
      balance,
    })

    if (principalPaid <= 0 && interestRate > 0) {
      break
    }
  }

  return rows
}

export interface DebtPayoffResult {
  debt: Debt
  payoffMonth: number
  totalInterest: number
  schedule: { month: number; balance: number; payment: number }[]
}

type WorkingDebt = Debt & {
  remainingBalance: number
  totalInterest: number
  payoffMonth: number
  schedule: { month: number; balance: number; payment: number }[]
}

export function calculateDebtPayoff(
  debts: Debt[],
  strategy: 'avalanche' | 'snowball',
  extraPayment = 0,
): DebtPayoffResult[] {
  if (debts.length === 0) return []

  const sorted: WorkingDebt[] = debts
    .map((debt) => ({
      ...debt,
      remainingBalance: debt.balance,
      totalInterest: 0,
      payoffMonth: 0,
      schedule: [],
    }))
    .sort((a, b) =>
      strategy === 'avalanche'
        ? b.interestRate - a.interestRate
        : a.remainingBalance - b.remainingBalance,
    )

  let month = 0
  const maxMonths = 360

  while (sorted.some((debt) => debt.remainingBalance > 0) && month < maxMonths) {
    month += 1
    let availableExtra = extraPayment
    const priorityIndex = sorted.findIndex((debt) => debt.remainingBalance > 0)

    for (let index = 0; index < sorted.length; index += 1) {
      const debt = sorted[index]
      if (debt.remainingBalance <= 0) continue

      const interest = (debt.remainingBalance * debt.interestRate) / 100 / 12
      debt.totalInterest += interest

      let payment = debt.minPayment
      if (index === priorityIndex) {
        payment += availableExtra
        availableExtra = 0
      }

      const actualPayment = Math.min(payment, debt.remainingBalance + interest)
      debt.remainingBalance = Math.max(0, debt.remainingBalance + interest - actualPayment)

      if (debt.remainingBalance <= 0 && debt.payoffMonth === 0) {
        debt.payoffMonth = month
      }

      debt.schedule.push({
        month,
        balance: debt.remainingBalance,
        payment: actualPayment,
      })
    }
  }

  return sorted.map((debt) => ({
    debt: debts.find((original) => original.id === debt.id) ?? debt,
    payoffMonth: debt.payoffMonth || month,
    totalInterest: debt.totalInterest,
    schedule: debt.schedule,
  }))
}
