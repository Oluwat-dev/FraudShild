import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import * as tf from 'npm:@tensorflow/tfjs@4.17.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function fetchAndPreprocessData() {
  const response = await fetch('https://raw.githubusercontent.com/Shabopp/FraudDetectionUsingGAN/refs/heads/main/AI_model_Py_Scripts/fraud_dataset_Generator_using_numpy.csv');
  const text = await response.text();
  
  // Parse CSV
  const rows = text.split('\n').slice(1); // Skip header
  const data = rows.map(row => row.split(',').map(Number));
  
  // Convert to tensors
  const features = data.map(row => row.slice(0, -1)); // All columns except last
  const labels = data.map(row => row[row.length - 1]); // Last column
  
  return {
    features: tf.tensor2d(features),
    labels: tf.tensor2d(labels, [labels.length, 1])
  };
}

async function trainModel(features: tf.Tensor, labels: tf.Tensor) {
  const model = tf.sequential();
  
  // Input layer
  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    inputShape: [features.shape[1]]
  }));
  
  // Hidden layers
  model.add(tf.layers.dropout(0.2));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dropout(0.2));
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  
  // Output layer
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });
  
  // Train the model
  await model.fit(features, labels, {
    epochs: 10,
    batchSize: 32,
    validationSplit: 0.2,
    shuffle: true
  });
  
  return model;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('Fetching and preprocessing data...');
    const { features, labels } = await fetchAndPreprocessData();
    
    console.log('Training model...');
    const model = await trainModel(features, labels);
    
    // Get model evaluation metrics
    const evaluation = await model.evaluate(features, labels);
    const metrics = {
      loss: (evaluation[0] as tf.Scalar).dataSync()[0],
      accuracy: (evaluation[1] as tf.Scalar).dataSync()[0]
    };
    
    // Clean up tensors
    features.dispose();
    labels.dispose();
    model.dispose();
    
    return new Response(
      JSON.stringify({
        message: 'Model trained successfully',
        metrics
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Training error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});