import {
  CreditCard,
  Home,
  LayoutDashboard,
  Target,
  Wallet,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navigation = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/budget', icon: Wallet, label: 'Budget' },
  { to: '/debts', icon: CreditCard, label: 'Debts' },
  { to: '/mortgage', icon: Home, label: 'Mortgage' },
  { to: '/goals', icon: Target, label: 'Goals' },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 bg-indigo-900 text-white md:flex md:flex-col">
      <div className="border-b border-indigo-700 p-6">
        <h1 className="text-xl font-bold">💰 FinPlan</h1>
        <p className="mt-1 text-xs text-indigo-300">Personal Financial Planner</p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-indigo-700 p-4 text-xs text-indigo-400">
        Data stored locally in your browser
      </div>
    </aside>
  )
}
