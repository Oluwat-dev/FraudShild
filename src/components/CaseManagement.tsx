import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';

interface FraudCase {
  id: string;
  transaction_id: string;
  status: 'open' | 'investigating' | 'resolved' | 'disputed' | 'closed';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
  resolution: string | null;
  transaction: {
    amount: number;
    merchant: string;
    created_at: string;
  };
}

export function CaseManagement() {
  const [cases, setCases] = useState<FraudCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<FraudCase | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    async function fetchCases() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('fraud_cases')
          .select(`
            *,
            transaction:transactions (
              amount,
              merchant,
              created_at
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setCases(data as FraudCase[]);
      } catch (error) {
        console.error('Error fetching fraud cases:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCases();

    // Subscribe to changes
    channel = supabase
      .channel('fraud_cases')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fraud_cases' },
        () => {
          fetchCases();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const getStatusColor = (status: FraudCase['status']) => {
    switch (status) {
      case 'open':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case 'investigating':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case 'resolved':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'disputed':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      case 'closed':
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getStatusIcon = (status: FraudCase['status']) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="w-5 h-5" />;
      case 'investigating':
        return <Clock className="w-5 h-5" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5" />;
      case 'disputed':
        return <AlertTriangle className="w-5 h-5" />;
      case 'closed':
        return <FileText className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Fraud Cases</h2>
        </div>

        <div className="space-y-4">
          {cases.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No fraud cases found</p>
            </div>
          ) : (
            cases.map((fraudCase) => (
              <div
                key={fraudCase.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                onClick={() => setSelectedCase(fraudCase)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(fraudCase.status)}`}>
                      {getStatusIcon(fraudCase.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {fraudCase.transaction.merchant}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(fraudCase.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP'
                      }).format(fraudCase.transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Case #{fraudCase.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
                {fraudCase.notes && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {fraudCase.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}