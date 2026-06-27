import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import {
  Area,
  AreaChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Mortgage } from '../types'
import {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
} from '../utils/calculations'
import { exportToCSV } from '../utils/csv'

interface Props {
  mortgage: Mortgage | null
  onUpdateMortgage: (mortgage: Mortgage | null) => void
}

const defaultMortgage: Mortgage = {
  loanAmount: 400000,
  interestRate: 6.5,
  termYears: 30,
  startDate: new Date().toISOString().split('T')[0],
  extraPayment: 0,
}

function formatCurrency(value: number, digits = 2) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export default function MortgageCalculator({ mortgage, onUpdateMortgage }: Props) {
  const [form, setForm] = useState<Mortgage>(mortgage ?? defaultMortgage)
  const [refiRate, setRefiRate] = useState(5.5)
  const [showFullSchedule, setShowFullSchedule] = useState(false)

  const schedule = useMemo(() => generateAmortizationSchedule(form), [form])
  const refiSchedule = useMemo(
    () => generateAmortizationSchedule({ ...form, interestRate: refiRate, extraPayment: 0 }),
    [form, refiRate],
  )
  const baseSchedule = useMemo(
    () => generateAmortizationSchedule({ ...form, extraPayment: 0 }),
    [form],
  )

  const monthlyPayment = calculateMonthlyPayment(
    form.loanAmount,
    form.interestRate,
    form.termYears * 12,
  )
  const biweeklyPayment = monthlyPayment / 2
  const biweeklySchedule = generateAmortizationSchedule({
    ...form,
    extraPayment: (monthlyPayment * 26) / 12 - monthlyPayment - form.extraPayment,
  })

  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0)
  const baseInterest = baseSchedule.reduce((sum, row) => sum + row.interest, 0)
  const interestSaved = baseInterest - totalInterest
  const refiTotalInterest = refiSchedule.reduce((sum, row) => sum + row.interest, 0)

  const chartData = schedule
    .filter((_, index) => index % 12 === 0)
    .map((row) => ({
      year: Math.ceil(row.month / 12),
      principal: Math.round(row.principal * 12),
      interest: Math.round(row.interest * 12),
      balance: Math.round(row.balance),
    }))

  const save = () => onUpdateMortgage(form)

  const exportSchedule = () => {
    exportToCSV(
      'amortization.csv',
      ['Month', 'Payment', 'Principal', 'Interest', 'Balance'],
      schedule.map((row) => [
        row.month,
        row.payment.toFixed(2),
        row.principal.toFixed(2),
        row.interest.toFixed(2),
        row.balance.toFixed(2),
      ]),
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mortgage Calculator</h1>
        <button
          onClick={exportSchedule}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          <Download size={16} /> Export Amortization
        </button>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Mortgage Details</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: 'Loan Amount ($)', key: 'loanAmount', type: 'number' },
            { label: 'Interest Rate (%)', key: 'interestRate', type: 'number', step: '0.01' },
            { label: 'Term (Years)', key: 'termYears', type: 'number' },
            { label: 'Start Date', key: 'startDate', type: 'date' },
            { label: 'Extra Monthly Payment ($)', key: 'extraPayment', type: 'number' },
          ].map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
              <input
                type={field.type}
                step={field.step ?? '1'}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form[field.key as keyof Mortgage] as string | number}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    [field.key]:
                      field.type === 'date' ? event.target.value : parseFloat(event.target.value) || 0,
                  }))
                }
              />
            </div>
          ))}
        </div>
        <button
          onClick={save}
          className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700"
        >
          Calculate
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Monthly Payment',
            value: `$${formatCurrency(monthlyPayment + form.extraPayment)}`,
            color: 'text-indigo-600',
          },
          {
            label: 'Total Interest',
            value: `$${formatCurrency(totalInterest, 0)}`,
            color: 'text-rose-600',
          },
          {
            label: 'Payoff Time',
            value: `${Math.ceil(schedule.length / 12)} yrs ${schedule.length % 12} mo`,
            color: 'text-emerald-600',
          },
          {
            label: 'Interest Saved (vs no extra)',
            value: `$${formatCurrency(interestSaved, 0)}`,
            color: interestSaved > 0 ? 'text-emerald-600' : 'text-gray-400',
          },
        ].map((card) => (
          <div key={card.label} className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-3 text-lg font-semibold">Bi-weekly vs Monthly Payment</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Monthly Payment</p>
            <p className="text-2xl font-bold text-indigo-600">${formatCurrency(monthlyPayment)}</p>
            <p className="text-xs text-gray-500">Payoff: {Math.ceil(baseSchedule.length / 12)} years</p>
            <p className="text-xs text-gray-500">Total Interest: ${formatCurrency(baseInterest, 0)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Bi-weekly Payment</p>
            <p className="text-2xl font-bold text-emerald-600">${formatCurrency(biweeklyPayment)}/2wk</p>
            <p className="text-xs text-gray-500">Payoff: {Math.ceil(biweeklySchedule.length / 12)} years</p>
            <p className="text-xs text-gray-500">
              Total Interest: ${formatCurrency(
                biweeklySchedule.reduce((sum, row) => sum + row.interest, 0),
                0,
              )}
            </p>
            <p className="text-xs font-medium text-emerald-600">
              Save {baseSchedule.length - biweeklySchedule.length} months!
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Refinance Scenario</h2>
        <div className="mb-4 flex items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">New Rate (%)</label>
            <input
              type="number"
              step="0.01"
              className="w-28 rounded-lg border px-3 py-2 text-sm"
              value={refiRate}
              onChange={(event) => setRefiRate(parseFloat(event.target.value) || 0)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Current Rate ({form.interestRate}%)</p>
            <p className="text-lg font-bold">${formatCurrency(monthlyPayment)}/mo</p>
            <p className="text-sm text-gray-500">Total Interest: ${formatCurrency(baseInterest, 0)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">After Refi ({refiRate}%)</p>
            <p className={`text-lg font-bold ${refiRate < form.interestRate ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${formatCurrency(calculateMonthlyPayment(form.loanAmount, refiRate, form.termYears * 12))}/mo
            </p>
            <p className="text-sm text-gray-500">Total Interest: ${formatCurrency(refiTotalInterest, 0)}</p>
            {refiRate < form.interestRate ? (
              <p className="text-sm font-medium text-emerald-600">
                Save ${formatCurrency(baseInterest - refiTotalInterest, 0)} in interest!
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Amortization Schedule</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
            <YAxis tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Legend />
            <Area type="monotone" dataKey="principal" stackId="1" stroke="#6366f1" fill="#e0e7ff" name="Principal" />
            <Area type="monotone" dataKey="interest" stackId="1" stroke="#f43f5e" fill="#ffe4e6" name="Interest" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-gray-400">Annual view — each bar represents one year of payments</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Full Amortization Schedule</h2>
          <button onClick={() => setShowFullSchedule((prev) => !prev)} className="text-sm text-indigo-600 hover:underline">
            {showFullSchedule ? 'Hide' : 'Show'} ({schedule.length} months)
          </button>
        </div>
        {showFullSchedule ? (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4">Month</th>
                  <th className="pb-2 pr-4 text-right">Payment</th>
                  <th className="pb-2 pr-4 text-right">Principal</th>
                  <th className="pb-2 pr-4 text-right">Interest</th>
                  <th className="pb-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.month} className="border-b hover:bg-gray-50">
                    <td className="py-1 pr-4">{row.month}</td>
                    <td className="py-1 pr-4 text-right">${row.payment.toFixed(2)}</td>
                    <td className="py-1 pr-4 text-right text-indigo-600">${row.principal.toFixed(2)}</td>
                    <td className="py-1 pr-4 text-right text-rose-600">${row.interest.toFixed(2)}</td>
                    <td className="py-1 text-right">${row.balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  )
}
