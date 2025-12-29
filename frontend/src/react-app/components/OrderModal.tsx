import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { Product, ProductVariant } from "@/shared/types";

interface OrderModalProps {
  product: Product;
  onClose: () => void;
  onSubmit: (orderData: {
    size: string;
    color: string;
    quantity: number;
    phone_number: string;
    country: string;
    variant_id: number;
  }) => void;
}

const KENYAN_COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Baricho",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kamba",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Muranga",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita Taveta",
  "Tana River",
  "Tharaka Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
];

// Validate Kenyan phone number
const validatePhoneNumber = (phone: string): boolean => {
  // Remove spaces and common formatting
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  
  // Kenyan phone formats: 0712345678, 254712345678, +254712345678
  // Must start with 0 (for local), 254 (for intl code), or +254
  // Must have 10 digits after country code
  const phoneRegex = /^(0|\+?254)[712]\d{7,8}$/;
  
  return phoneRegex.test(cleaned);
};

export default function OrderModal({ product, onClose, onSubmit }: OrderModalProps) {
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [country, setCountry] = useState("Nairobi");
  const [loading, setLoading] = useState(false);
  const [displayImage, setDisplayImage] = useState(product.image_url);

  useEffect(() => {
    fetch(`${API_BASE}/api/products/${product.id}/variants`)
      .then((res) => res.json())
      .then((data: ProductVariant[]) => {
        setVariants(data);
        // Auto-select first color if available
        const colors = [...new Set(data.map((v) => v.color))];
        if (colors.length > 0 && colors[0]) {
          setSelectedColor(colors[0]);
        }
      });
  }, [product.id]);

  useEffect(() => {
    // Update display image when color changes
    if (selectedColor) {
      const variant = variants.find((v) => v.color === selectedColor);
      if (variant?.image_url) {
        setDisplayImage(variant.image_url);
      }
    }
  }, [selectedColor, variants]);

  // Get unique colors from variants
  const availableColors = [...new Set(variants.map((v) => v.color))];

  // Get sizes available for the selected color
  const getAvailableSizes = () => {
    if (!selectedColor) return [];
    const variant = variants.find((v) => v.color === selectedColor);
    if (!variant?.available_sizes) return [];
    try {
      return JSON.parse(variant.available_sizes);
    } catch {
      return [];
    }
  };

  const availableSizes = getAvailableSizes();

  // Get the selected variant
  const getSelectedVariant = () => {
    if (!selectedColor) return null;
    return variants.find((v) => v.color === selectedColor);
  };

  const selectedVariant = getSelectedVariant();
  const sellingPrice = selectedVariant?.selling_price || null;
  const stockQuantity = selectedVariant?.stock_quantity || 0;

  // Calculate max quantity user can order
  const maxQuantity = Math.min(stockQuantity, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (variants.length === 0) {
      alert("This product has no available variants. Please contact the admin.");
      return;
    }
    
    if (!selectedSize || !selectedColor || !phoneNumber || !country || !selectedVariant) {
      alert("Please fill in all fields");
      return;
    }

    if (quantity > stockQuantity) {
      alert(`Only ${stockQuantity} items available in stock. Please contact the admin for more.`);
      return;
    }
    
    setLoading(true);
    onSubmit({
      size: selectedSize,
      color: selectedColor,
      quantity,
      phone_number: phoneNumber,
      country,
      variant_id: selectedVariant.id,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-green-500/20">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-500 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Place Order</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-64 object-cover rounded-lg transition-all duration-300"
            />
            <div className="flex items-start justify-between mt-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{product.name}</h3>
                <p className="text-gray-400 mt-2">{product.description}</p>
              </div>
              {sellingPrice !== null && (
                <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-lg px-4 py-2 ml-4">
                  <p className="text-white font-bold text-xl">${sellingPrice.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          {selectedVariant && stockQuantity < 5 && stockQuantity > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-yellow-400 font-medium">Low Stock Alert</p>
                <p className="text-gray-300 text-sm mt-1">
                  Only {stockQuantity} {stockQuantity === 1 ? 'item' : 'items'} left in stock. 
                  Please contact the admin if you need more.
                </p>
              </div>
            </div>
          )}

          {selectedVariant && stockQuantity === 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4 text-center">
              <p className="text-red-400 font-medium">Out of Stock</p>
              <p className="text-gray-400 text-sm mt-1">This color is currently unavailable. Please contact the admin.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {variants.length === 0 ? (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
                <p className="text-red-400 font-medium">No variants available for this product.</p>
                <p className="text-gray-400 text-sm mt-1">Please contact the admin to add product variants.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-white font-medium mb-2">Color</label>
                  {availableColors.length === 0 ? (
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                      <p className="text-yellow-400 text-sm">No colors available for this product.</p>
                    </div>
                  ) : availableColors.length === 1 ? (
                    <div className="bg-gray-800 rounded-lg p-3 border border-green-500/30">
                      <p className="text-white">Color: <span className="text-green-400 font-medium">{availableColors[0]}</span></p>
                    </div>
                  ) : (
                    <select
                      value={selectedColor}
                      onChange={(e) => {
                        setSelectedColor(e.target.value);
                        setSelectedSize(""); // Reset size when color changes
                        setQuantity(1); // Reset quantity
                      }}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Select color</option>
                      {availableColors.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Size</label>
                  {!selectedColor ? (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                      <p className="text-gray-400 text-sm">Please select a color first</p>
                    </div>
                  ) : availableSizes.length === 0 ? (
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                      <p className="text-yellow-400 text-sm">No sizes available for this color.</p>
                    </div>
                  ) : (
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Select size</option>
                      {availableSizes.map((size: string) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-white font-medium mb-2">
                Quantity {selectedVariant && stockQuantity > 0 && (
                  <span className="text-gray-400 text-sm ml-2">
                    ({stockQuantity} available)
                  </span>
                )}
              </label>
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val <= maxQuantity) {
                    setQuantity(val);
                  }
                }}
                className="input-field w-full"
                disabled={!selectedVariant || stockQuantity === 0}
                required
              />
              {selectedVariant && stockQuantity > 0 && quantity > stockQuantity && (
                <p className="text-yellow-400 text-sm mt-1">
                  Maximum available quantity is {stockQuantity}
                </p>
              )}
            </div>

            <div>
              <label className="block text-white font-medium mb-2">County</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input-field w-full"
                required
              >
                {KENYAN_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (e.target.value) {
                    setPhoneError(validatePhoneNumber(e.target.value) ? "" : "Invalid Kenyan phone number");
                  } else {
                    setPhoneError("");
                  }
                }}
                onBlur={() => {
                  if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
                    setPhoneError("Please enter a valid Kenyan phone (e.g., 0712345678, 254712345678, or +254712345678)");
                  }
                }}
                placeholder="0712345678 or +254712345678"
                className="input-field w-full"
                required
              />
              {phoneError && (
                <p className="text-red-400 text-sm mt-2">{phoneError}</p>
              )}
            </div>

            {sellingPrice !== null && quantity > 0 && (
              <div className="bg-gradient-to-r from-green-900/30 to-gray-800 rounded-lg p-4 border border-green-500/20">
                <div className="flex items-center justify-between text-lg">
                  <span className="text-gray-300 font-medium">Total:</span>
                  <span className="text-green-400 font-bold">${(sellingPrice * quantity).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-900/30 to-gray-800 rounded-lg p-4 border border-green-500/20">
              <p className="text-gray-300 text-sm">
                After placing your order, you will receive a call from us between 7:00 PM to 10:00 PM. 
                Please keep your phone available during this time.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || variants.length === 0 || availableColors.length === 0 || !selectedColor || availableSizes.length === 0 || !selectedVariant || stockQuantity === 0 || !!phoneError}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg shadow-green-500/30 w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Placing Order..." : 
               variants.length === 0 ? "No Variants Available" : 
               stockQuantity === 0 ? "Out of Stock" :
               "Place Order"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
