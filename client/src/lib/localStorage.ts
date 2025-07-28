import type { Expense, Budget } from "@shared/schema";

const EXPENSES_KEY = "expense-tracker-expenses";
const BUDGETS_KEY = "expense-tracker-budgets";

export const localStorageService = {
  getExpenses(): Expense[] {
    try {
      const data = localStorage.getItem(EXPENSES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveExpenses(expenses: Expense[]): void {
    try {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error("Failed to save expenses to localStorage:", error);
    }
  },

  getBudgets(): Budget[] {
    try {
      const data = localStorage.getItem(BUDGETS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveBudgets(budgets: Budget[]): void {
    try {
      localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
    } catch (error) {
      console.error("Failed to save budgets to localStorage:", error);
    }
  },
};
