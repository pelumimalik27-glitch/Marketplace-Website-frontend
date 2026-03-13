import { createContext, useContext, useState } from "react";
import ps from '/images/ps.jpg';
import iphone from '/images/iphone.jpg';
import shoes from '/images/shoes.jpg';
import lamp from '/images/lamp.jpg';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([
    {
      id: 1001,
      customer: { name: "John Doe", phone: "555-0123", address: "123 Main St" },
      items: [
        { id: 1, name: "PlayStation 3 Slim Console", image: ps, price: 399.99, qty: 1, sellerId: 1 },
        { id: 3, name: "Men's Casual Sneakers", image: shoes, price: 159.99, qty: 2, sellerId: 3 },
      ],
      total: 719.97,
      date: "2025-03-15 14:30",
      status: "Delivered",
      subOrders: [
        {
          sellerId: 1,
          sellerName: "Sony Store",
          status: "Delivered",
          tracking: "TRK123456789",
          items: [{ id: 1, name: "PlayStation 3 Slim Console", price: 399.99, qty: 1 }],
          shipping: 0,
          total: 399.99,
        },
        {
          sellerId: 3,
          sellerName: "Urban Wears",
          status: "Delivered",
          tracking: "TRK987654321",
          items: [{ id: 3, name: "Men's Casual Sneakers", price: 159.99, qty: 2 }],
          shipping: 0,
          total: 319.98,
        },
      ],
    },
    {
      id: 1002,
      customer: { name: "Jane Smith", phone: "555-0456", address: "456 Oak Ave" },
      items: [
        { id: 2, name: "iPhone 13 Pro Max", image: iphone, price: 279.99, qty: 1, sellerId: 2 },
        { id: 5, name: "Modern Table Lamp", image: lamp, price: 259.99, qty: 1, sellerId: 5 },
      ],
      total: 539.98,
      date: "2025-03-18 10:15",
      status: "Processing",
      subOrders: [
        {
          sellerId: 2,
          sellerName: "Apple Store",
          status: "Shipped",
          tracking: "TRK111222333",
          items: [{ id: 2, name: "iPhone 13 Pro Max", price: 279.99, qty: 1 }],
          shipping: 0,
          total: 279.99,
        },
        {
          sellerId: 5,
          sellerName: "HomeGlow",
          status: "Processing",
          tracking: null,
          items: [{ id: 5, name: "Modern Table Lamp", price: 259.99, qty: 1 }],
          shipping: 9.99,
          total: 269.98,
        },
      ],
    },
  ]);

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const updateSubOrderStatus = (orderId, sellerId, newStatus, tracking = null) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedSubOrders = order.subOrders.map(subOrder => 
          subOrder.sellerId === sellerId 
            ? { ...subOrder, status: newStatus, tracking: tracking || subOrder.tracking }
            : subOrder
        );
        return { ...order, subOrders: updatedSubOrders };
      }
      return order;
    }));
  };

  return (
    <OrderContext.Provider value={{ orders, updateOrderStatus, updateSubOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used inside OrderProvider");
  }
  return context;
};