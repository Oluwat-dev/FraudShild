import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TransactionConfirmationProps {
  riskAssessment: {
    score: number;
    is_fraudulent: boolean;
    risk_level: 'low' | 'medium' | 'high';
    flagged: boolean;
    amount: number;
    merchant: string;
    transactionId: string;
  };
  onClose: () => void;
  onConfirm: (isCancelled: boolean) => void;
}

export function TransactionConfirmation({ riskAssessment, onClose, onConfirm }: TransactionConfirmationProps) {
  const [status, setStatus] = React.useState<'assessing' | 'completed' | 'disputed' | 'cancelled' | null>(null);

  const getRiskIcon = () => {
    switch (riskAssessment.risk_level) {
      case 'low':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'medium':
        return <AlertCircle className="w-12 h-12 text-yellow-500" />;
      case 'high':
        return <AlertTriangle className="w-12 h-12 text-red-500" />;
      default:
        return null;
    }
  };

  const getRiskColor = () => {
    switch (riskAssessment.risk_level) {
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      default:
        return '';
    }
  };

  const handleConfirm = () => {
    onConfirm(false);
    setStatus('completed');
  };

  const handleCancel = () => {
    onConfirm(true);
    setStatus('cancelled');
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const renderStatusScreen = () => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex flex-col items-center justify-center h-48">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
            <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
              Transaction completed
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your transaction has been processed successfully
            </p>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex flex-col items-center justify-center h-48">
            <XCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
            <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">
              Transaction cancelled
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your transaction has been cancelled successfully
            </p>
          </div>
        );
      default:
        return (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              {getRiskIcon()}
              <h3 className="text-xl font-semibold mt-4 dark:text-white">
                Transaction Risk Assessment
              </h3>
            </div>

            <div className={`p-4 rounded-lg border ${getRiskColor()} mb-6`}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span>Risk Level:</span>
                  <span className="font-semibold capitalize">{riskAssessment.risk_level}</span>
                </div>
                <div className="flex justify-between">
                  <span>Risk Score:</span>
                  <span className="font-semibold">{(riskAssessment.score * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold">
                    {riskAssessment.flagged ? 'High Risk - Review Recommended' : 'Appears Safe'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200 ${
                  riskAssessment.flagged
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                {riskAssessment.flagged ? 'Proceed Anyway' : 'Confirm Transaction'}
              </button>
              
              <button
                onClick={handleCancel}
                className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200"
              >
                Cancel Transaction
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 relative">
        {renderStatusScreen()}
      </div>
    </div>
  );
}