import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTransactionStore, Transaction } from '../store/transactionStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, AlertTriangle, Activity, LogOut, Moon, Sun, HelpCircle, FileText, Wallet, Menu, X, Mail, Users } from 'lucide-react';
import { TransactionForm } from './TransactionForm';
import { TransactionDetails } from './TransactionDetails';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';
import { Help } from './Help';
import { Statements } from './Statements';
import { MonthlySpending } from './MonthlySpending';
import { MonthlyReceived } from './MonthlyReceived';
import { useThemeStore } from '../store/themeStore';
import { Notifications } from './Notifications';
import { Beneficiaries } from './Beneficiaries';
import { CaseManagement } from './CaseManagement';
import { supabase } from '../lib/supabase';

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

function TransactionList({ transactions, onTransactionClick }: { 
  transactions: Transaction[],
  onTransactionClick: (transaction: Transaction) => void 
}) {
  return (
    <div className="mt-4 md:mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold dark:text-white">Recent Transactions</h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[calc(100vh-24rem)] md:max-h-96 overflow-auto scrollbar-thin">
        {transactions.length === 0 ? (
          <div className="px-4 md:px-6 py-4 text-gray-500 dark:text-gray-400 text-center">
            No transactions found
          </div>
        ) : (
          transactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className="px-4 md:px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer touch-manipulation"
              onClick={() => onTransactionClick(transaction)}
            >
              <div>
                <div className="flex items-center">
                  <span className="font-medium dark:text-white">{transaction.merchant}</span>
                  {transaction.is_fraudulent && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                      Fraudulent
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(transaction.created_at).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-medium ${transaction.is_fraudulent ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  {formatAmount(transaction.amount)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{transaction.location}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const signOut = useAuthStore((state) => state.signOut);
  const { transactions, stats, loading, initialize, simulateTransaction, balance } = useTransactionStore();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'dashboard' | 'help' | 'statements' | 'beneficiaries' | 'cases'>('dashboard');
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
      }
    };
    fetchUserEmail();
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchQuery) return true;
    
    const searchTerms = searchQuery.toLowerCase().split(' ');
    return searchTerms.every(term => (
      transaction.merchant.toLowerCase().includes(term) ||
      transaction.category.toLowerCase().includes(term) ||
      transaction.amount.toString().includes(term) ||
      (transaction.location && transaction.location.toLowerCase().includes(term)) ||
      formatAmount(transaction.amount).toLowerCase().includes(term)
    ));
  });

  const chartData = transactions
    .slice()
    .reverse()
    .reduce((acc: any[], transaction) => {
      const hour = new Date(transaction.created_at).getHours();
      const existing = acc.find((d) => d.hour === hour);
      
      if (existing) {
        existing.amount += transaction.amount;
        if (transaction.is_fraudulent) existing.fraudulent += transaction.amount;
      } else {
        acc.push({
          hour,
          amount: transaction.amount,
          fraudulent: transaction.is_fraudulent ? transaction.amount : 0,
        });
      }
      
      return acc;
    }, [])
    .sort((a, b) => a.hour - b.hour);

  const renderContent = () => {
    switch (activeView) {
      case 'help':
        return <Help />;
      case 'statements':
        return <Statements transactions={filteredTransactions} />;
      case 'cases':
        return <CaseManagement />;
      case 'beneficiaries':
        return <Beneficiaries />;
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Transactions</p>
                    <p className="text-2xl font-semibold dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Fraudulent Activities</p>
                    <p className="text-2xl font-semibold dark:text-white">{stats.fraudulent}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
                <div className="flex items-center">
                  <Shield className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Success Rate</p>
                    <p className="text-2xl font-semibold dark:text-white">{stats.successRate}%</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
                  <h3 className="text-lg font-semibold mb-6 dark:text-white">Transaction Activity</h3>
                  <div className="h-60 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#888888" />
                        <XAxis 
                          dataKey="hour"
                          tickFormatter={(hour) => `${hour}:00`}
                          stroke="#888888"
                        />
                        <YAxis 
                          tickFormatter={(value) => `£${value}`}
                          stroke="#888888"
                        />
                        <Tooltip 
                          formatter={(value) => [`£${value}`, 'Amount']}
                          labelFormatter={(hour) => `${hour}:00`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#2563eb" 
                          strokeWidth={2}
                          name="Total Amount"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="fraudulent" 
                          stroke="#dc2626" 
                          strokeWidth={2}
                          name="Fraudulent Amount"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <MonthlySpending transactions={transactions} />
                <MonthlyReceived transactions={transactions} />

                <TransactionList 
                  transactions={filteredTransactions} 
                  onTransactionClick={(transaction) => setSelectedTransaction(transaction)}
                />
              </div>

              <div className="lg:block">
                <TransactionForm onSubmit={simulateTransaction} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30 safe-area-pt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white hidden sm:block">
                FraudShield
              </span>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300">
                <Mail className="w-5 h-5 mr-2" />
                <span className="font-medium">{userEmail}</span>
              </div>

              <div className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300">
                <Wallet className="w-5 h-5 mr-2 text-green-500" />
                <span className="font-semibold">{formatAmount(balance)}</span>
              </div>
              
              <SearchBar onSearch={setSearchQuery} />
              
              <button
                onClick={() => setActiveView('dashboard')}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'dashboard'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Activity className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveView('cases')}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'cases'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveView('beneficiaries')}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'beneficiaries'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveView('help')}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'help'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveView('statements')}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'statements'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-5 h-5" />
              </button>

              <Notifications />

              <ThemeToggle />

              <button
                onClick={signOut}
                className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <LogOut className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2">
            <div className="px-4 space-y-2">
              <div className="flex items-center py-2 text-gray-600 dark:text-gray-300">
                <Mail className="w-5 h-5 mr-2" />
                <span className="font-medium">{userEmail}</span>
              </div>

              <div className="flex items-center py-2 text-gray-600 dark:text-gray-300">
                <Wallet className="w-5 h-5 mr-2 text-green-500" />
                <span className="font-semibold">{formatAmount(balance)}</span>
              </div>

              <SearchBar onSearch={setSearchQuery} />

              <button
                onClick={() => {
                  setActiveView('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'dashboard'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <Activity className="w-5 h-5 mr-2" />
                Dashboard
              </button>

              <button
                onClick={() => {
                  setActiveView('cases');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'cases'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                Fraud Cases
              </button>

              <button
                onClick={() => {
                  setActiveView('beneficiaries');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'beneficiaries'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <Users className="w-5 h-5 mr-2" />
                Beneficiaries
              </button>

              <button
                onClick={() => {
                  setActiveView('help');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'help'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                Help
              </button>

              <button
                onClick={() => {
                  setActiveView('statements');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'statements'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <FileText className="w-5 h-5 mr-2" />
                Statements
              </button>

              <div className="flex items-center justify-between py-2">
                <Notifications />
                <ThemeToggle />
                <button
                  onClick={signOut}
                  className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 safe-area-pb">
        {renderContent()}
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow-sm mt-auto safe-area-pb">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            FraudShield © {new Date().getFullYear()} - All rights reserved. Developed by Oluwatobi
          </p>
        </div>
      </footer>

      {selectedTransaction && (
        <TransactionDetails
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </>
  );
}