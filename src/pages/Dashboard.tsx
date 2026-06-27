import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AppData, IncomeSource } from '../types'
import { generateAmortizationSchedule } from '../utils/calculations'

interface Props {
  data: AppData
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6']

function getMonthlyIncome(source: IncomeSource) {
  if (source.frequency === 'monthly') return source.amount
  if (source.frequency === 'biweekly') return (source.amount * 26) / 12
  if (source.frequency === 'weekly') return (source.amount * 52) / 12
  return source.amount / 12
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export default function Dashboard({ data }: Props) {
  const monthlyIncome = data.incomes.reduce((sum, income) => sum + getMonthlyIncome(income), 0)
  const monthlyExpenses = data.expenses.reduce((sum, expense) => sum + expense.budgeted, 0)
  const totalDebt = data.debts.reduce((sum, debt) => sum + debt.balance, 0)
  const cashFlow = monthlyIncome - monthlyExpenses
  const savingsRate = monthlyIncome > 0 ? (cashFlow / monthlyIncome) * 100 : 0

  const mortgageBalance = data.mortgage
    ? generateAmortizationSchedule(data.mortgage)[0]?.balance ?? data.mortgage.loanAmount
    : 0

  const netWorth =
    data.goals.reduce((sum, goal) => sum + goal.currentAmount, 0) - totalDebt - mortgageBalance

  const spendingData = data.expenses.map((expense, index) => ({
    name: expense.name,
    value: expense.budgeted,
    fill: COLORS[index % COLORS.length],
  }))

  const debtTimeline =
    data.debts.length > 0
      ? Array.from({ length: 12 }, (_, monthIndex) => ({
          month: `Month ${monthIndex + 1}`,
          debt: Math.max(
            0,
            totalDebt -
              data.debts.reduce((sum, debt) => sum + debt.minPayment, 0) * (monthIndex + 1),
          ),
        }))
      : []

  const summaryCards = [
    { label: 'Net Worth', value: netWorth, color: 'bg-indigo-500', prefix: '$' },
    {
      label: 'Monthly Cash Flow',
      value: cashFlow,
      color: cashFlow >= 0 ? 'bg-emerald-500' : 'bg-red-500',
      prefix: '$',
    },
    { label: 'Total Debt', value: totalDebt, color: 'bg-rose-500', prefix: '$' },
    { label: 'Savings Rate', value: savingsRate, color: 'bg-violet-500', suffix: '%' },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className={`${card.color} rounded-xl p-5 text-white shadow`}>
            <p className="text-sm opacity-80">{card.label}</p>
            <p className="mt-1 text-2xl font-bold">
              {card.prefix}
              {Math.abs(card.value).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              {card.suffix ?? ''}
            </p>
            {card.prefix === '$' && card.value < 0 ? (
              <p className="text-xs opacity-70">Negative</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Spending Breakdown</h2>
          {spendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={spendingData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {spendingData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-gray-400">
              <p>Add expenses in the Budget tab to see breakdown</p>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Debt Payoff Forecast (12 months)</h2>
          {debtTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={debtTimeline}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
                <Line
                  type="monotone"
                  dataKey="debt"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  name="Total Debt"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-gray-400">
              <p>Add debts in the Debts tab to see timeline</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Monthly Income vs Expenses</h2>
        <div className="flex flex-wrap gap-8">
          <div>
            <p className="text-sm text-gray-500">Monthly Income</p>
            <p className="text-2xl font-bold text-emerald-600">
              {monthlyIncome.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Monthly Expenses</p>
            <p className="text-2xl font-bold text-rose-600">
              {monthlyExpenses.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Net Cash Flow</p>
            <p className={`text-2xl font-bold ${cashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {cashFlow < 0 ? '-' : '+'}
              {Math.abs(cashFlow).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
        {monthlyIncome === 0 ? (
          <p className="mt-4 text-sm text-gray-400">
            Add income sources in the Budget tab to get started.
          </p>
        ) : null}
      </div>
    </div>
  )
}
