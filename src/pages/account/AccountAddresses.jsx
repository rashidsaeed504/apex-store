import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Edit2, Trash2, CheckCircle2, Star, X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AccountAddresses() {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth();
  const { success, error: toastError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    fullName: '',
    phone: '',
    address: '',
    city: 'Lahore',
    province: 'Punjab',
    postalCode: '54000',
    country: 'Pakistan',
    isDefault: false,
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    document.title = "Manage Addresses | APEX Store";
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      ...initialForm,
      isDefault: addresses.length === 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingId(addr.id);
    setFormData({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      address: addr.address || '',
      city: addr.city || 'Lahore',
      province: addr.province || 'Punjab',
      postalCode: addr.postalCode || '54000',
      country: addr.country || 'Pakistan',
      isDefault: Boolean(addr.isDefault),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      toastError('Please fill in all required address fields.');
      return;
    }

    if (editingId) {
      updateAddress(editingId, formData);
      success('Address updated successfully!');
    } else {
      addAddress(formData);
      success('New address added successfully!');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this address?')) {
      deleteAddress(id);
      success('Address removed.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-apex-red/10 border border-apex-red/20 text-apex-red flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-white leading-tight">
              SAVED <span className="text-apex-red">ADDRESSES</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
              Manage your delivery locations for faster 1-click checkout.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary inline-flex items-center justify-center gap-2 h-10 px-4 sm:px-5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.3)] cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </motion.div>

      {/* Address Cards Grid */}
      {addresses.length === 0 ? (
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-10 text-center">
          <MapPin className="w-10 h-10 text-gray-600 mx-auto mb-2.5" />
          <h3 className="text-sm font-bold uppercase text-white mb-1">No Addresses Saved</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-5">
            Add your residential or work address to automatically fill in shipping details at checkout.
          </p>
          <button
            onClick={handleOpenAdd}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {addresses.map((addr) => (
            <motion.div
              key={addr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-[#0D0D0D] border rounded-2xl p-4 sm:p-5 relative transition-all flex flex-col justify-between ${
                addr.isDefault
                  ? 'border-apex-red/50 shadow-[0_0_25px_rgba(220,38,38,0.15)]'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-bold text-white text-base truncate">
                    {addr.fullName}
                  </span>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 bg-apex-red/15 text-apex-red text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-apex-red/30 shrink-0">
                      <CheckCircle2 size={11} /> Default Address
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-gray-400 mb-6">
                  <p className="text-white font-medium">{addr.phone}</p>
                  <p className="text-gray-300 leading-relaxed">{addr.address}</p>
                  <p>{addr.city}, {addr.province || 'Punjab'} {addr.postalCode}</p>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">{addr.country || 'Pakistan'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5 gap-2">
                {!addr.isDefault ? (
                  <button
                    onClick={() => {
                      setDefaultAddress(addr.id);
                      success('Set as default address.');
                    }}
                    className="text-xs text-gray-400 hover:text-apex-red transition-colors font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5" /> Make Default
                  </button>
                ) : (
                  <span className="text-[11px] text-gray-500 italic">Primary destination</span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                    title="Edit Address"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete Address"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-3xl p-6 sm:p-8 z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-lg font-black uppercase tracking-wider text-white">
                  {editingId ? 'Edit' : 'Add New'} <span className="text-apex-red">Address</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Ahmed Khan"
                      className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0300 1234567"
                      className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    />
                  </div>
                </div>

                {/* Street Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Complete Address *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="House / Flat #, Street, Block, Area, Nearest Landmark"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-apex-red outline-none resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Lahore"
                      className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  {/* Province */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Province / State
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    >
                      <option value="Punjab">Punjab</option>
                      <option value="Sindh">Sindh</option>
                      <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                      <option value="Balochistan">Balochistan</option>
                      <option value="Islamabad Capital Territory">Islamabad</option>
                      <option value="Azad Kashmir">Azad Kashmir</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Postal Code */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="e.g. 54000"
                      className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Pakistan"
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Set as Default Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefaultAddr"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="accent-apex-red w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="isDefaultAddr" className="text-xs text-gray-300 font-semibold cursor-pointer">
                    Set as my primary default delivery address
                  </label>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 bg-white/5 hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingId ? 'Update Address' : 'Save Address'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
