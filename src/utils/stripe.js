import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
// In production, this should be an environment variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RfOoRP1VBbJ3P2LKofFkMPcTOVZcGNIQQdpVnHcKbmiwC7rPvGyvC6jnkQvzfEVjRJLWXWAU5TqLcNMGBE8UXVX00wdHwNLs9');

export default stripePromise;