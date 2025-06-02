import React from 'react';
import { HelpCircle, AlertTriangle, Shield, CreditCard, Mail, ChevronDown } from 'lucide-react';

export function Help() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
        <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Help & Support</h2>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Understanding Fraud Detection
          </h3>
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>
              Our system uses advanced machine learning to protect your transactions.
              Here's how it works:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Real-time transaction monitoring</li>
              <li>Risk score calculation based on multiple factors</li>
              <li>Automatic flagging of suspicious activities</li>
              <li>Instant notifications for high-risk transactions</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Common Warning Signs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-800 dark:text-red-300">High Risk</span>
              </div>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• Unusually large transactions</li>
                <li>• Unknown merchant locations</li>
                <li>• Multiple rapid transactions</li>
                <li>• Suspicious categories</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-300">Safe Practices</span>
              </div>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Verify merchant details</li>
                <li>• Use secure payment methods</li>
                <li>• Monitor transaction history</li>
                <li>• Keep device information updated</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">How does the fraud detection system work?</span>
                <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-4 text-gray-600 dark:text-gray-300">
                Our system analyzes multiple factors including transaction amount, location, merchant category, and device information. It uses machine learning to calculate a risk score and flags suspicious activities in real-time.
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">What should I do if a transaction is flagged?</span>
                <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-4 text-gray-600 dark:text-gray-300">
                If a transaction is flagged, you can either confirm it's legitimate or dispute it. For disputed transactions, our team will review the case and take appropriate action to protect your account.
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">How can I improve my transaction security?</span>
                <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-4 text-gray-600 dark:text-gray-300">
                <ul className="list-disc list-inside space-y-2">
                  <li>Use a secure internet connection</li>
                  <li>Keep your device and browser updated</li>
                  <li>Never share your bank ID or verification codes</li>
                  <li>Regularly monitor your transaction history</li>
                  <li>Report any suspicious activity immediately</li>
                </ul>
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">What transaction categories are considered high-risk?</span>
                <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-4 text-gray-600 dark:text-gray-300">
                High-risk categories include:
                <ul className="list-disc list-inside mt-2">
                  <li>Cryptocurrency transactions</li>
                  <li>Gambling services</li>
                  <li>Large money transfers</li>
                  <li>International transactions</li>
                  <li>High-value electronics purchases</li>
                </ul>
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">How long does it take to process a transaction?</span>
                <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-4 text-gray-600 dark:text-gray-300">
                Most transactions are processed instantly. However, if a transaction is flagged for review, it may take up to 24 hours for our security team to assess and clear it.
              </div>
            </details>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Need Additional Help?
          </h3>
          <div className="flex flex-col gap-3">
            <a 
              href={`mailto:Alukooluwatobiloba81@gmail.com`}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Mail className="w-5 h-5" />
              <span>Contact Support Team</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}