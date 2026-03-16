import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { AppContext } from '../../contexts/AppContext';
import { formatNaira } from '../../lib/currency';

function CartPage() {
  const { cart, removeFromCart, updateQuantity, groupCartBySeller } = useContext(AppContext);

  
  const sellerGroups = groupCartBySeller();
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shipping = Object.values(sellerGroups).reduce((sum, group) => sum + group.shipping, 0);
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some products to your cart to proceed to checkout</p>
        <Link
          to="/shoppage"
          className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-medium"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 sm:text-3xl sm:mb-8">
        Shopping Cart ({totalItems} items)
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(sellerGroups).map(([sellerId, group]) => (
            <div key={sellerId} className="bg-white rounded-xl shadow p-4 sm:p-6">
              <div className="flex flex-col gap-2 mb-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-lg">{group.sellerName}</h3>
                  <p className="text-sm text-gray-500">Seller ID: {sellerId}</p>
                </div>
                <span className="text-sm text-gray-500">
                  Shipping: {group.shipping === 0 ? 'FREE' : formatNaira(group.shipping)}
                </span>
              </div>
              
              <div className="space-y-4">
                {group.items.map(item => (
                  <div key={item.id} className="flex flex-col gap-4 p-4 border rounded-lg sm:flex-row sm:items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-40 object-cover rounded sm:w-24 sm:h-24"
                    />
                    
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-gray-500 text-sm">{formatNaira(item.price)} each</p>
                      
                      <div className="flex flex-col gap-3 mt-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex items-center border rounded">
                          <button 
                            onClick={() => updateQuantity(item.id, item.qty - 1)}
                            className="px-3 py-1 hover:bg-gray-100"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-4 py-1 border-x">{item.qty}</span>
                          <button 
                            disabled={Number(item?.inventory?.quantity ?? 0) > 0 && item.qty >= Number(item?.inventory?.quantity ?? 0)}
                            onClick={() => updateQuantity(item.id, item.qty + 1)}
                            className="px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                  
                        <span className="font-bold">{formatNaira(item.price * item.qty)}</span>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 sm:ml-auto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t text-right">
                <span className="text-gray-600">
                  Subtotal ({group.items.reduce((sum, i) => sum + i.qty, 0)} items): 
                  <span className="font-bold ml-2">
                    {formatNaira(group.items.reduce((sum, i) => sum + (i.price * i.qty), 0))}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow p-6 lg:sticky lg:top-24">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-semibold">{formatNaira(subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold">{formatNaira(shipping)}</span>
              </div>
              
              <div className="flex justify-between border-t pt-4">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-orange-600">{formatNaira(total)}</span>
              </div>
            </div>
            
            <Link
              to="/checkout"
              className="block w-full bg-orange-600 text-white text-center py-3 rounded-lg hover:bg-orange-700 font-medium mb-4"
            >
              Proceed to Checkout
            </Link>
            
            <Link
              to="/shoppage"
              className="block w-full border-2 border-orange-600 text-orange-600 text-center py-3 rounded-lg hover:bg-orange-50 font-medium"
            >
              Continue Shopping
            </Link>
            
            <div className="mt-6 pt-6 border-t text-sm text-gray-500">
              <p className="mb-2">Secure checkout</p>
              <p className="mb-2">Buyer protection included</p>
              <p>30-day return policy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
