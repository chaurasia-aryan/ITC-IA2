/**
 * Forum State Store (Mirroring React Context API Architecture)
 * -------------------------------------------------------------
 * Centralizes global state for posts, active user profile, and filters.
 */
const ForumContext = {
  state: {
    users: [],
    currentProfile: null,
    posts: [],
    activeCategory: 'All',
    searchQuery: '',
    activeThread: null
  },
  subscribers: [],
  subscribe(fn) {
    this.subscribers.push(fn);
  },
  notify() {
    this.subscribers.forEach(fn => fn(this.state));
    updateDebugState();
  },
  setState(updater) {
    this.state = { ...this.state, ...updater };
    this.notify();
  }
};

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateDebugState() {
  const p = ForumContext.state.currentProfile;
  document.getElementById('debugProfile').textContent = p ? `${p.name} (@${p.username})` : '--';
  document.getElementById('debugCount').textContent = ForumContext.state.posts.length;
}

// ----------------- Initialization -----------------
window.addEventListener('DOMContentLoaded', async () => {
  ForumContext.subscribe(renderFeed);
  await loadUsers();
  await loadPosts();
});

async function loadUsers() {
  try {
    const res = await fetch('/api/users');
    const users = await res.json();
    const current = users[0] || { username: 'aryan_c', name: 'Aryan Chaurasia', avatar: '👨‍💻' };

    ForumContext.setState({ users, currentProfile: current });

    const select = document.getElementById('activeUserSelect');
    select.innerHTML = users.map(u => `
      <option value="${u.username}">${u.avatar} ${u.name} (@${u.username})</option>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

function onUserChange(username) {
  const user = ForumContext.state.users.find(u => u.username === username);
  if (user) {
    ForumContext.setState({ currentProfile: user });
    showToast(`Switched active user to: ${user.name}`);
    renderFeed(ForumContext.state);
    if (ForumContext.state.activeThread) {
      viewThread(ForumContext.state.activeThread.id);
    }
  }
}

// ----------------- Posts API & Context Actions -----------------
async function loadPosts() {
  const { activeCategory, searchQuery } = ForumContext.state;
  let url = `/api/posts?category=${encodeURIComponent(activeCategory)}`;
  if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

  try {
    const res = await fetch(url);
    const posts = await res.json();
    ForumContext.setState({ posts });
  } catch (err) {
    console.error(err);
  }
}

function setCategoryFilter(cat, btn) {
  document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ForumContext.setState({ activeCategory: cat });
  loadPosts();
}

function onSearchPosts(val) {
  ForumContext.setState({ searchQuery: val.trim() });
  loadPosts();
}

function renderFeed(state) {
  const container = document.getElementById('postsFeed');
  const currentUsername = state.currentProfile ? state.currentProfile.username : '';

  if (!state.posts.length) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 40px;" class="card">
        <p>No discussion threads found in this category.</p>
        <p style="font-size: 0.85rem; margin-top: 6px;">Be the first to start a conversation!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.posts.map(p => {
    const isOwner = p.author.username === currentUsername;
    return `
      <div class="post-card">
        <div class="post-meta-row">
          <div class="author-chip">
            <span class="author-avatar">${p.author.avatar || '👤'}</span>
            <div>
              <span class="author-name">${p.author.name}</span>
              <span class="author-username">@${p.author.username}</span>
            </div>
          </div>
          <span class="cat-badge">${p.category}</span>
        </div>

        <h3 class="post-title" onclick="viewThread('${p.id}')">${p.title}</h3>
        <p class="post-preview">${p.content}</p>

        <div class="post-footer">
          <div class="action-buttons">
            <span class="interactive-badge" onclick="upvotePost('${p.id}')">
              ▲ <strong>${p.upvotes || 0}</strong> Upvotes
            </span>
            <span class="interactive-badge" onclick="viewThread('${p.id}')">
              💬 <strong>${p.commentsCount || 0}</strong> Comments
            </span>
          </div>

          <!-- Ownership Controlled Action Buttons -->
          <div>
            ${isOwner ? `
              <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.8rem; margin-right: 6px;" onclick="openEditPostModal('${p.id}')">Edit</button>
              <button class="btn btn-danger" style="padding: 4px 10px; font-size: 0.8rem;" onclick="handleDeletePost('${p.id}')">Delete</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------- Create, Edit, Delete Post -----------------
async function handleCreatePost(e) {
  e.preventDefault();
  const current = ForumContext.state.currentProfile;
  const payload = {
    title: document.getElementById('postTitle').value.trim(),
    content: document.getElementById('postContent').value.trim(),
    category: document.getElementById('postCategory').value,
    username: current.username
  };

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user': current.username
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to publish post');

    showToast('Discussion thread published!');
    document.getElementById('newPostForm').reset();
    await loadPosts();
  } catch (err) {
    alert(err.message);
  }
}

function openEditPostModal(id) {
  const post = ForumContext.state.posts.find(p => p.id === id);
  if (!post) return;

  document.getElementById('editPostId').value = post.id;
  document.getElementById('editPostTitle').value = post.title;
  document.getElementById('editPostContent').value = post.content;
  document.getElementById('editPostCategory').value = post.category;

  document.getElementById('editPostModal').classList.add('show');
}

function closeEditModal() {
  document.getElementById('editPostModal').classList.remove('show');
}

async function handleUpdatePost(e) {
  e.preventDefault();
  const id = document.getElementById('editPostId').value;
  const current = ForumContext.state.currentProfile;
  const payload = {
    title: document.getElementById('editPostTitle').value.trim(),
    content: document.getElementById('editPostContent').value.trim(),
    category: document.getElementById('editPostCategory').value
  };

  try {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user': current.username
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update post');

    showToast('Post updated successfully!');
    closeEditModal();
    await loadPosts();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeletePost(id) {
  if (!confirm('Are you sure you want to delete your post? All comments will also be deleted.')) return;
  const current = ForumContext.state.currentProfile;

  try {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: { 'x-user': current.username }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete post');

    showToast('Post deleted.');
    await loadPosts();
  } catch (err) {
    alert(err.message);
  }
}

async function upvotePost(id) {
  try {
    await fetch(`/api/posts/${id}/upvote`, { method: 'POST' });
    await loadPosts();
  } catch (err) {
    console.error(err);
  }
}

// ----------------- Thread Detail & Comments Modal -----------------
async function viewThread(id) {
  try {
    const res = await fetch(`/api/posts/${id}`);
    const thread = await res.json();
    ForumContext.setState({ activeThread: thread });

    const currentUsername = ForumContext.state.currentProfile ? ForumContext.state.currentProfile.username : '';
    const modalContent = document.getElementById('threadModalContent');

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <span class="cat-badge">${thread.category}</span>
        <button class="btn btn-secondary" style="padding: 4px 10px;" onclick="closeThreadModal()">✕ Close</button>
      </div>

      <h2 style="font-size: 1.5rem; margin-bottom: 8px; color: #fff;">${thread.title}</h2>
      <div class="author-chip" style="margin-bottom: 16px;">
        <span class="author-avatar">${thread.author.avatar || '👤'}</span>
        <div>
          <span class="author-name">${thread.author.name}</span>
          <span class="author-username">@${thread.author.username}</span>
        </div>
      </div>

      <div style="background: #0f172a; padding: 18px; border-radius: 8px; border: 1px solid var(--border-color); line-height: 1.7; margin-bottom: 24px; color: #e2e8f0;">
        ${thread.content}
      </div>

      <h3 style="font-size: 1.1rem; margin-bottom: 16px;">Comments (${(thread.comments || []).length})</h3>

      <!-- Comments Stream -->
      <div style="max-height: 250px; overflow-y: auto; margin-bottom: 20px;">
        ${(thread.comments || []).length ? thread.comments.map(c => {
          const isOwnComment = c.author.username === currentUsername;
          return `
            <div class="comment-box">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 700; font-size: 0.85rem; color: #fff;">
                  ${c.author.avatar || '👤'} ${c.author.name} <span style="color: var(--text-muted); font-weight: normal;">(@${c.author.username})</span>
                </span>
                ${isOwnComment ? `
                  <button class="btn btn-danger" style="padding: 2px 8px; font-size: 0.75rem;" onclick="handleDeleteComment('${thread.id}', '${c.id}')">Delete</button>
                ` : ''}
              </div>
              <p style="font-size: 0.9rem; color: #cbd5e1;">${c.content}</p>
            </div>
          `;
        }).join('') : '<p style="color: var(--text-muted); font-style: italic;">No comments yet. Share your thoughts!</p>'}
      </div>

      <!-- Add Comment Form -->
      <form onsubmit="handleAddComment(event, '${thread.id}')">
        <div style="display: flex; gap: 10px;">
          <input type="text" id="newCommentInput" class="form-control" placeholder="Write a constructive comment..." required />
          <button type="submit" class="btn btn-primary" style="white-space: nowrap;">Post Comment</button>
        </div>
      </form>
    `;

    document.getElementById('threadModal').classList.add('show');
  } catch (err) {
    alert(err.message);
  }
}

function closeThreadModal() {
  document.getElementById('threadModal').classList.remove('show');
  ForumContext.setState({ activeThread: null });
}

async function handleAddComment(e, postId) {
  e.preventDefault();
  const input = document.getElementById('newCommentInput');
  const content = input.value.trim();
  const current = ForumContext.state.currentProfile;

  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user': current.username
      },
      body: JSON.stringify({ content, username: current.username })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to post comment');

    showToast('Comment posted!');
    input.value = '';
    await viewThread(postId);
    await loadPosts();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteComment(postId, commentId) {
  if (!confirm('Delete your comment?')) return;
  const current = ForumContext.state.currentProfile;

  try {
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'x-user': current.username }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete comment');

    showToast('Comment deleted.');
    await viewThread(postId);
    await loadPosts();
  } catch (err) {
    alert(err.message);
  }
}
