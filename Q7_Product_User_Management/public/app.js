let products = [];
let users = [];
let activeTab = 'products';

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tab-products-btn').classList.toggle('active', tab === 'products');
  document.getElementById('tab-users-btn').classList.toggle('active', tab === 'users');

  document.getElementById('tab-products').classList.toggle('active', tab === 'products');
  document.getElementById('tab-users').classList.toggle('active', tab === 'users');

  if (tab === 'products') loadProducts();
  else loadUsers();
}

window.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  loadUsers();
});

// ================= PRODUCT CRUD CLIENT =================
async function loadProducts() {
  const search = document.getElementById('searchProductInput').value.trim();
  let url = '/api/products';
  if (search) url += `?search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url);
    products = await res.json();

    const tbody = document.getElementById('productsTableBody');
    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">No products found.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => `
      <tr>
        <td>
          <strong style="color: #fff;">${p.name}</strong>
          ${p.description ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${p.description}</div>` : ''}
        </td>
        <td><span style="font-size: 0.85rem; color: #38bdf8;">${p.category}</span></td>
        <td><strong style="color: #34d399;">₹${Number(p.price).toLocaleString()}</strong></td>
        <td>${p.stock} units</td>
        <td style="text-align: right;">
          <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem; margin-right: 4px;" onclick="openEditProductModal('${p.id}')">Edit</button>
          <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="handleDeleteProduct('${p.id}')">Del</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

function onSearchProducts() {
  loadProducts();
}

async function handleAddProduct(e) {
  e.preventDefault();
  const alertBox = document.getElementById('productValidationAlert');
  alertBox.style.display = 'none';

  const payload = {
    name: document.getElementById('prodName').value.trim(),
    price: document.getElementById('prodPrice').value,
    stock: document.getElementById('prodStock').value,
    category: document.getElementById('prodCategory').value.trim(),
    description: document.getElementById('prodDesc').value.trim()
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      const msg = data.details ? data.details.join('<br>') : data.error;
      alertBox.innerHTML = `<strong>Validation Error:</strong><br>${msg}`;
      alertBox.style.display = 'block';
      return;
    }

    showToast(`Product "${payload.name}" created!`);
    document.getElementById('addProductForm').reset();
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

function openEditProductModal(id) {
  const p = products.find(item => item.id === id);
  if (!p) return;

  document.getElementById('editProdId').value = p.id;
  document.getElementById('editProdName').value = p.name;
  document.getElementById('editProdPrice').value = p.price;
  document.getElementById('editProdStock').value = p.stock;
  document.getElementById('editProdCategory').value = p.category;
  document.getElementById('editProdDesc').value = p.description || '';

  document.getElementById('editProductModal').classList.add('show');
}

function closeEditProductModal() {
  document.getElementById('editProductModal').classList.remove('show');
}

async function handleUpdateProduct(e) {
  e.preventDefault();
  const id = document.getElementById('editProdId').value;
  const payload = {
    name: document.getElementById('editProdName').value.trim(),
    price: document.getElementById('editProdPrice').value,
    stock: document.getElementById('editProdStock').value,
    category: document.getElementById('editProdCategory').value.trim(),
    description: document.getElementById('editProdDesc').value.trim()
  };

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.details ? data.details.join(', ') : data.error);

    showToast('Product updated successfully!');
    closeEditProductModal();
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete product');
    showToast('Product removed.');
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

// ================= USER CRUD CLIENT =================
async function loadUsers() {
  const search = document.getElementById('searchUserInput').value.trim();
  let url = '/api/users';
  if (search) url += `?search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url);
    users = await res.json();

    const tbody = document.getElementById('usersTableBody');
    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">No users found.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <strong style="color: #fff;">${u.name}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${u.email}</div>
        </td>
        <td>${u.phone || '--'}</td>
        <td><span class="badge badge-${u.role}">${u.role}</span></td>
        <td><span class="status-dot ${u.status}"></span>${u.status}</td>
        <td style="text-align: right;">
          <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem; margin-right: 4px;" onclick="openEditUserModal('${u.id}')">Edit</button>
          <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="handleDeleteUser('${u.id}')">Del</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

function onSearchUsers() {
  loadUsers();
}

async function handleAddUser(e) {
  e.preventDefault();
  const alertBox = document.getElementById('userValidationAlert');
  alertBox.style.display = 'none';

  const payload = {
    name: document.getElementById('userName').value.trim(),
    email: document.getElementById('userEmail').value.trim(),
    phone: document.getElementById('userPhone').value.trim(),
    role: document.getElementById('userRole').value
  };

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      const msg = data.details ? data.details.join('<br>') : data.error;
      alertBox.innerHTML = `<strong>Validation Error:</strong><br>${msg}`;
      alertBox.style.display = 'block';
      return;
    }

    showToast(`User "${payload.name}" registered!`);
    document.getElementById('addUserForm').reset();
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
}

function openEditUserModal(id) {
  const u = users.find(item => item.id === id);
  if (!u) return;

  document.getElementById('editUserId').value = u.id;
  document.getElementById('editUserName').value = u.name;
  document.getElementById('editUserEmail').value = u.email;
  document.getElementById('editUserPhone').value = u.phone || '';
  document.getElementById('editUserRole').value = u.role;
  document.getElementById('editUserStatus').value = u.status || 'Active';

  document.getElementById('editUserModal').classList.add('show');
}

function closeEditUserModal() {
  document.getElementById('editUserModal').classList.remove('show');
}

async function handleUpdateUser(e) {
  e.preventDefault();
  const id = document.getElementById('editUserId').value;
  const payload = {
    name: document.getElementById('editUserName').value.trim(),
    email: document.getElementById('editUserEmail').value.trim(),
    phone: document.getElementById('editUserPhone').value.trim(),
    role: document.getElementById('editUserRole').value,
    status: document.getElementById('editUserStatus').value
  };

  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.details ? data.details.join(', ') : data.error);

    showToast('User profile updated!');
    closeEditUserModal();
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteUser(id) {
  if (!confirm('Are you sure you want to delete this user profile?')) return;
  try {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete user');
    showToast('User deleted.');
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
}
