import React from 'react';
import { Shield, Lock, AlertTriangle, Activity, ChevronRight } from 'lucide-react';

export function Home({ onProceed }: { onProceed: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="flex justify-center items-center mb-8">
            <Shield className="w-16 h-16 text-blue-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Welcome to FraudShield
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-8">
            Advanced fraud detection system powered by machine learning to protect your transactions in real-time
          </p>
          <button
            onClick={onProceed}
            className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-lg text-blue-900 bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
          >
            Proceed to FraudShield
            <ChevronRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Lock className="w-8 h-8 text-blue-400" />
                <h3 className="ml-3 text-xl font-semibold text-white">Real-time Protection</h3>
              </div>
              <p className="text-gray-300">
                Advanced algorithms monitor transactions 24/7 to detect and prevent fraudulent activities instantly
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
                <h3 className="ml-3 text-xl font-semibold text-white">Smart Alerts</h3>
              </div>
              <p className="text-gray-300">
                Receive instant notifications about suspicious activities and take immediate action
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Activity className="w-8 h-8 text-green-400" />
                <h3 className="ml-3 text-xl font-semibold text-white">Transaction Analytics</h3>
              </div>
              <p className="text-gray-300">
                Detailed insights and analytics to help you understand your transaction patterns
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Trusted by Thousands</h2>
            <p className="mt-4 text-xl text-gray-400">
              Protecting transactions worldwide with advanced security
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-400">99.9%</div>
              <div className="mt-2 text-gray-300">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400">£1M+</div>
              <div className="mt-2 text-gray-300">Fraud Prevented</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400">24/7</div>
              <div className="mt-2 text-gray-300">Active Monitoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-900 to-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Ready to secure your transactions?
          </h2>
          <button
            onClick={onProceed}
            className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-lg text-blue-900 bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
          >
            Get Started Now
            <ChevronRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>© {new Date().getFullYear()} FraudShield. All rights reserved.</p>
            <p className="mt-2">Developed by Oluwatobi</p>
          </div>
        </div>
      </footer>
    </div>
  );
}