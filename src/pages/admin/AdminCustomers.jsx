import { useState, useEffect } from 'react';
import { Users, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react';
import { fetchOrders } from '../../services/api';
import { formatPrice } from '../../utils/helpers';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      setLoading(true);
      const orders = await fetchOrders();
      
      // Group orders by email
      const customerMap = {};
      orders.forEach((o) => {
        const key = o.customer_email || o.customer_phone;
        if (!customerMap[key]) {
          customerMap[key] = {
            email: o.customer_email,
            name: o.customer_name,
            phone: o.customer_phone,
            city: o.city,
            totalSpent: 0,
            orderCount: 0,
            lastOrderDate: o.created_at,
          };
        }
        if (o.status !== 'Cancelled') {
          customerMap[key].totalSpent += Number(o.total);
        }
        customerMap[key].orderCount += 1;
      });

      setCustomers(Object.values(customerMap));
      setLoading(false);
    }

    loadCustomers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
          Customer <span className="text-apex-red">Directory</span>
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Registered buyer profiles, order history, and lifetime spending.
        </p>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-apex-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-400">Loading customer records...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No customer records found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#1a1a1a] text-xs uppercase tracking-wider text-gray-400 border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Contact Info</th>
                  <th className="py-3.5 px-6">City</th>
                  <th className="py-3.5 px-6">Total Orders</th>
                  <th className="py-3.5 px-6">Lifetime Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-bold text-white">
                      {c.name}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-xs text-gray-300">{c.email}</div>
                      <div className="text-xs text-gray-500">{c.phone}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-400">{c.city}</td>
                    <td className="py-4 px-6 font-bold text-white">{c.orderCount} orders</td>
                    <td className="py-4 px-6 font-bold text-apex-red">
                      {formatPrice(c.totalSpent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
