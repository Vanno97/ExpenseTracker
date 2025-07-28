import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, EXPENSE_CATEGORIES, type InsertExpense, type Expense } from "@shared/schema";
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

interface ExpenseModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateExpense: (id: number, expense: InsertExpense) => void;
  isLoading?: boolean;
}

export default function ExpenseModal({ 
  expense, 
  isOpen, 
  onClose, 
  onUpdateExpense, 
  isLoading = false 
}: ExpenseModalProps) {
  const form = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      description: "",
      category: "",
      amount: "",
      date: "",
    },
  });

  // Update form when expense changes
  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        date: expense.date.split('T')[0], // Handle date format
      });
    }
  }, [expense, form]);

  const onSubmit = (data: InsertExpense) => {
    if (expense) {
      onUpdateExpense(expense.id, data);
      onClose();
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" aria-describedby="expense-edit-description">
        <DialogHeader>
          <DialogTitle>Modifica Spesa</DialogTitle>
        </DialogHeader>
        <p id="expense-edit-description" className="sr-only">
          Modifica i dettagli di una spesa esistente inclusi descrizione, categoria, importo e data.
        </p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Spesa al supermercato" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importo (€)</FormLabel>
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                {isLoading ? "Aggiornando..." : "Aggiorna Spesa"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
