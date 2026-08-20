import React from 'react';
import { Minus, Plus } from 'lucide-react';

const QuantitySelector = ({ 
  quantity = 1, 
  onQuantityChange, 
  setQuantity, 
  onChange, 
  min = 1, 
  max = 99, 
  className = '' 
}) => {
  const updateQuantity = (val) => {
    if (typeof onQuantityChange === 'function') {
      onQuantityChange(val);
    } else if (typeof setQuantity === 'function') {
      setQuantity(val);
    } else if (typeof onChange === 'function') {
      onChange(val);
    }
  };

  const handleDecrease = () => {
    if (quantity > min) {
      updateQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      updateQuantity(quantity + 1);
    }
  };

  return (
    <div className={`flex items-center bg-apex-charcoal border border-white/10 rounded-lg overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={quantity <= min}
        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Minus size={16} />
      </button>
      
      <span className="w-10 text-center text-sm font-semibold text-white">
        {quantity}
      </span>
      
      <button
        type="button"
        onClick={handleIncrease}
        disabled={quantity >= max}
        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default QuantitySelector;
