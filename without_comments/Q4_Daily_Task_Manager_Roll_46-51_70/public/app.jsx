const { useState, useEffect, useMemo } = React;

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="toast show" onClick={onClose}>
      {message}
    </div>
  );
}

function Navbar({ totalTasks, completedCount, completionRate }) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand">
          <span className="brand-icon">✅</span>
          <span className="brand-title">Task<strong>Master</strong></span>
        </div>
        <div className="badge-header">
          {completedCount} of {totalTasks} Completed ({completionRate}%)
        </div>
      </div>
    </header>
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Pending',
    dueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      showToast('Error connecting to backend: ' + err.message);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'Pending') {
      return tasks.filter((t) => t.status === 'Pending' || t.status === 'In Progress');
    }
    if (activeFilter === 'Completed') {
      return tasks.filter((t) => t.status === 'Completed');
    }
    if (activeFilter === 'High Priority') {
      return tasks.filter((t) => t.priority === 'High');
    }
    return tasks;
  }, [tasks, activeFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please enter a task title.');
      return;
    }

    try {
      if (editingTask) {

        const id = editingTask.id || editingTask._id;
        const res = await fetch(`/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Failed to update task');
        const updated = await res.json();
        setTasks((prev) =>
          prev.map((t) => ((t.id || t._id) === id ? updated : t))
        );
        showToast('Task updated successfully!');
        setEditingTask(null);
      } else {

        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Failed to create task');
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
        showToast('New task added successfully!');
      }

      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Pending',
        dueDate: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to toggle task');
      const updated = await res.json();
      setTasks((prev) =>
        prev.map((t) => ((t.id || t._id) === id ? updated : t))
      );
      showToast(`Task status toggled to "${updated.status}".`);
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'Medium',
      status: task.status || 'Pending',
      dueDate: task.dueDate || new Date().toISOString().split('T')[0]
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete task "${title}"?`)) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      setTasks((prev) => prev.filter((t) => (t.id || t._id) !== id));
      showToast('Task deleted successfully.');
      if (editingTask && (editingTask.id || editingTask._id) === id) {
        setEditingTask(null);
      }
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const getPriorityClass = (priority) => {
    if (priority === 'High') return 'badge-priority badge-high';
    if (priority === 'Low') return 'badge-priority badge-low';
    return 'badge-priority badge-medium';
  };

  const getStatusClass = (status) => {
    if (status === 'Completed') return 'badge-status status-completed';
    if (status === 'In Progress') return 'badge-status status-progress';
    return 'badge-status status-pending';
  };

  return (
    <div id="app">
      <Navbar
        totalTasks={tasks.length}
        completedCount={completedCount}
        completionRate={completionRate}
      />

      <main className="content-container">

        <section className="card form-card">
          <h3 className="card-title">
            {editingTask ? '✏️ Update Task' : '➕ Create New Daily Task'}
          </h3>
          <form onSubmit={handleSubmit} className="task-form">
            <div className="form-group">
              <label>Task Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Complete OST Lab Exercise 4"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Task Description (optional)</label>
              <textarea
                rows="2"
                placeholder="Details, acceptance criteria, or notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Priority Level</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="Low">🟢 Low Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="High">🔴 High Priority</option>
                </select>
              </div>

              <div className="form-group">
                <label>Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Pending">⏳ Pending</option>
                  <option value="In Progress">🔄 In Progress</option>
                  <option value="Completed">✅ Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingTask ? 'Save Task Updates' : '+ Add Task'}
              </button>
              {editingTask && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingTask(null);
                    setFormData({
                      title: '',
                      description: '',
                      priority: 'Medium',
                      status: 'Pending',
                      dueDate: new Date().toISOString().split('T')[0]
                    });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="filter-nav">
          <div className="filter-tabs">
            {['All', 'Pending', 'Completed', 'High Priority'].map((filter) => (
              <button
                key={filter}
                className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="counter-text">
            Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </section>

        <section className="tasks-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks match this filter. Take a break or add a new task!</p>
            </div>
          ) : (
            filteredTasks.map((t) => {
              const taskId = t.id || t._id;
              const isDone = t.status === 'Completed';

              return (
                <div
                  key={taskId}
                  className={`task-card ${isDone ? 'task-completed-card' : ''}`}
                >
                  <div className="task-checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleToggle(taskId)}
                      title="Click to toggle status"
                    />
                  </div>

                  <div className="task-body">
                    <div className="task-header-row">
                      <h4 className={`task-title ${isDone ? 'completed-text' : ''}`}>
                        {t.title}
                      </h4>
                      <div className="task-badges">
                        <span className={getPriorityClass(t.priority)}>{t.priority}</span>
                        <span className={getStatusClass(t.status)}>{t.status}</span>
                      </div>
                    </div>

                    {t.description && <p className="task-desc">{t.description}</p>}

                    <div className="task-footer">
                      <span className="due-date">📅 Due: {t.dueDate}</span>
                      <div className="task-action-btns">
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(t)}
                          title="Edit Task"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(taskId, t.title)}
                          title="Delete Task"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <p>OST Lab IA-2 (Roll No: 46 to 51, 70) | Stack: React 18 + Node.js/Express + MongoDB Task CRUD</p>
        </div>
      </footer>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
