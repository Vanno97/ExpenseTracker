import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetSchema, EXPENSE_CATEGORIES, type InsertBudget } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getCurrentMonth } from "@/lib/expense-utils";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBudget: (budget: InsertBudget) => void;
  isLoading?: boolean;
}

export default function BudgetModal({ 
  isOpen, 
  onClose, 
  onCreateBudget, 
  isLoading = false 
}: BudgetModalProps) {
  const form = useForm<InsertBudget>({
    resolver: zodResolver(insertBudgetSchema),
    defaultValues: {
      category: "",
      limit: "",
      month: getCurrentMonth(),
    },
  });

  const onSubmit = (data: InsertBudget) => {
    onCreateBudget(data);
    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" aria-describedby="budget-description">
        <DialogHeader>
          <DialogTitle>Imposta Budget</DialogTitle>
        </DialogHeader>
        <p id="budget-description" className="sr-only">
          Imposta un limite di budget per una categoria specifica e mese per monitorare le tue spese.
        </p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona categoria..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite Budget (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mese</FormLabel>
                  <FormControl>
                    <Input type="month" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Impostando..." : "Imposta Budget"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}