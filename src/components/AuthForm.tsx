import React, { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { Shield } from 'lucide-react';

export function AuthForm() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Shield className="w-10 h-10 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900 ml-3">
            FraudShield
          </h2>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                },
              },
            },
            className: {
              container: 'w-full',
              button: 'w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200',
              input: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              divider: 'my-4',
              label: 'text-sm font-medium text-gray-700',
              message: 'text-sm text-gray-600',
              anchor: 'text-blue-600 hover:text-blue-700',
            },
          }}
          providers={['google']}
          socialLayout="vertical"
          theme="default"
          magicLink={false}
          redirectTo={window.location.origin}
          onError={(error) => {
            console.error('Auth error:', error);
            setError('Authentication failed. Please check your credentials and try again.');
          }}
        />

        <p className="mt-8 text-center text-sm text-gray-600">
          FraudShield © {new Date().getFullYear()} - All rights reserved. Developed by Oluwatobi
        </p>
      </div>
    </div>
  );
}