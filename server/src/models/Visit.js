// server/src/models/Visit.js
const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  ip_address: String,
  user_agent: String,
  page_url: String,
  referrer: String,
  timestamp: { type: Date, default: Date.now },
  
  // Browser & Device info
  browser: String,
  browser_version: String,
  os: String,
  device_type: String, // mobile, tablet, desktop
  
  // Geographic data (optional - requires IP geolocation)
  country: String,
  city: String,
  region: String,
  
  // Session tracking
  session_id: String,
  is_unique: { type: Boolean, default: true },
  
  // Engagement metrics
  time_on_page: Number, // in seconds
  
  // UTM parameters for marketing tracking
  utm_source: String,
  utm_medium: String,
  utm_campaign: String,
  
  // Product tracking (for product clicks)
  product_id: Number,
  product_name: String,
  product_image_url: String
});

// Index for faster queries
visitSchema.index({ timestamp: -1 });
visitSchema.index({ ip_address: 1, timestamp: -1 });
visitSchema.index({ session_id: 1 });

module.exports = mongoose.model('Visit', visitSchema);