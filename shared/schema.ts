import { pgTable, text, serial, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date", { mode: 'string' }).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).notNull().defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  limit: decimal("limit", { precision: 10, scale: 2 }).notNull(),
  month: text("month").notNull(), // Format: YYYY-MM
});

export const recurringPayments = pgTable("recurring_payments", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: text("frequency").notNull(), // weekly, monthly, yearly
  startDate: timestamp("start_date", { mode: 'string' }).notNull(),
  nextDueDate: timestamp("next_due_date", { mode: 'string' }).notNull(),
  isActive: text("is_active").notNull().default("true"), // true/false as text
  createdAt: timestamp("created_at", { mode: 'string' }).notNull().defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  description: z.string().min(1, "Description is required").max(100, "Description too long"),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
}).extend({
  limit: z.string().min(1, "Limit is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Limit must be a positive number"
  ),
});

export const insertRecurringPaymentSchema = createInsertSchema(recurringPayments).omit({
  id: true,
  createdAt: true,
  nextDueDate: true,
}).extend({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  description: z.string().min(1, "Description is required").max(100, "Description too long"),
  category: z.string().min(1, "Category is required"),
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  startDate: z.string().min(1, "Start date is required"),
  isActive: z.string().default("true"),
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertRecurringPayment = z.infer<typeof insertRecurringPaymentSchema>;
export type RecurringPayment = typeof recurringPayments.$inferSelect;

export const EXPENSE_CATEGORIES = [
  "Alimentari",
  "Trasporti", 
  "Bollette",
  "Intrattenimento",
  "Salute",
  "Shopping",
  "Altro"
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
