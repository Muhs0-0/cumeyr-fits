require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');

const Product = require('./models/Product');
const Variant = require('./models/Variant');
const Order = require('./models/Order');
const Visit = require('./models/Visit');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'https://cumeyr-fits-production.up.railway.app',
    'https://qaf-fits.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage (no local files)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI_ONLINE;
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB '))
  .catch(err => console.error('MongoDB connection error', err));

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'muhsoo';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'muhsoo123';
const ADMIN2_USERNAME = process.env.ADMIN2_USERNAME || 'cumeyr';
const ADMIN2_PASSWORD = process.env.ADMIN2_PASSWORD || 'cumeyr123';

// Helper function to parse user agent
function parseUserAgent(userAgent) {
  const ua = userAgent.toLowerCase();
  
  // Detect browser
  let browser = 'Unknown';
  let browser_version = '';
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'MacOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  // Detect device type
  let device_type = 'desktop';
  if (ua.includes('mobile')) device_type = 'mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device_type = 'tablet';
  
  return { browser, browser_version, os, device_type };
}

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  console.log('🔷 [LOGIN] Attempt with username:', username);

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    console.log('✅ [LOGIN] Admin1 authenticated:', ADMIN_USERNAME);
    return res.json({ success: true, admin_id: 'admin1', admin_name: ADMIN_USERNAME, message: 'Login successful' });
  }
  if (username === ADMIN2_USERNAME && password === ADMIN2_PASSWORD) {
    console.log('✅ [LOGIN] Admin2 authenticated:', ADMIN2_USERNAME);
    return res.json({ success: true, admin_id: 'admin2', admin_name: ADMIN2_USERNAME, message: 'Login successful' });
  }
  console.log('❌ [LOGIN] Failed - invalid credentials');
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Track page visit with detailed analytics
app.post('/api/track-visit', async (req, res) => {
  try {
    const { page_url, referrer, session_id, utm_source, utm_medium, utm_campaign } = req.body;
    
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Parse user agent for device/browser info
    const deviceInfo = parseUserAgent(userAgent);
    
    // Check if this is a unique visitor (same IP in last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingVisit = await Visit.findOne({
      ip_address: ip,
      timestamp: { $gte: yesterday }
    });
    
    await Visit.create({
      ip_address: ip,
      user_agent: userAgent,
      page_url: page_url || '/',
      referrer: referrer || 'direct',
      session_id: session_id || null,
      is_unique: !existingVisit,
      utm_source,
      utm_medium,
      utm_campaign,
      ...deviceInfo
    });
    
    return res.json({ success: true });
  } catch (err) {
    console.error('Visit tracking error:', err);
    return res.json({ success: false });
  }
});

// Get comprehensive visit analytics
app.get('/api/admin/visits/analytics', async (req, res) => {
  try {
    // Time periods
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Basic counts
    const totalVisits = await Visit.countDocuments();
    const visitsToday = await Visit.countDocuments({ timestamp: { $gte: todayStart } });
    const visitsYesterday = await Visit.countDocuments({
      timestamp: { $gte: yesterdayStart, $lt: todayStart }
    });
    const visitsLast7Days = await Visit.countDocuments({ timestamp: { $gte: last7Days } });
    const visitsLast30Days = await Visit.countDocuments({ timestamp: { $gte: last30Days } });
    
    // Unique visitors
    const uniqueVisitsToday = await Visit.countDocuments({
      timestamp: { $gte: todayStart },
      is_unique: true
    });
    const uniqueVisitsLast7Days = await Visit.countDocuments({
      timestamp: { $gte: last7Days },
      is_unique: true
    });

    // Page views breakdown
    const topPages = await Visit.aggregate([
      { $match: { timestamp: { $gte: last7Days } } },
      { $group: { _id: '$page_url', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Device breakdown
    const deviceStats = await Visit.aggregate([
      { $match: { timestamp: { $gte: last7Days } } },
      { $group: { _id: '$device_type', count: { $sum: 1 } } }
    ]);

    // Browser breakdown
    const browserStats = await Visit.aggregate([
      { $match: { timestamp: { $gte: last7Days } } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // OS breakdown
    const osStats = await Visit.aggregate([
      { $match: { timestamp: { $gte: last7Days } } },
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Traffic sources (referrer analysis)
    const trafficSources = await Visit.aggregate([
      { $match: { timestamp: { $gte: last7Days } } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$referrer', 'direct'] },
              'Direct Traffic',
              {
                $cond: [
                  { $regexMatch: { input: '$referrer', regex: 'google' } },
                  'Google',
                  {
                    $cond: [
                      { $regexMatch: { input: '$referrer', regex: 'facebook' } },
                      'Facebook',
                      {
                        $cond: [
                          { $regexMatch: { input: '$referrer', regex: 'instagram' } },
                          'Instagram',
                          {
                            $cond: [
                              { $regexMatch: { input: '$referrer', regex: 'twitter|x.com' } },
                              'Twitter/X',
                              'Other Referrals'
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Hourly visits for today (for chart)
    const hourlyVisitsToday = await Visit.aggregate([
      { $match: { timestamp: { $gte: todayStart } } },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Daily visits for last 7 days (for chart)
    const dailyVisits = await Visit.aggregate([
      { $match: { timestamp: { $gte: last7Days } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          total: { $sum: 1 },
          unique: { $sum: { $cond: ['$is_unique', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Recent visitors (last 20)
    const recentVisits = await Visit.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .select('ip_address page_url referrer timestamp browser os device_type is_unique')
      .lean();

    // Calculate growth rate (today vs yesterday)
    const growthRate = visitsYesterday > 0 
      ? ((visitsToday - visitsYesterday) / visitsYesterday * 100).toFixed(1)
      : visitsToday > 0 ? 100 : 0;

    return res.json({
      total_visits: totalVisits,
      visits_today: visitsToday,
      visits_yesterday: visitsYesterday,
      visits_last_7_days: visitsLast7Days,
      visits_last_30_days: visitsLast30Days,
      unique_visits_today: uniqueVisitsToday,
      unique_visits_last_7_days: uniqueVisitsLast7Days,
      growth_rate: parseFloat(growthRate),
      top_pages: topPages,
      device_stats: deviceStats,
      browser_stats: browserStats,
      os_stats: osStats,
      traffic_sources: trafficSources,
      hourly_visits_today: hourlyVisitsToday,
      daily_visits: dailyVisits,
      recent_visits: recentVisits
    });
  } catch (err) {
    console.error('Error fetching visit analytics:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Upload endpoint - NOW USING CLOUDINARY
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('🔷 Upload request received');
    console.log('🔷 File:', req.file ? req.file.originalname : 'NO FILE');
    console.log('🔷 Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
    });

    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'No file provided' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'cumeyr-fits',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary success:', result.secure_url);
            resolve(result);
          }
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    console.log('✅ Image uploaded to Cloudinary:', result.secure_url);
    return res.json({ url: result.secure_url });
  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('❌ Error details:', error.message, error.stack);
    return res.status(500).json({
      error: 'Upload failed',
      details: error.message
    });
  }
});

// Get product variants
app.get('/api/products/:id/variants', async (req, res) => {
  try {
    const { id } = req.params;
    const variants = await Variant.find({ product: id, stock_quantity: { $gt: 0 } }).sort({ size: 1, color: 1 }).lean();
    // Convert product refs to id fields for compatibility
    const mapped = variants.map(v => ({ ...v, id: v._id, product_id: v.product }));
    return res.json(mapped);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch variants' });
  }
});

// Public: Get all active products (for customers)
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;

    // Build query - only show active products with available stock
    const query = { is_active: true };
    if (category) query.category = category;

    const products = await Product.find(query).sort({ created_at: -1 }).lean();

    // For each product, check if it has any variants with stock > 0
    const productsWithStock = await Promise.all(
      products.map(async (p) => {
        const variantsWithStock = await Variant.countDocuments({
          product: p._id,
          stock_quantity: { $gt: 0 }
        });

        // Only return products that have at least one variant with stock
        if (variantsWithStock > 0) {
          return { ...p, id: p._id };
        }
        return null;
      })
    );

    // Filter out null values (products without stock)
    const availableProducts = productsWithStock.filter(p => p !== null);

    return res.json(availableProducts);
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Check variant stock
app.get('/api/variants/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const variant = await Variant.findById(id).select('color stock_quantity').lean();
    if (!variant) return res.status(404).json({ error: 'Variant not found' });
    return res.json({ id: variant._id, color: variant.color, stock_quantity: variant.stock_quantity });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch stock' });
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const data = req.body;
    if (!data.variant_id || !data.quantity) return res.status(400).json({ error: 'Invalid payload' });

    // Atomically decrement stock if enough exists
    const variant = await Variant.findOneAndUpdate(
      { _id: data.variant_id, stock_quantity: { $gte: data.quantity } },
      { $inc: { stock_quantity: -data.quantity } },
      { new: true }
    );

    if (!variant) {
      const current = await Variant.findById(data.variant_id).select('stock_quantity').lean();
      return res.status(400).json({ success: false, error: 'Insufficient stock', available: current?.stock_quantity || 0 });
    }

    const order = await Order.create({
      product_id: data.product_id,
      product_name: data.product_name,
      size: data.size,
      color: data.color,
      quantity: data.quantity,
      phone_number: data.phone_number,
      country: data.country,
      variant_id: data.variant_id,
      status: 'pending'
    });

    return res.json({ success: true, order_id: order._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

// Admin: get orders
app.get('/api/admin/orders', async (req, res) => {
  console.log('🔷 [GET /api/admin/orders] Request received');
  try {
    const orders = await Order.find().sort({ created_at: -1 }).lean();
    console.log('🔷 [GET /api/admin/orders] Found', orders.length, 'orders');
    // Enrich with variant pricing and map _id to id
    const enriched = await Promise.all(orders.map(async (o) => {
      const pv = await Variant.findById(o.variant_id).select('cost_price selling_price').lean();
      return { ...o, id: o._id, cost_price: pv?.cost_price || 0, selling_price: pv?.selling_price || 0, profit: ((pv?.selling_price || 0) - (pv?.cost_price || 0)) * o.quantity };
    }));
    console.log('✅ [GET /api/admin/orders] Returning', enriched.length, 'orders');
    return res.json(enriched);
  } catch (err) {
    console.error('❌ [GET /api/admin/orders] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin analytics
app.get('/api/admin/analytics', async (req, res) => {
  console.log('🔷 [GET /api/admin/analytics] Request received');
  try {
    const totalOrders = await Order.countDocuments();
    const approvedOrders = await Order.countDocuments({ status: 'completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    const pendingOrders = await Order.countDocuments({ $or: [{ status: 'pending' }, { status: 'confirmed' }] });
    const totalProducts = await Product.countDocuments({ is_active: true });

    console.log('🔷 [GET /api/admin/analytics] Counts - Orders:', totalOrders, 'Products:', totalProducts);

    const revenueAgg = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $lookup: { from: 'variants', localField: 'variant_id', foreignField: '_id', as: 'pv' } },
      { $unwind: { path: '$pv', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, total_revenue: { $sum: { $multiply: ['$pv.selling_price', '$quantity'] } }, total_profit: { $sum: { $multiply: [{ $subtract: ['$pv.selling_price', '$pv.cost_price'] }, '$quantity'] } } } }
    ]);

    const inventoryAgg = await Variant.aggregate([
      { $group: { _id: null, inventory_value: { $sum: { $multiply: ['$cost_price', '$stock_quantity'] } } } }
    ]);

    const lowStockVariants = await Variant.aggregate([
      { $match: { stock_quantity: { $lt: 5, $gt: 0 } } },
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'p' } },
      { $unwind: '$p' },
      { $project: { 'p.name': 1, color: 1, stock_quantity: 1, product_id: '$product', id: '$_id' } }
    ]);

    const outOfStockVariants = await Variant.aggregate([
      { $match: { stock_quantity: 0 } },
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'p' } },
      { $unwind: '$p' },
      { $project: { 'p.name': 1, color: 1, stock_quantity: 1, product_id: '$product', id: '$_id' } }
    ]);

    console.log('✅ [GET /api/admin/analytics] Revenue:', revenueAgg[0]?.total_revenue, 'Inventory Value:', inventoryAgg[0]?.inventory_value);
    return res.json({
      total_orders: totalOrders,
      approved_orders: approvedOrders,
      cancelled_orders: cancelledOrders,
      pending_orders: pendingOrders,
      total_products: totalProducts,
      total_revenue: revenueAgg[0]?.total_revenue || 0,
      total_profit: revenueAgg[0]?.total_profit || 0,
      inventory_value: inventoryAgg[0]?.inventory_value || 0,
      low_stock_variants: lowStockVariants,
      out_of_stock_variants: outOfStockVariants,
    });
  } catch (err) {
    console.error('❌ [GET /api/admin/analytics] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Admin: update order status
app.patch('/api/admin/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_id, admin_name } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // When completing (customer received product), decrement stock
    if (status === 'completed' && order.status !== 'completed') {
      await Variant.findByIdAndUpdate(order.variant_id, { $inc: { stock_quantity: -order.quantity } });
      // Track who approved/confirmed the sale
      order.approved_by = {
        admin_id: admin_id || 'unknown',
        admin_name: admin_name || 'Unknown Admin',
        timestamp: new Date()
      };
    }

    // If reverting completed to cancelled, restore stock
    if (status === 'cancelled' && order.status === 'completed') {
      await Variant.findByIdAndUpdate(order.variant_id, { $inc: { stock_quantity: order.quantity } });
    }

    order.status = status;
    await order.save();
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update order' });
  }
});

// Admin: delete order (only completed orders, with cascading logic)
app.delete('/api/admin/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id, admin_name } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Only allow deletion of completed orders
    if (order.status === 'completed') {
      return res.status(400).json({ error: 'Only approved (completed) orders cannot be deleted' });
    }

    // Restore stock to inventory
    await Variant.findByIdAndUpdate(order.variant_id, { $inc: { stock_quantity: order.quantity } });

    // Mark as deleted with audit trail instead of fully deleting
    order.status = 'cancelled';
    order.deleted_by = {
      admin_id: admin_id || 'unknown',
      admin_name: admin_name || 'Unknown Admin',
      timestamp: new Date()
    };
    await order.save();

    return res.json({ success: true, message: 'Order deleted and stock restored' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Admin: products
app.get('/api/admin/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ created_at: -1 }).lean();
    const mapped = products.map(p => ({ ...p, id: p._id }));
    return res.json(mapped);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single variant by ID (for order display)
app.get('/api/admin/variants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const variant = await Variant.findById(id).lean();
    if (!variant) return res.status(404).json({ error: 'Variant not found' });
    return res.json({ ...variant, id: variant._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch variant' });
  }
});

app.post('/api/admin/products', async (req, res) => {
  try {
    const data = req.body;
    const prod = await Product.create({
      name: data.name,
      description: data.description,
      category: data.category,
      image_url: data.image_url,
      available_sizes: data.available_sizes || '[]',
      is_active: data.is_active !== undefined ? data.is_active : true,
    });

    // first_variant
    if (data.first_variant) {
      await Variant.create({
        product: prod._id,
        size: '',
        color: data.first_variant.color,
        cost_price: data.first_variant.cost_price,
        selling_price: data.first_variant.selling_price,
        stock_quantity: data.first_variant.stock_quantity || 10,
        image_url: data.first_variant.image_url,
        available_sizes: data.first_variant.available_sizes || '[]'
      });
    }

    return res.json({ success: true, product_id: prod._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});


// Add this NEW endpoint for updating variants
app.patch('/api/admin/variants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    await Variant.findByIdAndUpdate(id, {
      color: data.color,
      cost_price: data.cost_price,
      selling_price: data.selling_price,
      stock_quantity: data.stock_quantity,
      image_url: data.image_url,
      available_sizes: data.available_sizes
    });

    console.log(`✅ Updated variant ${id}`);
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Error updating variant:', err);
    return res.status(500).json({ error: 'Failed to update variant' });
  }
});

// Update the product PATCH endpoint (REPLACE the existing one)
app.patch('/api/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Update the product
    await Product.findByIdAndUpdate(id, {
      name: data.name,
      description: data.description,
      category: data.category,
      image_url: data.image_url,
      available_sizes: data.available_sizes || '[]',
      is_active: data.is_active ? true : false,
    });

    // If available_sizes changed, update ALL variants to have the new product sizes
    if (data.available_sizes) {
      try {
        const newProductSizes = JSON.parse(data.available_sizes);

        // Get all variants for this product
        const variants = await Variant.find({ product: id });

        console.log(`🔷 Updating ${variants.length} variants with new sizes:`, newProductSizes);

        // Update each variant - REPLACE their sizes with new product sizes
        for (const variant of variants) {
          await Variant.findByIdAndUpdate(variant._id, {
            available_sizes: JSON.stringify(newProductSizes)
          });
        }

        console.log(`✅ Updated sizes for ${variants.length} variants of product ${id}`);
      } catch (parseError) {
        console.error('❌ Error parsing/updating variant sizes:', parseError);
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Variant.deleteMany({ product: id });
    await Product.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Admin: add variant
app.post('/api/admin/variants', async (req, res) => {
  try {
    const data = req.body;
    const v = await Variant.create({
      product: data.product_id,
      size: '',
      color: data.color,
      cost_price: data.cost_price,
      selling_price: data.selling_price,
      stock_quantity: data.stock_quantity,
      image_url: data.image_url,
      available_sizes: data.available_sizes || '[]'
    });
    return res.json({ success: true, variant_id: v._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create variant' });
  }
});

// Update variant stock
app.patch('/api/admin/variants/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;
    await Variant.findByIdAndUpdate(id, { stock_quantity });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Admin: get variants for product
app.get('/api/admin/products/:id/variants', async (req, res) => {
  try {
    const { id } = req.params;
    const variants = await Variant.find({ product: id }).sort({ size: 1, color: 1 }).lean();
    const mapped = variants.map(v => ({ ...v, id: v._id }));
    return res.json(mapped);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch variants' });
  }
});

app.delete('/api/admin/variants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Variant.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete variant' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));