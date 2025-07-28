import type { Expense, ExpenseCategory } from "@shared/schema";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), "dd MMM yyyy");
}

export function getCurrentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

export function getCurrentMonthDisplay(): string {
  return format(new Date(), "MMMM yyyy");
}

export function filterExpensesByMonth(expenses: Expense[], month: string): Expense[] {
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = startOfMonth(new Date(year, monthNum - 1));
  const monthEnd = endOfMonth(new Date(year, monthNum - 1));

  return expenses.filter(expense => {
    const expenseDate = parseISO(expense.date);
    return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
  });
}

export function filterExpensesByCategory(expenses: Expense[], category: string): Expense[] {
  if (!category) return expenses;
  return expenses.filter(expense => expense.category === category);
}

export function filterExpensesByDateRange(
  expenses: Expense[], 
  startDate?: string, 
  endDate?: string
): Expense[] {
  if (!startDate && !endDate) return expenses;

  return expenses.filter(expense => {
    const expenseDate = parseISO(expense.date);
    
    if (startDate && endDate) {
      return isWithinInterval(expenseDate, {
        start: parseISO(startDate),
        end: parseISO(endDate)
      });
    } else if (startDate) {
      return expenseDate >= parseISO(startDate);
    } else if (endDate) {
      return expenseDate <= parseISO(endDate);
    }
    
    return true;
  });
}

export function calculateCategoryTotals(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    const amount = parseFloat(expense.amount);
    acc[expense.category] = (acc[expense.category] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);
}

export function calculateMonthlyTotals(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    const month = format(parseISO(expense.date), "yyyy-MM");
    const amount = parseFloat(expense.amount);
    acc[month] = (acc[month] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    "Alimentari": "hsl(217, 91%, 60%)",
    "Trasporti": "hsl(142, 76%, 36%)",
    "Bollette": "hsl(45, 93%, 47%)",
    "Intrattenimento": "hsl(271, 81%, 56%)",
    "Salute": "hsl(0, 84%, 60%)",
    "Shopping": "hsl(262, 83%, 58%)",
    "Altro": "hsl(215, 14%, 34%)",
  };
  return colors[category] || "hsl(215, 14%, 34%)";
}
