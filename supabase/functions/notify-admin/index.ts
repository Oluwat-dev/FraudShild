import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Resend } from 'npm:resend@3.2.0';

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
    // Initialize Resend with API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Email service is not properly configured' }),
        { 
          status: 500,
          headers: corsHeaders 
        }
      );
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }

    const { transactionId, userId, amount, merchant, disputeReason } = requestData;

    // Validate required parameters
    if (!userId) {
      console.error('Missing userId in request');
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }

    if (!transactionId || !amount || !merchant) {
      console.error('Missing transaction details:', { transactionId, amount, merchant });
      return new Response(
        JSON.stringify({ error: 'Missing required transaction details' }),
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Database configuration error' }),
        { 
          status: 500,
          headers: corsHeaders 
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get user details from auth.users table
    const { data: userData, error: userError } = await supabaseAdmin
      .auth
      .admin
      .getUserById(userId);

    if (userError) {
      console.error('User lookup error:', userError);
      return new Response(
        JSON.stringify({ 
          error: 'Unable to find user details',
          details: userError.message
        }),
        { 
          status: 404,
          headers: corsHeaders 
        }
      );
    }

    if (!userData) {
      console.error('User not found:', userId);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404,
          headers: corsHeaders 
        }
      );
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey);

    // Send email
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'FraudShield <disputes@resend.dev>',
        to: 'Alukooluwatobiloba81@gmail.com',
        subject: 'Transaction Dispute Alert',
        html: `
          <h2>Transaction Dispute Notification</h2>
          <p>A transaction has been disputed by a user.</p>
          <h3>Details:</h3>
          <ul>
            <li>Transaction ID: ${transactionId}</li>
            <li>User Email: ${userData.email}</li>
            <li>Amount: £${amount}</li>
            <li>Merchant: ${merchant}</li>
            ${disputeReason ? `<li>Dispute Reason: ${disputeReason}</li>` : ''}
          </ul>
          <p>Please review this transaction in the admin dashboard.</p>
        `
      });

      if (emailError) {
        console.error('Email sending error:', emailError);
        // Continue execution even if email fails
      } else {
        console.log('Email sent successfully:', emailData);
      }
    } catch (emailError) {
      console.error('Resend API error:', emailError);
      // Continue execution even if email fails
    }

    // Update transaction status to flagged instead of disputed
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ 
        status: 'flagged',
        dispute_reason: disputeReason || null
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('Transaction update error:', updateError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update transaction status',
          details: updateError.message
        }),
        { 
          status: 500,
          headers: corsHeaders 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'Dispute recorded successfully',
        userId: userData.id 
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while processing the dispute',
        details: error.message 
      }),
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
});