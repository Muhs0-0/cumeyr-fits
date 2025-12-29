const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  size: String,
  color: String,
  cost_price: { type: Number, default: 0 },
  selling_price: { type: Number, default: 0 },
  stock_quantity: { type: Number, default: 0 },
  image_url: String,
  available_sizes: { type: String, default: '[]' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Variant', VariantSchema);
