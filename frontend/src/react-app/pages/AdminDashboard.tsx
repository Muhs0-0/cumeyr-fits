import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Package, ShoppingBag, Plus, Pencil, Trash2, CheckCircle, XCircle, Clock, Layers, DollarSign, TrendingUp, AlertTriangle, Box, User } from "lucide-react";
import ProductModal from "@/react-app/components/ProductModal";
import ManageVariantsModal from "@/react-app/components/ManageVariantsModal";
import type { Product, Order, Analytics } from "@/shared/types";

interface ExtendedOrder extends Order {
  cost_price?: number;
  selling_price?: number;
  profit?: number;
}

export default function AdminDashboardPage() {
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "inventory">("orders");
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | "approved" | "pending" | "cancelled">("all");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [variantsProduct, setVariantsProduct] = useState<Product | undefined>();
  const [adminName, setAdminName] = useState("");
  const [adminId, setAdminId] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔷 AdminDashboard useEffect running - checking auth");
    // Check localStorage first (persists across refresh)
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
    setIsInitialized(true);
    
    console.log("🔷 Fetching orders, products, and analytics");
    fetchOrders();
    fetchProducts();
    fetchAnalytics();
  }, [navigate]);

  const fetchOrders = async () => {
    console.log("🔷 Fetching orders from API...");
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`);
      console.log("🔷 Orders response status:", res.status);
      const data = await res.json();
      console.log("✅ Orders fetched:", data);
      setOrders(data);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
    }
  };

  const fetchProducts = async () => {
    console.log("🔷 Fetching products from API...");
    try {
      const res = await fetch(`${API_BASE}/api/admin/products`);
      console.log("🔷 Products response status:", res.status);
      const data = await res.json();
      console.log("✅ Products fetched:", data);
      setProducts(data);
    } catch (err) {
      console.error("❌ Error fetching products:", err);
    }
  };

  const fetchAnalytics = async () => {
    console.log("🔷 Fetching analytics from API...");
    try {
      const res = await fetch(`${API_BASE}/api/admin/analytics`);
      console.log("🔷 Analytics response status:", res.status);
      const data = await res.json();
      console.log("✅ Analytics fetched:", data);
      setAnalytics(data);
    } catch (err) {
      console.error("❌ Error fetching analytics:", err);
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

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to delete this order? This will restore inventory.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId, admin_name: adminName }),
      });
      if (res.ok) {
        fetchOrders();
        fetchAnalytics();
      } else {
        alert("Failed to delete order");
      }
    } catch (err) {
      alert("Error deleting order");
    }
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
    // Clear both sessionStorage and localStorage to ensure complete logout
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
        {analytics && (
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
        </div>

        {activeTab === "orders" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Orders Management</h2>
            {orders.length === 0 ? (
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
                            {order.country && <p>Country: {order.country}</p>}
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
                        {order.status === "completed" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeleteOrder(order.id as unknown as number)}
                              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                              Delete Order
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
              <h2 className="text-2xl font-bold text-white">Products Management</h2>
              <button
                onClick={handleAddProduct}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-lg shadow-green-500/30 flex items-center gap-2"
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>
            {products.length === 0 ? (
              <div className="col-span-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-12 text-center border border-gray-800">
                <Package size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg mb-2">No products yet</p>
                <p className="text-gray-500 text-sm">Click "Add Product" to get started</p>
              </div>
            ) : (
              <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
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