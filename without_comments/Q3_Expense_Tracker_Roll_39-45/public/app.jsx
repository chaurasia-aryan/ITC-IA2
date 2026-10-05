const { useState, useEffect, useMemo } = React;

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Other'];
const CATEGORY_ICONS = {
  Food: '🍔',
  Transport: '🚗',
  Entertainment: '🎬',
  Utilities: '💡',
  Healthcare: '💊',
  Shopping: '🛍️',
  Other: '📦'
};

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="toast show" onClick={onClose}>
      {message}
    </div>
  );
}

function Navbar({ selectedMonth, onMonthChange, totalExpense }) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand">
          <span className="brand-icon">💰</span>
          <span className="brand-title">Expense<strong>Track</strong></span>
        </div>
        <div className="month-selector-box">
          <label>Filter Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
}

function CategoryChart({ categoryTotals, grandTotal }) {
  return (
    <div className="card chart-card">
      <h3 className="card-title">Category Breakdown & Spending Ratio</h3>
      {grandTotal === 0 ? (
        <p className="empty-text">No spending recorded for this period.</p>
      ) : (
        <div className="chart-bars-list">
          {Object.entries(categoryTotals).map(([cat, amount]) => {
            const percentage = ((amount / grandTotal) * 100).toFixed(1);
            return (
              <div key={cat} className="bar-row">
                <div className="bar-label">
                  <span>{CATEGORY_ICONS[cat] || '📦'} {cat}</span>
                  <span className="bar-amount">₹{amount.toLocaleString('en-IN')} ({percentage}%)</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function App() {
  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${m}`;
  });
  const [activeCategory, setActiveCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      showToast('Error connecting to backend: ' + err.message);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const monthlyExpenses = useMemo(() => {
    return expenses.filter((e) => (e.date || '').startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const { categoryTotals, grandTotal, topCategory } = useMemo(() => {
    const totals = ;
    let total = 0;
    CATEGORIES.forEach((c) => (totals[c] = 0));

    monthlyExpenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      total += amt;
      const cat = totals.hasOwnProperty(e.category) ? e.category : 'Other';
      totals[cat] = (totals[cat] || 0) + amt;
    });

    let maxCat = 'None';
    let maxAmt = 0;
    Object.entries(totals).forEach(([c, a]) => {
      if (a > maxAmt) {
        maxAmt = a;
        maxCat = c;
      }
    });

    return { categoryTotals: totals, grandTotal: total, topCategory: maxCat };
  }, [monthlyExpenses]);

  const displayedExpenses = useMemo(() => {
    if (activeCategory === 'All') return monthlyExpenses;
    return monthlyExpenses.filter((e) => e.category === activeCategory);
  }, [monthlyExpenses, activeCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || Number(formData.amount) <= 0) {
      showToast('Please enter a valid title and positive amount.');
      return;
    }

    try {
      if (editingExpense) {

        const id = editingExpense.id || editingExpense._id;
        const res = await fetch(`/api/expenses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, amount: Number(formData.amount) })
        });
        if (!res.ok) throw new Error('Failed to update expense');
        const updated = await res.json();
        setExpenses((prev) =>
          prev.map((exp) => ((exp.id || exp._id) === id ? updated : exp))
        );
        showToast('Expense updated successfully!');
        setEditingExpense(null);
      } else {

        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, amount: Number(formData.amount) })
        });
        if (!res.ok) throw new Error('Failed to save expense');
        const created = await res.json();
        setExpenses((prev) => [created, ...prev]);
        showToast('New expense added successfully!');
      }

      setFormData({
        title: '',
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'UPI',
        notes: ''
      });
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      paymentMethod: expense.paymentMethod || 'UPI',
      notes: expense.notes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete expense "${title}"?`)) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
      setExpenses((prev) => prev.filter((e) => (e.id || e._id) !== id));
      showToast('Expense deleted.');
      if (editingExpense && (editingExpense.id || editingExpense._id) === id) {
        setEditingExpense(null);
      }
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  return (
    <div id="app">
      <Navbar
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        totalExpense={grandTotal}
      />

      <main className="content-container">

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">💵</span>
            <div className="stat-info">
              <span className="stat-label">Total Spent ({selectedMonth})</span>
              <span className="stat-value highlight">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔥</span>
            <div className="stat-info">
              <span className="stat-label">Top Spending Category</span>
              <span className="stat-value">{topCategory}</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📊</span>
            <div className="stat-info">
              <span className="stat-label">Total Transactions</span>
              <span className="stat-value">{monthlyExpenses.length}</span>
            </div>
          </div>
        </section>

        <div className="main-layout-grid">

          <div className="card">
            <h3 className="card-title">
              {editingExpense ? '✏️ Edit Expense Entry' : '➕ Add New Expense'}
            </h3>
            <form onSubmit={handleSubmit} className="expense-form">
              <div className="form-group">
                <label>Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Veggies, Subway Lunch"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 450"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_ICONS[c]} {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="NetBanking">Net Banking</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes / Receipt info (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Split with roommates"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingExpense ? 'Save Changes' : '+ Record Expense'}
                </button>
                {editingExpense && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditingExpense(null);
                      setFormData({
                        title: '',
                        amount: '',
                        category: 'Food',
                        date: new Date().toISOString().split('T')[0],
                        paymentMethod: 'UPI',
                        notes: ''
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <CategoryChart categoryTotals={categoryTotals} grandTotal={grandTotal} />
        </div>

        <section className="card list-section">
          <div className="list-header">
            <h3>Recent Expenses ({displayedExpenses.length})</h3>
            <div className="category-pills">
              <button
                className={`pill ${activeCategory === 'All' ? 'active' : ''}`}
                onClick={() => setActiveCategory('All')}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>

          {displayedExpenses.length === 0 ? (
            <div className="empty-state">
              <p>No transactions match the selected filter.</p>
            </div>
          ) : (
            <div className="expense-items-list">
              {displayedExpenses.map((exp) => (
                <div key={exp.id || exp._id} className="expense-row">
                  <div className="exp-icon-wrap">{CATEGORY_ICONS[exp.category] || '📦'}</div>
                  <div className="exp-details">
                    <h4>{exp.title}</h4>
                    <p>
                      <span>{exp.category}</span> • <span>{exp.date}</span> • <span>{exp.paymentMethod}</span>
                      {exp.notes && <span className="notes-tag">({exp.notes})</span>}
                    </p>
                  </div>
                  <div className="exp-amount">₹{Number(exp.amount).toLocaleString('en-IN')}</div>
                  <div className="exp-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(exp)}
                      title="Edit expense"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDelete(exp.id || exp._id, exp.title)}
                      title="Delete expense"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <p>OST Lab IA-2 (Roll No: 39 to 45) | Stack: React 18 + Node.js/Express + MongoDB Charts</p>
        </div>
      </footer>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
