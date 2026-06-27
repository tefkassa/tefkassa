import { useState } from 'react'
import { Check, Edit3, Plus, Trash2, X } from 'lucide-react'
import type { SavingsGoal } from '../types'

interface Props {
  goals: SavingsGoal[]
  onUpdateGoals: (goals: SavingsGoal[]) => void
}

const GOAL_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#14b8a6', '#eab308', '#f43f5e']

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function formatCurrency(value: number, digits = 2) {
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export default function SavingsGoals({ goals, onUpdateGoals }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    color: GOAL_COLORS[0],
  })
  const [editAmount, setEditAmount] = useState('')

  const addGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount) return
    onUpdateGoals([
      ...goals,
      {
        id: generateId(),
        name: newGoal.name,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: parseFloat(newGoal.currentAmount || '0'),
        targetDate: newGoal.targetDate,
        color: newGoal.color,
      },
    ])
    setNewGoal({
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      color: GOAL_COLORS[goals.length % GOAL_COLORS.length],
    })
    setShowForm(false)
  }

  const updateAmount = (id: string) => {
    onUpdateGoals(
      goals.map((goal) =>
        goal.id === id
          ? { ...goal, currentAmount: parseFloat(editAmount) || goal.currentAmount }
          : goal,
      ),
    )
    setEditingId(null)
    setEditAmount('')
  }

  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0)
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
        >
          <Plus size={16} /> Add Goal
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Total Saved</p>
          <p className="text-xl font-bold text-emerald-600">${formatCurrency(totalSaved)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Total Target</p>
          <p className="text-xl font-bold text-indigo-600">${formatCurrency(totalTarget)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Overall Progress</p>
          <p className="text-xl font-bold text-violet-600">
            {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : '0'}%
          </p>
        </div>
      </div>

      {showForm ? (
        <div className="mb-6 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">New Goal</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Goal Name</label>
              <input
                placeholder="e.g., Emergency Fund"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={newGoal.name}
                onChange={(event) => setNewGoal((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Target Amount ($)</label>
              <input
                type="number"
                placeholder="10000"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={newGoal.targetAmount}
                onChange={(event) => setNewGoal((prev) => ({ ...prev, targetAmount: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Current Amount ($)</label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={newGoal.currentAmount}
                onChange={(event) => setNewGoal((prev) => ({ ...prev, currentAmount: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Target Date</label>
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={newGoal.targetDate}
                onChange={(event) => setNewGoal((prev) => ({ ...prev, targetDate: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Color</label>
              <div className="mt-1 flex gap-2">
                {GOAL_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewGoal((prev) => ({ ...prev, color }))}
                    className={`h-7 w-7 rounded-full border-2 ${
                      newGoal.color === color ? 'border-gray-800' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={addGoal} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
              Save Goal
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0
          const remaining = goal.targetAmount - goal.currentAmount
          const monthsLeft = goal.targetDate
            ? Math.max(
                1,
                Math.ceil(
                  (new Date(goal.targetDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24 * 30),
                ),
              )
            : null
          const monthlyNeeded = monthsLeft && remaining > 0 ? remaining / monthsLeft : 0

          return (
            <div key={goal.id} className="rounded-xl bg-white p-6 shadow">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-white"
                    style={{ backgroundColor: goal.color }}
                  >
                    🎯
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                    {goal.targetDate ? (
                      <p className="text-xs text-gray-500">
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                </div>
                <button
                  onClick={() => onUpdateGoals(goals.filter((item) => item.id !== goal.id))}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mb-3">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium" style={{ color: goal.color }}>
                    ${goal.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-gray-500">${goal.targetAmount.toLocaleString()}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{ width: `${progress}%`, backgroundColor: goal.color }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{progress.toFixed(1)}% complete</p>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="font-medium">${formatCurrency(remaining, 0)}</p>
                </div>
                {monthlyNeeded > 0 ? (
                  <div>
                    <p className="text-xs text-gray-500">Monthly Needed</p>
                    <p className="font-medium text-indigo-600">${formatCurrency(monthlyNeeded)}</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-3 border-t pt-3">
                {editingId === goal.id ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 rounded border px-2 py-1 text-sm"
                      placeholder="New amount"
                      value={editAmount}
                      onChange={(event) => setEditAmount(event.target.value)}
                    />
                    <button onClick={() => updateAmount(goal.id)} className="text-emerald-600 hover:text-emerald-700">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(goal.id)
                      setEditAmount(goal.currentAmount.toString())
                    }}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    <Edit3 size={13} /> Update saved amount
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {goals.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center text-gray-400 md:col-span-2">
            <p className="mb-4 text-5xl">🎯</p>
            <p className="text-lg font-medium">No savings goals yet</p>
            <p className="text-sm">Add your first goal to start tracking your savings journey</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
