import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const { transactionId, notes } = await req.json();

    if (!transactionId) {
      return new Response(
        JSON.stringify({ 
          error: 'Transaction ID is required' 
        }),
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First check if the transaction exists
    const { data: transactionData, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('id', transactionId)
      .single();

    if (transactionError || !transactionData) {
      console.error('Transaction lookup error:', transactionError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid transaction ID',
          details: transactionError?.message 
        }),
        { 
          status: 404,
          headers: corsHeaders 
        }
      );
    }

    // Create fraud case
    const { data: fraudCase, error: fraudCaseError } = await supabaseAdmin
      .from('fraud_cases')
      .insert({
        transaction_id: transactionId,
        notes,
        status: 'open'
      })
      .select()
      .single();

    if (fraudCaseError) {
      console.error('Fraud case creation error:', fraudCaseError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create fraud case',
          details: fraudCaseError.message 
        }),
        { 
          status: 500,
          headers: corsHeaders 
        }
      );
    }

    // Update transaction status
    const { error: transactionUpdateError } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'flagged' })
      .eq('id', transactionId);

    if (transactionUpdateError) {
      console.error('Transaction update error:', transactionUpdateError);
      // Don't fail the request if status update fails
      // The fraud case was created successfully
    }

    return new Response(
      JSON.stringify({ 
        message: 'Fraud case created successfully',
        fraudCase 
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while creating the fraud case',
        details: error.message 
      }),
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
});