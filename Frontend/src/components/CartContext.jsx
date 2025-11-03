// CartContext.jsx
import React, { createContext, useReducer } from 'react';

// Create the context
export const CartContext = createContext();

// Action types
const ADD_WORKER = 'ADD_WORKER';
const ADD_EVENT = 'ADD_EVENT';
const REMOVE_ITEM = 'REMOVE_ITEM';
const UPDATE_ITEM = 'UPDATE_ITEM';
const SET_ACTIVE_SECTION = 'SET_ACTIVE_SECTION';
const CLEAR_CART = 'CLEAR_CART';
const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
const HIDE_NOTIFICATION = 'HIDE_NOTIFICATION';

// Initial state
const initialState = {
  workersBookings: [],
  eventsBookings: [],
  activeSection: 'workers', // 'workers' or 'events'
  notification: { show: false, message: '', type: '' }
};

// Reducer function
const cartReducer = (state, action) => {
  switch (action.type) {
    case ADD_WORKER:
      const existingWorkerIndex = state.workersBookings.findIndex(item => item._id === action.payload._id);
      if (existingWorkerIndex >= 0) {
        const updatedWorkers = [...state.workersBookings];
        updatedWorkers[existingWorkerIndex].quantity += 1;
        return { ...state, workersBookings: updatedWorkers };
      } else {
        const formattedWorker = {
          ...action.payload,
          price: parseFloat(action.payload.costPerHour) || 0,
          quantity: 1,
          type: action.payload.workerTypes 
            ? Object.keys(action.payload.workerTypes)
                .filter(key => action.payload.workerTypes[key])
                .join(', ')
            : 'Service Provider'
        };
        return { ...state, workersBookings: [...state.workersBookings, formattedWorker] };
      }
    
    case ADD_EVENT:
      const existingEventIndex = state.eventsBookings.findIndex(item => 
        item._id === action.payload._id && item.itemType === 'ticket');
      
      if (existingEventIndex >= 0) {
        const currentQuantity = state.eventsBookings[existingEventIndex].quantity;
        const availableTickets = action.payload.availableTickets;
        
        if (currentQuantity >= availableTickets) {
          return state; // Don't update if max reached
        }
        
        const updatedEvents = [...state.eventsBookings];
        updatedEvents[existingEventIndex].quantity += 1;
        return { ...state, eventsBookings: updatedEvents };
      } else {
        const formattedTicket = {
          ...action.payload,
          itemType: 'ticket',
          price: parseFloat(action.payload.ticketPrice),
          fees: action.payload.additionalFees ? parseFloat(action.payload.additionalFees) : 0,
          quantity: 1,
          type: 'Event Ticket',
          availableTickets: action.payload.availableTickets
        };
        return { ...state, eventsBookings: [...state.eventsBookings, formattedTicket] };
      }
    
    case REMOVE_ITEM:
      return {
        ...state,
        workersBookings: state.workersBookings.filter(item => item._id !== action.payload),
        eventsBookings: state.eventsBookings.filter(item => item._id !== action.payload)
      };
    
    case UPDATE_ITEM:
      const { itemId, newQuantity } = action.payload;
      if (newQuantity <= 0) {
        return cartReducer(state, { type: REMOVE_ITEM, payload: itemId });
      }
      
      return {
        ...state,
        workersBookings: state.workersBookings.map(item => 
          item._id === itemId ? { ...item, quantity: newQuantity } : item
        ),
        eventsBookings: state.eventsBookings.map(item => {
          if (item._id === itemId) {
            if (item.itemType === 'ticket' && newQuantity > item.availableTickets) {
              return item; // Don't update if exceeding available tickets
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
      };
    
    case SET_ACTIVE_SECTION:
      return { ...state, activeSection: action.payload };
    
    case CLEAR_CART:
      return { ...state, workersBookings: [], eventsBookings: [] };
    
    case SHOW_NOTIFICATION:
      return { ...state, notification: { show: true, message: action.payload.message, type: action.payload.type } };
    
    case HIDE_NOTIFICATION:
      return { ...state, notification: { show: false, message: '', type: '' } };
    
    default:
      return state;
  }
};

// Create a provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Legacy cartItems getter for backward compatibility
  const cartItems = [...state.workersBookings, ...state.eventsBookings];

  // Add a worker to the cart
  const addToCart = (worker) => {
    dispatch({ type: ADD_WORKER, payload: worker });
    showNotification('Worker added to cart', 'success');
  };

  // Add an event ticket to the cart
  const addTicketToCart = (ticket) => {
    try {
      const existingTicket = state.eventsBookings.find(item => 
        item._id === ticket._id && item.itemType === 'ticket');
      
      if (existingTicket && existingTicket.quantity >= ticket.availableTickets) {
        showNotification('Maximum available tickets reached', 'error');
        return false;
      }
      
      dispatch({ type: ADD_EVENT, payload: ticket });
      showNotification('Ticket added successfully to Cart', 'success');
      return true;
    } catch (error) {
      showNotification('Failed to add the ticket', 'error');
      console.error("Error adding ticket to cart:", error);
      return false;
    }
  };

  // Show notification
  const showNotification = (message, type) => {
    dispatch({ type: SHOW_NOTIFICATION, payload: { message, type } });
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      dispatch({ type: HIDE_NOTIFICATION });
    }, 3000);
  };

  // Remove an item from the cart by id
  const removeFromCart = (itemId) => {
    dispatch({ type: REMOVE_ITEM, payload: itemId });
  };

  // Update cart item quantity
  const updateQuantity = (itemId, newQuantity) => {
    const eventItem = state.eventsBookings.find(item => item._id === itemId);
    if (eventItem && eventItem.itemType === 'ticket' && newQuantity > eventItem.availableTickets) {
      showNotification('Maximum available tickets reached', 'error');
      return;
    }
    dispatch({ type: UPDATE_ITEM, payload: { itemId, newQuantity } });
  };

  // Clear all items from the cart
  const clearCart = () => {
    dispatch({ type: CLEAR_CART });
  };

  // Set active section
  const setActiveSection = (section) => {
    dispatch({ type: SET_ACTIVE_SECTION, payload: section });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems, // Legacy support
        workersBookings: state.workersBookings,
        eventsBookings: state.eventsBookings,
        activeSection: state.activeSection,
        addToCart,
        addTicketToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setActiveSection,
        notification: state.notification
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
