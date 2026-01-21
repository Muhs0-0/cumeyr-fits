import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import type { Product } from "@/shared/types";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const navigate = useNavigate();
  const [lowestPrice, setLowestPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    // Fetch variants to get the lowest price
    fetch(`${API_BASE}/api/products/${product.id}/variants`)
      .then((res) => res.json())
      .then((variants) => {
        if (variants.length > 0) {
          const prices = variants.map((v: any) => v.selling_price).filter((p: number) => p > 0);
          if (prices.length > 0) {
            setLowestPrice(Math.min(...prices));
          }
        }
      })
      .catch((err) => console.error("Error fetching price:", err))
      .finally(() => setPriceLoading(false));
  }, [product.id]);

  const handleCardClick = async () => {
    setNavigating(true);
    // Convert product name to URL-friendly slug (e.g., "Nike Dunk Low" -> "nike-dunk-low")
    const slug = product.name.toLowerCase().replace(/\s+/g, '-');
    setTimeout(() => {
      navigate(`/product/${slug}`, { state: { product } });
      onClick();
    }, 100);
  };

  return (
    <div className="card cursor-pointer group relative" onClick={handleCardClick}>
      <div className="aspect-square overflow-hidden bg-gray-800 relative">
        {navigating && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        )}
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-green-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div className="text-xs text-green-400 font-medium">{product.category}</div>
          
          {/* Price Badge */}
          {priceLoading ? (
            <div className="flex flex-col items-end gap-1">
              <div className="w-16 h-4 bg-gray-700 rounded animate-pulse"></div>
              <div className="w-20 h-5 bg-gray-700 rounded animate-pulse"></div>
            </div>
          ) : lowestPrice !== null ? (
            <div className="flex flex-col items-end">
              <p className="text-gray-500 text-xs line-through">
                KSh {(lowestPrice * 1.2).toFixed(2)}
              </p>
              <p className="text-green-400 font-bold text-lg">
                KSh {lowestPrice.toFixed(2)}
              </p>
            </div>
          ) : null}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">{product.name}</h3>
        <p className="text-sm text-gray-400 line-clamp-2">{product.description}</p>
      </div>
    </div>
  );
}