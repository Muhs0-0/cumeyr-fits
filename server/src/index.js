require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Product = require('./models/Product');
const Variant = require('./models/Variant');
const Order = require('./models/Order');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/files', express.static(uploadsDir));

// Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, unique);
  }
});
const upload = multer({ storage });

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error', err));

// Admin credentials (env or fallback) - support 2 admins
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'muhsoo';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'muhsoo123';
const ADMIN2_USERNAME = process.env.ADMIN2_USERNAME || 'cumeyr';
const ADMIN2_PASSWORD = process.env.ADMIN2_PASSWORD || 'cumeyr123';

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  // console.log('Login attempt:', { username, password, envAdmin1: ADMIN_USERNAME, envAdmin2: ADMIN2_USERNAME });
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ success: true, admin_id: 'admin1', admin_name: ADMIN_USERNAME, message: 'Login successful' });
  }
  if (username === ADMIN2_USERNAME && password === ADMIN2_PASSWORD) {
    return res.json({ success: true, admin_id: 'admin2', admin_name: ADMIN2_USERNAME, message: 'Login successful' });
  }
  console.log('Login failed - invalid credentials');
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  const key = `files/${req.file.filename}`;
  // Return full URL so frontend can display image correctly
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
  return res.json({ url: `${backendUrl}/${key}` });
});

// Get products
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    const match = { is_active: true };
    if (category && category !== 'all') match.category = category;

    // Find products and ensure they have at least one variant
    const products = await Product.find(match).sort({ created_at: -1 }).lean();
    // Attach first variant count existence
    const result = await Promise.all(products.map(async (p) => {
      const count = await Variant.countDocuments({ product: p._id });
      return count > 0 ? { ...p, id: p._id } : null;
    }));
    return res.json(result.filter(Boolean));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch products' });
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
  try {
    const orders = await Order.find().sort({ created_at: -1 }).lean();
    // Enrich with variant pricing and map _id to id
    const enriched = await Promise.all(orders.map(async (o) => {
      const pv = await Variant.findById(o.variant_id).select('cost_price selling_price').lean();
      return { ...o, id: o._id, cost_price: pv?.cost_price || 0, selling_price: pv?.selling_price || 0, profit: ((pv?.selling_price || 0) - (pv?.cost_price || 0)) * o.quantity };
    }));
    return res.json(enriched);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin analytics
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const approvedOrders = await Order.countDocuments({ status: 'completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    const pendingOrders = await Order.countDocuments({ $or: [{ status: 'pending' }, { status: 'confirmed' }] });
    const totalProducts = await Product.countDocuments({ is_active: true });

    const revenueAgg = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $lookup: { from: 'variants', localField: 'variant_id', foreignField: '_id', as: 'pv' } },
      { $unwind: { path: '$pv', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, total_revenue: { $sum: { $multiply: [ '$pv.selling_price', '$quantity' ] } }, total_profit: { $sum: { $multiply: [ { $subtract: [ '$pv.selling_price', '$pv.cost_price' ] }, '$quantity' ] } } } }
    ]);

    const inventoryAgg = await Variant.aggregate([
      { $group: { _id: null, inventory_value: { $sum: { $multiply: [ '$cost_price', '$stock_quantity' ] } } } }
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
    console.error(err);
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
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Only approved (completed) orders can be deleted' });
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

app.patch('/api/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await Product.findByIdAndUpdate(id, {
      name: data.name,
      description: data.description,
      category: data.category,
      image_url: data.image_url,
      available_sizes: data.available_sizes || '[]',
      is_active: data.is_active ? true : false,
    });
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
