// Dynamic API base: points to backend port 5001 if opened standalone, or relative '/api' when served by Express
const BACKEND_PORT = 5001;
const API_BASE = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== String(BACKEND_PORT)))
  ? `http://localhost:${BACKEND_PORT}`
  : '';

const { useState, useEffect } = React;
const { HashRouter, Routes, Route, Link, useNavigate, useParams, useLocation } = ReactRouterDOM;

// Global Toast Notification Component
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="toast show" onClick={onClose}>
      {message}
    </div>
  );
}

// Navigation Header Component with React Router Links
function Navbar({ cartCount }) {
  const location = useLocation();

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="brand-logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">ReadHub<strong>Books</strong></span>
        </Link>
        <div className="nav-links">
          <Link
            to="/"
            className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`}
          >
            Catalog
          </Link>
          <Link
            to="/admin"
            className={`nav-btn ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            Admin Portal
          </Link>
          <Link
            to="/cart"
            className={`nav-btn cart-btn ${location.pathname === '/cart' ? 'active' : ''}`}
          >
            🛒 Cart (<span id="cart-count">{cartCount}</span>)
          </Link>
        </div>
      </div>
    </header>
  );
}

// Catalog View: Browse, Search, Category Filter, and Add to Cart
function CatalogView({ books, onAddToCart, showToast, activeCategory, setActiveCategory, searchQuery, setSearchQuery }) {
  const categories = ['All', 'Programming', 'Science Fiction', 'Non-Fiction', 'Finance', 'Self-Help', 'Design'];

  const filteredBooks = books.filter((b) => {
    const matchesCat = activeCategory === 'All' || b.category === activeCategory;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="catalog-container">
      {/* Search and Category Filter Section */}
      <section className="search-filter-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search books by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
        <div className="category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Book Grid */}
      <div className="books-grid">
        {filteredBooks.length === 0 ? (
          <div className="empty-state">
            <p>No books found matching your criteria.</p>
          </div>
        ) : (
          filteredBooks.map((book) => (
            <div key={book.id || book._id} className="book-card">
              <div className="book-cover-wrap">
                <img
                  src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
                  alt={book.title}
                  loading="lazy"
                />
                <span className="category-tag">{book.category}</span>
              </div>
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">by {book.author}</p>
                <div className="book-footer">
                  <div className="price-tag">₹{book.price}</div>
                  <div className="card-actions">
                    <Link to={`/book/${book.id || book._id}`} className="btn-secondary">
                      Details
                    </Link>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        onAddToCart(book);
                        showToast(`Added "${book.title}" to cart!`);
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Book Detail View: Shows description, author, stock, and Add to Cart
function BookDetailView({ books, onAddToCart, showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = books.find((b) => String(b.id || b._id) === String(id));

  if (!book) {
    return (
      <div className="detail-container">
        <h2>Book Not Found</h2>
        <button className="btn-secondary" onClick={() => navigate('/')}>Back to Catalog</button>
      </div>
    );
  }

  return (
    <div className="detail-container">
      <button className="back-link" onClick={() => navigate('/')}>
        ← Back to Catalog
      </button>
      <div className="detail-card">
        <div className="detail-image-wrap">
          <img
            src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
            alt={book.title}
          />
        </div>
        <div className="detail-content">
          <span className="category-tag">{book.category}</span>
          <h1 className="detail-title">{book.title}</h1>
          <p className="detail-author">Author: <strong>{book.author}</strong></p>
          <div className="detail-price">₹{book.price}</div>
          <p className="detail-stock">
            Availability: <span className="in-stock">{book.stock} in stock</span>
          </p>
          <p className="detail-desc">{book.description || 'No detailed description provided.'}</p>
          <button
            className="btn-primary btn-large"
            onClick={() => {
              onAddToCart(book);
              showToast(`Added "${book.title}" to cart!`);
            }}
          >
            🛒 Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

// Cart & Checkout View: Adjust quantity, compute total, submit purchase order
function CartView({ cart, onUpdateQuantity, onRemoveFromCart, onClearCart, showToast }) {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Your cart is empty.');
      return;
    }
    if (!customerName.trim() || !email.trim()) {
      showToast('Please enter your name and email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          email,
          items: cart.map((item) => ({
            bookId: item.id || item._id,
            title: item.title,
            price: item.price,
            quantity: item.quantity
          })),
          totalAmount: subtotal
        })
      });

      if (!res.ok) throw new Error('Order submission failed');
      const order = await res.json();
      showToast(` Order #${order.id || order._id} confirmed! Thank you!`);
      onClearCart();
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      showToast('Error placing order: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cart-container">
      <h2>Your Shopping Cart</h2>
      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Explore Books
          </button>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id || item._id} className="cart-item">
                <img
                  src={item.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}
                  alt={item.title}
                  className="cart-thumb"
                />
                <div className="cart-item-details">
                  <h4>{item.title}</h4>
                  <p className="cart-price">₹{item.price}</p>
                </div>
                <div className="quantity-controls">
                  <button onClick={() => onUpdateQuantity(item.id || item._id, item.quantity - 1)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => onUpdateQuantity(item.id || item._id, item.quantity + 1)}>
                    +
                  </button>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => onRemoveFromCart(item.id || item._id)}
                  title="Remove item"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <div className="order-summary-card">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Items Total:</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span className="free-shipping">FREE</span>
            </div>
            <hr />
            <div className="summary-row total-row">
              <span>Grand Total:</span>
              <span>₹{subtotal}</span>
            </div>

            <form onSubmit={handleCheckout} className="checkout-form">
              <h4>Customer Details</h4>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aryan Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary btn-block" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Confirm & Purchase'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Admin View: Add new books to catalog and delete existing books
function AdminView({ books, onBookAdded, onBookDeleted, showToast }) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    price: '',
    category: 'Programming',
    stock: 10,
    description: '',
    coverImage: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock)
        })
      });
      if (!res.ok) throw new Error('Failed to create book');
      const newBook = await res.json();
      onBookAdded(newBook);
      showToast(`Added book "${newBook.title}" successfully!`);
      setFormData({
        title: '',
        author: '',
        price: '',
        category: 'Programming',
        stock: 10,
        description: '',
        coverImage: ''
      });
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to remove "${title}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/books/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete book');
      onBookDeleted(id);
      showToast(`Book "${title}" deleted.`);
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  return (
    <div className="admin-container">
      <h2>Admin Book Management Portal</h2>
      <div className="admin-grid">
        {/* Form to Add New Book */}
        <div className="admin-card">
          <h3>Add New Book</h3>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Book Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Learning React 18"
              />
            </div>
            <div className="form-group">
              <label>Author Name *</label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="e.g. Alex Banks"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="599"
                />
              </div>
              <div className="form-group">
                <label>Initial Stock</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Programming">Programming</option>
                <option value="Science Fiction">Science Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
                <option value="Finance">Finance</option>
                <option value="Self-Help">Self-Help</option>
                <option value="Design">Design</option>
              </select>
            </div>
            <div className="form-group">
              <label>Cover Image URL (optional)</label>
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of the book..."
              />
            </div>
            <button type="submit" className="btn-primary btn-block" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Book...' : '+ Add Book to Store'}
            </button>
          </form>
        </div>

        {/* Existing Books Table */}
        <div className="admin-card">
          <h3>Current Books in Catalog ({books.length})</h3>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title & Author</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id || b._id}>
                    <td>
                      <strong>{b.title}</strong>
                      <div className="sub-text">{b.author}</div>
                    </td>
                    <td><span className="category-tag">{b.category}</span></td>
                    <td>₹{b.price}</td>
                    <td>{b.stock}</td>
                    <td>
                      <button
                        className="btn-danger-sm"
                        onClick={() => handleDelete(b.id || b._id, b.title)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Component with State & React Router
function App() {
  const [books, setBooks] = useState([]);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('readhub_cart')) || [];
    } catch {
      return [];
    }
  });
  const [toastMessage, setToastMessage] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('readhub_cart', JSON.stringify(cart));
  }, [cart]);

  // Fetch initial books from Node.js Express Backend
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/books');
      const data = await res.json();
      setBooks(data);
    } catch (err) {
      showToast('Error connecting to backend: ' + err.message);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAddToCart = (book) => {
    const bookId = book.id || book._id;
    setCart((prev) => {
      const existing = prev.find((item) => (item.id || item._id) === bookId);
      if (existing) {
        return prev.map((item) =>
          (item.id || item._id) === bookId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...book, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (bookId, newQty) => {
    if (newQty <= 0) {
      handleRemoveFromCart(bookId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        (item.id || item._id) === bookId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleRemoveFromCart = (bookId) => {
    setCart((prev) => prev.filter((item) => (item.id || item._id) !== bookId));
  };

  const handleClearCart = () => setCart([]);

  const handleBookAdded = (newBook) => {
    setBooks((prev) => [newBook, ...prev]);
  };

  const handleBookDeleted = (id) => {
    setBooks((prev) => prev.filter((b) => (b.id || b._id) !== id));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <HashRouter>
      <div id="app">
        <Navbar cartCount={cartCount} />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <CatalogView
                  books={books}
                  onAddToCart={handleAddToCart}
                  showToast={showToast}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              }
            />
            <Route
              path="/book/:id"
              element={
                <BookDetailView
                  books={books}
                  onAddToCart={handleAddToCart}
                  showToast={showToast}
                />
              }
            />
            <Route
              path="/cart"
              element={
                <CartView
                  cart={cart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveFromCart={handleRemoveFromCart}
                  onClearCart={handleClearCart}
                  showToast={showToast}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <AdminView
                  books={books}
                  onBookAdded={handleBookAdded}
                  onBookDeleted={handleBookDeleted}
                  showToast={showToast}
                />
              }
            />
          </Routes>
        </main>
        <footer className="footer">
          <div className="footer-container">
            <p>OST Lab IA-2 (Roll No: 24 to 30) | Stack: React Router Navigation + Node/Express + MongoDB</p>
          </div>
        </footer>
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      </div>
    </HashRouter>
  );
}

// Mount React Root
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
