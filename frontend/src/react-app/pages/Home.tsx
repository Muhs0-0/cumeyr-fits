import { useState, useEffect } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
import Navbar from "@/react-app/components/Navbar";
import ProductCard from "@/react-app/components/ProductCard";
import OrderModal from "@/react-app/components/OrderModal";
import type { Product } from "@/shared/types";

interface ProductWithVariants extends Product {
  variants?: Array<{
    color: string;
    selling_price: number;
  }>;
}

// Helper functions for tracking
function getSessionId() {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
}

function getUTMParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined
  };
}

export default function HomePage() {
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithVariants[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  
  // Filter states
  const [selectedColor, setSelectedColor] = useState("all");
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>("all");

  // Track visitor on page load
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const sessionId = getSessionId();
        const utmParams = getUTMParams();
        
        await fetch(`${API_BASE}/api/track-visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page_url: window.location.pathname,
            referrer: document.referrer || 'direct',
            session_id: sessionId,
            ...utmParams
          })
        });
      } catch (err) {
        console.error('Visit tracking failed:', err);
      }
    };

    trackVisit();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  useEffect(() => {
    applyFilters();
  }, [products, selectedColor, priceRange]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = selectedCategory === "all"
        ? `${API_BASE}/api/products`
        : `${API_BASE}/api/products?category=${selectedCategory}`;
      const res = await fetch(url);
      const data = await res.json();
      
      // Fetch variants for all products at once
      const productsWithVariants = await Promise.all(
        data.map(async (product: Product) => {
          try {
            const variantsRes = await fetch(`${API_BASE}/api/products/${product.id}/variants`);
            const variants = await variantsRes.json();
            return { ...product, variants };
          } catch (err) {
            console.error("Error fetching variants:", err);
            return { ...product, variants: [] };
          }
        })
      );
      
      setProducts(productsWithVariants);
      
      // Extract and normalize colors from all variants
      const colorSet = new Set<string>();
      productsWithVariants.forEach((product) => {
        product.variants?.forEach((v: { color: string; selling_price: number }) => {
          const color = v.color.toLowerCase();
          
          // Normalize multi-color variants to primary color
          if (color.includes('white') && color.includes('black')) colorSet.add('Black & White');
          else if (color.includes('x') || color.includes('+')) {
            // Multi-color variants - extract primary colors
            const colors = color.split(/[x+]/).map(c => c.trim());
            colors.forEach(c => {
              if (c) {
                const normalized = c.charAt(0).toUpperCase() + c.slice(1);
                colorSet.add(normalized);
              }
            });
          } else {
            // Single color - capitalize first letter
            colorSet.add(color.charAt(0).toUpperCase() + color.slice(1));
          }
        });
      });
      
      // Sort colors with common ones first
      const commonColors = ['Black', 'White', 'Brown', 'Blue', 'Red', 'Green', 'Orange', 'Purple', 'Yellow'];
      const sortedColors = Array.from(colorSet).sort((a, b) => {
        const aIndex = commonColors.indexOf(a);
        const bIndex = commonColors.indexOf(b);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
      });
      
      setAvailableColors(sortedColors);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setFilterLoading(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      let filtered = [...products];

      // Filter by color
      if (selectedColor !== "all") {
        filtered = filtered.filter((product) =>
          product.variants?.some((v) => {
            const variantColor = v.color.toLowerCase();
            const selectedColorLower = selectedColor.toLowerCase();
            
            // Check if variant color contains the selected color
            return variantColor.includes(selectedColorLower) || 
                   variantColor.split(/[x+]/).some(c => c.trim().toLowerCase() === selectedColorLower);
          })
        );
      }

      // Filter by price range
      if (priceRange !== "all") {
        filtered = filtered.filter((product) => {
          if (!product.variants || product.variants.length === 0) return false;
          
          const prices = product.variants.map((v) => v.selling_price);
          const minPrice = Math.min(...prices);
          
          if (priceRange === "under2000") return minPrice < 2000;
          if (priceRange === "2000-4000") return minPrice >= 2000 && minPrice <= 4000;
          if (priceRange === "over4000") return minPrice > 4000;
          
          return false;
        });
      }

      // Remove duplicates by product ID (just in case)
      const uniqueFiltered = filtered.filter((product, index, self) =>
        index === self.findIndex((p) => p.id === product.id)
      );

      setFilteredProducts(uniqueFiltered);
      setFilterLoading(false);
    }, 300);
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

  const displayProducts = selectedColor === "all" && priceRange === "all" ? products : filteredProducts;

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {selectedCategory === "all" ? "All Products" : selectedCategory}
              </h1>
              <p className="text-gray-400">Browse our premium collection and place your order</p>
            </div>
          </div>

          {/* Subtle Filter Bar */}
          <div className="flex items-center gap-4 mt-6 border-t border-gray-800 pt-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <SlidersHorizontal size={16} />
              <span>Filter:</span>
            </div>

            {/* Color Filter */}
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="bg-gray-900 text-gray-300 text-sm border border-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-green-500/50 transition-colors"
              disabled={loading}
            >
              <option value="all">All Colors</option>
              {availableColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>

            {/* Price Range Filter */}
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="bg-gray-900 text-gray-300 text-sm border border-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-green-500/50 transition-colors"
              disabled={loading}
            >
              <option value="all">All Prices</option>
              <option value="under2000">Under KSh 2,000</option>
              <option value="2000-4000">KSh 2,000 - 4,000</option>
              <option value="over4000">Over KSh 4,000</option>
            </select>

            {(selectedColor !== "all" || priceRange !== "all") && (
              <button
                onClick={() => {
                  setSelectedColor("all");
                  setPriceRange("all");
                }}
                className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
                disabled={loading}
              >
                Clear filters
              </button>
            )}

            {filterLoading && (
              <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
            )}
          </div>

          {/* Info notice when color filter is active */}
          {selectedColor !== "all" && !loading && displayProducts.length > 0 && (
            <div className="mt-4 bg-blue-900/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-blue-400 text-sm">
                ℹ️ Products shown have <strong>{selectedColor}</strong> available. Click on any product to see all color options.
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
            <p className="text-gray-400 text-lg">Loading products...</p>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No products match your filters</p>
            <button
              onClick={() => {
                setSelectedColor("all");
                setPriceRange("all");
              }}
              className="text-green-400 hover:text-green-300 text-sm mt-2 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
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