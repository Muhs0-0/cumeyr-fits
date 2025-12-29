const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name: { type: String, required: true },
  size: String,
  color: String,
  quantity: { type: Number, required: true },
  phone_number: { type: String, required: true },
  country: String,
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
  status: { type: String, enum: ['pending','confirmed','completed','cancelled'], default: 'pending' },
  approved_by: {
    admin_id: String,
    admin_name: String,
    timestamp: { type: Date, default: null }
  },
  deleted_by: {
    admin_id: String,
    admin_name: String,
    timestamp: { type: Date, default: null }
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Order', OrderSchema);
