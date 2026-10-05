// State Management
let books = [];
let cart = JSON.parse(localStorage.getItem('book_cart') || '[]');
let currentRoute = '/';
let activeCategory = 'All';
let searchQuery = '';

function saveCart() {
  localStorage.setItem('book_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = totalItems;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Client-Side Router
function navigate(route) {
  window.location.hash = '#' + route;
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  handleRouting();
});

function handleRouting() {
  const hash = window.location.hash.slice(1) || '/';
  currentRoute = hash;

  // Update navbar active states
  document.getElementById('nav-catalog').classList.toggle('active', hash === '/');
  document.getElementById('nav-admin').classList.toggle('active', hash.startsWith('/admin'));
  document.getElementById('nav-cart').classList.toggle('active', hash.startsWith('/cart'));

  const outlet = document.getElementById('route-outlet');

  if (hash === '/' || hash.startsWith('/?')) {
    renderCatalogView(outlet);
  } else if (hash.startsWith('/book/')) {
    const bookId = hash.split('/')[2];
    renderBookDetailView(outlet, bookId);
  } else if (hash === '/cart') {
    renderCartView(outlet);
  } else if (hash === '/admin') {
    renderAdminView(outlet);
  } else {
    outlet.innerHTML = `<h2>404 - Page Not Found</h2><p><a href="#/">Return to Catalog</a></p>`;
  }
}

// ----------------- VIEW 1: CATALOG & SEARCH -----------------
async function renderCatalogView(container) {
  container.innerHTML = `
    <div class="catalog-header">
      <div>
        <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 4px;">Explore Book Catalog</h1>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Browse and search our vast collection of titles.</p>
      </div>

      <div class="search-bar-box">
        <input 
          type="text" 
          id="searchInput" 
          class="search-input" 
          placeholder="Search by book title or author..."
          value="${searchQuery}"
          oninput="onSearchInput(this.value)"
        />
        <select id="categoryFilter" class="filter-select" onchange="onCategoryChange(this.value)">
          <option value="All" ${activeCategory === 'All' ? 'selected' : ''}>All Categories</option>
          <option value="Programming" ${activeCategory === 'Programming' ? 'selected' : ''}>Programming</option>
          <option value="Engineering" ${activeCategory === 'Engineering' ? 'selected' : ''}>Engineering</option>
          <option value="Self-Help" ${activeCategory === 'Self-Help' ? 'selected' : ''}>Self-Help</option>
        </select>
      </div>
    </div>

    <div id="booksGrid" class="books-grid">
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        Loading books catalog...
      </div>
    </div>
  `;

  await fetchAndDisplayBooks();
}

async function fetchAndDisplayBooks() {
  try {
    let url = `/api/books?category=${encodeURIComponent(activeCategory)}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
    
    const res = await fetch(url);
    books = await res.json();

    const grid = document.getElementById('booksGrid');
    if (!grid) return;

    if (books.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted);">
        <h3>No books found matching your criteria.</h3>
        <p>Try clearing your search or changing the filter.</p>
      </div>`;
      return;
    }

    grid.innerHTML = books.map(b => `
      <div class="book-card">
        <img src="${b.coverImage}" alt="${b.title}" class="book-img" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'">
        <div class="book-info">
          <div class="book-category">${b.category}</div>
          <h3 class="book-title">${b.title}</h3>
          <p class="book-author">By ${b.author}</p>
          <div class="book-bottom">
            <span class="book-price">₹${b.price}</span>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary" onclick="addToCart('${b.id}')">Add to Cart</button>
              <button class="btn" style="background: rgba(255,255,255,0.08); color: #fff;" onclick="navigate('/book/${b.id}')">Details</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

function onSearchInput(val) {
  searchQuery = val;
  fetchAndDisplayBooks();
}

function onCategoryChange(cat) {
  activeCategory = cat;
  fetchAndDisplayBooks();
}

function addToCart(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  const existing = cart.find(item => item.bookId === bookId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      bookId: book.id,
      title: book.title,
      price: book.price,
      coverImage: book.coverImage,
      quantity: 1
    });
  }
  saveCart();
  showToast(`Added "${book.title}" to cart!`);
}

// ----------------- VIEW 2: BOOK DETAILS -----------------
async function renderBookDetailView(container, bookId) {
  try {
    const res = await fetch(`/api/books/${bookId}`);
    if (!res.ok) throw new Error('Book not found');
    const b = await res.json();

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <button class="btn" style="background: transparent; border: 1px solid var(--border-color); color: #fff;" onclick="navigate('/')">
          ← Back to Catalog
        </button>
      </div>
      <div class="panel-card" style="display: grid; grid-template-columns: 320px 1fr; gap: 32px;">
        <img src="${b.coverImage}" alt="${b.title}" style="width: 100%; border-radius: var(--radius); height: 400px; object-fit: cover;">
        <div>
          <span class="book-category">${b.category}</span>
          <h1 style="font-size: 2rem; margin: 8px 0 12px 0;">${b.title}</h1>
          <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 20px;">Author: <strong style="color: #fff;">${b.author}</strong></p>
          <div style="font-size: 2rem; font-weight: 800; color: var(--accent); margin-bottom: 20px;">₹${b.price}</div>
          <p style="line-height: 1.7; color: #cbd5e1; margin-bottom: 24px;">${b.description || 'No detailed description available.'}</p>
          <p style="color: var(--text-muted); margin-bottom: 24px;">In Stock: <strong>${b.stock} units available</strong></p>
          <button class="btn btn-primary" style="padding: 12px 28px; font-size: 1rem;" onclick="addToCart('${b.id}')">Add to Cart</button>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<h2>Error</h2><p>${err.message}</p><button class="btn btn-primary" onclick="navigate('/')">Catalog</button>`;
  }
}

// ----------------- VIEW 3: CART & PURCHASE CHECKOUT -----------------
function renderCartView(container) {
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="panel-card" style="text-align: center; padding: 60px;">
        <h2>Your Shopping Cart is Empty</h2>
        <p style="color: var(--text-muted); margin: 16px 0 24px 0;">Explore our collection and add some amazing books.</p>
        <button class="btn btn-primary" onclick="navigate('/')">Browse Books</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <h1 style="margin-bottom: 24px;">Shopping Cart & Checkout</h1>
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 28px;">
      <div class="cart-container">
        <table class="cart-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Subtotal</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${cart.map((item, idx) => `
              <tr>
                <td><strong>${item.title}</strong></td>
                <td>₹${item.price}</td>
                <td>
                  <div class="qty-control">
                    <button class="qty-btn" onclick="updateQty(${idx}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQty(${idx}, 1)">+</button>
                  </div>
                </td>
                <td>₹${item.price * item.quantity}</td>
                <td>
                  <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem;" onclick="removeCartItem(${idx})">✕</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="panel-card">
        <h3 class="panel-title">Order Summary</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: var(--text-muted);">
          <span>Items Total:</span>
          <span>₹${subtotal}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; color: var(--text-muted);">
          <span>Estimated Tax (5%):</span>
          <span>₹${tax}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 1.3rem; font-weight: 800; border-top: 1px solid var(--border-color); padding-top: 12px;">
          <span>Grand Total:</span>
          <span style="color: var(--accent);">₹${total}</span>
        </div>

        <form id="checkoutForm" onsubmit="handleCheckout(event, ${total})">
          <div class="form-group">
            <label>Customer Full Name</label>
            <input type="text" id="custName" class="form-control" required placeholder="e.g. Rahul Sharma" />
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="custEmail" class="form-control" required placeholder="e.g. rahul@example.com" />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 8px;">
            Place Order (₹${total})
          </button>
        </form>
      </div>
    </div>
  `;
}

function updateQty(idx, delta) {
  cart[idx].quantity += delta;
  if (cart[idx].quantity <= 0) {
    cart.splice(idx, 1);
  }
  saveCart();
  renderCartView(document.getElementById('route-outlet'));
}

function removeCartItem(idx) {
  cart.splice(idx, 1);
  saveCart();
  renderCartView(document.getElementById('route-outlet'));
}

async function handleCheckout(e, total) {
  e.preventDefault();
  const name = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: name,
        email: email,
        items: cart,
        totalAmount: total
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to place order');

    cart = [];
    saveCart();

    const outlet = document.getElementById('route-outlet');
    outlet.innerHTML = `
      <div class="panel-card" style="text-align: center; padding: 60px;">
        <span style="font-size: 3rem;">🎉</span>
        <h2 style="margin: 16px 0;">Order Successfully Confirmed!</h2>
        <p style="color: var(--text-muted); margin-bottom: 8px;">Thank you, <strong>${name}</strong>.</p>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Your order has been recorded into the MongoDB Orders collection.</p>
        <button class="btn btn-primary" onclick="navigate('/')">Continue Shopping</button>
      </div>
    `;
    showToast('Order confirmed successfully!');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ----------------- VIEW 4: ADMIN PORTAL (ADD/REMOVE BOOKS & ORDERS) -----------------
async function renderAdminView(container) {
  container.innerHTML = `
    <h1 style="margin-bottom: 24px;">Admin Portal - Inventory & Orders</h1>
    <div class="admin-grid">
      <!-- Add New Book Form -->
      <div class="panel-card">
        <h3 class="panel-title">Add New Book to Catalog</h3>
        <form id="addBookForm" onsubmit="handleAddBook(event)">
          <div class="form-group">
            <label>Book Title *</label>
            <input type="text" id="bookTitle" class="form-control" required placeholder="e.g. Modern Full-Stack Development" />
          </div>
          <div class="form-group">
            <label>Author Name *</label>
            <input type="text" id="bookAuthor" class="form-control" required placeholder="e.g. Dr. Jane Doe" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label>Price (₹) *</label>
              <input type="number" id="bookPrice" class="form-control" required min="0" placeholder="599" />
            </div>
            <div class="form-group">
              <label>Initial Stock</label>
              <input type="number" id="bookStock" class="form-control" min="0" value="15" />
            </div>
          </div>
          <div class="form-group">
            <label>Category</label>
            <select id="bookCategory" class="form-control">
              <option value="Programming">Programming</option>
              <option value="Engineering">Engineering</option>
              <option value="Self-Help">Self-Help</option>
              <option value="Fiction">Fiction</option>
              <option value="General">General</option>
            </select>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="bookDesc" class="form-control" rows="3" placeholder="Brief synopsis..."></textarea>
          </div>
          <div class="form-group">
            <label>Cover Image URL (optional)</label>
            <input type="url" id="bookCover" class="form-control" placeholder="https://..." />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">Publish Book to MongoDB</button>
        </form>
      </div>

      <!-- Manage Books & Orders -->
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div class="panel-card">
          <h3 class="panel-title">Current Inventory (<span id="admin-book-count">0</span> books)</h3>
          <div id="adminBooksList" style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
            Loading inventory...
          </div>
        </div>

        <div class="panel-card">
          <h3 class="panel-title">Placed Customer Orders</h3>
          <div id="adminOrdersList" style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
            Loading orders...
          </div>
        </div>
      </div>
    </div>
  `;

  await loadAdminData();
}

async function loadAdminData() {
  try {
    const [booksRes, ordersRes] = await Promise.all([
      fetch('/api/books'),
      fetch('/api/orders')
    ]);
    const booksData = await booksRes.json();
    const ordersData = await ordersRes.json();

    document.getElementById('admin-book-count').textContent = booksData.length;

    const bList = document.getElementById('adminBooksList');
    if (bList) {
      bList.innerHTML = booksData.map(b => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #0f172a; border-radius: 8px; border: 1px solid var(--border-color);">
          <div>
            <strong style="color: #fff;">${b.title}</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted);">${b.author} | ₹${b.price} | Stock: ${b.stock}</p>
          </div>
          <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.8rem;" onclick="handleDeleteBook('${b.id}')">Delete</button>
        </div>
      `).join('') || '<p style="color: var(--text-muted);">No books in catalog.</p>';
    }

    const oList = document.getElementById('adminOrdersList');
    if (oList) {
      oList.innerHTML = ordersData.map(o => `
        <div style="padding: 10px 14px; background: #0f172a; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span>${o.customerName} (${o.email})</span>
            <span style="color: var(--accent);">₹${o.totalAmount}</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
            ${(o.items || []).map(i => `${i.title} (x${i.quantity})`).join(', ')}
          </p>
        </div>
      `).join('') || '<p style="color: var(--text-muted);">No orders placed yet.</p>';
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleAddBook(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('bookTitle').value,
    author: document.getElementById('bookAuthor').value,
    price: document.getElementById('bookPrice').value,
    stock: document.getElementById('bookStock').value,
    category: document.getElementById('bookCategory').value,
    description: document.getElementById('bookDesc').value,
    coverImage: document.getElementById('bookCover').value || undefined
  };

  try {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to add book');
    showToast('Book successfully added to catalog!');
    document.getElementById('addBookForm').reset();
    await loadAdminData();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteBook(id) {
  if (!confirm('Are you sure you want to remove this book from the catalog?')) return;
  try {
    const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete book');
    showToast('Book removed from database.');
    await loadAdminData();
  } catch (err) {
    alert(err.message);
  }
}
