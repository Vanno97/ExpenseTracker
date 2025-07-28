import { expenses, budgets, recurringPayments, type Expense, type InsertExpense, type Budget, type InsertBudget, type RecurringPayment, type InsertRecurringPayment } from "@shared/schema";
import { db } from "./db";
import { eq, and, lte } from "drizzle-orm";

export interface IStorage {
  // Expense operations
  getExpenses(): Promise<Expense[]>;
  getExpenseById(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  
  // Budget operations
  getBudgets(): Promise<Budget[]>;
  getBudgetByCategory(category: string, month: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  
  // Recurring payment operations
  getRecurringPayments(): Promise<RecurringPayment[]>;
  getRecurringPaymentById(id: number): Promise<RecurringPayment | undefined>;
  createRecurringPayment(payment: InsertRecurringPayment): Promise<RecurringPayment>;
  updateRecurringPayment(id: number, payment: Partial<InsertRecurringPayment & { nextDueDate?: string }>): Promise<RecurringPayment | undefined>;
  deleteRecurringPayment(id: number): Promise<boolean>;
  getDueRecurringPayments(): Promise<RecurringPayment[]>;
}

export class MemStorage implements IStorage {
  private expenses: Map<number, Expense>;
  private budgets: Map<number, Budget>;
  private recurringPayments: Map<number, RecurringPayment>;
  private currentExpenseId: number;
  private currentBudgetId: number;
  private currentRecurringPaymentId: number;

  constructor() {
    this.expenses = new Map();
    this.budgets = new Map();
    this.recurringPayments = new Map();
    this.currentExpenseId = 1;
    this.currentBudgetId = 1;
    this.currentRecurringPaymentId = 1;
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getExpenseById(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const expense: Expense = {
      ...insertExpense,
      id,
      createdAt: new Date().toISOString(),
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: number, updateData: Partial<InsertExpense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;

    const updatedExpense: Expense = {
      ...expense,
      ...updateData,
    };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  async getBudgets(): Promise<Budget[]> {
    return Array.from(this.budgets.values());
  }

  async getBudgetByCategory(category: string, month: string): Promise<Budget | undefined> {
    return Array.from(this.budgets.values()).find(
      budget => budget.category === category && budget.month === month
    );
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = this.currentBudgetId++;
    const budget: Budget = {
      ...insertBudget,
      id,
    };
    this.budgets.set(id, budget);
    return budget;
  }

  async updateBudget(id: number, updateData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;

    const updatedBudget: Budget = {
      ...budget,
      ...updateData,
    };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }

  async getRecurringPayments(): Promise<RecurringPayment[]> {
    return Array.from(this.recurringPayments.values()).sort((a, b) => 
      new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
    );
  }

  async getRecurringPaymentById(id: number): Promise<RecurringPayment | undefined> {
    return this.recurringPayments.get(id);
  }

  async createRecurringPayment(insertPayment: InsertRecurringPayment): Promise<RecurringPayment> {
    const id = this.currentRecurringPaymentId++;
    
    // Calculate next due date based on frequency and handle backlog
    const startDate = new Date(insertPayment.startDate);
    const now = new Date();
    let nextDueDate = new Date(startDate);
    
    // If start date is in the past, calculate all missed payments and create them
    if (startDate < now) {
      const missedPayments = [];
      let currentDue = new Date(startDate);
      
      while (currentDue <= now) {
        // Create expense for each missed payment
        const expense = await this.createExpense({
          description: `${insertPayment.description} (Automatic - Backlog)`,
          category: insertPayment.category,
          amount: insertPayment.amount,
          date: currentDue.toISOString().split('T')[0],
        });
        missedPayments.push(expense);
        
        // Move to next due date
        switch (insertPayment.frequency) {
          case "weekly":
            currentDue.setDate(currentDue.getDate() + 7);
            break;
          case "monthly":
            currentDue.setMonth(currentDue.getMonth() + 1);
            break;
          case "yearly":
            currentDue.setFullYear(currentDue.getFullYear() + 1);
            break;
        }
      }
      
      nextDueDate = new Date(currentDue);
    } else {
      // Start date is in the future, so next due date is the start date
      nextDueDate = new Date(startDate);
    }

    const payment: RecurringPayment = {
      ...insertPayment,
      id,
      nextDueDate: nextDueDate.toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.recurringPayments.set(id, payment);
    return payment;
  }

  async updateRecurringPayment(id: number, updateData: Partial<InsertRecurringPayment & { nextDueDate?: string }>): Promise<RecurringPayment | undefined> {
    const payment = this.recurringPayments.get(id);
    if (!payment) return undefined;

    const updatedPayment: RecurringPayment = {
      ...payment,
      ...updateData,
    };
    this.recurringPayments.set(id, updatedPayment);
    return updatedPayment;
  }

  async deleteRecurringPayment(id: number): Promise<boolean> {
    return this.recurringPayments.delete(id);
  }

  async getDueRecurringPayments(): Promise<RecurringPayment[]> {
    const now = new Date();
    return Array.from(this.recurringPayments.values()).filter(
      payment => payment.isActive === "true" && new Date(payment.nextDueDate) <= now
    );
  }
}

export class DatabaseStorage implements IStorage {
  // Expense operations
  async getExpenses(): Promise<Expense[]> {
    const result = await db.select().from(expenses).orderBy(expenses.date);
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExpenseById(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async updateExpense(id: number, updateData: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [expense] = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, id))
      .returning();
    return expense || undefined;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return result.rowCount !== undefined && result.rowCount > 0;
  }

  // Budget operations
  async getBudgets(): Promise<Budget[]> {
    return await db.select().from(budgets);
  }

  async getBudgetByCategory(category: string, month: string): Promise<Budget | undefined> {
    const [budget] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.category, category), eq(budgets.month, month)));
    return budget || undefined;
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const [budget] = await db
      .insert(budgets)
      .values(insertBudget)
      .returning();
    return budget;
  }

  async updateBudget(id: number, updateData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const [budget] = await db
      .update(budgets)
      .set(updateData)
      .where(eq(budgets.id, id))
      .returning();
    return budget || undefined;
  }

  // Recurring payment operations
  async getRecurringPayments(): Promise<RecurringPayment[]> {
    return await db.select().from(recurringPayments);
  }

  async getRecurringPaymentById(id: number): Promise<RecurringPayment | undefined> {
    const [payment] = await db.select().from(recurringPayments).where(eq(recurringPayments.id, id));
    return payment || undefined;
  }

  async createRecurringPayment(insertPayment: InsertRecurringPayment): Promise<RecurringPayment> {
    const [payment] = await db
      .insert(recurringPayments)
      .values({
        ...insertPayment,
        nextDueDate: insertPayment.startDate, // Set initial nextDueDate to startDate
      })
      .returning();
    return payment;
  }

  async updateRecurringPayment(id: number, updateData: Partial<InsertRecurringPayment & { nextDueDate?: string }>): Promise<RecurringPayment | undefined> {
    const [payment] = await db
      .update(recurringPayments)
      .set(updateData)
      .where(eq(recurringPayments.id, id))
      .returning();
    return payment || undefined;
  }

  async deleteRecurringPayment(id: number): Promise<boolean> {
    const result = await db.delete(recurringPayments).where(eq(recurringPayments.id, id));
    return result.rowCount !== undefined && result.rowCount > 0;
  }

  async getDueRecurringPayments(): Promise<RecurringPayment[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db
      .select()
      .from(recurringPayments)
      .where(and(
        eq(recurringPayments.isActive, "true"),
        lte(recurringPayments.nextDueDate, today)
      ));
  }
}

export const storage = new DatabaseStorage();
