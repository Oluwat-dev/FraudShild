import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';
import { Transaction } from '../store/transactionStore';

interface MonthlySpendingProps {
  transactions: Transaction[];
}

export function MonthlySpending({ transactions }: MonthlySpendingProps) {
  const monthlyData = transactions.reduce((acc: { [key: string]: number }, transaction) => {
    // Only include outgoing transactions (exclude received money)
    if (transaction.merchant === 'Money Received') {
      return acc;
    }

    const date = new Date(transaction.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + transaction.amount;
    return acc;
  }, {});

  const chartData = Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, amount]) => {
      const [year, monthNum] = month.split('-');
      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' });
      return {
        month: `${monthName} ${year}`,
        amount,
      };
    });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  // Calculate total and average spending excluding received money
  const totalSpending = Object.values(monthlyData).reduce((sum, amount) => sum + amount, 0);
  const averageSpending = totalSpending / Object.keys(monthlyData).length || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold dark:text-white">Monthly Spending</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">Average Monthly</p>
          <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">
            {formatAmount(averageSpending)}
          </p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">Total Spending</p>
          <p className="text-2xl font-semibold text-green-700 dark:text-green-300">
            {formatAmount(totalSpending)}
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#888888" />
            <XAxis 
              dataKey="month" 
              stroke="#888888"
              tick={{ fill: '#888888' }}
            />
            <YAxis
              tickFormatter={(value) => `£${value.toLocaleString()}`}
              stroke="#888888"
              tick={{ fill: '#888888' }}
            />
            <Tooltip
              formatter={(value: number) => [formatAmount(value), 'Spending']}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Bar 
              dataKey="amount" 
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}