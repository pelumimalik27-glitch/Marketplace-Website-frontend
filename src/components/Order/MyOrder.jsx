import { useOrder } from "../contexts/OrderContext";
import { formatNaira } from "../../lib/currency";

export default function MyOrders() {
  const { orders } = useOrder();

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">No orders yet</p>
        <p className="text-gray-500 mt-2">When you place an order, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">My Orders</h2>
      {orders?.map((order) => (
        <div
          key={order.id}
          className="border rounded-lg p-5 bg-white shadow-sm hover:shadow transition-shadow"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-bold text-lg">Order #{order.id}</p>
              <p className="text-sm text-gray-500">{order.date}</p>
            </div>
            <p className="text-xl font-bold">{formatNaira(order.total)}</p>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="font-medium">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                order.status === "Delivered" ? "bg-green-100 text-green-800" :
                order.status === "Processing" ? "bg-yellow-100 text-yellow-800" :
                "bg-gray-100 text-gray-800"
              }`}
            >
              {order.status}
            </span>
          </div>

          <p className="text-sm text-gray-600">
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
