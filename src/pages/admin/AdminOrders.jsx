import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Search, 
  Eye, 
  X, 
  Clock, 
  CheckCircle, 
  Truck, 
  Package, 
  XCircle 
} from 'lucide-react';
import { fetchAdminOrders, updateOrderStatus } from '../../services/api';
import { formatPrice } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { success } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    const data = await fetchAdminOrders();
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (order, newStatus) => {
    await updateOrderStatus(order?.id, newStatus, order?.order_number);
    success(`Order ${order?.order_number || `#${order?.id}`} status updated to "${newStatus}"`);
    if (selectedOrder && (selectedOrder.id === order?.id || selectedOrder.order_number === order?.order_number)) {
      setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
    }
    loadOrders();
  };

  const filteredOrders = (orders || []).filter((o) => {
    const q = (searchQuery || '').trim().toLowerCase();
    const orderNum = String(o?.order_number || o?.id || '').toLowerCase();
    const custName = String(o?.customer_name || '').toLowerCase();
    const custEmail = String(o?.customer_email || '').toLowerCase();
    const custPhone = String(o?.customer_phone || '').toLowerCase();
    const city = String(o?.city || '').toLowerCase();

    const matchesSearch = !q || 
      orderNum.includes(q) ||
      custName.includes(q) ||
      custEmail.includes(q) ||
      custPhone.includes(q) ||
      city.includes(q);

    const matchesStatus = statusFilter === 'All' || 
      String(o?.status || 'Pending').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const statusTabs = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const getOrderItems = (order) => {
    if (!order) return [];
    if (Array.isArray(order.items)) return order.items;
    if (typeof order.items === 'string') {
      try { return JSON.parse(order.items); } catch (e) { return []; }
    }
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
          Order <span className="text-apex-red">Management</span>
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Track incoming purchases, review items, and update delivery status live.
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                statusFilter === tab
                  ? 'bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                  : 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search order # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-apex-red outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-apex-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-400">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No orders match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#1a1a1a] text-xs uppercase tracking-wider text-gray-400 border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-6">Order ID</th>
                  <th className="py-3.5 px-6">Customer Info</th>
                  <th className="py-3.5 px-6">Destination</th>
                  <th className="py-3.5 px-6">Payment</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => (
                  <tr key={order.id || order.order_number} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-white">
                      {order.order_number || `#${order.id}`}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-white">{order.customer_name || 'Guest Customer'}</div>
                      <div className="text-xs text-gray-500">{order.customer_email || order.customer_phone}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-white font-medium">{order.city || 'Pakistan'}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{order.shipping_address}</div>
                    </td>
                    <td className="py-4 px-6 uppercase text-xs font-semibold text-gray-400">
                      {order.payment_method || 'COD'}
                    </td>
                    <td className="py-4 px-6 font-bold text-apex-red">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={order.status || 'Pending'}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-md border outline-none cursor-pointer transition-colors ${
                          (order.status || 'Pending') === 'Delivered'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : (order.status || 'Pending') === 'Shipped'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : (order.status || 'Pending') === 'Processing'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : (order.status || 'Pending') === 'Cancelled'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setSelectedOrder(null)} className="fixed inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 z-10 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-wider text-white">
                    Order {selectedOrder.order_number || `#${selectedOrder.id}`}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Placed on {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'Recently'}
                  </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-[#1a1a1a] rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-apex-red mb-2">
                    Customer Information
                  </h4>
                  <p className="font-bold text-white text-sm">{selectedOrder.customer_name || 'Guest'}</p>
                  <p className="text-xs text-gray-400">{selectedOrder.customer_email || 'No email provided'}</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedOrder.customer_phone || 'No phone provided'}</p>
                </div>

                <div className="p-4 bg-[#1a1a1a] rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-apex-red mb-2">
                    Shipping Address
                  </h4>
                  <p className="text-xs text-white leading-relaxed">{selectedOrder.shipping_address || 'Standard Delivery'}</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedOrder.city || 'Pakistan'}{selectedOrder.postal_code ? `, ${selectedOrder.postal_code}` : ''}</p>
                </div>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Order Line Items
              </h4>
              <div className="divide-y divide-white/5 border border-white/5 rounded-xl bg-[#1a1a1a] overflow-hidden mb-6">
                {getOrderItems(selectedOrder).length > 0 ? (
                  getOrderItems(selectedOrder).map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-bold text-white">{item.name || item.product_name || 'APEX Item'}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                      <p className="font-bold text-apex-red">
                        {formatPrice((item.price || 0) * (item.quantity || 1))}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 flex items-center justify-between text-sm">
                    <p className="font-bold text-white">Standard Order Package</p>
                    <p className="font-bold text-apex-red">{formatPrice(selectedOrder.total)}</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#1a1a1a] rounded-xl border border-white/5 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal || selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Shipping</span>
                  <span>{selectedOrder.shipping === 0 ? 'FREE' : formatPrice(selectedOrder.shipping || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-white text-base pt-2 border-t border-white/10">
                  <span>Total Amount</span>
                  <span className="text-apex-red">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
