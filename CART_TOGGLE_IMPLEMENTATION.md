# Cart Toggle Implementation

## Overview
The cart has been updated to support toggled Workers Booking and Events Booking sections as requested.

## Features Implemented

### 1. Toggle UI
- **Two toggle buttons**: "Workers Booking" and "Events Booking"
- **Default active**: Workers Booking section
- **Item counts**: Shows number of items in each section
- **New item badges**: Shows a pulsing dot when items are added to the inactive section

### 2. Separate Booking Sections

#### Workers Booking Section
- **Fields shown**: Location, Date, Service Time
- **Items**: Worker services with delete functionality
- **Service Time**: Required for workers booking (time slot selection)

#### Events Booking Section  
- **Fields shown**: Location, Date (no Service Time required)
- **Items**: Event tickets with quantity controls
- **Quantity controls**: Plus/minus buttons with availability limits

### 3. Shared Areas
- **Promotion section**: Common for both booking types
- **Order Totals**: Aggregates both workers and events bookings
- **Payment button**: Processes combined cart

### 4. Data Management
- **CartContext**: Updated with reducer pattern for better state management
- **Actions**: ADD_WORKER, ADD_EVENT, REMOVE_ITEM, UPDATE_ITEM, SET_ACTIVE_SECTION, CLEAR_CART
- **State structure**: 
  ```javascript
  {
    workersBookings: [],
    eventsBookings: [],
    activeSection: 'workers', // 'workers' or 'events'
    notification: { show: false, message: '', type: '' }
  }
  ```

### 5. UX Enhancements
- **Toast notifications**: Success/error messages when items are added
- **Keyboard accessible**: Toggle buttons support keyboard navigation
- **Non-intrusive updates**: Cart counts update without forcing section switch
- **Validation**: Different validation rules for workers vs events booking

## Usage

### Adding Workers
```javascript
// From WorkerDetails component
const handleBookNow = () => {
  addToCart(workerData); // Automatically goes to workersBookings
};
```

### Adding Events
```javascript
// From ticket list components
const handleAddToCart = (ticket) => {
  addTicketToCart(ticket); // Automatically goes to eventsBookings
};
```

### Switching Sections
```javascript
// Toggle between sections
setActiveSection('workers'); // or 'events'
```

## Validation Rules

### Workers Booking
- Location: Required
- Date: Required  
- Service Time: Required (time slots must be selected)

### Events Booking
- Location: Required
- Date: Required
- Service Time: Not required

## Styling
- **Toggle buttons**: Segmented control design with active states
- **Item counts**: Blue badges showing number of items
- **New item indicators**: Pulsing red dots for inactive sections
- **Section info**: Helper text showing required fields
- **Toast notifications**: Slide-in animations with auto-hide

## Files Modified
1. `CartContext.jsx` - Updated with reducer pattern and separate booking arrays
2. `Cart.jsx` - Added toggle UI and section-specific rendering
3. `Cart.css` - Added styles for toggle functionality and notifications
4. `WorkerDetails.jsx` - Removed alert, uses notification system

## Backward Compatibility
- Legacy `cartItems` getter maintained for existing code
- Existing add functions work unchanged
- All existing cart functionality preserved