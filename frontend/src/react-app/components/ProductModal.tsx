import { useState, useEffect } from "react";
import { X, Upload, Check } from "lucide-react";
import type { Product } from "@/shared/types";

interface ProductModalProps {
  product?: Product;
  onClose: () => void;
  onSave: () => void;
}

const FOOTWEAR_SIZES = ['39', '40', '41', '42', '43', '44', '45', '46'];
const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const ACCESSORY_SIZES = ['One Size'];

export default function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Footwear");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // First variant fields (with color-specific sizes)
  const [variantColor, setVariantColor] = useState("");
  const [variantSizes, setVariantSizes] = useState<string[]>([]);
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("10");

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setCategory(product.category);
      setImageUrl(product.image_url || "");
      setImagePreview(product.image_url || "");
      setIsActive(product.is_active);
    }
  }, [product]);

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

  const getSizeOptions = () => {
    switch (category) {
      case 'Footwear':
        return FOOTWEAR_SIZES;
      case 'Apparel':
        return APPAREL_SIZES;
      default:
        return ACCESSORY_SIZES;
    }
  };

  const toggleVariantSize = (size: string) => {
    setVariantSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) {
      // For new products, require variant fields
      if (!variantColor.trim()) {
        alert("Please enter a color for the first variant");
        return;
      }
      if (variantSizes.length === 0) {
        alert("Please select at least one size for this variant");
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
      if (!imageFile) {
        alert("Please upload an image for the first variant");
        return;
      }
    }

    setLoading(true);

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.url;
      }

      const data = {
        name,
        description,
        category,
        image_url: finalImageUrl,
        is_active: isActive,
        // First variant data (only for new products)
        ...(!product && {
          first_variant: {
            color: variantColor,
            cost_price: parseFloat(costPrice),
            selling_price: parseFloat(sellingPrice),
            stock_quantity: parseInt(stockQuantity) || 10,
            image_url: finalImageUrl,
            available_sizes: JSON.stringify(variantSizes),
          }
        })
      };

      if (product) {
        await fetch(`${API_BASE}/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await fetch(`${API_BASE}/api/admin/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      onSave();
      onClose();
    } catch (error) {
      alert("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-green-500/20">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-500 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {product ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">Product Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setVariantSizes([]); // Reset selected sizes when category changes
              }}
              className="input-field w-full"
              required
            >
              <option value="Footwear">Footwear</option>
              <option value="Apparel">Apparel</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Select Available Sizes <span className="text-red-400">*</span>
            </label>
            <p className="text-gray-400 text-sm mb-3">
              Choose which sizes this variant will be available in
            </p>
            <div className="bg-gradient-to-r from-green-900/20 to-gray-800 rounded-lg p-4 border border-green-500/20">
              <div className="flex flex-wrap gap-2">
                {getSizeOptions().map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleVariantSize(size)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      variantSizes.includes(size)
                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {variantSizes.includes(size) && <Check size={16} />}
                    {size}
                  </button>
                ))}
              </div>
              {variantSizes.length === 0 && (
                <p className="text-yellow-400 text-sm mt-3">⚠ Please select at least one size</p>
              )}
            </div>
          </div>

          {!product && (
            <>
              <div className="bg-gradient-to-r from-green-900/30 to-gray-800 rounded-lg p-4 border border-green-500/30">
                <h3 className="text-white font-semibold mb-3">First Variant Details</h3>
                <p className="text-gray-400 text-sm mb-4">
                  When creating a product, you must add the first color variant. More variants can be added later.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Color <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={variantColor}
                      onChange={(e) => setVariantColor(e.target.value)}
                      placeholder="e.g., Black, White, Red"
                      className="input-field w-full"
                      required={!product}
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
                        required={!product}
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
                        required={!product}
                      />
                      <p className="text-gray-500 text-xs mt-1">Visible to customers</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Initial Stock Quantity <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      placeholder="10"
                      className="input-field w-full"
                      required={!product}
                    />
                    <p className="text-gray-500 text-xs mt-1">How many items to stock for this variant</p>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Variant Image <span className="text-red-400">*</span>
                    </label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                        required={!product}
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg cursor-pointer transition-all border border-gray-700 hover:border-green-500"
                      >
                        <Upload size={20} />
                        {imageFile ? imageFile.name : "Choose Image"}
                      </label>
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {product && (
            <div>
              <label className="block text-white font-medium mb-2">Product Image</label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg cursor-pointer transition-all border border-gray-700 hover:border-green-500"
                >
                  <Upload size={20} />
                  {imageFile ? imageFile.name : "Change Image"}
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-white font-medium">
              Active (visible to customers)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || variantSizes.length === 0}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg shadow-green-500/30 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : product ? "Update Product" : "Add Product"}
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
