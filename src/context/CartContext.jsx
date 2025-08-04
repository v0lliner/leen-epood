import { createContext, useContext, useReducer } from 'react';

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
    const existingItem = state.items.find(item => item.id === product.id);
    if (existingItem) {
      return;
    }

    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const removeItem = async (productId) => {
    const cartItem = state.items.find(item => item.id === productId);
    if (!cartItem) return;

    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const clearCart = async () => {
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
