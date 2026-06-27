import { useMemo, useState } from 'react'
import { Download, Plus, Trash2 } from 'lucide-react'
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Debt } from '../types'
import { calculateDebtPayoff } from '../utils/calculations'
import { exportToCSV } from '../utils/csv'

interface Props {
  debts: Debt[]
  onUpdateDebts: (debts: Debt[]) => void
}

const DEBT_TYPES = ['credit_card', 'auto', 'student', 'personal', 'other'] as const
const COLORS = ['#6366f1', '#ec4899', '#f97316', '#22c55e', '#14b8a6']

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function DebtManager({ debts, onUpdateDebts }: Props) {
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche')
  const [extraPayment, setExtraPayment] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [newDebt, setNewDebt] = useState({
    name: '',
    type: 'credit_card' as (typeof DEBT_TYPES)[number],
    balance: '',
    interestRate: '',
    minPayment: '',
    dueDate: '',
  })

  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0)
  const totalMinPayment = debts.reduce((sum, debt) => sum + debt.minPayment, 0)
  const payoffResults = calculateDebtPayoff(debts, strategy, extraPayment)

  const chartData = useMemo(() => {
    const maxMonths = Math.max(...payoffResults.map((result) => result.payoffMonth), 1)
    return Array.from({ length: Math.min(maxMonths, 120) }, (_, index) => {
      const entry: Record<string, number | string> = { month: `M${index + 1}` }
      payoffResults.forEach((result) => {
        entry[result.debt.name] = result.schedule[index]?.balance ?? 0
      })
      return entry
    })
  }, [payoffResults])

  const addDebt = () => {
    if (!newDebt.name || !newDebt.balance) return

    onUpdateDebts([
      ...debts,
      {
        id: generateId(),
        name: newDebt.name,
        type: newDebt.type,
        balance: parseFloat(newDebt.balance),
        interestRate: parseFloat(newDebt.interestRate || '0'),
        minPayment: parseFloat(newDebt.minPayment || '0'),
        dueDate: parseInt(newDebt.dueDate || '1', 10),
      },
    ])

    setNewDebt({
      name: '',
      type: 'credit_card',
      balance: '',
      interestRate: '',
      minPayment: '',
      dueDate: '',
    })
    setShowForm(false)
  }

  const exportDebts = () => {
    exportToCSV(
      'debts.csv',
      ['Name', 'Type', 'Balance', 'Interest Rate', 'Min Payment', 'Due Date', 'Total Interest', 'Payoff Month'],
      payoffResults.map((result) => [
        result.debt.name,
        result.debt.type,
        result.debt.balance,
        `${result.debt.interestRate}%`,
        result.debt.minPayment,
        result.debt.dueDate,
        result.totalInterest.toFixed(2),
        result.payoffMonth,
      ]),
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Debt Manager</h1>
        <button
          onClick={exportDebts}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Total Debt</p>
          <p className="text-xl font-bold text-rose-600">${formatCurrency(totalDebt)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Min Monthly Payments</p>
          <p className="text-xl font-bold text-orange-600">${formatCurrency(totalMinPayment)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Est. Total Interest</p>
          <p className="text-xl font-bold text-amber-600">
            ${formatCurrency(payoffResults.reduce((sum, result) => sum + result.totalInterest, 0))}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Payoff Strategy</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Strategy</label>
            <div className="flex flex-wrap gap-2">
              {(['avalanche', 'snowball'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setStrategy(value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    strategy === value
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {value === 'avalanche'
                    ? '🏔 Avalanche (highest rate first)'
                    : '⛄ Snowball (lowest balance first)'}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {strategy === 'avalanche'
                ? 'Saves the most money in interest.'
                : 'Provides psychological wins by paying off small debts first.'}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Extra Monthly Payment ($)
            </label>
            <input
              type="number"
              min="0"
              className="w-32 rounded-lg border px-3 py-2 text-sm"
              value={extraPayment}
              onChange={(event) => setExtraPayment(parseFloat(event.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Debts</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> Add Debt
          </button>
        </div>
        {showForm ? (
          <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-indigo-50 p-4 lg:grid-cols-3">
            <input
              placeholder="Debt name"
              className="rounded-lg border px-3 py-2 text-sm"
              value={newDebt.name}
              onChange={(event) => setNewDebt((prev) => ({ ...prev, name: event.target.value }))}
            />
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={newDebt.type}
              onChange={(event) =>
                setNewDebt((prev) => ({
                  ...prev,
                  type: event.target.value as (typeof DEBT_TYPES)[number],
                }))
              }
            >
              {DEBT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
            <input
              placeholder="Balance ($)"
              type="number"
              className="rounded-lg border px-3 py-2 text-sm"
              value={newDebt.balance}
              onChange={(event) => setNewDebt((prev) => ({ ...prev, balance: event.target.value }))}
            />
            <input
              placeholder="Interest Rate (%)"
              type="number"
              className="rounded-lg border px-3 py-2 text-sm"
              value={newDebt.interestRate}
              onChange={(event) =>
                setNewDebt((prev) => ({ ...prev, interestRate: event.target.value }))
              }
            />
            <input
              placeholder="Min Payment ($)"
              type="number"
              className="rounded-lg border px-3 py-2 text-sm"
              value={newDebt.minPayment}
              onChange={(event) =>
                setNewDebt((prev) => ({ ...prev, minPayment: event.target.value }))
              }
            />
            <input
              placeholder="Due Day (1-31)"
              type="number"
              min="1"
              max="31"
              className="rounded-lg border px-3 py-2 text-sm"
              value={newDebt.dueDate}
              onChange={(event) => setNewDebt((prev) => ({ ...prev, dueDate: event.target.value }))}
            />
            <div className="col-span-full flex gap-2">
              <button onClick={addDebt} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
                Save
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">Name</th>
                <th className="pb-2">Type</th>
                <th className="pb-2 text-right">Balance</th>
                <th className="pb-2 text-right">Rate</th>
                <th className="pb-2 text-right">Min Payment</th>
                <th className="pb-2 text-right">Total Interest</th>
                <th className="pb-2 text-right">Payoff</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {payoffResults.map(({ debt, totalInterest, payoffMonth }) => (
                <tr key={debt.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium">{debt.name}</td>
                  <td className="py-3 capitalize">{debt.type.replace('_', ' ')}</td>
                  <td className="py-3 text-right">${debt.balance.toLocaleString()}</td>
                  <td className="py-3 text-right">{debt.interestRate}%</td>
                  <td className="py-3 text-right">${debt.minPayment.toLocaleString()}</td>
                  <td className="py-3 text-right text-amber-600">${formatCurrency(totalInterest)}</td>
                  <td className="py-3 text-right text-indigo-600">{payoffMonth} mo</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onUpdateDebts(debts.filter((item) => item.id !== debt.id))}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {debts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No debts added yet
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {debts.length > 0 ? (
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Debt Payoff Timeline</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10 }}
                interval={Math.max(Math.floor(chartData.length / 10), 0)}
              />
              <YAxis tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) =>
                  `$${Number(value).toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}`
                }
              />
              <Legend />
              {payoffResults.map((result, index) => (
                <Line
                  key={result.debt.id}
                  type="monotone"
                  dataKey={result.debt.name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  )
}
