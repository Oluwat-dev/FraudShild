import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  status: 'pending' | 'completed' | 'failed' | 'flagged';
  risk_score: number;
  is_fraudulent: boolean;
  created_at: string;
  location: string;
  ip_address?: string;
  device_id?: string;
}

interface TransactionState {
  transactions: Transaction[];
  balance: number;
  stats: {
    total: number;
    fraudulent: number;
    successRate: number;
  };
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  simulateTransaction: (transaction: Partial<Transaction>) => Promise<any>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  balance: 0,
  stats: {
    total: 0,
    fraudulent: 0,
    successRate: 0,
  },
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('No authenticated user found');

      const fetchData = async () => {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('balance')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;

        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        const transactions = data as Transaction[];
        const stats = calculateStats(transactions);
        set({ 
          transactions, 
          stats, 
          balance: userData.balance,
          loading: false 
        });
      };

      // Initial fetch
      await fetchData();

      // Subscribe to transaction changes
      const transactionSubscription = supabase
        .channel('transactions')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'transactions',
            filter: `user_id=eq.${user.id}`
          },
          async () => {
            // Refetch all data to ensure consistency
            await fetchData();
          }
        )
        .subscribe();

      // Subscribe to balance changes
      const balanceSubscription = supabase
        .channel('users')
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'users', 
            filter: `id=eq.${user.id}` 
          },
          async (payload) => {
            set({ balance: (payload.new as any).balance });
            // Refetch transactions to ensure consistency
            await fetchData();
          }
        )
        .subscribe();

      // Cleanup subscriptions on unmount
      return () => {
        transactionSubscription.unsubscribe();
        balanceSubscription.unsubscribe();
      };

    } catch (error) {
      console.error('Initialization error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred', 
        loading: false 
      });
    }
  },

  simulateTransaction: async (transaction) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw new Error(`Authentication error: ${authError.message}`);
      if (!user) throw new Error('User not authenticated - please sign in to simulate transactions');

      if (!transaction.amount || transaction.amount <= 0) {
        throw new Error('Invalid transaction amount');
      }

      if (!transaction.merchant) {
        throw new Error('Merchant name is required');
      }

      const maxRetries = 3;
      let retryCount = 0;
      let lastError = null;

      while (retryCount < maxRetries) {
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-transaction`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transaction: {
                amount: transaction.amount,
                merchant: transaction.merchant,
                category: transaction.category || 'retail',
                ip_address: transaction.ip_address || '127.0.0.1',
                device_id: transaction.device_id || 'web-client',
                location: transaction.location || 'Unknown',
              },
              user_id: user.id,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          // Include the transaction ID in the risk assessment data
          if (data.transaction && data.transaction.id) {
            data.riskAssessment = {
              ...data.riskAssessment,
              transactionId: data.transaction.id
            };
          }
          return data;
        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          lastError = error;
          retryCount++;
          
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          }
        }
      }

      throw lastError;
    } catch (error) {
      console.error('Transaction simulation error:', error);
      const errorMessage = error instanceof Error 
        ? error.message
        : 'An unexpected error occurred while processing the transaction';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },
}));

function calculateStats(transactions: Transaction[]) {
  const total = transactions.length;
  const fraudulent = transactions.filter(t => t.is_fraudulent).length;
  const successRate = total ? ((total - fraudulent) / total) * 100 : 0;

  return {
    total,
    fraudulent,
    successRate: Math.round(successRate * 10) / 10,
  };
}