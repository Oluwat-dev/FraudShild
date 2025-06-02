import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, ArrowRight } from 'lucide-react';

interface Beneficiary {
  id: string;
  email: string;
  total_sent: number;
  last_transfer_date: string;
}

export function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    async function fetchBeneficiaries() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get all P2P transfers where the user is the sender
        const { data: transfers, error: transferError } = await supabase
          .from('transactions')
          .select(`
            recipient_id,
            amount,
            created_at,
            email
          `)
          .eq('user_id', user.id)
          .eq('merchant', 'P2P Transfer')
          .order('created_at', { ascending: false });

        if (transferError) throw transferError;
        if (!transfers) return;

        // Group transfers by recipient
        const beneficiaryMap = transfers.reduce((acc, transfer) => {
          if (!transfer.recipient_id || !transfer.email) return acc;

          if (acc.has(transfer.recipient_id)) {
            const existing = acc.get(transfer.recipient_id)!;
            acc.set(transfer.recipient_id, {
              ...existing,
              total_sent: existing.total_sent + Number(transfer.amount),
              last_transfer_date: existing.last_transfer_date > transfer.created_at 
                ? existing.last_transfer_date 
                : transfer.created_at
            });
          } else {
            acc.set(transfer.recipient_id, {
              id: transfer.recipient_id,
              email: transfer.email,
              total_sent: Number(transfer.amount),
              last_transfer_date: transfer.created_at
            });
          }

          return acc;
        }, new Map<string, Beneficiary>());

        setBeneficiaries(Array.from(beneficiaryMap.values()));
      } catch (error) {
        console.error('Error fetching beneficiaries:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBeneficiaries();

    // Subscribe to new transfers
    channel = supabase
      .channel('beneficiaries')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `merchant=eq.P2P Transfer`
        },
        () => {
          fetchBeneficiaries();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Beneficiaries</h2>
      </div>

      {beneficiaries.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No beneficiaries found</p>
          <p className="text-sm mt-2">Start a P2P transfer to add beneficiaries</p>
        </div>
      ) : (
        <div className="space-y-4">
          {beneficiaries.map((beneficiary) => (
            <div
              key={beneficiary.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{beneficiary.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last transfer: {new Date(beneficiary.last_transfer_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatAmount(beneficiary.total_sent)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total sent</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}