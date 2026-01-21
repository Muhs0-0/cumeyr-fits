import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Package, ShoppingBag, Plus, Pencil, Trash2, CheckCircle, XCircle, Clock, Layers, DollarSign, TrendingUp, AlertTriangle, Box, User, Filter, Eye, Monitor, Smartphone, Globe, Activity, TrendingDown, Users } from "lucide-react";
import ProductModal from "@/react-app/components/ProductModal";
import ManageVariantsModal from "@/react-app/components/ManageVariantsModal";
import type { Product, Order, Analytics } from "@/shared/types";

interface ExtendedOrder extends Order {
  cost_price?: number;
  selling_price?: number;
  profit?: number;
  variant_image?: string;
  variant_id?: string | number;
}

export default function AdminDashboardPage() {
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "visitors">("orders");
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [visitorAnalytics, setVisitorAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [visitorAnalyticsLoading, setVisitorAnalyticsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | "approved" | "pending" | "cancelled">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [variantsProduct, setVariantsProduct] = useState<Product | undefined>();
  const [adminName, setAdminName] = useState("");
  const [adminId, setAdminId] = useState("");
  const navigate = useNavigate();

  const categories = ["all", ...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    if (categoryFilter === "all") return true;
    return product.category === categoryFilter;
  });

  useEffect(() => {
    console.log("🔷 AdminDashboard useEffect running - checking auth");
    const authToken = localStorage.getItem("adminAuth");
    const name = localStorage.getItem("adminName") || "Admin";
    const id = localStorage.getItem("adminId") || "";

    console.log("🔷 Auth check:", { authToken, name, id });

    if (!authToken) {
      console.log("❌ No auth token found - redirecting to login");
      navigate("/admin/login");
      return;
    }

    console.log("✅ Auth token found - setting admin info");
    setAdminName(name);
    setAdminId(id);
    
    console.log("🔷 Fetching orders, products, analytics, and visitor analytics");
    fetchOrders();
    fetchProducts();
    fetchAnalytics();
    fetchVisitorAnalytics();
  }, [navigate]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    console.log("🔷 Fetching orders from API...");
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`);
      console.log("🔷 Orders response status:", res.status);
      const data = await res.json();
      console.log("✅ Orders fetched:", data);
      
      const ordersWithImages = await Promise.all(
        data.map(async (order: ExtendedOrder) => {
          try {
            const variantRes = await fetch(`${API_BASE}/api/admin/variants/${order.variant_id}`);
            if (variantRes.ok) {
              const variantData = await variantRes.json();
              return { ...order, variant_image: variantData.image_url };
            }
          } catch (err) {
            console.error("Error fetching variant image:", err);
          }
          return order;
        })
      );
      
      setOrders(ordersWithImages);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    console.log("🔷 Fetching products from API...");
    try {
      const res = await fetch(`${API_BASE}/api/admin/products`);
      console.log("🔷 Products response status:", res.status);
      const data = await res.json();
      console.log("✅ Products fetched:", data);
      setProducts(data);
    } catch (err) {
      console.error("❌ Error fetching products:", err);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    console.log("🔷 Fetching analytics from API...");
    try {
      const res = await fetch(`${API_BASE}/api/admin/analytics`);
      console.log("🔷 Analytics response status:", res.status);
      const data = await res.json();
      console.log("✅ Analytics fetched:", data);
      setAnalytics(data);
    } catch (err) {
      console.error("❌ Error fetching analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchVisitorAnalytics = async () => {
    setVisitorAnalyticsLoading(true);
    console.log("🔷 Fetching visitor analytics from API...");
    try {
      const res = await fetch(`${API_BASE}/api/admin/visits/analytics`);
      console.log("🔷 Visitor analytics response status:", res.status);
      const data = await res.json();
      console.log("✅ Visitor analytics fetched:", data);
      setVisitorAnalytics(data);
    } catch (err) {
      console.error("❌ Error fetching visitor analytics:", err);
    } finally {
      setVisitorAnalyticsLoading(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId: number, status: "confirmed" | "completed" | "cancelled") => {
    await fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, admin_id: adminId, admin_name: adminName }),
    });
    fetchOrders();
    fetchAnalytics();
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await fetch(`${API_BASE}/api/admin/products/${productId}`, { method: "DELETE" });
    fetchProducts();
    fetchAnalytics();
  };

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleCloseModal = () => {
    setShowProductModal(false);
    setEditingProduct(undefined);
  };

  const handleSaveProduct = () => {
    fetchProducts();
    fetchAnalytics();
  };

  const handleManageVariants = (product: Product) => {
    setVariantsProduct(product);
    setShowVariantsModal(true);
  };

  const handleCloseVariantsModal = () => {
    setShowVariantsModal(false);
    setVariantsProduct(undefined);
    fetchAnalytics();
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    sessionStorage.removeItem("adminId");
    sessionStorage.removeItem("adminName");
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminName");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-black">
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Qaf fits Admin</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
              <User size={18} className="text-green-400" />
              <span className="text-white font-medium">{adminName}</span>
            </div>
            <button onClick={handleLogout} className="btn-secondary text-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Analytics Section */}
        {analyticsLoading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-5 w-5 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="h-8 w-32 bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-40 bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 border border-gray-800 aspect-square">
                  <div className="h-5 w-5 bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-16 bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-6 w-12 bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </>
        ) : analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-900/30 to-gray-900 rounded-lg p-6 hover:shadow-xl hover:shadow-green-500/20 transition-all border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-300 text-sm font-medium">Total Revenue</h3>
                  <DollarSign size={20} className="text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-400">${analytics.total_revenue?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-gray-500 mt-1">From approved orders</p>
              </div>

              <div className="bg-gradient-to-br from-green-900/20 to-gray-900 rounded-lg p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-300 text-sm font-medium">Total Profit</h3>
                  <TrendingUp size={20} className="text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-400">${analytics.total_profit?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-gray-500 mt-1">Net profit earned</p>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-300 text-sm font-medium">Inventory Value</h3>
                  <Box size={20} className="text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-blue-400">${analytics.inventory_value?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-gray-500 mt-1">Cost of all stock</p>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all border border-gray-800 hover:border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-300 text-sm font-medium">Active Products</h3>
                  <Package size={20} className="text-green-400" />
                </div>
                <p className="text-3xl font-bold text-white">{analytics.total_products}</p>
                <p className="text-xs text-gray-500 mt-1">Products with variants</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 hover:shadow-xl hover:shadow-green-500/10 transition-all border border-gray-800 hover:border-green-500/30 aspect-square flex flex-col items-center justify-center text-center cursor-pointer" onClick={() => setOrderStatusFilter("all")}>
                <ShoppingBag size={20} className="text-green-400 mb-2" />
                <h3 className="text-gray-400 text-xs font-medium">Total Orders</h3>
                <p className="text-2xl font-bold text-white">{analytics.total_orders}</p>
              </div>

              <div className={`bg-gradient-to-br rounded-lg p-4 hover:shadow-xl transition-all aspect-square flex flex-col items-center justify-center text-center cursor-pointer border ${orderStatusFilter === 'approved' ? 'from-green-900/40 to-gray-900 border-green-500/50' : 'from-green-900/20 to-gray-900 border-green-500/30'}`} onClick={() => setOrderStatusFilter("approved")}>
                <CheckCircle size={20} className="text-green-400 mb-2" />
                <h3 className="text-gray-400 text-xs font-medium">Approved</h3>
                <p className="text-2xl font-bold text-green-400">{analytics.approved_orders}</p>
              </div>

              <div className={`bg-gradient-to-br rounded-lg p-4 hover:shadow-xl transition-all aspect-square flex flex-col items-center justify-center text-center cursor-pointer border ${orderStatusFilter === 'pending' ? 'from-yellow-900/40 to-gray-900 border-yellow-500/50' : 'from-yellow-900/20 to-gray-900 border-yellow-500/30'}`} onClick={() => setOrderStatusFilter("pending")}>
                <Clock size={20} className="text-yellow-400 mb-2" />
                <h3 className="text-gray-400 text-xs font-medium">Pending</h3>
                <p className="text-2xl font-bold text-yellow-400">{analytics.pending_orders}</p>
              </div>

              <div className={`bg-gradient-to-br rounded-lg p-4 hover:shadow-xl transition-all aspect-square flex flex-col items-center justify-center text-center cursor-pointer border ${orderStatusFilter === 'cancelled' ? 'from-red-900/40 to-gray-900 border-red-500/50' : 'from-red-900/20 to-gray-900 border-red-500/30'}`} onClick={() => setOrderStatusFilter("cancelled")}>
                <XCircle size={20} className="text-red-400 mb-2" />
                <h3 className="text-gray-400 text-xs font-medium">Cancelled</h3>
                <p className="text-2xl font-bold text-red-400">{analytics.cancelled_orders}</p>
              </div>
            </div>

            {/* Inventory Alerts */}
            {((analytics.low_stock_variants?.length ?? 0) > 0 || (analytics.out_of_stock_variants?.length ?? 0) > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {(analytics.low_stock_variants?.length ?? 0) > 0 && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="text-yellow-400" size={24} />
                      <h3 className="text-yellow-400 font-semibold text-lg">Low Stock Alert</h3>
                    </div>
                    <div className="space-y-2">
                      {analytics.low_stock_variants?.map((variant: any) => (
                        <div key={variant.id} className="bg-gray-900/50 rounded-lg p-3">
                          <p className="text-white font-medium">{variant.product_name}</p>
                          <p className="text-gray-400 text-sm">Color: {variant.color} - Only {variant.stock_quantity} left</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(analytics.out_of_stock_variants?.length ?? 0) > 0 && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="text-red-400" size={24} />
                      <h3 className="text-red-400 font-semibold text-lg">Out of Stock</h3>
                    </div>
                    <div className="space-y-2">
                      {analytics.out_of_stock_variants?.map((variant: any) => (
                        <div key={variant.id} className="bg-gray-900/50 rounded-lg p-3">
                          <p className="text-white font-medium">{variant.product_name}</p>
                          <p className="text-gray-400 text-sm">Color: {variant.color} - Out of stock</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "orders"
                ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30"
                : "bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800"
            }`}
          >
            <ShoppingBag size={20} />
            Orders
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "products"
                ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30"
                : "bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800"
            }`}
          >
            <Package size={20} />
            Products
          </button>
          <button
            onClick={() => setActiveTab("visitors")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "visitors"
                ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30"
                : "bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800"
            }`}
          >
            <Eye size={20} />
            Visitors
          </button>
        </div>

        {activeTab === "orders" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Orders Management</h2>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-6 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-800">
                    <div className="grid grid-cols-6 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((j) => (
                        <div key={j} className="h-10 bg-gray-700 rounded animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-gray-400">No orders yet</p>
              </div>
            ) : (
              orders
                .filter(order => {
                  if (orderStatusFilter === 'all') return true;
                  if (orderStatusFilter === 'approved') return order.status === 'completed';
                  if (orderStatusFilter === 'pending') return order.status === 'pending' || order.status === 'confirmed';
                  return order.status === orderStatusFilter;
                })
                .map((order) => (
                  <div key={order.id} className="card">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex gap-4 flex-1">
                          {order.variant_image && (
                            <div className="flex-shrink-0">
                              <img
                                src={order.variant_image}
                                alt={`${order.product_name} - ${order.color}`}
                                className="w-24 h-24 object-cover rounded-lg border border-gray-700"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-white">
                                {order.product_name}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  order.status === "completed"
                                    ? "bg-green-600 text-white"
                                    : order.status === "cancelled"
                                    ? "bg-red-600 text-white"
                                    : order.status === "confirmed"
                                    ? "bg-blue-600 text-white"
                                    : "bg-yellow-600 text-black"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400 space-y-1">
                              <p>Size: {order.size} | Color: {order.color} | Quantity: {order.quantity}</p>
                              <p>Phone: {order.phone_number}</p>
                              {order.country && <p>County: {order.country}</p>}
                              <p>Order Date: {new Date(order.created_at).toLocaleString()}</p>
                              {order.approved_by && order.approved_by.admin_name && (
                                <p className="text-green-400 mt-2">✓ Approved by: <span className="font-semibold">{order.approved_by.admin_name}</span> on {new Date(order.approved_by.timestamp).toLocaleString()}</p>
                              )}
                              {order.deleted_by && order.deleted_by.admin_name && (
                                <p className="text-red-400 mt-2">🗑️ Deleted by: <span className="font-semibold">{order.deleted_by.admin_name}</span> on {new Date(order.deleted_by.timestamp).toLocaleString()}</p>
                              )}
                            </div>

                            {order.status === "completed" && order.selling_price && order.cost_price && (
                              <div className="mt-4 bg-gradient-to-r from-green-900/20 to-gray-800/50 rounded-lg p-4 border border-green-500/20">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-400">Revenue</p>
                                    <p className="text-white font-semibold">${(order.selling_price * order.quantity).toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400">Cost</p>
                                    <p className="text-white font-semibold">${(order.cost_price * order.quantity).toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400">Profit</p>
                                    <p className="text-green-400 font-bold">${order.profit?.toFixed(2) || '0.00'}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {order.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOrderStatusUpdate(order.id as unknown as number, "confirmed")}
                              className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-500/20"
                            >
                              <CheckCircle size={16} />
                              Confirm Order
                            </button>
                            <button
                              onClick={() => handleOrderStatusUpdate(order.id as unknown as number, "cancelled")}
                              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all"
                            >
                              <XCircle size={16} />
                              Cancel
                            </button>
                          </div>
                        )}
                        {order.status === "confirmed" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOrderStatusUpdate(order.id as unknown as number, "completed")}
                              className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-green-500/20"
                            >
                              <CheckCircle size={16} />
                              Confirm Sale
                            </button>
                            <button
                              onClick={() => handleOrderStatusUpdate(order.id as unknown as number, "cancelled")}
                              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all"
                            >
                              <XCircle size={16} />
                              Cancel
                            </button>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                <h2 className="text-2xl font-bold text-white">Products Management</h2>
                
                {categories.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50"
                      disabled={productsLoading}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category === "all" ? "All Categories" : category}
                        </option>
                      ))}
                    </select>
                    {categoryFilter !== "all" && !productsLoading && (
                      <span className="text-gray-400 text-sm">
                        ({filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'})
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleAddProduct}
                disabled={productsLoading}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-lg shadow-green-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>
            
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="card">
                    <div className="w-full h-48 bg-gray-700 animate-pulse"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-5 w-32 bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-gray-700 rounded animate-pulse"></div>
                      <div className="flex gap-2 mt-4">
                        <div className="h-10 flex-1 bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-10 flex-1 bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-12 text-center border border-gray-800">
                <Package size={48} className="mx-auto mb-4 text-gray-600" />
                {categoryFilter === "all" ? (
                  <>
                    <p className="text-gray-400 text-lg mb-2">No products yet</p>
                    <p className="text-gray-500 text-sm">Click "Add Product" to get started</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-lg mb-2">No products in "{categoryFilter}"</p>
                    <p className="text-gray-500 text-sm">Try selecting a different category</p>
                  </>
                )}
              </div>
            ) : (
              <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="card">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                          <p className="text-xs text-gray-400">{product.category}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            product.is_active ? "bg-white text-black" : "bg-gray-700 text-white"
                          }`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-4">{product.description}</p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleManageVariants(product)}
                          className="w-full flex items-center justify-center gap-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-3 py-2 rounded-lg transition-all text-sm font-medium shadow-lg shadow-green-500/20"
                        >
                          <Layers size={14} />
                          Manage Variants & Stock
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="flex-1 flex items-center justify-center gap-1 bg-white hover:bg-gray-200 text-black px-3 py-2 rounded-lg transition-all text-sm font-medium"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-all text-sm font-medium"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "visitors" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Visitor Analytics</h2>

            {visitorAnalyticsLoading ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-5 w-5 bg-gray-700 rounded animate-pulse"></div>
                      </div>
                      <div className="h-8 w-32 bg-gray-700 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-20 bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="card p-6">
                      <div className="h-5 w-32 bg-gray-700 rounded animate-pulse mb-4"></div>
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((j) => (
                          <div key={j} className="h-6 bg-gray-700 rounded animate-pulse"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : visitorAnalytics ? (
              <>
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-900/30 to-gray-900 rounded-lg p-6 border border-purple-500/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-300 text-sm font-medium">Total Visits</h3>
                  <Eye size={20} className="text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-purple-400">
                  {visitorAnalytics.total_visits.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>

              <div className="bg-gradient-to-br from-blue-900/30 to-gray-900 rounded-lg p-6 border border-blue-500/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-300 text-sm font-medium">Today</h3>
                  <Activity size={20} className="text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-blue-400">
                  {visitorAnalytics.visits_today}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {visitorAnalytics.growth_rate > 0 ? (
                    <>
                      <TrendingUp size={14} className="text-green-400" />
                      <p className="text-xs text-green-400">+{visitorAnalytics.growth_rate}% vs yesterday</p>
                    </>
                  ) : visitorAnalytics.growth_rate < 0 ? (
                    <>
                      <TrendingDown size={14} className="text-red-400" />
                      <p className="text-xs text-red-400">{visitorAnalytics.growth_rate}% vs yesterday</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Same as yesterday</p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-900/30 to-gray-900 rounded-lg p-6 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-300 text-sm font-medium">Last 7 Days</h3>
                  <Users size={20} className="text-cyan-400" />
                </div>
                <p className="text-3xl font-bold text-cyan-400">
                  {visitorAnalytics.visits_last_7_days}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {visitorAnalytics.unique_visits_last_7_days} unique
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-900/30 to-gray-900 rounded-lg p-6 border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-300 text-sm font-medium">Last 30 Days</h3>
                  <Globe size={20} className="text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-400">
                  {visitorAnalytics.visits_last_30_days}
                </p>
                <p className="text-xs text-gray-500 mt-1">Monthly traffic</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-white font-semibold mb-4">Last 7 Days Trend</h3>
                <div className="space-y-2">
                  {visitorAnalytics.daily_visits.map((day: any) => (
                    <div key={day._id} className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm w-24">
                        {new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 bg-gray-800 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-600 to-green-400 h-full rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${(day.total / Math.max(...visitorAnalytics.daily_visits.map((d: any) => d.total))) * 100}%`
                          }}
                        >
                          <span className="text-white text-xs font-medium">{day.total}</span>
                        </div>
                      </div>
                      <span className="text-gray-500 text-xs w-16">{day.unique} unique</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-white font-semibold mb-4">Traffic Sources</h3>
                <div className="space-y-3">
                  {visitorAnalytics.traffic_sources.map((source: any) => (
                    <div key={source._id} className="flex items-center justify-between">
                      <span className="text-gray-300">{source._id}</span>
                      <span className="text-green-400 font-semibold">{source.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Device & Browser Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Monitor size={18} />
                  Devices
                </h3>
                <div className="space-y-3">
                  {visitorAnalytics.device_stats.map((device: any) => {
                    const total = visitorAnalytics.device_stats.reduce((sum: number, d: any) => sum + d.count, 0);
                    const percentage = ((device.count / total) * 100).toFixed(1);
                    return (
                      <div key={device._id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-300 capitalize">{device._id || 'Unknown'}</span>
                          <span className="text-gray-400 text-sm">{percentage}%</span>
                        </div>
                        <div className="bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Globe size={18} />
                  Browsers
                </h3>
                <div className="space-y-3">
                  {visitorAnalytics.browser_stats.slice(0, 5).map((browser: any) => {
                    const total = visitorAnalytics.browser_stats.reduce((sum: number, b: any) => sum + b.count, 0);
                    const percentage = ((browser.count / total) * 100).toFixed(1);
                    return (
                      <div key={browser._id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-300">{browser._id || 'Unknown'}</span>
                          <span className="text-gray-400 text-sm">{percentage}%</span>
                        </div>
                        <div className="bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Smartphone size={18} />
                  Operating Systems
                </h3>
                <div className="space-y-3">
                  {visitorAnalytics.os_stats.slice(0, 5).map((os: any) => {
                    const total = visitorAnalytics.os_stats.reduce((sum: number, o: any) => sum + o.count, 0);
                    const percentage = ((os.count / total) * 100).toFixed(1);
                    return (
                      <div key={os._id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-300">{os._id || 'Unknown'}</span>
                          <span className="text-gray-400 text-sm">{percentage}%</span>
                        </div>
                        <div className="bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Pages */}
            <div className="card p-6">
              <h3 className="text-white font-semibold mb-4">Top Pages (Last 7 Days)</h3>
              <div className="space-y-2">
                {visitorAnalytics.top_pages.map((page: any) => (
                  <div key={page._id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <span className="text-gray-300">{page._id}</span>
                    <span className="text-green-400 font-semibold">{page.count} visits</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Visitors */}
            <div className="card p-6">
              <h3 className="text-white font-semibold mb-4">Recent Visitors</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                      <th className="pb-3">Time</th>
                      <th className="pb-3">Product</th>
                      <th className="pb-3">Page</th>
                      <th className="pb-3">Device</th>
                      <th className="pb-3">Browser</th>
                      <th className="pb-3">OS</th>
                      <th className="pb-3">Source</th>
                      <th className="pb-3">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitorAnalytics.recent_visits.map((visit: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-900/30">
                        <td className="py-3 text-gray-400 text-sm">
                          {new Date(visit.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3">
                          {visit.product_image_url ? (
                            <div className="flex items-center gap-2">
                              <img 
                                src={visit.product_image_url} 
                                alt={visit.product_name}
                                className="w-8 h-8 rounded object-cover"
                              />
                              <span className="text-white text-sm max-w-[150px] truncate">{visit.product_name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 text-white text-sm">{visit.page_url}</td>
                        <td className="py-3 text-gray-300 text-sm capitalize">{visit.device_type}</td>
                        <td className="py-3 text-gray-300 text-sm">{visit.browser}</td>
                        <td className="py-3 text-gray-300 text-sm">{visit.os}</td>
                        <td className="py-3 text-gray-400 text-sm truncate max-w-[150px]">
                          {visit.referrer === 'direct' ? 'Direct' : visit.referrer}
                        </td>
                        <td className="py-3">
                          {visit.is_unique ? (
                            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">New</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded">Returning</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">No visitor data available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
        />
      )}

      {showVariantsModal && variantsProduct && (
        <ManageVariantsModal
          product={variantsProduct}
          onClose={handleCloseVariantsModal}
        />
      )}
    </div>
  );
}