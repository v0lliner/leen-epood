import { createContext, useContext, useReducer } from 'react';
import { productService } from '../utils/supabase/products';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      // Check if item already exists in cart
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        // Item already in cart, don't add again
        return state;
      }
      // Add new item with quantity 1
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }]
      };
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };
    
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = async (product) => {
    // Check if product is already in cart
    const existingItem = state.items.find(item => item.id === product.id);
    if (existingItem) {
      console.log('Product already in cart');
      return;
    }

    // Add to cart first
    dispatch({ type: 'ADD_ITEM', payload: product });

    // Update product availability in database
    try {
      // Remove quantity property before updating database
      const { quantity, ...productData } = product;
      await productService.upsertProduct({
        ...productData,
        available: false
      });
    } catch (error) {
      console.error('Failed to update product availability:', error);
      // If database update fails, remove from cart
      dispatch({ type: 'REMOVE_ITEM', payload: product.id });
    }
  };

  const removeItem = async (productId) => {
    // Find the product in cart
    const cartItem = state.items.find(item => item.id === productId);
    if (!cartItem) return;

    // Remove from cart
    dispatch({ type: 'REMOVE_ITEM', payload: productId });

    // Update product availability in database
    try {
      // Remove quantity property before updating database
      const { quantity, ...productData } = cartItem;
      await productService.upsertProduct({
        ...productData,
        available: true
      });
    } catch (error) {
      console.error('Failed to update product availability:', error);
    }
  };

  const clearCart = async () => {
    // Update all cart items to be available again
    const updatePromises = state.items.map(async (item) => {
      try {
        // Remove quantity property before updating database
        const { quantity, ...productData } = item;
        await productService.upsertProduct({
          ...productData,
          available: true
        });
      } catch (error) {
        console.error('Failed to update product availability for item:', item.id, error);
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    // Clear the cart
    dispatch({ type: 'CLEAR_CART' });
  };

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => {
      const price = parseFloat(item.price.replace('€', ''));
      return total + price; // Each item has quantity 1
    }, 0);
  };

  const getTotalItems = () => {
    return state.items.length; // Each item is unique
  };

  const isInCart = (productId) => {
    return state.items.some(item => item.id === productId);
  };

  return (
    <CartContext.Provider value={{
      items: state.items,
      addItem,
      removeItem,
      clearCart,
      getTotalPrice,
      getTotalItems,
      isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};