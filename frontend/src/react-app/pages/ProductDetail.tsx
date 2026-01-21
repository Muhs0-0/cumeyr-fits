import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { trackVisit } from "@/utils/trackVisit";
import type { Product } from "@/shared/types";
import OrderForm from "@/react-app/components/OrderForm";

export default function ProductDetailPage() {
  const { productName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  
  const [product, setProduct] = useState<Product | null>(location.state?.product || null);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(!product);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImages, setAllImages] = useState<string[]>([]);

  useEffect(() => {
    // Track this product page view
    trackVisit();

    if (!product) {
      // Fetch product by name if not passed through state
      const loadProduct = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/api/products`);
          if (!res.ok) throw new Error('Failed to fetch products');
          const products: Product[] = await res.json();
          const found = products.find(p => 
            p.name.toLowerCase().replace(/\s+/g, '-') === productName
          );
          if (found) {
            setProduct(found);
            await fetchVariants(found.id);
          } else {
            setLoading(false);
          }
        } catch (err) {
          console.error("Error loading product:", err);
          setLoading(false);
        }
      };
      loadProduct();
    } else {
      setLoading(true);
      fetchVariants(product.id);
    }
  }, [productName]);

  const fetchVariants = async (productId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}/variants`);
      if (!res.ok) throw new Error('Failed to fetch variants');
      const data = await res.json();
      setVariants(data);
      
      // Collect all unique images (product image + all variant images)
      const images = product?.image_url ? [product.image_url] : [];
      data.forEach((v: any) => {
        if (v.image_url && !images.includes(v.image_url)) {
          images.push(v.image_url);
        }
      });
      setAllImages(images);
      
      if (data.length > 0) {
        setSelectedVariant(data[0]);
        // Set initial image to first variant image if available
        if (data[0].image_url) {
          const idx = images.indexOf(data[0].image_url);
          setCurrentImageIndex(idx !== -1 ? idx : 0);
        }
      }
    } catch (err) {
      console.error("Error fetching variants:", err);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSubmit = async (orderData: any) => {
    setOrderSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product!.id,
          product_name: product!.name,
          ...orderData
        })
      });
      
      if (response.ok) {
        alert('Order placed successfully!');
        navigate('/');
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      alert('An error occurred while placing your order.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleVariantSelect = (variant: any) => {
    setSelectedVariant(variant);
    // Update image to match selected variant
    if (variant.image_url) {
      const idx = allImages.indexOf(variant.image_url);
      if (idx !== -1) {
        setCurrentImageIndex(idx);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Image Skeleton */}
            <div className="flex items-center justify-center bg-gray-800 rounded-lg overflow-hidden min-h-[400px]">
              <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-700 animate-pulse"></div>
            </div>

            {/* Product Details Skeleton */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <div className="h-4 w-20 bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-full bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-full bg-gray-700 rounded animate-pulse"></div>
                </div>

                {/* Variants Skeleton */}
                <div className="mb-6">
                  <div className="h-5 w-32 bg-gray-700 rounded animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 rounded-lg border-2 border-gray-700 bg-gray-800">
                        <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Skeleton */}
                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                  <div className="h-3 w-24 bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-8 w-40 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Button Skeleton */}
              <div className="w-full py-3 bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Product not found</p>
          <button 
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with close button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <button 
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Product Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image Carousel */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative flex items-center justify-center bg-gray-800 rounded-lg overflow-hidden min-h-[400px] group">
              {allImages.length > 0 ? (
                <>
                  <img 
                    src={allImages[currentImageIndex]} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  
                  {/* Navigation Arrows */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}

                  {/* Image Indicators */}
                  {allImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {allImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === currentImageIndex ? 'bg-green-400 w-6' : 'bg-gray-400 hover:bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-400">No image available</div>
              )}
            </div>

            {/* Thumbnail Scroll */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex
                        ? 'border-green-500 ring-2 ring-green-400'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Variant ${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <span className="text-sm text-green-400 font-medium">{product.category}</span>
                <p className="text-gray-400 mt-2">{product.description}</p>
              </div>

              {/* Variants Selection */}
              {variants.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Choose Color & Size</h3>
                  <div className="space-y-3">
                    {variants.map((variant, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleVariantSelect(variant)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-gray-500 ${
                          selectedVariant?.id === variant.id
                            ? 'border-green-500 bg-green-900/20'
                            : 'border-gray-700 bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {variant.color && <p className="text-sm font-medium text-gray-200">{variant.color}</p>}
                            {variant.size && <p className="text-sm text-gray-400">Size: {variant.size}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            {variant.image_url && (
                              <img 
                                src={variant.image_url}
                                alt={variant.color}
                                className="w-12 h-12 rounded object-cover border border-gray-600"
                              />
                            )}
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-400">
                                KSh {variant.selling_price?.toFixed(2) || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {variant.stock_quantity > 0 
                                  ? `${variant.stock_quantity} left`
                                  : 'Out of stock'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Display */}
              {selectedVariant && (
                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                  <p className="text-gray-400 text-sm mb-1">Unit Price</p>
                  <p className="text-3xl font-bold text-green-400">
                    KSh {selectedVariant.selling_price?.toFixed(2) || 'N/A'}
                  </p>
                </div>
              )}

              {/* Order Form */}
              {selectedVariant ? (
                <OrderForm
                  selectedVariant={selectedVariant}
                  onSubmit={handleOrderSubmit}
                  isSubmitting={orderSubmitting}
                />
              ) : (
                <div className="w-full py-3 bg-gray-700 text-gray-400 font-semibold rounded-lg text-center">
                  Select a color & size to continue
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
