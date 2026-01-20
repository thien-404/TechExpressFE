import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], // Array of cart items
  // Each item structure:
  // {
  //   id: productDetailId (variant ID),
  //   productId: product.id,
  //   name: product.name,
  //   price: product.price,
  //   image: product.thumbnail,
  //   color: selectedColor,
  //   size: selectedSize,
  //   quantity: number,
  //   stock: available stock
  // }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /**
     * Add item to cart
     * Matches by ProductDetail ID (variant: size + color combination)
     */
    addToCart: (state, action) => {
      const product = action.payload;
      console.log('Adding to cart:', product);
      
      // Validate required fields
      if (!product.id || !product.name || product.price === undefined) {
        console.error('Invalid product data:', product);
        return;
      }

      // Find existing item by ProductDetail ID (id = productDetailId)
      const existing = state.items.find((item) => item.id === product.id);

      if (existing) {
        // Check stock limit
        const newQuantity = existing.quantity + (product.quantity || 1);
        const maxStock = product.stock || existing.stock || 999;
        
        if (newQuantity <= maxStock) {
          existing.quantity = newQuantity;
        } else {
          // Don't add more than stock allows
          existing.quantity = maxStock;
          console.warn(`Cannot add more. Max stock: ${maxStock}`);
        }
      } else {
        // Add new item
        state.items.push({
          id: product.id,                           // ProductDetail ID
          productId: product.productId,             // Parent Product ID
          name: product.name,
          price: product.price,
          image: product.image || product.thumbnail,
          color: product.color || '',
          size: product.size || '',
          quantity: product.quantity || 1,
          stock: product.stock || 999
        });
      }
    },

    /**
     * Remove item from cart by index
     */
    removeFromCart: (state, action) => {
      const index = action.payload;
      if (index >= 0 && index < state.items.length) {
        state.items.splice(index, 1);
      }
    },

    /**
     * Remove item from cart by ProductDetail ID
     */
    removeFromCartById: (state, action) => {
      const productDetailId = action.payload;
      state.items = state.items.filter((item) => item.id !== productDetailId);
    },

    /**
     * Update quantity by index
     */
    updateQuantity: (state, action) => {
      const { index, quantity } = action.payload;
      
      if (index >= 0 && index < state.items.length) {
        const item = state.items[index];
        const maxStock = item.stock || 999;
        
        if (quantity > 0 && quantity <= maxStock) {
          item.quantity = quantity;
        } else if (quantity > maxStock) {
          item.quantity = maxStock;
          console.warn(`Quantity limited to stock: ${maxStock}`);
        } else if (quantity <= 0) {
          // Remove item if quantity is 0
          state.items.splice(index, 1);
        }
      }
    },

    /**
     * Update quantity by ProductDetail ID
     */
    updateQuantityById: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((item) => item.id === id);
      
      if (item) {
        const maxStock = item.stock || 999;
        
        if (quantity > 0 && quantity <= maxStock) {
          item.quantity = quantity;
        } else if (quantity > maxStock) {
          item.quantity = maxStock;
          console.warn(`Quantity limited to stock: ${maxStock}`);
        } else if (quantity <= 0) {
          // Remove item if quantity is 0
          state.items = state.items.filter((i) => i.id !== id);
        }
      }
    },

    /**
     * Increment quantity
     */
    incrementQuantity: (state, action) => {
      const index = action.payload;
      
      if (index >= 0 && index < state.items.length) {
        const item = state.items[index];
        const maxStock = item.stock || 999;
        
        if (item.quantity < maxStock) {
          item.quantity += 1;
        }
      }
    },

    /**
     * Decrement quantity
     */
    decrementQuantity: (state, action) => {
      const index = action.payload;
      
      if (index >= 0 && index < state.items.length) {
        const item = state.items[index];
        
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          // Remove item if quantity becomes 0
          state.items.splice(index, 1);
        }
      }
    },

    /**
     * Clear entire cart
     */
    clearCart: (state) => {
      state.items = [];
    },

    /**
     * Update stock for an item (after fetching latest data)
     */
    updateStock: (state, action) => {
      const { id, stock } = action.payload;
      const item = state.items.find((item) => item.id === id);
      
      if (item) {
        item.stock = stock;
        // Adjust quantity if it exceeds new stock
        if (item.quantity > stock) {
          item.quantity = stock;
        }
      }
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  removeFromCartById,
  updateQuantity,
  updateQuantityById,
  incrementQuantity,
  decrementQuantity,
  clearCart,
  updateStock,
} = cartSlice.actions;

export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartItemCount = (state) => 
  state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartTotal = (state) =>
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);