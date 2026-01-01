import { useState, useEffect } from "react";
import { X, Plus, Trash2, DollarSign, Edit3, Save, AlertTriangle, Edit2 } from "lucide-react";
import type { Product, ProductVariant } from "@/shared/types";
import VariantModal from "./VariantModal";
import EditVariantModal from "./EditVariantModal";

interface ManageVariantsModalProps {
  product: Product;
  onClose: () => void;
}

export default function ManageVariantsModal({ product, onClose }: ManageVariantsModalProps) {
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState<{ [key: number]: number }>({});

  const fetchVariants = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/admin/products/${product.id}/variants`);
    const data = await res.json();
    setVariants(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchVariants();
  }, [product.id]);

  const handleDeleteVariant = async (variantId: number) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;
    await fetch(`${API_BASE}/api/admin/variants/${variantId}`, { method: "DELETE" });
    fetchVariants();
  };

  const handleAddVariant = () => {
    setShowAddModal(true);
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
  };

  const handleSaveVariant = () => {
    fetchVariants();
  };

  const handleEditStock = (variantId: number, currentStock: number) => {
    setEditingStock({ ...editingStock, [variantId]: currentStock });
  };

  const handleSaveStock = async (variantId: number) => {
    const newStock = editingStock[variantId];
    if (newStock === undefined) return;

    await fetch(`${API_BASE}/api/admin/variants/${variantId}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock_quantity: newStock }),
    });

    const newEditingStock = { ...editingStock };
    delete newEditingStock[variantId];
    setEditingStock(newEditingStock);
    fetchVariants();
  };

  const handleCancelEdit = (variantId: number) => {
    const newEditingStock = { ...editingStock };
    delete newEditingStock[variantId];
    setEditingStock(newEditingStock);
  };

  const getSizesDisplay = (variant: ProductVariant) => {
    if (!variant.available_sizes) return variant.size || 'N/A';
    try {
      const sizes = JSON.parse(variant.available_sizes);
      return sizes.join(', ');
    } catch {
      return variant.size || 'N/A';
    }
  };

  const calculateProfit = (variant: ProductVariant) => {
    if (!variant.cost_price || !variant.selling_price) return null;
    return variant.selling_price - variant.cost_price;
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/30', label: 'Out of Stock' };
    if (stock < 5) return { color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-500/30', label: 'Low Stock' };
    return { color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-500/30', label: 'In Stock' };
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-40">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-green-500/20">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-500 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Manage Variants & Inventory</h2>
            <p className="text-green-100">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-r from-green-900/30 to-gray-800 rounded-lg p-4 mb-6 border border-green-500/30">
            <h3 className="text-white font-semibold mb-2">Inventory Management:</h3>
            <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
              <li>Click "Edit" to change a variant's color, sizes, prices, stock, and image</li>
              <li>Quick stock adjustments available with "Edit Stock" button</li>
              <li>Low stock alerts (less than 5 items) show automatically</li>
              <li>Add new color variants with the "Add Variant" button</li>
            </ul>
          </div>

          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-300 font-medium">
              Color Variants ({variants.length})
            </p>
            <button
              onClick={handleAddVariant}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-green-500/30"
            >
              <Plus size={18} />
              Add Variant
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading variants...</div>
          ) : variants.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-gray-400 mb-4">No variants added yet</p>
              <p className="text-gray-500 text-sm mb-4">Add your first color variant to make this product visible to customers</p>
              <button
                onClick={handleAddVariant}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-lg transition-all"
              >
                Add Your First Variant
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variants.map((variant) => {
                const profit = calculateProfit(variant);
                const stockStatus = getStockStatus(variant.stock_quantity);
                const isEditingThisStock = editingStock[variant.id] !== undefined;
                
                return (
                  <div
                    key={variant.id}
                    className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-green-500/50 transition-all"
                  >
                    {variant.image_url && (
                      <img
                        src={variant.image_url}
                        alt={`${variant.color}`}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-lg">
                            {variant.color}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Sizes: {getSizesDisplay(variant)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditVariant(variant)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Edit variant"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteVariant(variant.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete variant"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 bg-gradient-to-r from-green-900/20 to-gray-700/50 rounded-lg p-3 border border-green-500/20 mb-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Cost Price:</span>
                          <span className="text-white font-medium">
                            KSh {variant.cost_price?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Selling Price:</span>
                          <span className="text-green-400 font-medium">
                            KSh {variant.selling_price?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        {profit !== null && (
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-600">
                            <span className="text-gray-400 flex items-center gap-1">
                              <DollarSign size={14} />
                              Profit/Unit:
                            </span>
                            <span className={`font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              KSh {profit.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={`${stockStatus.bg} ${stockStatus.border} rounded-lg p-3 border`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">Stock:</span>
                            {variant.stock_quantity < 5 && variant.stock_quantity > 0 && (
                              <AlertTriangle size={14} className="text-yellow-400" />
                            )}
                          </div>
                          {!isEditingThisStock && (
                            <button
                              onClick={() => handleEditStock(variant.id, variant.stock_quantity)}
                              className="text-green-400 hover:text-green-300 transition-colors"
                              title="Edit stock"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                        </div>
                        
                        {isEditingThisStock ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={editingStock[variant.id]}
                              onChange={(e) => setEditingStock({ 
                                ...editingStock, 
                                [variant.id]: parseInt(e.target.value) || 0 
                              })}
                              className="input-field flex-1 text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveStock(variant.id)}
                              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors"
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => handleCancelEdit(variant.id)}
                              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className={`${stockStatus.color} font-bold text-2xl`}>
                              {variant.stock_quantity}
                            </span>
                            <span className={`${stockStatus.color} text-xs font-medium`}>
                              {stockStatus.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <VariantModal
          product={product}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveVariant}
        />
      )}

      {editingVariant && (
        <EditVariantModal
          product={product}
          variant={editingVariant}
          onClose={() => setEditingVariant(null)}
          onSave={handleSaveVariant}
        />
      )}
    </div>
  );
}