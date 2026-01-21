import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { ProductVariant } from "@/shared/types";

interface OrderFormProps {
  selectedVariant: ProductVariant | null;
  onSubmit: (orderData: {
    size: string;
    color: string;
    quantity: number;
    phone_number: string;
    country: string;
    variant_id: number;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

const KENYAN_COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", "Homa Bay",
  "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii",
  "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera",
  "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi",
  "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita Taveta", "Tana River",
  "Tharaka Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
];

const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  const phoneRegex = /^(0|\+?254)[712]\d{7,8}$/;
  return phoneRegex.test(cleaned);
};

export default function OrderForm({ selectedVariant, onSubmit, isSubmitting = false }: OrderFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [country, setCountry] = useState("");
  const [size, setSize] = useState(selectedVariant?.size || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVariant) {
      alert("Please select a color first");
      return;
    }

    if (!quantity || quantity <= 0) {
      alert("Please select a valid quantity");
      return;
    }

    if (!size) {
      alert("Please select a size");
      return;
    }

    if (!phoneNumber || !country) {
      alert("Please fill in all fields");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError("Please enter a valid Kenyan phone number");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        size,
        color: selectedVariant.color || "",
        quantity,
        phone_number: phoneNumber,
        country,
        variant_id: selectedVariant.id,
      });
    } finally {
      setLoading(false);
    }
  };

  const maxQuantity = selectedVariant?.stock_quantity || 0;
  const totalPrice = selectedVariant && selectedVariant.selling_price ? selectedVariant.selling_price * quantity : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Size */}
      <div>
        <label className="block text-white font-medium mb-2">Size</label>
        <input
          type="text"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Enter size (e.g., 40, 42, 38, 44)"
          className="input-field w-full"
          required
        />
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-white font-medium mb-2">
          Quantity {selectedVariant && maxQuantity > 0 && (
            <span className="text-gray-400 text-sm">Max: {maxQuantity}</span>
          )}
        </label>
        <input
          type="number"
          min="1"
          max={maxQuantity}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="input-field w-full text-lg"
          disabled={!selectedVariant || maxQuantity === 0}
          required
        />
        {selectedVariant && maxQuantity > 0 && quantity > maxQuantity && (
          <p className="text-yellow-400 text-sm mt-1">
            Maximum available quantity is {maxQuantity}
          </p>
        )}
      </div>

      {/* County */}
      <div>
        <label className="block text-white font-medium mb-2">County</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="input-field w-full"
          required
        >
          <option value="">Select county</option>
          {KENYAN_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {country && country !== "Garissa" && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mt-3">
            <p className="text-blue-400 text-sm">
              ℹ️ <strong>Delivery Notice:</strong> Orders to {country} may take more than one day to arrive. 
              Please wait for a call from us to confirm delivery details.
            </p>
          </div>
        )}
      </div>

      {/* Phone Number */}
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

      {/* Total Price */}
      {selectedVariant && quantity > 0 && (
        <div className="bg-gradient-to-r from-green-900/30 to-gray-800 rounded-lg p-4 border border-green-500/20">
          <div className="flex items-center justify-between text-lg">
            <span className="text-gray-300 font-medium">Total:</span>
            <span className="text-green-400 font-bold">KSh {totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Info Notice */}
      <div className="bg-gradient-to-r from-green-900/30 to-gray-800 rounded-lg p-4 border border-green-500/20">
        <p className="text-gray-300 text-sm">
          After placing your order, you will receive a call from us between 7:00 PM to 10:00 PM. 
          Please keep your phone available during this time.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || loading || !selectedVariant || maxQuantity === 0 || quantity > maxQuantity || !!phoneError}
        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg shadow-green-500/30 w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting || loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        {isSubmitting || loading ? "Placing Order..." : "Place Order"}
      </button>
    </form>
  );
}
