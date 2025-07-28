import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Expense, Budget, InsertBudget } from "@shared/schema";
import { formatCurrency, filterExpensesByMonth, getCurrentMonth, calculateCategoryTotals } from "@/lib/expense-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import BudgetModal from "./budget-modal";

interface BudgetSectionProps {
  expenses: Expense[];
  onCreateBudget?: (budget: InsertBudget) => void;
}

export default function BudgetSection({ expenses, onCreateBudget }: BudgetSectionProps) {
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  
  // Fetch budgets from API
  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });
  
  const currentMonth = getCurrentMonth();
  const monthlyExpenses = filterExpensesByMonth(expenses, currentMonth);
  const categoryTotals = calculateCategoryTotals(monthlyExpenses);
  
  // Get budgets for current month
  const currentMonthBudgets = budgets.filter(budget => budget.month === currentMonth);
  const totalBudgetLimit = currentMonthBudgets.reduce((sum, budget) => sum + parseFloat(budget.limit), 0);
  const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
  const budgetRemaining = totalBudgetLimit - totalSpent;
  const budgetProgress = totalBudgetLimit > 0 ? Math.min((totalSpent / totalBudgetLimit) * 100, 100) : 0;

  // Create category budgets map from API data
  const categoryBudgets = currentMonthBudgets.reduce((acc, budget) => {
    acc[budget.category] = parseFloat(budget.limit);
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Panoramica Budget Mensile</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsBudgetModalOpen(true)}>
            Imposta Budget
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Budget Progress */}
          <div className="md:col-span-2">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Progresso Budget</span>
              <span>{budgetProgress.toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(budgetProgress, 100)} 
              className="mb-4 h-3"
            />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalBudgetLimit)}
                </div>
                <div className="text-sm text-slate-500">Budget Mensile</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totalSpent)}
                </div>
                <div className="text-sm text-slate-500">Speso</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${
                  budgetRemaining >= 0 ? "text-green-600" : "text-red-500"
                }`}>
                  {formatCurrency(budgetRemaining)}
                </div>
                <div className="text-sm text-slate-500">Rimanente</div>
              </div>
            </div>
          </div>

          {/* Category Budget Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">Limiti per Categoria</h4>
            <div className="space-y-3">
              {Object.entries(categoryBudgets).slice(0, 3).map(([category, limit]) => {
                const spent = categoryTotals[category] || 0;
                const percentage = (spent / limit) * 100;
                const isOverBudget = spent > limit;
                
                return (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">{category}</span>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        isOverBudget ? "text-red-600" : "text-slate-900"
                      }`}>
                        {formatCurrency(spent)} / {formatCurrency(limit)}
                      </div>
                      <div className="w-16 bg-slate-200 rounded-full h-1.5 mt-1">
                        <div 
                          className={`h-1.5 rounded-full ${
                            isOverBudget ? "bg-red-500" : 
                            percentage > 80 ? "bg-yellow-500" : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onCreateBudget={(budget) => {
          if (onCreateBudget) onCreateBudget(budget);
          setIsBudgetModalOpen(false);
        }}
      />
    </Card>
  );
}
