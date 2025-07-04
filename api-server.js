import express from 'express';
import cors from 'cors';
import paymentMethodsHandler from './server/api/payment-methods.js';
import createPaymentHandler from './server/api/create-payment.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Convert handler functions to Express middleware
const wrapHandler = (handler) => (req, res) => {
  handler(req, res);
};

// Routes
app.get('/api/payment-methods', wrapHandler(paymentMethodsHandler));
app.post('/api/create-payment', wrapHandler(createPaymentHandler));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});