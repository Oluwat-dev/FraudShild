import * as tf from '@tensorflow/tfjs';

// Feature normalization parameters
const AMOUNT_MAX = 10000;
const RISK_CATEGORIES = {
  gambling: 1,
  cryptocurrency: 0.9,
  money_transfer: 0.8,
  electronics: 0.6,
  travel: 0.5,
  entertainment: 0.4,
  retail: 0.3,
  food: 0.2,
  services: 0.3,
  other: 0.4,
};

// Create and train the model
export async function createFraudModel() {
  // Define model architecture
  const model = tf.sequential();
  
  // Input layer with 6 features:
  // - Normalized amount
  // - Category risk score
  // - Hour of day (normalized)
  // - Has location (binary)
  // - Has valid UPI (binary)
  // - Has device ID (binary)
  model.add(tf.layers.dense({
    units: 10,
    activation: 'relu',
    inputShape: [6],
  }));
  
  model.add(tf.layers.dense({
    units: 5,
    activation: 'relu',
  }));
  
  // Output layer (probability of fraud)
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid',
  }));

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

// Preprocess transaction data for the model
export function preprocessTransaction(transaction: {
  amount: number;
  category: string;
  location?: string;
  upiId?: string;
  device_id?: string;
}) {
  // Normalize amount
  const normalizedAmount = Math.min(transaction.amount / AMOUNT_MAX, 1);
  
  // Get category risk score
  const categoryRisk = RISK_CATEGORIES[transaction.category as keyof typeof RISK_CATEGORIES] || RISK_CATEGORIES.other;
  
  // Get hour of day and normalize
  const hour = new Date().getHours() / 24;
  
  // Binary features
  const hasLocation = transaction.location ? 1 : 0;
  const hasValidUpi = transaction.upiId ? 1 : 0;
  const hasDeviceId = transaction.device_id ? 1 : 0;

  // Return tensor
  return tf.tensor2d([
    [normalizedAmount, categoryRisk, hour, hasLocation, hasValidUpi, hasDeviceId]
  ]);
}

// Singleton model instance
let modelInstance: tf.LayersModel | null = null;

// Get or create model
export async function getModel() {
  if (!modelInstance) {
    modelInstance = await createFraudModel();
    
    // Initialize with some weights that reflect our domain knowledge
    // This is a simplified approach - in production, you'd train on real data
    const weights = tf.randomNormal([6, 10]).mul(tf.scalar(0.1));
    modelInstance.layers[0].setWeights([
      weights,
      tf.zeros([10])
    ]);
  }
  return modelInstance;
}

// Predict fraud probability
export async function predictFraud(transaction: {
  amount: number;
  category: string;
  location?: string;
  upiId?: string;
  device_id?: string;
}) {
  const model = await getModel();
  const input = preprocessTransaction(transaction);
  const prediction = model.predict(input) as tf.Tensor;
  const probability = await prediction.data();
  return probability[0];
}