let tasks = [];
let activeFilter = 'All';
let searchQuery = '';

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('taskDueDate').value = today;
  loadTasks();
  loadStats();
});

function setFilter(status, btn) {
  activeFilter = status;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadTasks();
}

function onSearch(val) {
  searchQuery = val.trim();
  loadTasks();
}

async function loadStats() {
  try {
    const res = await fetch('/api/tasks/stats');
    const stats = await res.json();
    document.getElementById('statTotal').textContent = stats.total || 0;
    document.getElementById('statPending').textContent = stats.pending || 0;
    document.getElementById('statProgress').textContent = stats.inProgress || 0;
    document.getElementById('statCompleted').textContent = stats.completed || 0;
  } catch (err) {
    console.error(err);
  }
}

async function loadTasks() {
  let url = `/api/tasks?status=${encodeURIComponent(activeFilter)}`;
  if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

  try {
    const res = await fetch(url);
    tasks = await res.json();

    const container = document.getElementById('tasksList');
    if (!tasks.length) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 40px;">
          <p>No tasks found for this filter.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = tasks.map(t => {
      const isCompleted = t.status === 'Completed';
      return `
        <div class="task-item ${isCompleted ? 'is-completed' : ''}">
          <div class="task-left">
            <input 
              type="checkbox" 
              class="task-check" 
              ${isCompleted ? 'checked' : ''} 
              onchange="toggleTaskStatus('${t.id}')"
              title="Click to toggle Complete/Pending"
            />
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span class="task-title-text" style="font-weight: 700; color: #fff; font-size: 1rem;">${t.title}</span>
                <span class="priority-tag prio-${t.priority}">${t.priority}</span>
                <span class="status-tag">${t.status}</span>
              </div>
              ${t.description ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">${t.description}</p>` : ''}
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 6px;">
                📅 Due: <strong>${t.dueDate}</strong>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="openEditModal('${t.id}')">Edit</button>
            <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.8rem;" onclick="handleDeleteTask('${t.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
  }
}

async function handleCreateTask(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('taskTitle').value.trim(),
    dueDate: document.getElementById('taskDueDate').value,
    priority: document.getElementById('taskPriority').value,
    description: document.getElementById('taskDesc').value.trim(),
    status: 'Pending'
  };

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create task');

    showToast('Task added to list!');
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDesc').value = '';
    loadTasks();
    loadStats();
  } catch (err) {
    alert(err.message);
  }
}

async function toggleTaskStatus(id) {
  try {
    const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to toggle status');
    loadTasks();
    loadStats();
  } catch (err) {
    alert(err.message);
  }
}

function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  document.getElementById('editTaskId').value = task.id;
  document.getElementById('editTaskTitle').value = task.title;
  document.getElementById('editTaskDesc').value = task.description || '';
  document.getElementById('editTaskPriority').value = task.priority;
  document.getElementById('editTaskStatus').value = task.status;
  document.getElementById('editTaskDueDate').value = task.dueDate;

  document.getElementById('editTaskModal').classList.add('show');
}

function closeEditModal() {
  document.getElementById('editTaskModal').classList.remove('show');
}

async function handleUpdateTask(e) {
  e.preventDefault();
  const id = document.getElementById('editTaskId').value;
  const payload = {
    title: document.getElementById('editTaskTitle').value.trim(),
    description: document.getElementById('editTaskDesc').value.trim(),
    priority: document.getElementById('editTaskPriority').value,
    status: document.getElementById('editTaskStatus').value,
    dueDate: document.getElementById('editTaskDueDate').value
  };

  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update task');

    showToast('Task updated successfully!');
    closeEditModal();
    loadTasks();
    loadStats();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  try {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');

    showToast('Task deleted.');
    loadTasks();
    loadStats();
  } catch (err) {
    alert(err.message);
  }
}
