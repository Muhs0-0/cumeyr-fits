import { useState, useEffect } from "react";
import Navbar from "@/react-app/components/Navbar";
import ProductCard from "@/react-app/components/ProductCard";
import OrderModal from "@/react-app/components/OrderModal";
import type { Product } from "@/shared/types";

export default function HomePage() {
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    const url = selectedCategory === "all"
      ? `${API_BASE}/api/products`
      : `${API_BASE}/api/products?category=${selectedCategory}`;
    const res = await fetch(url);
    const data = await res.json();
    setProducts(data);
  };

  const handleOrderSubmit = async (orderData: {
    size: string;
    color: string;
    quantity: number;
    phone_number: string;
    country: string;
    variant_id: number;
  }) => {
    if (!selectedProduct) return;

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          ...orderData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSelectedProduct(null);
        setOrderSuccess(true);
        setTimeout(() => setOrderSuccess(false), 5000);
      } else {
        if (data.error === "Insufficient stock") {
          alert(`Only ${data.available} items available in stock. Please adjust your quantity or contact the admin for more.`);
        } else {
          alert("Failed to place order. Please try again.");
        }
      }
    } catch (error) {
      alert("Failed to place order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <main className="container mx-auto px-4 py-8">
        {orderSuccess && (
          <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 rounded-lg mb-6 font-medium shadow-lg shadow-green-500/30">
            Order placed successfully! You will receive a call between 7:00 PM - 10:00 PM.
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {selectedCategory === "all" ? "All Products" : selectedCategory}
          </h1>
          <p className="text-gray-400">Browse our premium collection and place your order</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No products available in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}
      </main>

      {selectedProduct && (
        <OrderModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSubmit={handleOrderSubmit}
        />
      )}
    </div>
  );
}
