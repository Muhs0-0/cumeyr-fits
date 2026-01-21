// server/src/models/ProductView.js
const mongoose = require('mongoose');

const productViewSchema = new mongoose.Schema({
  // Product info
  product_id: { type: Number, required: true },
  product_name: { type: String, required: true },
  product_image_url: { type: String },
  product_category: String,
  
  // Visitor info
  ip_address: String,
  user_agent: String,
  
  // Browser & Device info
  browser: String,
  browser_version: String,
  os: String,
  os_version: String,
  device_type: String, // mobile, tablet, desktop
  
  // Geographic data (optional)
  country: String,
  city: String,
  region: String,
  
  // Session tracking
  session_id: String,
  is_unique: { type: Boolean, default: true }, // First time viewing this product
  
  // Timestamp
  timestamp: { type: Date, default: Date.now },
  
  // Engagement metrics
  time_spent_on_product: Number, // in seconds (can be updated if needed)
  
  // UTM parameters
  utm_source: String,
  utm_medium: String,
  utm_campaign: String
});

// Indexes for faster queries
productViewSchema.index({ product_id: 1, timestamp: -1 });
productViewSchema.index({ product_id: 1, ip_address: 1 });
productViewSchema.index({ timestamp: -1 });
productViewSchema.index({ session_id: 1 });

module.exports = mongoose.model('ProductView', productViewSchema);
