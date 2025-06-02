import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter } from 'lucide-react';
import { Transaction } from '../store/transactionStore';

interface StatementsProps {
  transactions: Transaction[];
}

export function Statements({ transactions }: StatementsProps) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => (new Date().getFullYear() - i).toString()
  );

  const filteredTransactions = transactions.filter(transaction => {
    const date = new Date(transaction.created_at);
    return (
      (!selectedMonth || months[date.getMonth()] === selectedMonth) &&
      (!selectedYear || date.getFullYear().toString() === selectedYear)
    );
  });

  const downloadStatement = () => {
    const headers = ['Date', 'Merchant', 'Amount', 'Category', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.merchant,
        new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(t.amount),
        t.category,
        t.is_fraudulent ? 'Fraudulent' : 'Valid'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${selectedMonth || 'all'}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Transaction Statements
          </h2>
        </div>
        <button
          onClick={downloadStatement}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Months</option>
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Filter className="w-4 h-4 inline mr-1" />
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Merchant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {transaction.merchant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.is_fraudulent
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {transaction.is_fraudulent ? 'Fraudulent' : 'Valid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}