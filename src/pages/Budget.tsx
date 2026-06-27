import { useState } from 'react'
import { Download, Plus, Trash2 } from 'lucide-react'
import type { ExpenseCategory, IncomeSource, Transaction } from '../types'
import { exportToCSV } from '../utils/csv'

interface Props {
  incomes: IncomeSource[]
  expenses: ExpenseCategory[]
  transactions: Transaction[]
  onUpdateIncomes: (incomes: IncomeSource[]) => void
  onUpdateExpenses: (expenses: ExpenseCategory[]) => void
  onUpdateTransactions: (transactions: Transaction[]) => void
}

const EXPENSE_CATEGORIES = [
  'housing',
  'food',
  'transport',
  'utilities',
  'entertainment',
  'healthcare',
  'other',
] as const
const FREQUENCIES = ['monthly', 'biweekly', 'weekly', 'annual'] as const

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function getMonthlyIncome(source: IncomeSource) {
  if (source.frequency === 'monthly') return source.amount
  if (source.frequency === 'biweekly') return (source.amount * 26) / 12
  if (source.frequency === 'weekly') return (source.amount * 52) / 12
  return source.amount / 12
}

function formatMoney(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Budget({
  incomes,
  expenses,
  transactions,
  onUpdateIncomes,
  onUpdateExpenses,
  onUpdateTransactions,
}: Props) {
  const [activeTab, setActiveTab] = useState<'income' | 'expenses' | 'transactions'>('income')
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showTxForm, setShowTxForm] = useState(false)
  const [newIncome, setNewIncome] = useState({
    name: '',
    amount: '',
    frequency: 'monthly' as (typeof FREQUENCIES)[number],
  })
  const [newExpense, setNewExpense] = useState({
    name: '',
    budgeted: '',
    actual: '',
    category: 'other' as (typeof EXPENSE_CATEGORIES)[number],
  })
  const [newTx, setNewTx] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    notes: '',
    type: 'expense' as 'income' | 'expense',
  })

  const totalMonthlyIncome = incomes.reduce((sum, income) => sum + getMonthlyIncome(income), 0)
  const totalBudgeted = expenses.reduce((sum, expense) => sum + expense.budgeted, 0)
  const totalActual = expenses.reduce((sum, expense) => sum + expense.actual, 0)

  const addIncome = () => {
    if (!newIncome.name || !newIncome.amount) return
    onUpdateIncomes([
      ...incomes,
      {
        id: generateId(),
        name: newIncome.name,
        amount: parseFloat(newIncome.amount),
        frequency: newIncome.frequency,
      },
    ])
    setNewIncome({ name: '', amount: '', frequency: 'monthly' })
    setShowIncomeForm(false)
  }

  const addExpense = () => {
    if (!newExpense.name || !newExpense.budgeted) return
    onUpdateExpenses([
      ...expenses,
      {
        id: generateId(),
        name: newExpense.name,
        budgeted: parseFloat(newExpense.budgeted),
        actual: parseFloat(newExpense.actual || '0'),
        category: newExpense.category,
      },
    ])
    setNewExpense({ name: '', budgeted: '', actual: '', category: 'other' })
    setShowExpenseForm(false)
  }

  const addTransaction = () => {
    if (!newTx.amount || !newTx.category) return
    onUpdateTransactions([
      ...transactions,
      {
        id: generateId(),
        date: newTx.date,
        amount: parseFloat(newTx.amount),
        category: newTx.category,
        notes: newTx.notes,
        type: newTx.type,
      },
    ])
    setNewTx({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: '',
      notes: '',
      type: 'expense',
    })
    setShowTxForm(false)
  }

  const exportBudget = () => {
    exportToCSV(
      'budget.csv',
      ['Name', 'Budgeted', 'Actual', 'Difference', 'Category'],
      expenses.map((expense) => [
        expense.name,
        expense.budgeted,
        expense.actual,
        expense.budgeted - expense.actual,
        expense.category,
      ]),
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Budget Planner</h1>
        <button
          onClick={exportBudget}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Monthly Income', value: totalMonthlyIncome, color: 'text-emerald-600' },
          { label: 'Budgeted', value: totalBudgeted, color: 'text-indigo-600' },
          {
            label: 'Surplus / Deficit',
            value: totalMonthlyIncome - totalBudgeted,
            color: totalMonthlyIncome - totalBudgeted >= 0 ? 'text-emerald-600' : 'text-red-600',
          },
        ].map((summary) => (
          <div key={summary.label} className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">{summary.label}</p>
            <p className={`text-xl font-bold ${summary.color}`}>
              ${formatMoney(Math.abs(summary.value))}
              {summary.value < 0 ? ' (deficit)' : ''}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
        {(['income', 'expenses', 'transactions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-indigo-700 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'income' ? (
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Income Sources</h2>
            <button
              onClick={() => setShowIncomeForm(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
            >
              <Plus size={16} /> Add Income
            </button>
          </div>
          {showIncomeForm ? (
            <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-indigo-50 p-4 lg:grid-cols-4">
              <input
                placeholder="Name (e.g., Salary)"
                className="col-span-1 rounded-lg border px-3 py-2 text-sm lg:col-span-2"
                value={newIncome.name}
                onChange={(event) => setNewIncome((prev) => ({ ...prev, name: event.target.value }))}
              />
              <input
                placeholder="Amount"
                type="number"
                className="rounded-lg border px-3 py-2 text-sm"
                value={newIncome.amount}
                onChange={(event) => setNewIncome((prev) => ({ ...prev, amount: event.target.value }))}
              />
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={newIncome.frequency}
                onChange={(event) =>
                  setNewIncome((prev) => ({
                    ...prev,
                    frequency: event.target.value as (typeof FREQUENCIES)[number],
                  }))
                }
              >
                {FREQUENCIES.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency}
                  </option>
                ))}
              </select>
              <div className="col-span-full flex gap-2">
                <button onClick={addIncome} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
                  Save
                </button>
                <button onClick={() => setShowIncomeForm(false)} className="rounded-lg border px-4 py-2 text-sm">
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
                  <th className="pb-2">Frequency</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-right">Monthly Equiv.</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {incomes.map((income) => {
                  const monthly = getMonthlyIncome(income)
                  return (
                    <tr key={income.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">{income.name}</td>
                      <td className="py-3 capitalize">{income.frequency}</td>
                      <td className="py-3 text-right">${income.amount.toLocaleString()}</td>
                      <td className="py-3 text-right font-medium text-emerald-600">
                        ${formatMoney(monthly)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onUpdateIncomes(incomes.filter((item) => item.id !== income.id))}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {incomes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No income sources added yet
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {activeTab === 'expenses' ? (
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Monthly Expenses</h2>
            <button
              onClick={() => setShowExpenseForm(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
            >
              <Plus size={16} /> Add Expense
            </button>
          </div>
          {showExpenseForm ? (
            <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-indigo-50 p-4 lg:grid-cols-4">
              <input
                placeholder="Expense name"
                className="col-span-1 rounded-lg border px-3 py-2 text-sm lg:col-span-2"
                value={newExpense.name}
                onChange={(event) => setNewExpense((prev) => ({ ...prev, name: event.target.value }))}
              />
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={newExpense.category}
                onChange={(event) =>
                  setNewExpense((prev) => ({
                    ...prev,
                    category: event.target.value as (typeof EXPENSE_CATEGORIES)[number],
                  }))
                }
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                placeholder="Budgeted $"
                type="number"
                className="rounded-lg border px-3 py-2 text-sm"
                value={newExpense.budgeted}
                onChange={(event) => setNewExpense((prev) => ({ ...prev, budgeted: event.target.value }))}
              />
              <input
                placeholder="Actual spent $"
                type="number"
                className="col-span-1 rounded-lg border px-3 py-2 text-sm lg:col-span-2"
                value={newExpense.actual}
                onChange={(event) => setNewExpense((prev) => ({ ...prev, actual: event.target.value }))}
              />
              <div className="col-span-full flex gap-2">
                <button onClick={addExpense} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
                  Save
                </button>
                <button onClick={() => setShowExpenseForm(false)} className="rounded-lg border px-4 py-2 text-sm">
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
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Budgeted</th>
                  <th className="pb-2 text-right">Actual</th>
                  <th className="pb-2 text-right">Difference</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => {
                  const difference = expense.budgeted - expense.actual
                  return (
                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">{expense.name}</td>
                      <td className="py-3 capitalize">{expense.category}</td>
                      <td className="py-3 text-right">${expense.budgeted.toLocaleString()}</td>
                      <td className="py-3 text-right">${expense.actual.toLocaleString()}</td>
                      <td className={`py-3 text-right font-medium ${difference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {difference >= 0 ? '+' : '-'}${Math.abs(difference).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onUpdateExpenses(expenses.filter((item) => item.id !== expense.id))}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No expenses added yet
                    </td>
                  </tr>
                ) : null}
              </tbody>
              {expenses.length > 0 ? (
                <tfoot className="border-t-2 font-semibold">
                  <tr>
                    <td colSpan={2} className="pt-3">
                      Total
                    </td>
                    <td className="pt-3 text-right">${formatMoney(totalBudgeted)}</td>
                    <td className="pt-3 text-right">${formatMoney(totalActual)}</td>
                    <td className={`pt-3 text-right ${totalBudgeted - totalActual >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {totalBudgeted - totalActual >= 0 ? '+' : '-'}${formatMoney(Math.abs(totalBudgeted - totalActual))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </div>
      ) : null}

      {activeTab === 'transactions' ? (
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Transactions</h2>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  exportToCSV(
                    'transactions.csv',
                    ['Date', 'Type', 'Category', 'Amount', 'Notes'],
                    transactions.map((transaction) => [
                      transaction.date,
                      transaction.type,
                      transaction.category,
                      transaction.amount,
                      transaction.notes,
                    ]),
                  )
                }
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                <Download size={16} /> Export
              </button>
              <button
                onClick={() => setShowTxForm(true)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </div>
          {showTxForm ? (
            <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-indigo-50 p-4 lg:grid-cols-4">
              <input
                type="date"
                className="rounded-lg border px-3 py-2 text-sm"
                value={newTx.date}
                onChange={(event) => setNewTx((prev) => ({ ...prev, date: event.target.value }))}
              />
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={newTx.type}
                onChange={(event) =>
                  setNewTx((prev) => ({ ...prev, type: event.target.value as 'income' | 'expense' }))
                }
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input
                placeholder="Category"
                className="rounded-lg border px-3 py-2 text-sm"
                value={newTx.category}
                onChange={(event) => setNewTx((prev) => ({ ...prev, category: event.target.value }))}
              />
              <input
                placeholder="Amount"
                type="number"
                className="rounded-lg border px-3 py-2 text-sm"
                value={newTx.amount}
                onChange={(event) => setNewTx((prev) => ({ ...prev, amount: event.target.value }))}
              />
              <input
                placeholder="Notes"
                className="col-span-1 rounded-lg border px-3 py-2 text-sm lg:col-span-3"
                value={newTx.notes}
                onChange={(event) => setNewTx((prev) => ({ ...prev, notes: event.target.value }))}
              />
              <div className="col-span-full flex gap-2">
                <button onClick={addTransaction} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
                  Save
                </button>
                <button onClick={() => setShowTxForm(false)} className="rounded-lg border px-4 py-2 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2">Notes</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {[...transactions]
                  .sort((left, right) => right.date.localeCompare(left.date))
                  .map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{transaction.date}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            transaction.type === 'income'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-2">{transaction.category}</td>
                      <td
                        className={`py-2 text-right font-medium ${
                          transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </td>
                      <td className="py-2 text-gray-500">{transaction.notes}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() =>
                            onUpdateTransactions(
                              transactions.filter((item) => item.id !== transaction.id),
                            )
                          }
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No transactions yet
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
