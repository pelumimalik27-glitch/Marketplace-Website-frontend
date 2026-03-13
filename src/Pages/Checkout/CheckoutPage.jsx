import React, { useState, useContext } from 'react';
import { CreditCard, Truck, Shield } from 'lucide-react';
import { AppContext } from '../../contexts/AppContext';
import { createOrder } from '../../lib/orderApi';
import { initializePayment } from '../../lib/paymentApi';
import { formatNaira } from '../../lib/currency';

const isObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ''));

function CheckoutPage() {
  const { cart, groupCartBySeller, user } = useContext(AppContext);
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'US'
  });
  
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const sellerGroups = groupCartBySeller();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shipping = Object.values(sellerGroups).reduce((sum, group) => sum + group.shipping, 0);
  const total = subtotal + shipping;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const buyerId = user?.userId || user?._id;
    if (!buyerId) {
      setSubmitError('Please login to continue checkout.');
      return;
    }

    if (paymentMethod !== 'credit_card') {
      setSubmitError('Only card checkout is enabled right now.');
      return;
    }

    const invalidItem = cart.find((item) => !isObjectId(item.id) || !isObjectId(item.sellerId));
    if (invalidItem) {
      setSubmitError('Some cart items cannot be checked out yet. Re-add products from the latest shop list.');
      return;
    }

    try {
      setIsSubmitting(true);

      const items = cart.map((item) => {
        const qty = Math.max(1, Number(item.qty || 1));
        const price = Number(item.price || 0);
        return {
          product: item.id,
          seller: item.sellerId,
          quantity: qty,
          price,
          total: Number((price * qty).toFixed(2)),
        };
      });

      const orderPayload = {
        buyer: buyerId,
        items,
        summary: {
          subtotal: Number(subtotal.toFixed(2)),
          shipping: Number(shipping.toFixed(2)),
          tax: 0,
          discount: 0,
          total: Number(total.toFixed(2)),
        },
        deliveryAddress: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.zipCode}, ${shippingInfo.country}`,
        deliveryPhone: shippingInfo.phone,
        shippingInfo,
      };

      const orderResponse = await createOrder(orderPayload);
      const orderId = orderResponse?.data?._id;
      if (!orderId) {
        throw new Error('Order was not created');
      }

      const paymentResponse = await initializePayment(orderId, '/checkout/verify');
      const authUrl = paymentResponse?.authorization_url;
      if (!authUrl) {
        throw new Error('Failed to start payment');
      }

      window.location.assign(authUrl);
    } catch (error) {
      setSubmitError(error.message || 'Checkout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Information */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-6">
              <Truck size={24} className="text-orange-600" />
              <h2 className="text-xl font-bold">Shipping Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={shippingInfo.fullName}
                  onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={shippingInfo.email}
                  onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Phone *</label>
                <input
                  type="tel"
                  required
                  value={shippingInfo.phone}
                  onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Zip Code *</label>
                <input
                  type="text"
                  required
                  value={shippingInfo.zipCode}
                  onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Address *</label>
                <input
                  type="text"
                  required
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={shippingInfo.city}
                  onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Country *</label>
                <select
                  value={shippingInfo.country}
                  onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="NI">Nigeria</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard size={24} className="text-orange-600" />
              <h2 className="text-xl font-bold">Payment Method</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="credit_card"
                  name="payment"
                  checked={paymentMethod === 'credit_card'}
                  onChange={() => setPaymentMethod('credit_card')}
                  className="text-orange-600"
                />
                <label htmlFor="credit_card" className="font-medium">Credit/Debit Card</label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="paypal"
                  name="payment"
                  checked={paymentMethod === 'paypal'}
                  onChange={() => setPaymentMethod('paypal')}
                  className="text-orange-600"
                />
                <label htmlFor="paypal" className="font-medium">PayPal</label>
              </div>
              
              {/* {paymentMethod === 'credit_card' && (
                <div className="mt-4 p-4 border rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Card Number *</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Name on Card *</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Expiry Date *</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">CVV *</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )} */}
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {/* Seller Groups */}
              {Object.entries(sellerGroups).map(([sellerId, group]) => (
                <div key={sellerId} className="border-b pb-4">
                  <p className="font-medium text-sm text-gray-600">{group.sellerName}</p>
                  {group.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm mt-2">
                      <span>{item.name} × {item.qty}</span>
                      <span>{formatNaira(item.price * item.qty)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm mt-2">
                    <span>Shipping</span>
                    <span>{group.shipping === 0 ? 'FREE' : formatNaira(group.shipping)}</span>
                  </div>
                </div>
              ))}
              
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatNaira(shipping)}</span>
                </div>
                
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-orange-600">{formatNaira(total)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-gray-600 mb-6">
              <Shield size={20} />
              <span>Secure payment & buyer protection</span>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Redirecting to payment...' : 'Pay with Paystack'}
            </button>
            {submitError && (
              <p className="mt-3 text-sm text-red-600">{submitError}</p>
            )}
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              By placing your order, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CheckoutPage;
