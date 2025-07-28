import { DollarSign, FileText, BarChart3, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Expense, Budget } from "@shared/schema";
import { formatCurrency, filterExpensesByMonth, getCurrentMonth } from "@/lib/expense-utils";

interface DashboardStatsProps {
  expenses: Expense[];
}

export default function DashboardStats({ expenses }: DashboardStatsProps) {
  const currentMonth = getCurrentMonth();
  const monthlyExpenses = filterExpensesByMonth(expenses, currentMonth);
  
  // Fetch budgets from API
  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });
  
  const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const expenseCount = monthlyExpenses.length;
  const averageExpense = expenseCount > 0 ? monthlyTotal / expenseCount : 0;
  
  // Calculate total budget limit for current month
  const currentMonthBudgets = budgets.filter(budget => budget.month === currentMonth);
  const totalBudgetLimit = currentMonthBudgets.reduce((sum, budget) => sum + parseFloat(budget.limit), 0);
  const budgetRemaining = totalBudgetLimit - monthlyTotal;

  const stats = [
    {
      title: "Totale Questo Mese",
      value: formatCurrency(monthlyTotal),
      icon: DollarSign,
      color: "text-slate-400",
    },
    {
      title: "Numero di Spese",
      value: expenseCount.toString(),
      icon: FileText,
      color: "text-slate-400",
    },
    {
      title: "Spesa Media",
      value: formatCurrency(averageExpense),
      icon: BarChart3,
      color: "text-slate-400",
    },
    {
      title: "Budget Rimanente",
      value: formatCurrency(budgetRemaining),
      icon: TrendingUp,
      color: budgetRemaining >= 0 ? "text-green-600" : "text-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    {stat.title}
                  </dt>
                  <dd className={`text-lg font-medium ${
                    stat.title === "Budget Rimanente" ? stat.color : "text-slate-900"
                  }`}>
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
