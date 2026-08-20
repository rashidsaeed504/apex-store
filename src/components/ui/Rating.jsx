import React from 'react';
import { Star, StarHalf } from 'lucide-react';

const Rating = ({ rating = 0, reviews, size = 'md' }) => {
  const numericRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const fullStars = Math.floor(numericRating);
  const hasHalfStar = (numericRating % 1) >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));

  const iconSize = size === 'sm' ? 14 : 18;

  return (
    <div className="flex items-center space-x-1.5">
      <div className="flex text-amber-500">
        {Array.from({ length: fullStars }, (_, i) => (
          <Star key={`full-${i}`} size={iconSize} className="fill-current" />
        ))}
        {hasHalfStar && <StarHalf size={iconSize} className="fill-current" />}
        {Array.from({ length: emptyStars }, (_, i) => (
          <Star key={`empty-${i}`} size={iconSize} className="text-gray-600" />
        ))}
      </div>
      {reviews !== undefined && reviews !== null && (
        <span className={`text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          ({reviews})
        </span>
      )}
    </div>
  );
};

export default Rating;
