// Dynamic API base: points to backend port 5007 if opened standalone, or relative '/api' when served by Express
const BACKEND_PORT = 5007;
const API_BASE = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== String(BACKEND_PORT)))
  ? `http://localhost:${BACKEND_PORT}`
  : '';

const { useState, useEffect } = React;

// Toast notification component
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="toast show" onClick={onClose}>
      {message}
    </div>
  );
}

// Navigation Bar
function Navbar({ activeTab, onTabChange }) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-title">Admin<strong>Hub</strong></span>
        </div>
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => onTabChange('products')}
          >
            📦 Products Management
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => onTabChange('users')}
          >
            👥 Users Management
          </button>
        </div>
      </div>
    </header>
  );
}

// 1. Products Management View with Input Validation
function ProductsTab({ products, onProductSaved, onProductDeleted, showToast }) {
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Electronics',
    price: '',
    stock: 10,
    description: ''
  });
  const [errors, setErrors] = useState([]);

  const validate = () => {
    const errs = [];
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.push('Product name must be at least 2 characters.');
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      errs.push('Price must be a valid positive number.');
    }
    if (formData.stock === '' || isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
      errs.push('Stock must be a non-negative whole number.');
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = validate();
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors([]);

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      price: Number(formData.price),
      stock: Number(formData.stock),
      description: formData.description.trim()
    };

    try {
      if (editingProduct) {
        const id = editingProduct.id || editingProduct._id;
        const res = await fetch(`${API_BASE}/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.details ? errData.details.join(', ') : errData.error);
        }
        const updated = await res.json();
        onProductSaved(updated, true);
        showToast(`Product "${updated.name}" updated!`);
        setEditingProduct(null);
      } else {
        const res = await fetch(`${API_BASE}/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.details ? errData.details.join(', ') : errData.error);
        }
        const created = await res.json();
        onProductSaved(created, false);
        showToast(`Product "${created.name}" created!`);
      }

      setFormData({
        name: '',
        category: 'Electronics',
        price: '',
        stock: 10,
        description: ''
      });
    } catch (err) {
      showToast('Validation / API Error: ' + err.message);
    }
  };

  const handleEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      description: p.description || ''
    });
    setErrors([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete product "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      onProductDeleted(id);
      showToast(`Product "${name}" deleted.`);
      if (editingProduct && (editingProduct.id || editingProduct._id) === id) {
        setEditingProduct(null);
      }
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  return (
    <div className="tab-content active">
      <div className="section-header">
        <h2>Product Catalog & Inventory Management</h2>
        <p>Perform RESTful CRUD operations on products with server & client validation.</p>
      </div>

      <div className="grid-split">
        {/* Product Form */}
        <div className="card">
          <h3 className="card-title">
            {editingProduct ? '✏️ Edit Product Details' : '➕ Add New Product'}
          </h3>

          {errors.length > 0 && (
            <div className="error-alert">
              <strong>Validation Errors:</strong>
              <ul>
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="crud-form">
            <div className="form-group">
              <label>Product Name * (min 2 chars)</label>
              <input
                type="text"
                required
                placeholder="e.g. Mechanical Wireless Keyboard"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Computers">Computers</option>
                  <option value="Audio">Audio</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Wearables">Wearables</option>
                </select>
              </div>
              <div className="form-group">
                <label>Price (₹) * (> 0)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="2499"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Units in Stock * (>= 0)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description (optional)</label>
              <textarea
                rows="2"
                placeholder="Features, technical specs, or warranty info..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingProduct ? 'Save Product Changes' : '+ Add Product'}
              </button>
              {editingProduct && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingProduct(null);
                    setFormData({
                      name: '',
                      category: 'Electronics',
                      price: '',
                      stock: 10,
                      description: ''
                    });
                    setErrors([]);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Products Table */}
        <div className="card">
          <h3 className="card-title">Current Inventory Products ({products.length})</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const pId = p.id || p._id;
                  return (
                    <tr key={pId}>
                      <td>
                        <strong>{p.name}</strong>
                        {p.description && <div className="sub-desc">{p.description}</div>}
                      </td>
                      <td><span className="badge-cat">{p.category}</span></td>
                      <td>₹{Number(p.price).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`stock-tag ${p.stock < 5 ? 'stock-low' : 'stock-ok'}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-cell">
                          <button
                            className="btn-icon"
                            onClick={() => handleEdit(p)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(pId, p.name)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Users Management View with Strict Validation
function UsersTab({ users, onUserSaved, onUserDeleted, showToast }) {
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Customer'
  });
  const [errors, setErrors] = useState([]);

  const validate = () => {
    const errs = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.push('Name must be at least 2 characters.');
    }
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.push('Please provide a valid email address (e.g. name@domain.com).');
    }
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone.trim())) {
      errs.push('Phone number must contain exactly 10 digits.');
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = validate();
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors([]);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      role: formData.role
    };

    try {
      if (editingUser) {
        const id = editingUser.id || editingUser._id;
        const res = await fetch(`${API_BASE}/api/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.details ? errData.details.join(', ') : errData.error);
        }
        const updated = await res.json();
        onUserSaved(updated, true);
        showToast(`User profile for "${updated.name}" updated!`);
        setEditingUser(null);
      } else {
        const res = await fetch(`${API_BASE}/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.details ? errData.details.join(', ') : errData.error);
        }
        const created = await res.json();
        onUserSaved(created, false);
        showToast(`User "${created.name}" registered!`);
      }

      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Customer'
      });
    } catch (err) {
      showToast('Validation / API Error: ' + err.message);
    }
  };

  const handleEdit = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role || 'Customer'
    });
    setErrors([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      onUserDeleted(id);
      showToast(`User "${name}" deleted.`);
      if (editingUser && (editingUser.id || editingUser._id) === id) {
        setEditingUser(null);
      }
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'Admin') return <span className="role-pill role-admin">Admin</span>;
    if (role === 'Manager') return <span className="role-pill role-manager">Manager</span>;
    return <span className="role-pill role-customer">Customer</span>;
  };

  return (
    <div className="tab-content active">
      <div className="section-header">
        <h2>User Accounts & Permissions Directory</h2>
        <p>Manage authenticated users with strict regex email and phone validation.</p>
      </div>

      <div className="grid-split">
        {/* User Form */}
        <div className="card">
          <h3 className="card-title">
            {editingUser ? '✏️ Edit User Record' : '➕ Register New User'}
          </h3>

          {errors.length > 0 && (
            <div className="error-alert">
              <strong>Validation Errors:</strong>
              <ul>
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="crud-form">
            <div className="form-group">
              <label>Full Name * (min 2 chars)</label>
              <input
                type="text"
                required
                placeholder="e.g. Aryan Chaurasia"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email Address * (must be valid email)</label>
              <input
                type="email"
                required
                placeholder="e.g. aryan@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number * (10 digits)</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>System Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Customer">Customer</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingUser ? 'Save User Updates' : '+ Register User'}
              </button>
              {editingUser && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingUser(null);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      role: 'Customer'
                    });
                    setErrors([]);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Users Table */}
        <div className="card">
          <h3 className="card-title">Registered Users ({users.length})</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const uId = u.id || u._id;
                  return (
                    <tr key={uId}>
                      <td>
                        <strong>{u.name}</strong>
                        <div className="sub-desc">{u.email}</div>
                      </td>
                      <td>{u.phone}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>
                        <div className="action-buttons-cell">
                          <button
                            className="btn-icon"
                            onClick={() => handleEdit(u)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(uId, u.name)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [pRes, uRes] = await Promise.all([
        fetch(`${API_BASE}/api/products'),
        fetch(`${API_BASE}/api/users')
      ]);
      const pData = await pRes.json();
      const uData = await uRes.json();
      setProducts(pData);
      setUsers(uData);
    } catch (err) {
      showToast('Error connecting to backend: ' + err.message);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleProductSaved = (product, isUpdate) => {
    if (isUpdate) {
      setProducts((prev) =>
        prev.map((p) => ((p.id || p._id) === (product.id || product._id) ? product : p))
      );
    } else {
      setProducts((prev) => [product, ...prev]);
    }
  };

  const handleProductDeleted = (id) => {
    setProducts((prev) => prev.filter((p) => (p.id || p._id) !== id));
  };

  const handleUserSaved = (user, isUpdate) => {
    if (isUpdate) {
      setUsers((prev) =>
        prev.map((u) => ((u.id || u._id) === (user.id || user._id) ? user : u))
      );
    } else {
      setUsers((prev) => [user, ...prev]);
    }
  };

  const handleUserDeleted = (id) => {
    setUsers((prev) => prev.filter((u) => (u.id || u._id) !== id));
  };

  return (
    <div id="app">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="content-container">
        {activeTab === 'products' ? (
          <ProductsTab
            products={products}
            onProductSaved={handleProductSaved}
            onProductDeleted={handleProductDeleted}
            showToast={showToast}
          />
        ) : (
          <UsersTab
            users={users}
            onUserSaved={handleUserSaved}
            onUserDeleted={handleUserDeleted}
            showToast={showToast}
          />
        )}
      </main>

      <footer className="footer">
        <div className="footer-container">
          <p>OST Lab IA-2 (Text Doc Q1) | Stack: React 18 + Node.js/Express + MongoDB Strict Validation</p>
        </div>
      </footer>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}

// Mount React Root
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
