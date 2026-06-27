import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { useLocalStorage } from './hooks/useLocalStorage'
import Budget from './pages/Budget'
import Dashboard from './pages/Dashboard'
import DebtManager from './pages/DebtManager'
import MortgageCalculator from './pages/MortgageCalculator'
import SavingsGoals from './pages/SavingsGoals'
import type {
  AppData,
  Debt,
  ExpenseCategory,
  IncomeSource,
  Mortgage,
  SavingsGoal,
  Transaction,
} from './types'

const defaultData: AppData = {
  incomes: [],
  expenses: [],
  transactions: [],
  debts: [],
  mortgage: null,
  goals: [],
}

export default function App() {
  const [data, setData] = useLocalStorage<AppData>('financial-planner', defaultData)

  const updateIncomes = (incomes: IncomeSource[]) => setData((prev) => ({ ...prev, incomes }))
  const updateExpenses = (expenses: ExpenseCategory[]) => setData((prev) => ({ ...prev, expenses }))
  const updateTransactions = (transactions: Transaction[]) =>
    setData((prev) => ({ ...prev, transactions }))
  const updateDebts = (debts: Debt[]) => setData((prev) => ({ ...prev, debts }))
  const updateMortgage = (mortgage: Mortgage | null) =>
    setData((prev) => ({ ...prev, mortgage }))
  const updateGoals = (goals: SavingsGoal[]) => setData((prev) => ({ ...prev, goals }))

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard data={data} />} />
          <Route
            path="budget"
            element={
              <Budget
                incomes={data.incomes}
                expenses={data.expenses}
                transactions={data.transactions}
                onUpdateIncomes={updateIncomes}
                onUpdateExpenses={updateExpenses}
                onUpdateTransactions={updateTransactions}
              />
            }
          />
          <Route
            path="debts"
            element={<DebtManager debts={data.debts} onUpdateDebts={updateDebts} />}
          />
          <Route
            path="mortgage"
            element={
              <MortgageCalculator
                mortgage={data.mortgage}
                onUpdateMortgage={updateMortgage}
              />
            }
          />
          <Route
            path="goals"
            element={<SavingsGoals goals={data.goals} onUpdateGoals={updateGoals} />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
