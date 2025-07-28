import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExpenseSchema, insertBudgetSchema, insertRecurringPaymentSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const expense = await storage.getExpenseById(id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(id, validatedData);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExpense(id);
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Budget routes
  app.get("/api/budgets", async (req, res) => {
    try {
      const budgets = await storage.getBudgets();
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.post("/api/budgets", async (req, res) => {
    try {
      const validatedData = insertBudgetSchema.parse(req.body);
      
      // Check if budget already exists for this category and month
      const existingBudgets = await storage.getBudgets();
      const existingBudget = existingBudgets.find(
        budget => budget.category === validatedData.category && budget.month === validatedData.month
      );
      
      if (existingBudget) {
        // Update existing budget instead of creating duplicate
        const updatedBudget = await storage.updateBudget(existingBudget.id, validatedData);
        res.json(updatedBudget);
      } else {
        // Create new budget
        const budget = await storage.createBudget(validatedData);
        res.status(201).json(budget);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create budget" });
    }
  });

  app.put("/api/budgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertBudgetSchema.partial().parse(req.body);
      const budget = await storage.updateBudget(id, validatedData);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      res.json(budget);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update budget" });
    }
  });

  // Recurring payments routes
  app.get("/api/recurring-payments", async (req, res) => {
    try {
      const payments = await storage.getRecurringPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching recurring payments:", error);
      res.status(500).json({ message: "Failed to fetch recurring payments" });
    }
  });

  app.get("/api/recurring-payments/due", async (req, res) => {
    try {
      const duePayments = await storage.getDueRecurringPayments();
      res.json(duePayments);
    } catch (error) {
      console.error("Error fetching due payments:", error);
      res.status(500).json({ message: "Failed to fetch due payments" });
    }
  });

  app.post("/api/recurring-payments", async (req, res) => {
    try {
      const validatedData = insertRecurringPaymentSchema.parse(req.body);
      const payment = await storage.createRecurringPayment(validatedData);
      
      // Automatically process any backlog payments if start date is in the past
      const startDate = new Date(validatedData.startDate);
      const today = new Date();
      
      if (startDate < today) {
        // Process backlog for this new payment immediately
        const currentDue = new Date(startDate);
        const existingExpenses = await storage.getExpenses();
        
        while (currentDue <= today) {
          const dueDateStr = currentDue.toISOString().split('T')[0];
          
          const alreadyProcessedForDate = existingExpenses.some(expense => 
            expense.date === dueDateStr && 
            expense.description.includes(validatedData.description) &&
            (expense.description.includes("(Automatic - Backlog)") || expense.description.includes("(Automatic)"))
          );
          
          if (!alreadyProcessedForDate) {
            const isBacklog = currentDue < new Date(today.toISOString().split('T')[0]);
            const description = isBacklog 
              ? `${validatedData.description} (Automatic - Backlog)`
              : `${validatedData.description} (Automatic)`;
            
            await storage.createExpense({
              description,
              category: validatedData.category,
              amount: validatedData.amount,
              date: dueDateStr,
            });
          }

          switch (validatedData.frequency) {
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
        
        // Update payment with correct next due date
        await storage.updateRecurringPayment(payment.id, {
          nextDueDate: currentDue.toISOString(),
        });
      }
      
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create recurring payment" });
    }
  });

  app.put("/api/recurring-payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRecurringPaymentSchema.partial().parse(req.body);
      const payment = await storage.updateRecurringPayment(id, validatedData);
      if (!payment) {
        return res.status(404).json({ message: "Recurring payment not found" });
      }
      res.json(payment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update recurring payment" });
    }
  });

  app.delete("/api/recurring-payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRecurringPayment(id);
      if (!success) {
        return res.status(404).json({ message: "Recurring payment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete recurring payment" });
    }
  });

  // Process due recurring payments and create expenses (automatic processing)
  app.post("/api/recurring-payments/process", async (req, res) => {
    try {
      const duePayments = await storage.getDueRecurringPayments();
      const processedExpenses = [];
      const today = new Date();
      
      for (const payment of duePayments) {
        const currentDue = new Date(payment.nextDueDate);
        const existingExpenses = await storage.getExpenses();
        
        // Process all missed payments from start date to today
        while (currentDue <= today) {
          const dueDateStr = currentDue.toISOString().split('T')[0];
          
          // Check if we already processed this payment for this specific date
          const alreadyProcessedForDate = existingExpenses.some(expense => 
            expense.date === dueDateStr && 
            expense.description.includes(payment.description) &&
            expense.description.includes("(Automatic - Backlog)") ||
            expense.description.includes("(Automatic)")
          );
          
          if (!alreadyProcessedForDate) {
            // Determine if this is a backlog payment or current
            const isBacklog = currentDue < new Date(today.toISOString().split('T')[0]);
            const description = isBacklog 
              ? `${payment.description} (Automatic - Backlog)`
              : `${payment.description} (Automatic)`;
            
            // Create expense for the specific due date
            const expense = await storage.createExpense({
              description,
              category: payment.category,
              amount: payment.amount,
              date: dueDateStr,
            });
            processedExpenses.push(expense);
          }

          // Move to next due date
          switch (payment.frequency) {
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

        // Update payment with next future due date
        await storage.updateRecurringPayment(payment.id, {
          nextDueDate: currentDue.toISOString(),
        });
      }
      
      res.json({ processed: processedExpenses.length, expenses: processedExpenses });
    } catch (error) {
      console.error("Error processing recurring payments:", error);
      res.status(500).json({ message: "Failed to process recurring payments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
