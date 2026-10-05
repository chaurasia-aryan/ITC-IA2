const { useState, useEffect, useContext, createContext } = React;

const ForumContext = createContext();

const DEMO_USERS = [
  { username: 'aryan_c', name: 'Aryan Chaurasia', avatar: '👨‍💻' },
  { username: 'priya_m', name: 'Priya Mukherjee', avatar: '👩‍🔬' },
  { username: 'rahul_s', name: 'Rahul Sharma', avatar: '🧑‍💻' },
  { username: 'neha_k', name: 'Neha Kulkarni', avatar: '👩‍💼' }
];

const CATEGORIES = ['All', 'React', 'Node.js', 'MongoDB', 'System Design', 'General'];

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="toast show" onClick={onClose}>
      {message}
    </div>
  );
}

function ForumProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(DEMO_USERS[0]);
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchPosts = async () => {
    try {
      const url = activeCategory === 'All' ? '/api/posts' : `/api/posts?category=${activeCategory}`;
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      showToast('Error loading posts: ' + err.message);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  const addPost = async (title, content, category) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category,
          author: currentUser
        })
      });
      if (!res.ok) throw new Error('Failed to create post');
      const created = await res.json();
      setPosts((prev) => [created, ...prev]);
      showToast('New discussion thread published!');
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const deletePost = async (postId, postAuthorUsername) => {
    if (currentUser.username !== postAuthorUsername) {
      showToast('❌ Permission Denied: You can only delete your own posts!');
      return;
    }
    if (!window.confirm('Are you sure you want to delete your post?')) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      setPosts((prev) => prev.filter((p) => (p.id || p._id) !== postId));
      showToast('Post deleted successfully.');
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const upvotePost = async (postId) => {
    try {
      const res = await fetch(`/api/posts/${postId}/upvote`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to upvote');
      const updated = await res.json();
      setPosts((prev) =>
        prev.map((p) => ((p.id || p._id) === postId ? { ...p, upvotes: updated.upvotes } : p))
      );
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const addComment = async (postId, commentText) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText,
          author: currentUser
        })
      });
      if (!res.ok) throw new Error('Failed to add comment');
      const newComment = await res.json();

      setPosts((prev) =>
        prev.map((p) =>
          (p.id || p._id) === postId
            ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
            : p
        )
      );
      showToast('Comment posted!');
      return newComment;
    } catch (err) {
      showToast('Error adding comment: ' + err.message);
      return null;
    }
  };

  const deleteComment = async (postId, commentId, commentAuthorUsername) => {
    if (currentUser.username !== commentAuthorUsername) {
      showToast('❌ Permission Denied: You can only delete your own comments!');
      return false;
    }
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, postId })
      });
      if (!res.ok) throw new Error('Failed to delete comment');
      setPosts((prev) =>
        prev.map((p) =>
          (p.id || p._id) === postId
            ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) }
            : p
        )
      );
      showToast('Comment removed.');
      return true;
    } catch (err) {
      showToast('Error: ' + err.message);
      return false;
    }
  };

  return (
    <ForumContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        posts,
        activeCategory,
        setActiveCategory,
        addPost,
        deletePost,
        upvotePost,
        addComment,
        deleteComment,
        showToast,
        toastMessage,
        setToastMessage
      }}
    >
      {children}
    </ForumContext.Provider>
  );
}

function useForum() {
  return useContext(ForumContext);
}

function Navbar() {
  const { currentUser, setCurrentUser } = useForum();

  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand">
          <span className="brand-icon">💬</span>
          <span className="brand-title">Dev<strong>Forum</strong></span>
        </div>

        <div className="user-switcher-box">
          <span className="user-label">Logged In As:</span>
          <select
            value={currentUser.username}
            onChange={(e) => {
              const selected = DEMO_USERS.find((u) => u.username === e.target.value);
              if (selected) setCurrentUser(selected);
            }}
          >
            {DEMO_USERS.map((u) => (
              <option key={u.username} value={u.username}>
                {u.avatar} {u.name} (@{u.username})
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

function CreatePostBox() {
  const { addPost, currentUser } = useForum();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('React');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    await addPost(title, content, category);
    setTitle('');
    setContent('');
    setIsSubmitting(false);
  };

  return (
    <div className="card create-post-card">
      <div className="post-header-top">
        <span className="user-avatar">{currentUser.avatar}</span>
        <div>
          <h4>Start a New Discussion</h4>
          <p className="author-subtitle">Posting as <strong>{currentUser.name}</strong></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <input
            type="text"
            required
            placeholder="Thread Title / Question..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-group">
          <textarea
            rows="3"
            required
            placeholder="Describe your question or share insights with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div className="form-row-submit">
          <div className="category-select-wrap">
            <label>Tag / Category:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="React">React</option>
              <option value="Node.js">Node.js</option>
              <option value="MongoDB">MongoDB</option>
              <option value="System Design">System Design</option>
              <option value="General">General</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Publishing...' : '🚀 Post Thread'}
          </button>
        </div>
      </form>
    </div>
  );
}

function PostCard({ post }) {
  const { currentUser, deletePost, upvotePost, addComment, deleteComment } = useForum();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const postId = post.id || post._id;
  const isOwner = currentUser.username === (post.author && post.author.username);

  const toggleComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newC = await addComment(postId, commentText);
    if (newC) {
      setComments((prev) => [...prev, newC]);
      setCommentText('');
    }
  };

  const handleDeleteComment = async (cId, authorUsername) => {
    const success = await deleteComment(postId, cId, authorUsername);
    if (success) {
      setComments((prev) => prev.filter((c) => (c.id || c._id) !== cId));
    }
  };

  return (
    <div className="card post-card">
      <div className="post-top">
        <div className="author-info">
          <span className="author-avatar">{post.author?.avatar || '👤'}</span>
          <div>
            <strong>{post.author?.name || 'Anonymous'}</strong>
            <span className="username-tag">@{post.author?.username}</span>
          </div>
        </div>
        <div className="post-badges">
          <span className="category-pill">{post.category}</span>

          {isOwner ? (
            <button
              className="btn-delete-owner"
              onClick={() => deletePost(postId, post.author.username)}
              title="Delete your post"
            >
              🗑️ Delete
            </button>
          ) : (
            <span className="ownership-tag" title="Only author can delete">Read-only</span>
          )}
        </div>
      </div>

      <h3 className="post-title">{post.title}</h3>
      <p className="post-content">{post.content}</p>

      <div className="post-footer">
        <button className="upvote-btn" onClick={() => upvotePost(postId)}>
          ▲ Upvote ({post.upvotes || 0})
        </button>
        <button className="comments-toggle-btn" onClick={toggleComments}>
          💬 Comments ({post.commentsCount || 0})
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          <form onSubmit={handleAddComment} className="comment-form">
            <input
              type="text"
              placeholder={`Comment as ${currentUser.name}...`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="btn-primary-sm">Send</button>
          </form>

          {loadingComments ? (
            <p className="loading-text">Loading replies...</p>
          ) : (
            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">No comments yet. Be the first to reply!</p>
              ) : (
                comments.map((c) => {
                  const isCommentOwner = currentUser.username === (c.author && c.author.username);
                  return (
                    <div key={c.id || c._id} className="comment-bubble">
                      <div className="comment-header">
                        <span>{c.author?.avatar} <strong>{c.author?.name}</strong> (@{c.author?.username})</span>
                        {isCommentOwner && (
                          <button
                            className="btn-comment-delete"
                            onClick={() => handleDeleteComment(c.id || c._id, c.author.username)}
                            title="Delete your comment"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <p className="comment-text">{c.content}</p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ForumScreen() {
  const { posts, activeCategory, setActiveCategory, toastMessage, setToastMessage } = useForum();

  return (
    <div id="app">
      <Navbar />

      <main className="content-container">

        <div className="ownership-banner">
          <span>💡 <strong>React Context API & Content Ownership:</strong> Switch users in the top-right header to test that authors can only delete their own posts and comments.</span>
        </div>

        <div className="category-filter-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <CreatePostBox />

        <div className="posts-list">
          {posts.length === 0 ? (
            <div className="empty-state">
              <p>No discussion threads found in this category. Start one above!</p>
            </div>
          ) : (
            posts.map((p) => <PostCard key={p.id || p._id} post={p} />)
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <p>OST Lab IA-2 (Roll No: 52 to 59) | Stack: React Context API + Node.js/Express + MongoDB</p>
        </div>
      </footer>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}

function App() {
  return (
    <ForumProvider>
      <ForumScreen />
    </ForumProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
