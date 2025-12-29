import { useState, useEffect } from "react";
import { X, Upload, Check } from "lucide-react";
import type { Product } from "@/shared/types";

interface VariantModalProps {
  product: Product;
  onClose: () => void;
  onSave: () => void;
}

export default function VariantModal({ product, onClose, onSave }: VariantModalProps) {
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [color, setColor] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState(10);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  useEffect(() => {
    if (product.available_sizes) {
      try {
        const sizes = JSON.parse(product.available_sizes);
        setAvailableSizes(sizes);
      } catch {
        setAvailableSizes([]);
      }
    }
  }, [product]);

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSizes.length === 0) {
      alert("Please select at least one size for this variant");
      return;
    }

    if (!imageFile) {
      alert("Please upload an image for this color variant");
      return;
    }

    if (!costPrice || parseFloat(costPrice) <= 0) {
      alert("Please enter a valid cost price");
      return;
    }

    if (!sellingPrice || parseFloat(sellingPrice) <= 0) {
      alert("Please enter a valid selling price");
      return;
    }
    
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadRes = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      const variantImageUrl = uploadData.url;

      const data = {
        product_id: product.id,
        color,
        cost_price: parseFloat(costPrice),
        selling_price: parseFloat(sellingPrice),
        stock_quantity: stockQuantity,
        image_url: variantImageUrl,
        available_sizes: JSON.stringify(selectedSizes),
      };

      await fetch(`${API_BASE}/api/admin/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      onSave();
      onClose();
    } catch (error) {
      alert("Failed to add variant");
    } finally {
      setLoading(false);
    }
  };

  if (availableSizes.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-lg max-w-md w-full shadow-2xl border border-red-500/20">
          <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">No Sizes Available</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-6">
            <p className="text-white mb-4">
              This product has no sizes configured. Please edit the product and select available sizes first.
            </p>
            <button
              onClick={onClose}
              className="btn-secondary w-full"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-green-500/20">
        <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Add New Variant</h2>
            <p className="text-green-100 text-sm">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-green-900/20 to-gray-800 rounded-lg p-4 border border-green-500/20">
            <p className="text-gray-300 text-sm">
              Add a new color variant for this product. Select which sizes it will be available in, 
              specify the color, pricing, and upload an image showing this specific color.
            </p>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Select Sizes for This Variant <span className="text-red-400">*</span>
            </label>
            <p className="text-gray-400 text-sm mb-3">
              Choose which sizes this color will be available in
            </p>
            <div className="bg-gradient-to-r from-green-900/20 to-gray-800 rounded-lg p-4 border border-green-500/20">
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      selectedSizes.includes(size)
                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {selectedSizes.includes(size) && <Check size={16} />}
                    {size}
                  </button>
                ))}
              </div>
              {selectedSizes.length === 0 && (
                <p className="text-yellow-400 text-sm mt-3">⚠ Please select at least one size</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Color <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g., Black, White, Red, Blue"
              className="input-field w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">
                Cost Price <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="input-field w-full"
                required
              />
              <p className="text-gray-500 text-xs mt-1">Only visible to admin</p>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Selling Price <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="input-field w-full"
                required
              />
              <p className="text-gray-500 text-xs mt-1">Visible to customers</p>
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Stock Quantity</label>
            <input
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(parseInt(e.target.value))}
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Color-Specific Image <span className="text-red-400">*</span>
            </label>
            <p className="text-gray-400 text-xs mb-2">
              Upload an image showing the product in this specific color
            </p>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="variant-image-upload"
                required
              />
              <label
                htmlFor="variant-image-upload"
                className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg cursor-pointer transition-all border border-gray-700 hover:border-green-500"
              >
                <Upload size={20} />
                {imageFile ? imageFile.name : "Choose Image for this Color"}
              </label>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-green-500/30"
                />
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || selectedSizes.length === 0}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg shadow-green-500/30 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Variant"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
