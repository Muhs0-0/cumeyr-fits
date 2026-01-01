import { useState, useEffect } from "react";
import type { Product } from "@/shared/types";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const [lowestPrice, setLowestPrice] = useState<number | null>(null);

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
      .catch((err) => console.error("Error fetching price:", err));
  }, [product.id]);

  return (
    <div className="card cursor-pointer group relative" onClick={onClick}>
      <div className="aspect-square overflow-hidden bg-gray-800 relative">
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
          {lowestPrice !== null && (
            <div className="flex flex-col items-end">
              <p className="text-gray-500 text-xs line-through">
                KSh {(lowestPrice * 1.1).toFixed(2)}
              </p>
              <p className="text-green-400 font-bold text-lg">
                KSh {lowestPrice.toFixed(2)}
              </p>
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">{product.name}</h3>
        <p className="text-sm text-gray-400 line-clamp-2">{product.description}</p>
      </div>
    </div>
  );
}