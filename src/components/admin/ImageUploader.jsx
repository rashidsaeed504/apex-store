import { useState } from 'react';
import { Upload, X, Star, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function ImageUploader({ images = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const { success, error: toastError } = useToast();

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const newImageUrls = [...images];

    for (const file of files) {
      if (isSupabaseConfigured) {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

          if (uploadError) {
            console.warn('Storage upload error:', uploadError.message);
            // Fallback to local object URL preview
            const objectUrl = URL.createObjectURL(file);
            newImageUrls.push(objectUrl);
          } else {
            const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
            if (data?.publicUrl) {
              newImageUrls.push(data.publicUrl);
            }
          }
        } catch (err) {
          console.error('File upload failed:', err);
          const objectUrl = URL.createObjectURL(file);
          newImageUrls.push(objectUrl);
        }
      } else {
        // Local engine preview fallback
        const objectUrl = URL.createObjectURL(file);
        newImageUrls.push(objectUrl);
      }
    }

    onChange(newImageUrls);
    setUploading(false);
    success(`Uploaded ${files.length} image(s)`);
  };

  const handleRemoveImage = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetPrimary = (indexToPrimary) => {
    if (indexToPrimary === 0) return;
    const selected = images[indexToPrimary];
    const remaining = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([selected, ...remaining]);
    success('Primary image updated');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
          Product Images (Upload Multiple)
        </label>
        <span className="text-[11px] text-gray-500">
          First image is set as <span className="text-apex-red font-bold">Primary</span>
        </span>
      </div>

      {/* Upload Drag & Drop Area */}
      <label className={`border-2 border-dashed border-white/10 hover:border-apex-red/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#1a1a1a]/50 ${
        uploading ? 'opacity-50 pointer-events-none' : ''
      }`}>
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-apex-red animate-spin mb-2" />
            <p className="text-xs text-gray-400 font-medium">Uploading to Supabase Storage...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2 group-hover:text-apex-red transition-colors" />
            <p className="text-sm font-semibold text-white">Click or drag images to upload</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP, GIF up to 5MB</p>
          </div>
        )}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </label>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
          {images.map((imgUrl, index) => (
            <div
              key={index}
              className={`relative aspect-square bg-[#f5f5f5] rounded-lg overflow-hidden border group ${
                index === 0 ? 'border-apex-red ring-2 ring-apex-red/30' : 'border-white/10'
              }`}
            >
              <img
                src={imgUrl}
                alt={`Product Preview ${index + 1}`}
                className="w-full h-full object-contain p-1"
              />

              {/* Primary Badge */}
              {index === 0 ? (
                <span className="absolute top-1 left-1 bg-apex-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                  PRIMARY
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(index)}
                  className="absolute top-1 left-1 bg-black/70 hover:bg-apex-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Make Primary"
                >
                  SET PRIMARY
                </button>
              )}

              {/* Remove Image Button */}
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
