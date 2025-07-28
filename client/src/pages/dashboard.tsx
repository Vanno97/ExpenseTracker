import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Expense, InsertExpense, InsertBudget, EXPENSE_CATEGORIES } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { localStorageService } from "@/lib/localStorage";
import { filterExpensesByCategory, filterExpensesByDateRange } from "@/lib/expense-utils";

// Components
import NavigationHeader from "@/components/navigation-header";
import DashboardStats from "@/components/dashboard-stats";
import AddExpenseForm from "@/components/add-expense-form";
import ExpenseList from "@/components/expense-list";
import ExpenseCharts from "@/components/expense-charts";
import BudgetSection from "@/components/budget-section";
import ExpenseModal from "@/components/expense-modal";
import RecurringPaymentsSection from "@/components/recurring-payments-section";

// Filter components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filters, setFilters] = useState({
    category: "all",
    dateFrom: "",
    dateTo: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load expenses from localStorage on mount and sync with server
  useEffect(() => {
    const savedExpenses = localStorageService.getExpenses();
    if (savedExpenses.length > 0) {
      queryClient.setQueryData(["/api/expenses"], savedExpenses);
    }
  }, [queryClient]);

  // Fetch expenses
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    meta: { onSuccess: (data: Expense[]) => localStorageService.saveExpenses(data) }
  });

  // Filter expenses based on current filters
  const filteredExpenses = expenses
    .filter(expense => {
      if (!filters.category || filters.category === "all") return true;
      return filterExpensesByCategory([expense], filters.category).length > 0;
    })
    .filter(expense => filterExpensesByDateRange([expense], filters.dateFrom, filters.dateTo).length > 0);

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (expense: InsertExpense) => {
      const response = await apiRequest("POST", "/api/expenses", expense);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Successo",
        description: "Spesa aggiunta con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiungere la spesa",
        variant: "destructive",
      });
    },
  });

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, expense }: { id: number; expense: InsertExpense }) => {
      const response = await apiRequest("PUT", `/api/expenses/${id}`, expense);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  const handleAddExpense = (expense: InsertExpense) => {
    addExpenseMutation.mutate(expense);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleUpdateExpense = (id: number, expense: InsertExpense) => {
    updateExpenseMutation.mutate({ id, expense });
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: number) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      deleteExpenseMutation.mutate(id);
    }
  };

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: async (budget: InsertBudget) => {
      const response = await apiRequest("POST", "/api/budgets", budget);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Budget created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create budget",
        variant: "destructive",
      });
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ category: "all", dateFrom: "", dateTo: "" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Dashboard Stats */}
        <div className="px-4 py-6 sm:px-0">
          <DashboardStats expenses={expenses} />
        </div>

        {/* Management Section - Quick Add and Recurring Payments */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Quick Add Expense */}
            <div>
              <AddExpenseForm 
                onAddExpense={handleAddExpense}
                isLoading={addExpenseMutation.isPending}
              />
            </div>
            
            {/* Recurring Payments */}
            <div>
              <RecurringPaymentsSection 
                onProcessPayments={() => {
                  // Refresh expenses after processing payments
                  queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
                }}
              />
            </div>
          </div>
        </div>

        {/* Expense List and Filters */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Filters */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Filtra Spese</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="filterCategory">Categoria</Label>
                    <Select 
                      value={filters.category} 
                      onValueChange={(value) => handleFilterChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tutte le Categorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutte le Categorie</SelectItem>
                        {(["Alimentari", "Trasporti", "Bollette", "Intrattenimento", "Salute", "Shopping", "Altro"] as const).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="dateFrom">Da</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateTo">A</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {(filters.category !== "all" || filters.dateFrom || filters.dateTo) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-slate-500 hover:text-slate-700 underline"
                    >
                      Cancella filtri
                    </button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Expense List */}
            <div className="lg:col-span-2">
              <ExpenseList
                expenses={filteredExpenses}
                onEditExpense={handleEditExpense}
                onDeleteExpense={handleDeleteExpense}
                isLoading={isLoadingExpenses}
              />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="px-4 py-6 sm:px-0">
          <ExpenseCharts expenses={expenses} />
        </div>

        {/* Budget Section */}
        <div className="px-4 py-6 sm:px-0">
          <BudgetSection 
            expenses={expenses} 
            onCreateBudget={(budget) => {
              // Handle budget creation via API
              createBudgetMutation.mutate(budget);
            }}
          />
        </div>


      </div>

      {/* Edit Expense Modal */}
      <ExpenseModal
        expense={editingExpense}
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        onUpdateExpense={handleUpdateExpense}
        isLoading={updateExpenseMutation.isPending}
      />
    </div>
  );
}
