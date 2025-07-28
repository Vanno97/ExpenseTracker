import { useState } from "react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Expense } from "@shared/schema";
import { calculateCategoryTotals, calculateMonthlyTotals, formatCurrency, getCategoryColor, filterExpensesByMonth } from "@/lib/expense-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, subMonths, addMonths, isBefore, startOfMonth } from "date-fns";

interface ExpenseChartsProps {
  expenses: Expense[];
}

export default function ExpenseCharts({ expenses }: ExpenseChartsProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const canNavigateForward = isBefore(startOfMonth(currentMonth), startOfMonth(new Date()));
  
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };
  
  const handleNextMonth = () => {
    if (canNavigateForward) {
      setCurrentMonth(prev => addMonths(prev, 1));
    }
  };

  // Filter expenses for current selected month for pie chart
  const currentMonthStr = format(currentMonth, "yyyy-MM");
  const monthlyExpenses = filterExpensesByMonth(expenses, currentMonthStr);
  
  // Prepare category data for pie chart (current month only)
  const categoryTotals = calculateCategoryTotals(monthlyExpenses);
  const categoryData = Object.entries(categoryTotals).map(([category, amount]) => ({
    name: category,
    value: amount,
    color: getCategoryColor(category),
  }));

  // Prepare monthly trend data for line chart (last 4 months from selected month)
  const monthlyTotals = calculateMonthlyTotals(expenses);
  const last4Months = Array.from({ length: 4 }, (_, i) => {
    const date = subMonths(currentMonth, 3 - i);
    return format(date, "yyyy-MM");
  });
  
  const trendData = last4Months.map(month => ({
    month: format(new Date(month + "-01"), "MMM"),
    amount: monthlyTotals[month] || 0,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${label}: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${data.name}: ${formatCurrency(data.value)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Expenses by Category Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Spese per Categoria</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                disabled={!canNavigateForward}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              Nessun dato da visualizzare
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tendenza Spesa Mensile</CardTitle>
            <span className="text-sm text-slate-500">
              Ultimi 4 mesi fino a {format(currentMonth, "MMM yyyy")}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {trendData.every(d => d.amount === 0) ? (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              Nessun dato da visualizzare
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(217, 91%, 60%)", strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: "hsl(217, 91%, 60%)", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
