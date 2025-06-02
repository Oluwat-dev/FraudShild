import React, { useState } from 'react';
import { CreditCard, CheckCircle, MapPin, Send, Store } from 'lucide-react';
import { TransactionConfirmation } from './TransactionConfirmation';
import { UpiVerification } from './UpiVerification';
import { supabase } from '../lib/supabase';

interface TransactionFormProps {
  onSubmit: (transaction: {
    amount: number;
    merchant: string;
    category: string;
    location: string;
    recipientEmail?: string;
    upiId?: string;
    transferType: 'payment' | 'p2p_transfer';
    status?: 'approved' | 'disputed' | 'cancelled';
  }) => Promise<{
    transaction: {
      id: string;
    };
    risk_assessment: {
      score: number;
      is_fraudulent: boolean;
      risk_level: 'low' | 'medium' | 'high';
      flagged: boolean;
    };
  }>;
}

const UK_LOCATIONS = [
  'London',
  'Manchester',
  'Birmingham',
  'Leeds',
  'Glasgow',
  'Liverpool',
  'Edinburgh',
  'Bristol',
  'Cardiff',
  'Newcastle',
  'Sheffield',
  'Belfast',
  'Nottingham',
  'Cambridge',
  'Oxford',
  'Reading',
  'Leicester',
  'Brighton',
  'Portsmouth',
  'Milton Keynes'
].sort();

export function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('retail');
  const [location, setLocation] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientError, setRecipientError] = useState('');
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');
  const [transactionType, setTransactionType] = useState<'payment' | 'p2p_transfer'>('payment');
  const [showInitiated, setShowInitiated] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<null | {
    score: number;
    is_fraudulent: boolean;
    risk_level: 'low' | 'medium' | 'high';
    flagged: boolean;
    amount: number;
    merchant: string;
    transactionId: string;
  }>(null);

  const filteredLocations = UK_LOCATIONS.filter(city =>
    city.toLowerCase().includes(location.toLowerCase())
  );

  const resetForm = () => {
    setAmount('');
    setMerchant('');
    setCategory('retail');
    setLocation('');
    setRecipientEmail('');
    setRecipientError('');
    setUpiId('');
    setUpiError('');
    setTransactionType('payment');
    setRiskAssessment(null);
    setShowInitiated(false);
  };

  const handleConfirm = async (isCancelled: boolean) => {
    if (isCancelled) {
      resetForm();
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (transactionType === 'p2p_transfer') {
        const { data: recipientData } = await supabase
          .rpc('validate_recipient_email', { recipient_email: recipientEmail });

        if (recipientData) {
          const { error: transferError } = await supabase
            .rpc('transfer_money', {
              p_sender_id: user.id,
              p_recipient_id: recipientData,
              p_amount: parseFloat(amount)
            });

          if (transferError) throw transferError;
        }
      }
    } catch (error) {
      console.error('Transfer error:', error);
    }
    resetForm();
  };

  const validateRecipientEmail = async (email: string) => {
    if (!email) return;
    
    setIsValidatingEmail(true);
    setRecipientError('');

    try {
      const { data, error } = await supabase
        .rpc('validate_recipient_email', { recipient_email: email });

      if (error) {
        setRecipientError('Recipient not found');
        return false;
      }

      return true;
    } catch (error) {
      setRecipientError('Error validating recipient');
      return false;
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setShowLocationSuggestions(false);
  };

  const handleUpiChange = (value: string) => {
    setUpiId(value);
    if (value && !/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(value)) {
      setUpiError('Invalid UPI ID format');
    } else {
      setUpiError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (transactionType === 'p2p_transfer') {
      if (!recipientEmail) {
        setRecipientError('Recipient email is required');
        return;
      }

      if (!location) {
        alert('Please select your location');
        return;
      }

      const isValid = await validateRecipientEmail(recipientEmail);
      if (!isValid) return;
    }

    if (upiId && !/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(upiId)) {
      setUpiError('Please enter a valid UPI ID');
      return;
    }

    setShowInitiated(true);

    try {
      const result = await onSubmit({
        amount: parseFloat(amount),
        merchant: transactionType === 'p2p_transfer' ? 'P2P Transfer' : merchant,
        category: transactionType === 'p2p_transfer' ? 'money_transfer' : category,
        location,
        recipientEmail: transactionType === 'p2p_transfer' ? recipientEmail : undefined,
        upiId: upiId || undefined,
        transferType: transactionType,
        status: 'approved'
      });

      setRiskAssessment({
        ...result.risk_assessment,
        amount: parseFloat(amount),
        merchant: transactionType === 'p2p_transfer' ? 'P2P Transfer' : merchant,
        transactionId: result.transaction.id
      });
    } catch (error) {
      console.error('Transaction error:', error);
      alert('Transaction failed. Please try again.');
      setShowInitiated(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 relative">
        <div className="flex items-center gap-3 mb-6">
          {transactionType === 'payment' ? (
            <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          ) : (
            <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          )}
          <h3 className="text-lg font-semibold dark:text-white">
            {transactionType === 'payment' ? 'New Payment' : 'Send Money'}
          </h3>
        </div>

        {showInitiated && (
          <div className="absolute top-0 left-0 right-0 p-4 bg-blue-500 text-white rounded-t-xl flex items-center justify-center gap-2 transition-all duration-300 ease-in-out">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Transaction initiated...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setTransactionType('payment')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border transition-colors ${
                transactionType === 'payment'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
              }`}
            >
              <Store className="w-5 h-5" />
              Payment
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('p2p_transfer')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border transition-colors ${
                transactionType === 'p2p_transfer'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
              }`}
            >
              <Send className="w-5 h-5" />
              Send Money
            </button>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">£</span>
              </div>
              <input
                type="number"
                id="amount"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {transactionType === 'p2p_transfer' ? (
            <>
              <div>
                <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  id="recipientEmail"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className={`block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    recipientError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Enter recipient's email"
                />
                {recipientError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{recipientError}</p>
                )}
                {isValidatingEmail && (
                  <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">Validating email...</p>
                )}
              </div>

              <div className="relative">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="location"
                    required
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setShowLocationSuggestions(true);
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                    className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter UK city"
                  />
                </div>
                
                {showLocationSuggestions && location && filteredLocations.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredLocations.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleLocationSelect(city)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="merchant" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Merchant
                </label>
                <input
                  type="text"
                  id="merchant"
                  required
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter merchant name"
                />
              </div>

              <UpiVerification
                value={upiId}
                onChange={handleUpiChange}
                error={upiError}
              />

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="retail">Retail</option>
                  <option value="food">Food & Dining</option>
                  <option value="travel">Travel</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="services">Services</option>
                  <option value="electronics">Electronics</option>
                  <option value="cryptocurrency">Cryptocurrency</option>
                  <option value="gambling">Gambling</option>
                  <option value="money_transfer">Money Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="relative">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setShowLocationSuggestions(true);
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                    className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter UK city"
                  />
                </div>
                
                {showLocationSuggestions && location && filteredLocations.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredLocations.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleLocationSelect(city)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2"
          >
            {transactionType === 'payment' ? (
              <>
                <CreditCard className="w-5 h-5" />
                Process Payment
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Money
              </>
            )}
          </button>
        </form>
      </div>

      {riskAssessment && (
        <TransactionConfirmation
          riskAssessment={riskAssessment}
          onClose={resetForm}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}