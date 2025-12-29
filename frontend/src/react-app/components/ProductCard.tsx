import type { Product } from "@/shared/types";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
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
        <div className="text-xs text-green-400 mb-1 font-medium">{product.category}</div>
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">{product.name}</h3>
        <p className="text-sm text-gray-400 line-clamp-2">{product.description}</p>
      </div>
    </div>
  );
}
