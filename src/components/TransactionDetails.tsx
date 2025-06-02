import React from 'react';
import { AlertTriangle, CheckCircle, Clock, DollarSign, MapPin, Shield, Store, Tag, AlertCircle, Globe, Mail, User, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TransactionDetailsProps {
  transaction: {
    id: string;
    amount: number;
    merchant: string;
    category: string;
    status: string;
    risk_score: number;
    is_fraudulent: boolean;
    created_at: string;
    location: string;
    ip_address?: string;
    device_id?: string;
    email?: string;
    account_age_days?: number;
    transfer_type?: 'payment' | 'p2p_transfer';
    dispute_reason?: string;
  };
  onClose: () => void;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmColor?: string;
  icon?: React.ReactNode;
}

function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  confirmColor = 'bg-red-600 hover:bg-red-700',
  icon
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <h3 className="text-xl font-semibold dark:text-white">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 text-white py-2 px-4 rounded-lg transition-colors ${confirmColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessDialog({ isOpen, message, onClose }: { isOpen: boolean; message: string; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold dark:text-white mb-2">Success</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

const UK_LOCATIONS = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool',
  'Edinburgh', 'Bristol', 'Cardiff', 'Newcastle', 'Sheffield', 'Belfast',
  'Nottingham', 'Cambridge', 'Oxford', 'Reading', 'Leicester', 'Brighton',
  'Portsmouth', 'Milton Keynes'
].map(city => city.toLowerCase());

export function TransactionDetails({ transaction, onClose }: TransactionDetailsProps) {
  const [isReporting, setIsReporting] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const [disputeReason, setDisputeReason] = React.useState('');
  const [showDisputeForm, setShowDisputeForm] = React.useState(false);
  const [showReportDialog, setShowReportDialog] = React.useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = React.useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const getRiskLevel = (score: number) => {
    if (score <= 0.3) return { level: 'Low', color: 'text-green-600 dark:text-green-400' };
    if (score <= 0.6) return { level: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' };
    return { level: 'High', color: 'text-red-600 dark:text-red-400' };
  };

  const handleReportFraud = async () => {
    try {
      setIsReporting(true);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-fraud-case`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          notes: notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create fraud case');
      }

      setIsReporting(false);
      setSuccessMessage('Transaction has been reported successfully. Our team will investigate the case.');
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error reporting fraud:', error);
      alert('Failed to report fraud. Please try again.');
      setIsReporting(false);
    }
  };

  const handleDisputeTransaction = async () => {
    try {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: 'disputed',
          dispute_reason: disputeReason
        })
        .eq('id', transaction.id);

      if (updateError) throw updateError;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          amount: transaction.amount,
          merchant: transaction.merchant,
          disputeReason
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to notify admin');
      }

      setShowDisputeForm(false);
      setSuccessMessage('Transaction has been disputed successfully. Our team will review your case.');
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error disputing transaction:', error);
      alert('Failed to dispute transaction. Please try again.');
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    onClose();
    window.location.reload();
  };

  const generateInsights = () => {
    const insights: { icon: React.ReactNode; text: string; severity: 'high' | 'medium' | 'low' }[] = [];

    if (transaction.transfer_type === 'p2p_transfer') {
      if (transaction.account_age_days !== undefined) {
        const accountAgeMonths = transaction.account_age_days / 30;
        
        if (accountAgeMonths < 3) {
          insights.push({
            icon: <User className="w-5 h-5 text-red-500" />,
            text: `User account is less than 3 months old (${Math.floor(accountAgeMonths)} months)`,
            severity: 'high'
          });
        } else if (accountAgeMonths < 6) {
          insights.push({
            icon: <User className="w-5 h-5 text-yellow-500" />,
            text: `Relatively new account (${Math.floor(accountAgeMonths)} months old)`,
            severity: 'medium'
          });
        }
      }

      if (transaction.email) {
        const emailAge = transaction.account_age_days || 0;
        
        if (emailAge < 30) {
          insights.push({
            icon: <Mail className="w-5 h-5 text-red-500" />,
            text: `New account: Only ${emailAge} days old`,
            severity: 'high'
          });
        } else if (emailAge < 90) {
          insights.push({
            icon: <Mail className="w-5 h-5 text-yellow-500" />,
            text: `Recent account: ${emailAge} days old`,
            severity: 'medium'
          });
        }
      }

      if (transaction.amount >= 5000) {
        insights.push({
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          text: 'Large P2P transfer exceeding £5,000',
          severity: 'high'
        });
      } else if (transaction.amount >= 1000) {
        insights.push({
          icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
          text: 'Moderate P2P transfer exceeding £1,000',
          severity: 'medium'
        });
      }

      if (transaction.location) {
        if (!UK_LOCATIONS.includes(transaction.location.toLowerCase())) {
          insights.push({
            icon: <Globe className="w-5 h-5 text-red-500" />,
            text: 'Transfer initiated from outside UK',
            severity: 'high'
          });
        } else if (transaction.location.toLowerCase() === 'london' && transaction.amount > 1000) {
          insights.push({
            icon: <MapPin className="w-5 h-5 text-yellow-500" />,
            text: 'High-value transfer from high-risk location',
            severity: 'medium'
          });
        }
      }

      const hour = new Date(transaction.created_at).getHours();
      if (hour >= 23 || hour <= 4) {
        insights.push({
          icon: <Clock className="w-5 h-5 text-yellow-500" />,
          text: 'Transfer initiated during unusual hours',
          severity: 'medium'
        });
      }
    } else {
      if (transaction.amount >= 10000) {
        insights.push({
          icon: <DollarSign className="w-5 h-5 text-red-500" />,
          text: 'Unusually large transaction amount exceeding £10,000',
          severity: 'high'
        });
      }

      if (!transaction.location || transaction.location === 'Unknown') {
        insights.push({
          icon: <MapPin className="w-5 h-5 text-red-500" />,
          text: 'Missing location information increases risk',
          severity: 'high'
        });
      } else if (!UK_LOCATIONS.includes(transaction.location.toLowerCase())) {
        insights.push({
          icon: <Globe className="w-5 h-5 text-red-500" />,
          text: 'Transaction location outside UK banking jurisdiction',
          severity: 'high'
        });
      }

      const highRiskCategories = ['gambling', 'cryptocurrency', 'money_transfer'];
      if (highRiskCategories.includes(transaction.category.toLowerCase())) {
        insights.push({
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          text: `High-risk transaction category: ${transaction.category}`,
          severity: 'high'
        });
      }
    }

    return insights;
  };

  const risk = getRiskLevel(transaction.risk_score);
  const insights = generateInsights();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {transaction.is_fraudulent ? (
                <AlertTriangle className="w-8 h-8 text-red-500" />
              ) : (
                <Shield className="w-8 h-8 text-green-500" />
              )}
              <div>
                <h2 className="text-2xl font-bold dark:text-white">Transaction Details</h2>
                <p className={`text-sm ${transaction.is_fraudulent ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {transaction.is_fraudulent ? 'Fraudulent Activity Detected' : 'Legitimate Transaction'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                  <p className="font-semibold dark:text-white">{formatAmount(transaction.amount)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Merchant</p>
                  <p className="font-semibold dark:text-white">{transaction.merchant}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                  <p className="font-semibold capitalize dark:text-white">{transaction.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                  <p className="font-semibold dark:text-white">{transaction.location || 'Unknown'}</p>
                </div>
              </div>

              {transaction.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-semibold dark:text-white">{transaction.email}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Risk Score</p>
                  <p className={`font-semibold ${risk.color}`}>
                    {(transaction.risk_score * 100).toFixed(1)}% - {risk.level} Risk
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transaction Time</p>
                  <p className="font-semibold dark:text-white">
                    {new Date(transaction.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {transaction.account_age_days !== undefined && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Account Age</p>
                    <p className="font-semibold dark:text-white">{transaction.account_age_days} days</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {insights.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-700 dark:text-red-300">Fraud Detection Insights</h4>
                  <ul className="mt-2 space-y-3">
                    {insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        {insight.icon}
                        <span className={`text-sm ${
                          insight.severity === 'high' 
                            ? 'text-red-600 dark:text-red-400' 
                            : insight.severity === 'medium'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {insight.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!showDisputeForm && !isReporting && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setShowDisputeDialog(true)}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-5 h-5" />
                Dispute Transaction
              </button>
              <button
                onClick={() => setShowReportDialog(true)}
                className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-5 h-5" />
                Report as Suspicious
              </button>
            </div>
          )}

          {showDisputeForm && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Dispute
                </label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white h-24"
                  placeholder="Please explain why you are disputing this transaction..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisputeForm(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisputeTransaction}
                  disabled={!disputeReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Dispute
                </button>
              </div>
            </div>
          )}

          {isReporting && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white h-24"
                  placeholder="Please provide any additional information about why this transaction is suspicious..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsReporting(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportFraud}
                  disabled={!notes.trim()}
                  className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Report
                </button>
              </div>
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          onConfirm={() => {
            setShowReportDialog(false);
            setIsReporting(true);
          }}
          title="Report Transaction"
          message="Are you sure you want to report this transaction as suspicious? This action will create a fraud case for investigation."
          confirmText="Report Transaction"
          confirmColor="bg-yellow-600 hover:bg-yellow-700"
          icon={<AlertCircle className="w-6 h-6 text-yellow-500" />}
        />

        <ConfirmDialog
          isOpen={showDisputeDialog}
          onClose={() => setShowDisputeDialog(false)}
          onConfirm={() => {
            setShowDisputeDialog(false);
            setShowDisputeForm(true);
          }}
          title="Dispute Transaction"
          message="Are you sure you want to dispute this transaction? This will initiate a formal dispute process."
          confirmText="Dispute Transaction"
          confirmColor="bg-red-600 hover:bg-red-700"
          icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
        />

        <SuccessDialog
          isOpen={showSuccessDialog}
          message={successMessage}
          onClose={handleSuccessDialogClose}
        />
      </div>
    </div>
  );
}

export default TransactionDetails;