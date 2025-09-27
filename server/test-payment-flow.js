// Test the complete payment flow without Stripe
const axios = require('axios');

async function testPaymentFlow() {
  console.log('Testing payment flow...');
  
  // Simulate what PaymentSuccess.jsx does
  const mockOrderDetails = {
    location: '123 Test Street, Test City',
    date: '2024-12-25',
    timeSlots: ['10:00 AM - 11:00 AM'],
    cartItems: [
      { name: 'AC Repair Service', price: 150, quantity: 1 }
    ],
    serviceCategory: 'AC Repair',
    subtotal: 150,
    deliveryFee: 35,
    platformFee: 10,
    tax: 25.35,
    total: 220.35,
    promoCode: 'TEST'
  };

  const mockUser = {
    name: 'Test User',
    phone: '+1-555-TEST-123',
    email: 'test@example.com'
  };

  const payload = {
    customer: {
      name: mockUser.name,
      phone: mockUser.phone,
      email: mockUser.email
    },
    location: mockOrderDetails.location,
    date: mockOrderDetails.date,
    timeSlots: mockOrderDetails.timeSlots,
    items: mockOrderDetails.cartItems,
    serviceCategory: mockOrderDetails.serviceCategory,
    subtotal: mockOrderDetails.subtotal,
    deliveryFee: mockOrderDetails.deliveryFee,
    platformFee: mockOrderDetails.platformFee,
    tax: mockOrderDetails.tax,
    total: mockOrderDetails.total,
    promoCode: mockOrderDetails.promoCode
  };

  try {
    const response = await axios.post('http://localhost:5003/api/orders', payload);
    console.log('✅ Order stored successfully:', response.data._id);
    console.log('Customer:', response.data.customer.name);
    console.log('Service:', response.data.serviceCategory);
    console.log('Total: ₹', response.data.total);
  } catch (error) {
    console.error('❌ Order storage failed:', error.response?.data || error.message);
  }
}

testPaymentFlow();