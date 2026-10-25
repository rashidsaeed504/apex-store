import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  CheckCircle,
  Truck,
  Eye,
  Layers,
  Archive,
  FolderTree
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchDashboardStats, updateOrderStatus } from '../../services/api.js';
import { formatPrice } from '../../utils/helpers.js';
import { useToast } from '../../context/ToastContext.jsx';
import DashboardUnreadNotifications from '../../components/admin/DashboardUnreadNotifications';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success } = useToast();

  const loadDashboard = async () => {
    setLoading(true);
    const data = await fetchDashboardStats();
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleQuickStatusChange = async (order, newStatus) => {
    await updateOrderStatus(order?.id, newStatus, order?.order_number);
    success(`Order ${order?.order_number || `#${order?.id}`} status updated to ${newStatus}`);
    loadDashboard();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-apex-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatPrice(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      subtitle: `${stats?.totalOrders || 0} lifetime orders`,
    },
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      subtitle: `${stats?.activeProducts || 0} active / ${stats?.inactiveProducts || 0} inactive`,
    },
    {
      title: 'CMS Categories',
      value: stats?.totalCategories || 0,
      icon: FolderTree,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      subtitle: `${stats?.totalSubcategories || 0} subcategories active`,
    },
    {
      title: 'Low / Out of Stock',
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      subtitle: `${stats?.outOfStockCount || 0} completely out of stock`,
    },
  ];

  const statusBreakdown = [
    { label: 'Pending', count: stats?.pendingOrders || 0, color: 'text-amber-400 border-amber-500/20 bg-amber-500/10' },
    { label: 'Processing', count: stats?.processingOrders || 0, color: 'text-purple-400 border-purple-500/20 bg-purple-500/10' },
    { label: 'Shipped', count: stats?.shippedOrders || 0, color: 'text-blue-400 border-blue-500/20 bg-blue-500/10' },
    { label: 'Delivered', count: stats?.deliveredOrders || 0, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
    { label: 'Cancelled', count: stats?.cancelledOrders || 0, color: 'text-red-400 border-red-500/20 bg-red-500/10' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 0. Notifications Section: UNREAD Activity & Alerts */}
      <DashboardUnreadNotifications />

      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
          Dashboard <span className="text-apex-red">Overview</span>
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Real-time Supabase analytics, inventory monitoring, and CMS statistics.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-xl border ${card.bg} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-lg ${card.bg}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-white">{card.value}</h3>
                <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Order Status Breakdown Bar */}
      <div className="bg-[#111] border border-white/5 rounded-xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
          Fulfillment Status Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {statusBreakdown.map((item) => (
            <div key={item.label} className={`p-4 rounded-xl border ${item.color} text-center`}>
              <div className="text-xl sm:text-2xl font-black text-white">{item.count}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders & Low Stock Quick Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-[#111] border border-white/5 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold uppercase tracking-wider text-white">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-apex-red hover:underline font-bold flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!stats?.recentOrders || stats.recentOrders.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-6 text-center">No orders recorded yet.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between text-xs text-gray-300">
                  <div>
                    <span className="font-mono font-bold text-white">{order.order_number}</span>
                    <span className="ml-3 font-medium text-gray-400">{order.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-apex-red">{formatPrice(order.total)}</span>
                    <select
                      value={order.status}
                      onChange={(e) => handleQuickStatusChange(order, e.target.value)}
                      className="bg-[#1a1a1a] border border-white/10 text-[11px] font-bold text-white rounded px-2 py-1 outline-none focus:border-apex-red"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alert Panel */}
        <div className="bg-[#111] border border-white/5 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold uppercase tracking-wider text-white">Stock Warnings</h3>
            <Link to="/admin/products" className="text-xs text-apex-red hover:underline font-bold flex items-center gap-1">
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!stats?.lowStockProducts || stats.lowStockProducts.length === 0 ? (
            <p className="text-xs text-emerald-400 font-semibold py-6 text-center">
              ✓ All inventory items are well-stocked!
            </p>
          ) : (
            <div className="space-y-3">
              {stats.lowStockProducts.slice(0, 5).map((p) => (
                <div key={p.id} className="p-3 bg-[#181818] border border-white/5 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-bold text-white truncate max-w-[140px]">{p.name}</span>
                  <span className="text-amber-400 font-mono font-bold">{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
