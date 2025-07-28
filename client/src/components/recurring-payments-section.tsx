import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RecurringPayment, InsertRecurringPayment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, getCategoryColor } from "@/lib/expense-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Play, Pause, Trash2 } from "lucide-react";
import RecurringPaymentsModal from "./recurring-payments-modal";

interface RecurringPaymentsSectionProps {
  onProcessPayments: () => void;
}

export default function RecurringPaymentsSection({ onProcessPayments }: RecurringPaymentsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recurring payments
  const { data: recurringPayments = [], isLoading } = useQuery<RecurringPayment[]>({
    queryKey: ["/api/recurring-payments"],
  });

  // Fetch due payments
  const { data: duePayments = [] } = useQuery<RecurringPayment[]>({
    queryKey: ["/api/recurring-payments/due"],
    refetchInterval: 300000, // Check every 5 minutes to reduce server load
  });

  // Create recurring payment mutation
  const createRecurringPaymentMutation = useMutation({
    mutationFn: async (payment: InsertRecurringPayment) => {
      const response = await apiRequest("POST", "/api/recurring-payments", payment);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-payments/due"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      onProcessPayments(); // Trigger parent refresh
      toast({
        title: "Successo",
        description: "Pagamento ricorrente aggiunto con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il pagamento ricorrente",
        variant: "destructive",
      });
    },
  });

  // Toggle payment active status
  const togglePaymentMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: string }) => {
      const payment = recurringPayments.find(p => p.id === id);
      if (!payment) throw new Error("Payment not found");
      
      const response = await apiRequest("PUT", `/api/recurring-payments/${id}`, {
        ...payment,
        isActive,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-payments/due"] });
      toast({
        title: "Successo",
        description: "Stato del pagamento aggiornato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo stato del pagamento",
        variant: "destructive",
      });
    },
  });

  // Delete recurring payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/recurring-payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-payments/due"] });
      toast({
        title: "Successo",
        description: "Pagamento ricorrente eliminato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il pagamento ricorrente",
        variant: "destructive",
      });
    },
  });

  // Auto-process payments mutation
  const autoProcessMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/recurring-payments/process");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.processed > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/recurring-payments"] });
        queryClient.invalidateQueries({ queryKey: ["/api/recurring-payments/due"] });
        onProcessPayments();
      }
    },
  });

  // Auto-trigger processing on mount - only once
  useEffect(() => {
    autoProcessMutation.mutate();
  }, []); // Empty dependency array ensures this runs only once

  const handleCreateRecurringPayment = (payment: InsertRecurringPayment) => {
    createRecurringPaymentMutation.mutate(payment);
  };

  const handleTogglePayment = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "true" ? "false" : "true";
    togglePaymentMutation.mutate({ id, isActive: newStatus });
  };

  const handleDeletePayment = (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questo pagamento ricorrente?")) {
      deletePaymentMutation.mutate(id);
    }
  };



  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency) {
      case "weekly": return "bg-blue-100 text-blue-800";
      case "monthly": return "bg-green-100 text-green-800";
      case "yearly": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">


      {/* Recurring Payments List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Pagamenti Ricorrenti</CardTitle>
            <Button onClick={() => setIsModalOpen(true)}>
              Aggiungi Pagamento Ricorrente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-slate-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : recurringPayments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nessun pagamento ricorrente configurato</p>
              <p className="text-sm text-slate-400">Aggiungi pagamenti ricorrenti per automatizzare la gestione delle spese</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recurringPayments.map((payment) => (
                <div
                  key={payment.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    payment.isActive === "true" ? "border-slate-200" : "border-slate-300 bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-medium ${
                          payment.isActive === "true" ? "text-slate-900" : "text-slate-500"
                        }`}>
                          {payment.description}
                        </h4>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-sm text-slate-500">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getFrequencyBadgeColor(payment.frequency)}`}
                        >
                          {payment.frequency === "weekly" ? "Settimanale" : 
                           payment.frequency === "monthly" ? "Mensile" : 
                           payment.frequency === "yearly" ? "Annuale" : payment.frequency}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{ 
                            backgroundColor: getCategoryColor(payment.category) + '20',
                            color: getCategoryColor(payment.category),
                            border: `1px solid ${getCategoryColor(payment.category)}40`
                          }}
                        >
                          {payment.category}
                        </Badge>
                        <span>Prossimo: {formatDate(payment.nextDueDate)}</span>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePayment(payment.id, payment.isActive)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {payment.isActive === "true" ? 
                          <Pause className="h-4 w-4" /> : 
                          <Play className="h-4 w-4" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePayment(payment.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recurring Payments Modal */}
      <RecurringPaymentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateRecurringPayment={handleCreateRecurringPayment}
        isLoading={createRecurringPaymentMutation.isPending}
      />
    </div>
  );
}