import React, { createContext, useContext, useReducer, useEffect } from 'react';

const initialState = {
  posts: [],
  currentUser: { username: 'aryan_c', name: 'Aryan Chaurasia', avatar: '👨‍💻' },
  activeCategory: 'All',
  loading: false
};

function forumReducer(state, action) {
  switch (action.type) {
    case 'SET_POSTS':
      return { ...state, posts: action.payload, loading: false };
    case 'ADD_POST':
      return { ...state, posts: [action.payload, ...state.posts] };
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(p => p.id === action.payload.id ? action.payload : p)
      };
    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(p => p.id !== action.payload)
      };
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_CATEGORY':
      return { ...state, activeCategory: action.payload };
    default:
      return state;
  }
}

const ForumStateContext = createContext();
const ForumDispatchContext = createContext();

export function ForumProvider({ children }) {
  const [state, dispatch] = useReducer(forumReducer, initialState);

  useEffect(() => {
    fetchPosts();
  }, [state.activeCategory]);

  async function fetchPosts() {
    try {
      const res = await fetch(`/api/posts?category=${state.activeCategory}`);
      const data = await res.json();
      dispatch({ type: 'SET_POSTS', payload: data });
    } catch (err) {
      console.error(err);
    }
  }

  const createPost = async (title, content, category) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user': state.currentUser.username
      },
      body: JSON.stringify({ title, content, category, username: state.currentUser.username })
    });
    const newPost = await res.json();
    dispatch({ type: 'ADD_POST', payload: newPost });
  };

  const deletePost = async (id) => {
    await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: { 'x-user': state.currentUser.username }
    });
    dispatch({ type: 'DELETE_POST', payload: id });
  };

  return (
    <ForumStateContext.Provider value={state}>
      <ForumDispatchContext.Provider value={{ dispatch, createPost, deletePost }}>
        {children}
      </ForumDispatchContext.Provider>
    </ForumStateContext.Provider>
  );
}

export function useForumState() {
  const context = useContext(ForumStateContext);
  if (!context) throw new Error('useForumState must be used within a ForumProvider');
  return context;
}

export function useForumDispatch() {
  const context = useContext(ForumDispatchContext);
  if (!context) throw new Error('useForumDispatch must be used within a ForumProvider');
  return context;
}
