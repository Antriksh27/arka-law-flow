import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import TimeUtils from '@/lib/timeUtils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
interface ExpensesTabProps {
  caseId: string;
}
export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  caseId
}) => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseDate, setExpenseDate] = useState(TimeUtils.formatDateInput(TimeUtils.nowDate()));
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');

  // Fetch case details to get client info
  const {
    data: caseData
  } = useQuery({
    queryKey: ['case-details', caseId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cases').select('*, clients(id, full_name)').eq('id', caseId).single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch expense accounts from Zoho Books
  const {
    data: expenseAccounts
  } = useQuery({
    queryKey: ['zoho-expense-accounts'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.functions.invoke('zoho-books-get-expense-accounts');
      if (error) throw error;
      return data?.accounts || [];
    }
  });

  // Fetch expenses from Zoho Books
  const {
    data: expenses,
    isLoading
  } = useQuery({
    queryKey: ['zoho-expenses', caseId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.functions.invoke('zoho-books-get-expenses');
      if (error) throw error;

      // Filter expenses that have this case ID in reference_number
      const allExpenses = data?.expenses || [];
      return allExpenses.filter((exp: any) => exp.reference_number?.includes(caseId));
    }
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      const {
        data,
        error
      } = await supabase.functions.invoke('zoho-books-create-expense', {
        body: expenseData
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense added successfully"
      });
      queryClient.invalidateQueries({
        queryKey: ['zoho-expenses', caseId]
      });
      setIsAddExpenseOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add expense",
        variant: "destructive"
      });
    }
  });
  const resetForm = () => {
    setExpenseDate(TimeUtils.formatDateInput(TimeUtils.nowDate()));
    setAmount('');
    setDescription('');
    setAccountId('');
  };
  const handleAddExpense = () => {
    if (!amount || !description || !accountId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    const expenseData = {
      account_id: accountId,
      date: expenseDate,
      amount: parseFloat(amount),
      description: description,
      reference_number: `Case: ${caseData?.case_number || caseId}`,
      is_billable: true
    };
    createExpenseMutation.mutate(expenseData);
  };
  if (isLoading) {
    return <div className="p-6">Loading expenses...</div>;
  }
  const totalExpenses = expenses?.reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0) || 0;
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Case Expenses</h3>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-semibold">₹{totalExpenses.toFixed(2)}</p>
          </div>
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input id="amount" type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="category">Expense Account *</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select expense account" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseAccounts?.map((account: any) => <SelectItem key={account.account_id} value={account.account_id}>
                          {account.account_name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" placeholder="Enter expense details" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                </div>
                {caseData?.clients && <div className="text-sm text-muted-foreground p-3 rounded-lg bg-teal-50">
                    <p><strong>Linked to:</strong></p>
                    <p>Title: {caseData.case_title}</p>
                    <p>Client: {caseData.clients.full_name}</p>
                  </div>}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleAddExpense} disabled={createExpenseMutation.isPending} className="flex-1">
                    {createExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {expenses && expenses.length > 0 ? <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                <th className="text-left p-3 text-sm font-semibold">Date</th>
                <th className="text-left p-3 text-sm font-semibold">Description</th>
                <th className="text-left p-3 text-sm font-semibold">Category</th>
                <th className="text-right p-3 text-sm font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense: any) => <tr key={expense.expense_id} className="border-b hover:bg-muted/50">
                  <td className="p-3 text-sm">
                    {expense.date ? TimeUtils.formatDate(expense.date, 'dd/MM/yyyy') : '-'} (IST)
                  </td>
                  <td className="p-3 text-sm">{expense.description}</td>
                  <td className="p-3 text-sm">{expense.account_name || '-'}</td>
                  <td className="p-3 text-sm text-right font-medium">₹{Number(expense.amount || 0).toFixed(2)}</td>
                </tr>)}
            </tbody>
          </table>
        </div> : <div className="text-center py-12 text-muted-foreground">
          <p>No expenses recorded for this case</p>
        </div>}
    </div>;
};