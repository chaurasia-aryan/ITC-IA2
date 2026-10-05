let expenses = [];
const categoryColors = {
  Food: '#fbbf24',
  Transport: '#60a5fa',
  Entertainment: '#c084fc',
  Utilities: '#34d399',
  Healthcare: '#f87171',
  Shopping: '#f472b6',
  Other: '#94a3b8'
};

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const yearMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

  document.getElementById('reportMonthFilter').value = yearMonth;
  document.getElementById('expDate').value = today;
  document.getElementById('expDate').max = today;

  loadData();
});

function onFilterChange() {
  loadData();
}

async function loadData() {
  const month = document.getElementById('reportMonthFilter').value;
  const category = document.getElementById('categoryFilter').value;

  let expensesUrl = `/api/expenses?month=${month}`;
  if (category && category !== 'All') expensesUrl += `&category=${category}`;

  const summaryUrl = `/api/expenses/summary?month=${month}`;

  try {
    const [expRes, sumRes] = await Promise.all([
      fetch(expensesUrl),
      fetch(summaryUrl)
    ]);

    expenses = await expRes.json();
    const summary = await sumRes.json();

    renderMetrics(summary);
    renderCategoryCharts(summary);
    renderTable();
  } catch (err) {
    console.error(err);
  }
}

function renderMetrics(summary) {
  document.getElementById('metricTotal').textContent = `₹${(summary.totalExpenses || 0).toLocaleString()}`;
  document.getElementById('metricCount').textContent = `${summary.transactionCount || 0} transaction(s)`;
  document.getElementById('metricAvg').textContent = `₹${(summary.averageExpense || 0).toLocaleString()}`;

  let topCat = '--';
  let topAmt = 0;
  if (summary.breakdown && summary.breakdown.length) {
    const sorted = [...summary.breakdown].sort((a, b) => b.amount - a.amount);
    if (sorted[0] && sorted[0].amount > 0) {
      topCat = sorted[0].category;
      topAmt = sorted[0].amount;
    }
  }
  document.getElementById('metricTopCat').textContent = topCat;
  document.getElementById('metricTopAmount').textContent = `₹${topAmt.toLocaleString()} spent`;
}

function renderCategoryCharts(summary) {
  const container = document.getElementById('categoryChartContainer');
  if (!summary.breakdown || summary.totalExpenses === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 40px;">
        <p>No expenses recorded for this month.</p>
        <p style="font-size: 0.85rem; margin-top: 6px;">Add an expense to view category distribution analytics.</p>
      </div>
    `;
    return;
  }

  // Filter categories with amounts > 0
  const activeBreakdown = summary.breakdown.filter(b => b.amount > 0);

  container.innerHTML = activeBreakdown.map(item => `
    <div class="cat-progress-item">
      <div class="cat-progress-header">
        <span style="color: #fff;">${item.category}</span>
        <span style="color: var(--text-muted);">₹${item.amount.toLocaleString()} (${item.percentage}%)</span>
      </div>
      <div class="cat-progress-track">
        <div class="cat-progress-bar" style="width: ${item.percentage}%; background: ${categoryColors[item.category] || '#10b981'};"></div>
      </div>
    </div>
  `).join('');
}

function renderTable() {
  const tbody = document.getElementById('expensesTableBody');
  if (!expenses.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
          No expense transactions found for this selection.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = expenses.map(e => `
    <tr>
      <td><strong style="color: #fff;">${e.date}</strong></td>
      <td>
        <span style="color: #fff; font-weight: 600;">${e.title}</span>
        ${e.notes ? `<div style="font-size: 0.8rem; color: var(--text-muted);">${e.notes}</div>` : ''}
      </td>
      <td><span class="cat-badge cat-${e.category}">${e.category}</span></td>
      <td><span style="color: var(--text-muted); font-size: 0.85rem;">${e.paymentMethod || 'UPI'}</span></td>
      <td><strong style="color: #34d399; font-size: 1.05rem;">₹${Number(e.amount).toLocaleString()}</strong></td>
      <td style="text-align: right;">
        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem; margin-right: 6px;" onclick="openEditModal('${e.id}')">Edit</button>
        <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.8rem;" onclick="handleDeleteExpense('${e.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function handleAddExpense(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('expTitle').value.trim(),
    amount: document.getElementById('expAmount').value,
    category: document.getElementById('expCategory').value,
    date: document.getElementById('expDate').value,
    paymentMethod: document.getElementById('expPayment').value
  };

  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add expense');

    showToast('Expense recorded successfully!');
    document.getElementById('expTitle').value = '';
    document.getElementById('expAmount').value = '';
    loadData();
  } catch (err) {
    alert(err.message);
  }
}

function openEditModal(id) {
  const exp = expenses.find(e => e.id === id);
  if (!exp) return;

  document.getElementById('editExpId').value = exp.id;
  document.getElementById('editExpTitle').value = exp.title;
  document.getElementById('editExpAmount').value = exp.amount;
  document.getElementById('editExpCategory').value = exp.category;
  document.getElementById('editExpDate').value = exp.date;
  document.getElementById('editExpPayment').value = exp.paymentMethod || 'UPI';

  document.getElementById('editModal').classList.add('show');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('show');
}

async function handleUpdateExpense(e) {
  e.preventDefault();
  const id = document.getElementById('editExpId').value;
  const payload = {
    title: document.getElementById('editExpTitle').value.trim(),
    amount: document.getElementById('editExpAmount').value,
    category: document.getElementById('editExpCategory').value,
    date: document.getElementById('editExpDate').value,
    paymentMethod: document.getElementById('editExpPayment').value
  };

  try {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update');

    showToast('Expense updated successfully!');
    closeEditModal();
    loadData();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteExpense(id) {
  if (!confirm('Are you sure you want to delete this expense record?')) return;
  try {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete');

    showToast('Expense deleted.');
    loadData();
  } catch (err) {
    alert(err.message);
  }
}
