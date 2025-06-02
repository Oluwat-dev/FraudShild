import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

interface Transaction {
  amount: number;
  merchant: string;
  category: string;
  ip_address: string;
  device_id: string;
  location: string;
  recipientEmail?: string;
  transferType: 'payment' | 'p2p_transfer';
  status?: 'approved' | 'disputed' | 'cancelled';
}

// List of valid UK locations
const UK_LOCATIONS = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool',
  'Edinburgh', 'Bristol', 'Cardiff', 'Newcastle', 'Sheffield', 'Belfast',
  'Nottingham', 'Cambridge', 'Oxford', 'Reading', 'Leicester', 'Brighton',
  'Portsmouth', 'Milton Keynes'
].map(city => city.toLowerCase());

function calculateRiskScore(transaction: Transaction): number {
  let riskScore = 0;
  
  // Amount-based risk (25% weight)
  const amountScore = () => {
    if (transaction.amount >= 10000) return 1;
    if (transaction.amount >= 5000) return 0.85;
    if (transaction.amount >= 2500) return 0.7;
    if (transaction.amount >= 1000) return 0.5;
    if (transaction.amount >= 500) return 0.3;
    return 0.1;
  };
  
  // Category-based risk (25% weight)
  const categoryScore = () => {
    const riskLevels: { [key: string]: number } = {
      gambling: 0.95,
      cryptocurrency: 0.9,
      money_transfer: 0.85,
      electronics: 0.7,
      travel: 0.5,
      entertainment: 0.4,
      retail: 0.3,
      food: 0.2,
      services: 0.4,
      other: 0.5
    };
    return riskLevels[transaction.category.toLowerCase()] || riskLevels.other;
  };

  // Location-based risk (30% weight)
  const locationScore = () => {
    if (!transaction.location) return 1;
    
    const locationLower = transaction.location.toLowerCase();
    
    // Non-UK location is highest risk
    if (!UK_LOCATIONS.includes(locationLower)) {
      return 1;
    }
    
    // London has slightly elevated risk due to higher fraud rates
    if (locationLower === 'london') {
      return 0.4;
    }
    
    // Major cities have medium risk
    if (['manchester', 'birmingham', 'glasgow', 'liverpool'].includes(locationLower)) {
      return 0.3;
    }
    
    // Other UK cities have lower risk
    return 0.2;
  };
  
  // Device verification (20% weight)
  const verificationScore = () => {
    let score = 0;
    
    // Missing device ID is suspicious
    if (!transaction.device_id || transaction.device_id === 'web-client') {
      score += 0.6;
    }
    
    // Generic IP address is suspicious
    if (!transaction.ip_address || transaction.ip_address === '127.0.0.1') {
      score += 0.7;
    }
    
    return Math.min(score, 1);
  };

  // Calculate weighted risk score
  riskScore = (
    amountScore() * 0.25 +
    categoryScore() * 0.25 +
    locationScore() * 0.30 +
    verificationScore() * 0.20
  );

  // Additional risk multipliers
  const riskMultipliers = [
    // High-risk categories with large amounts
    {
      condition: ['gambling', 'cryptocurrency', 'money_transfer'].includes(transaction.category.toLowerCase()) 
        && transaction.amount >= 1000,
      multiplier: 1.3
    },
    // Non-UK location with high-risk category
    {
      condition: !UK_LOCATIONS.includes(transaction.location.toLowerCase())
        && ['gambling', 'cryptocurrency', 'money_transfer'].includes(transaction.category.toLowerCase()),
      multiplier: 1.5
    },
    // Large transactions from non-UK locations
    {
      condition: !UK_LOCATIONS.includes(transaction.location.toLowerCase())
        && transaction.amount >= 5000,
      multiplier: 1.4
    },
    // Missing location with large amount
    {
      condition: (!transaction.location || transaction.location === 'Unknown')
        && transaction.amount >= 1000,
      multiplier: 1.3
    }
  ];

  // Apply risk multipliers
  for (const { condition, multiplier } of riskMultipliers) {
    if (condition) {
      riskScore *= multiplier;
    }
  }

  // Ensure final score is between 0 and 1
  return Math.min(Math.max(riskScore, 0), 1);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { transaction, user_id } = body;

    if (!transaction || !user_id) {
      throw new Error('Transaction data and user ID are required');
    }

    if (!transaction.amount || typeof transaction.amount !== 'number' || transaction.amount <= 0) {
      throw new Error('Invalid transaction amount');
    }

    // For P2P transfers, validate recipient email
    let recipient_id = null;
    if (transaction.transferType === 'p2p_transfer') {
      if (!transaction.recipientEmail) {
        throw new Error('Recipient email is required for P2P transfers');
      }

      const { data: recipientData, error: recipientError } = await supabase
        .rpc('validate_recipient_email', { recipient_email: transaction.recipientEmail });

      if (recipientError || !recipientData) {
        throw new Error('Invalid recipient email');
      }

      recipient_id = recipientData;

      // Prevent self-transfers
      if (recipient_id === user_id) {
        throw new Error('Cannot transfer money to yourself');
      }
    } else {
      if (!transaction.merchant || typeof transaction.merchant !== 'string') {
        throw new Error('Invalid merchant name');
      }
    }

    // Check user's balance before processing
    const { data: userData, error: balanceError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', user_id)
      .single();

    if (balanceError) {
      throw new Error(`Error checking balance: ${balanceError.message}`);
    }

    if (userData.balance < transaction.amount) {
      throw new Error('Insufficient funds');
    }

    const riskScore = calculateRiskScore(transaction);
    const isFraudulent = riskScore > 0.6;
    
    // Insert the transaction record
    const { data, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        recipient_id,
        amount: transaction.amount,
        merchant: transaction.merchant,
        category: transaction.category,
        status: transaction.status || 'approved',
        risk_score: riskScore,
        is_fraudulent: isFraudulent,
        ip_address: transaction.ip_address,
        device_id: transaction.device_id,
        location: transaction.location,
        transfer_type: transaction.transferType
      })
      .select()
      .single();

    if (transactionError) {
      throw new Error(`Database operation failed: ${transactionError.message}`);
    }

    if (!data) {
      throw new Error('No data returned from database');
    }

    // Only update balances if the transaction is approved
    if (transaction.status === 'approved') {
      if (transaction.transferType === 'p2p_transfer') {
        // Use the transfer_money function for P2P transfers
        const { error: transferError } = await supabase
          .rpc('transfer_money', {
            p_sender_id: user_id,
            p_recipient_id: recipient_id,
            p_amount: transaction.amount
          });

        if (transferError) {
          throw new Error(`Transfer failed: ${transferError.message}`);
        }
      } else {
        // Regular payment - deduct from sender only if approved
        const { error: balanceUpdateError } = await supabase
          .from('users')
          .update({ balance: userData.balance - transaction.amount })
          .eq('id', user_id);

        if (balanceUpdateError) {
          throw new Error(`Failed to update balance: ${balanceUpdateError.message}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        transaction: {
          id: data.id,
          amount: data.amount,
          merchant: data.merchant,
          created_at: data.created_at,
          status: data.status
        },
        risk_assessment: {
          score: riskScore,
          is_fraudulent: isFraudulent,
          risk_level: riskScore <= 0.3 ? 'low' : riskScore <= 0.6 ? 'medium' : 'high',
          flagged: isFraudulent
        }
      }),
      { 
        status: 200, 
        headers: corsHeaders 
      }
    );

  } catch (error) {
    console.error('Process transaction error:', error);
    
    const status = error.message.includes('not allowed') ? 405 :
                   error.message.includes('required') ? 400 :
                   error.message.includes('invalid') ? 400 : 500;
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        status, 
        headers: corsHeaders 
      }
    );
  }
});