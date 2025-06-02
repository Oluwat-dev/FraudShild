import React, { useState } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

interface UpiVerificationProps {
  value: string;
  onChange: (value: string) => void;
  error: string;
}

export function UpiVerification({ value, onChange, error }: UpiVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const validateBankId = (id: string) => {
    const ukBankRegex = /\b([a-zA-Z0-9._%+-]+@(barclays|hsbc|natwest|lloyds|monzo|revolut|starling|tsb|santander|metro|cooperative|nationwide|halifax))\b/;
    return ukBankRegex.test(id);
  };

  const verifyBankId = async (id: string) => {
    // Simulate verification with a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return validateBankId(id);
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toLowerCase();
    onChange(newValue);
    setIsVerified(false);

    if (newValue) {
      setIsVerifying(true);
      try {
        const isValid = await verifyBankId(newValue);
        setIsVerified(isValid);
        if (!isValid) {
          onChange(newValue);
        }
      } catch (error) {
        console.error('Bank ID verification error:', error);
        setIsVerified(false);
      }
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-1">
      <label htmlFor="bankId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Bank ID
      </label>
      <div className="relative mt-1">
        <input
          type="text"
          id="bankId"
          value={value}
          onChange={handleChange}
          className={`block w-full pr-10 rounded-lg shadow-sm ${
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : isVerified
              ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
          } dark:bg-gray-700 dark:text-white`}
          placeholder="username@bankname"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isVerifying ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : error ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : isVerified ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : isVerified ? (
        <p className="text-sm text-green-600 dark:text-green-400">Valid bank ID format</p>
      ) : value ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter a valid bank ID
        </p>
      ) : null}
    </div>
  );
}