import { useState } from "react";
import { Edit2, Trash2, Search } from "lucide-react";
import type { Expense } from "@shared/schema";
import { formatCurrency, formatDate, getCategoryColor } from "@/lib/expense-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentMonthDisplay } from "@/lib/expense-utils";

interface ExpenseListProps {
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: number) => void;
  isLoading?: boolean;
}

export default function ExpenseList({ 
  expenses, 
  onEditExpense, 
  onDeleteExpense, 
  isLoading = false 
}: ExpenseListProps) {
  const [visibleCount, setVisibleCount] = useState(10);

  const displayedExpenses = expenses.slice(0, visibleCount);
  const hasMore = expenses.length > visibleCount;

  const loadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-slate-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Spese Recenti</CardTitle>
          <span className="text-sm text-slate-500">{getCurrentMonthDisplay()}</span>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nessuna spesa trovata</p>
            <p className="text-sm text-slate-400">Aggiungi la tua prima spesa per iniziare</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {displayedExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-slate-900">
                          {expense.description}
                        </h4>
                        <span className="text-sm font-medium text-slate-900">
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-slate-500">
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{ 
                            backgroundColor: getCategoryColor(expense.category) + '20',
                            color: getCategoryColor(expense.category),
                            border: `1px solid ${getCategoryColor(expense.category)}40`
                          }}
                        >
                          {expense.category}
                        </Badge>
                        <span className="ml-2">{formatDate(expense.date)}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditExpense(expense)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteExpense(expense.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {hasMore && (
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  onClick={loadMore}
                  className="text-primary hover:text-blue-700 text-sm font-medium"
                >
                  Load More Expenses
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
