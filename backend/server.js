const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OAuth2Client } = require('google-auth-library');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-tres-securise';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vitapharm';
const GOOGLE_CLIENT_ID ='775881234717-36l5t936hnf5pj8f7uhjg8hf17dm46h3.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Connexion MongoDB avec meilleure gestion d'erreur
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connecté avec succès');
    console.log('🔗 Database:', MONGODB_URI);
  })
  .catch(err => {
    console.error('❌ Erreur connexion MongoDB:', err.message);
    process.exit(1);
  });

// Configuration Multer pour upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Schémas MongoDB
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: String,
  address: String,
  city: String,
  googleId: String,      // NEW
  picture: String,       // NEW
  createdAt: { type: Date, default: Date.now }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  image: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  image: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: String, required: true },
  originalPrice: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
  image: String,
  gallery: [String],
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  ratingBreakdown: {
    5: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    1: { type: Number, default: 0 }
  },
  badge: String,
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: String,
    quantity: { type: Number, required: true }
  }],
  customerInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    notes: String
  },
  totalPrice: { type: Number, required: true },
  deliveryFee: { type: Number, default: 15 },
  finalTotal: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String, default: 'COD' },
  orderNumber: String,
  createdAt: { type: Date, default: Date.now }
});
const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, maxlength: 100 },
  comment: { type: String, required: true, maxlength: 1000 },
  isVerifiedPurchase: { type: Boolean, default: false },
  helpfulVotes: { type: Number, default: 0 },
  unhelpfulVotes: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  adminResponse: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-generate order number
orderSchema.pre('save', async function() {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `VTB-${Date.now()}-${count + 1}`;
  }
});

// Modèles
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const SubCategory = mongoose.model('SubCategory', subCategorySchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
// Create compound index to prevent duplicate reviews from same user for same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Review Model
const Review = mongoose.model('Review', reviewSchema);

// Helper function to update product rating statistics
const updateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId, status: 'approved' });
  
  if (reviews.length === 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
    return;
  }

  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
  
  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    ratingBreakdown[review.rating]++;
  });

  await Product.findByIdAndUpdate(productId, {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratingBreakdown
  });
};
// Middleware d'authentification
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token requis' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Token invalide' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès administrateur requis' });
  }
  next();
};

// Global error handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// ==================== AUTHENTIFICATION ====================

// Inscription
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, city } = req.body;
    
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ name, email, password: hashedPassword, phone, address, city });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ 
      message: 'Compte créé avec succès',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Connexion
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Identifiants invalides' });
    }
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ 
      message: 'Connexion réussie',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Profil utilisateur
app.get('/api/auth/profile', auth, async (req, res) => {
  res.json(req.user);
});

// ==================== CATÉGORIES ====================

// Toutes les catégories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une catégorie (Admin)
app.post('/api/categories', auth, adminAuth, upload.single('image'), async (req, res) => {
  try {
    const categoryData = req.body;
    if (req.file) {
      categoryData.image = `/uploads/${req.file.filename}`;
    }
    
    const category = new Category(categoryData);
    await category.save();
    res.status(201).json({ message: 'Catégorie créée', category });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Cette catégorie existe déjà' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier une catégorie (Admin)
app.put('/api/categories/:id', auth, adminAuth, upload.single('image'), async (req, res) => {
  try {
    const updateData = req.body;
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }
    
    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    
    res.json({ message: 'Catégorie mise à jour', category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une catégorie (Admin)
app.delete('/api/categories/:id', auth, adminAuth, async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    await SubCategory.updateMany({ category: req.params.id }, { isActive: false });
    await Product.updateMany({ category: req.params.id }, { isActive: false });
    res.json({ message: 'Catégorie désactivée' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== SOUS-CATÉGORIES ====================

// Toutes les sous-catégories
app.get('/api/subcategories', async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    
    const subCategories = await SubCategory.find(query)
      .populate('category', 'name')
      .sort({ name: 1 });
    res.json(subCategories);
  } catch (error) {
    console.error('Subcategories error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une sous-catégorie (Admin)
app.post('/api/subcategories', auth, adminAuth, upload.single('image'), async (req, res) => {
  try {
    const subCategoryData = req.body;
    if (req.file) {
      subCategoryData.image = `/uploads/${req.file.filename}`;
    }
    
    const subCategory = new SubCategory(subCategoryData);
    await subCategory.save();
    res.status(201).json({ message: 'Sous-catégorie créée', subCategory });
  } catch (error) {
    console.error('Create subcategory error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier une sous-catégorie (Admin)
app.put('/api/subcategories/:id', auth, adminAuth, upload.single('image'), async (req, res) => {
  try {
    const updateData = req.body;
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }
    
    const subCategory = await SubCategory.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!subCategory) {
      return res.status(404).json({ error: 'Sous-catégorie non trouvée' });
    }
    
    res.json({ message: 'Sous-catégorie mise à jour', subCategory });
  } catch (error) {
    console.error('Update subcategory error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une sous-catégorie (Admin)
app.delete('/api/subcategories/:id', auth, adminAuth, async (req, res) => {
  try {
    await SubCategory.findByIdAndUpdate(req.params.id, { isActive: false });
    await Product.updateMany({ subCategory: req.params.id }, { isActive: false });
    res.json({ message: 'Sous-catégorie désactivée' });
  } catch (error) {
    console.error('Delete subcategory error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== PRODUITS ====================

// Tous les produits avec filtres
app.get('/api/products', async (req, res) => {
  try {
    const { category, subCategory, search, page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = { isActive: true };
    
    // Don't filter by inStock in admin panel
    if (req.query.inStock !== undefined) {
      query.inStock = req.query.inStock === 'true';
    }
    
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (search) query.name = { $regex: search, $options: 'i' };
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Product.countDocuments(query);
    res.json({ products, total, pages: Math.ceil(total / limit), currentPage: parseInt(page) });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Produit par ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('subCategory', 'name');
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    res.json(product);
  } catch (error) {
    console.error('Product by ID error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un produit (Admin)
app.post('/api/products', auth, adminAuth, upload.array('images', 5), async (req, res) => {
  try {
    const productData = req.body;
    
    if (req.files && req.files.length > 0) {
      productData.image = `/uploads/${req.files[0].filename}`;
      productData.gallery = req.files.map(file => `/uploads/${file.filename}`);
    }
    
    const product = new Product(productData);
    await product.save();
    res.status(201).json({ message: 'Produit créé', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un produit (Admin)
app.put('/api/products/:id', auth, adminAuth, upload.array('images', 5), async (req, res) => {
  try {
    const updateData = req.body;
    
    if (req.files && req.files.length > 0) {
      updateData.image = `/uploads/${req.files[0].filename}`;
      updateData.gallery = req.files.map(file => `/uploads/${file.filename}`);
    }
    
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    res.json({ message: 'Produit mis à jour', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un produit (Admin)
app.delete('/api/products/:id', auth, adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Produit désactivé' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== COMMANDES ====================

// Créer une commande
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json({ message: 'Commande créée avec succès', order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
});

// Commandes utilisateur
app.get('/api/orders/user', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('User orders error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;

    // Validate input
    if (!credential) {
      console.error('Missing credential in request');
      return res.status(400).json({ error: 'Credential manquant' });
    }

    // Check if Google Client ID is configured
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
      console.error('Google Client ID not configured');
      return res.status(500).json({ 
        error: 'Google Sign-In n\'est pas configuré sur le serveur. Veuillez contacter l\'administrateur.' 
      });
    }

    console.log('Verifying Google token...');

    // Verify Google token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return res.status(401).json({ 
        error: 'Token Google invalide. Veuillez réessayer.' 
      });
    }

    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      console.error('Invalid payload from Google token');
      return res.status(400).json({ error: 'Données Google invalides' });
    }

    const { email, name, picture, sub: googleId } = payload;
    console.log('Google auth successful for:', email);

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      console.log('Existing user found:', user.email);
      // User exists, update Google ID and picture if not set
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.picture && picture) {
        user.picture = picture;
      }
      await user.save();
    } else {
      console.log('Creating new user for:', email);
      // Create new user
      user = new User({
        name: name || email.split('@')[0],
        email,
        googleId,
        picture,
        // Generate a random password for Google users (they won't use it)
        password: await bcrypt.hash(Math.random().toString(36) + Date.now(), 12),
        role: 'user'
      });
      await user.save();
      console.log('New user created:', user.email);
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

    console.log('JWT token generated for user:', user.email);

    res.json({
      message: 'Connexion Google réussie',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'authentification Google',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// ==================== ADMIN ROUTES (NEW) ====================

// Admin Orders - matches your frontend call to /admin/orders
app.get('/api/admin/orders', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 100, status } = req.query;
    const query = status ? { status } : {};
    
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Return direct array as your frontend expects
    res.json(orders);
  } catch (error) {
    console.error('Admin orders error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin Users - matches your frontend call to /admin/users  
app.get('/api/admin/users', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Return direct array as your frontend expects
    res.json(users);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update order status - Admin
app.patch('/api/admin/orders/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json({ message: 'Statut mis à jour', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== LEGACY ROUTES (Keep for compatibility) ====================

// Original orders route (for non-admin access)
app.get('/api/orders', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const query = status ? { status } : {};
    
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(query);
    res.json({ orders, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Original users route (for non-admin access)
app.get('/api/users', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments({ role: { $ne: 'admin' } });
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Original update order status route
app.patch('/api/orders/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json({ message: 'Statut mis à jour', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== STATISTIQUES ADMIN ====================

app.get('/api/admin/stats', auth, adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalOrders, totalProducts, totalCategories, recentOrders] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);
    
    res.json({ 
      totalUsers, 
      totalOrders, 
      totalProducts, 
      totalCategories, 
      recentOrders 
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== DEBUG ROUTE ====================

// Debug route for testing admin endpoints
app.get('/api/debug/admin', auth, adminAuth, async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      totalOrders: await Order.countDocuments(),
      totalProducts: await Product.countDocuments({ isActive: true }),
      totalCategories: await Category.countDocuments({ isActive: true })
    };
    
    const recentOrders = await Order.find().limit(3).sort({ createdAt: -1 });
    const recentUsers = await User.find().limit(3).sort({ createdAt: -1 }).select('-password');
    
    res.json({
      message: 'Debug info for admin panel',
      stats,
      recentOrders,
      recentUsers,
      userRole: req.user.role,
      userId: req.user._id
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed', details: error.message });
  }
});

// Créer un admin par défaut au démarrage
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const admin = new User({
        name: 'Administrateur',
        email: 'admin@vitapharm.tn',
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('🔑 Admin par défaut créé:');
      console.log('   Email: admin@vitapharm.tn');
      console.log('   Password: admin123');
      console.log('⚠️  Changez ce mot de passe en production!');
    }
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
  }
};
// Get reviews for a product
app.get('/api/products/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', rating } = req.query;
    
    const query = { 
      product: productId, 
      status: 'approved' 
    };
    
    if (rating) {
      query.rating = parseInt(rating);
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const reviews = await Review.find(query)
      .populate('user', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments(query);
    
    // Get rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingStats.forEach(stat => {
      ratingBreakdown[stat._id] = stat.count;
    });
    
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
    
    res.json({
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: total,
        ratingBreakdown
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des avis' });
  }
});

// Create a review (authenticated users only)
app.post('/api/products/:productId/reviews', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;
    
    // Validate input
    if (!rating || !title || !comment) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5' });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ product: productId, user: req.user._id });
    if (existingReview) {
      return res.status(400).json({ error: 'Vous avez déjà donné votre avis sur ce produit' });
    }
    
    // Check if user purchased this product (optional)
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      status: { $in: ['delivered', 'completed'] }
    });
    
    const review = new Review({
      product: productId,
      user: req.user._id,
      rating: parseInt(rating),
      title: title.trim(),
      comment: comment.trim(),
      isVerifiedPurchase: !!hasPurchased
    });
    
    await review.save();
    
    // Update product rating statistics
    await updateProductRating(productId);
    
    // Populate user data for response
    await review.populate('user', 'name');
    
    res.status(201).json({
      message: 'Avis créé avec succès',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Vous avez déjà donné votre avis sur ce produit' });
    }
    res.status(500).json({ error: 'Erreur lors de la création de l\'avis' });
  }
});

// Update a review (only the author can update)
app.put('/api/reviews/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Avis non trouvé' });
    }
    
    // Check if user owns this review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    
    // Update review
    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.status = 'pending'; // Reset to pending for re-approval
    review.updatedAt = new Date();
    
    await review.save();
    await updateProductRating(review.product);
    
    res.json({
      message: 'Avis mis à jour avec succès',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'avis' });
  }
});

// Delete a review (only the author can delete)
app.delete('/api/reviews/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Avis non trouvé' });
    }
    
    // Check if user owns this review or is admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    
    const productId = review.product;
    await Review.findByIdAndDelete(reviewId);
    await updateProductRating(productId);
    
    res.json({ message: 'Avis supprimé avec succès' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'avis' });
  }
});

// Vote helpful/unhelpful on a review (authenticated users)
app.post('/api/reviews/:reviewId/vote', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { voteType } = req.body; // 'helpful' or 'unhelpful'
    
    if (!['helpful', 'unhelpful'].includes(voteType)) {
      return res.status(400).json({ error: 'Type de vote invalide' });
    }
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Avis non trouvé' });
    }
    
    // Prevent users from voting on their own reviews
    if (review.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Vous ne pouvez pas voter sur votre propre avis' });
    }
    
    // Update vote count
    if (voteType === 'helpful') {
      review.helpfulVotes += 1;
    } else {
      review.unhelpfulVotes += 1;
    }
    
    await review.save();
    
    res.json({
      message: 'Vote enregistré avec succès',
      helpfulVotes: review.helpfulVotes,
      unhelpfulVotes: review.unhelpfulVotes
    });
  } catch (error) {
    console.error('Vote review error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du vote' });
  }
});

// ==================== ADMIN REVIEW MANAGEMENT ====================

// Get all reviews for admin
app.get('/api/admin/reviews', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, productId } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (productId) query.product = productId;
    
    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments(query);
    
    res.json({
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Admin get reviews error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Approve/Reject review (admin)
app.patch('/api/admin/reviews/:reviewId/status', auth, adminAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, adminResponse } = req.body;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { 
        status,
        adminResponse: adminResponse || undefined,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('product', 'name');
    
    if (!review) {
      return res.status(404).json({ error: 'Avis non trouvé' });
    }
    
    // Update product rating statistics
    await updateProductRating(review.product._id);
    
    res.json({
      message: `Avis ${status === 'approved' ? 'approuvé' : status === 'rejected' ? 'rejeté' : 'mis en attente'}`,
      review
    });
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get user's reviews
app.get('/api/user/reviews', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name image')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments({ user: req.user._id });
    
    res.json({
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('User reviews error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Check if user can review a product
app.get('/api/products/:productId/can-review', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id
    });
    
    if (existingReview) {
      return res.json({
        canReview: false,
        reason: 'already_reviewed',
        existingReview: {
          _id: existingReview._id,
          rating: existingReview.rating,
          title: existingReview.title,
          comment: existingReview.comment,
          status: existingReview.status,
          createdAt: existingReview.createdAt
        }
      });
    }
    
    // Check if user purchased this product
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      status: { $in: ['delivered', 'completed'] }
    });
    
    res.json({
      canReview: true,
      hasPurchased: !!hasPurchased
    });
  } catch (error) {
    console.error('Can review check error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== MIDDLEWARE 404 ====================

// Middleware 404 pour les routes non trouvées (MUST BE LAST)
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(404).json({ 
      error: 'Route API non trouvée',
      path: req.originalUrl,
      method: req.method 
    });
  } else {
    res.status(404).json({ 
      error: 'Route non trouvée',
      path: req.originalUrl,
      method: req.method 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 Serveur VitaPharm démarré!');
  console.log(`🔗 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`📁 Uploads: ${uploadsDir}`);
  console.log('==========================================\n');
  createDefaultAdmin();
});
