import { create } from 'zustand';

const storedToken = localStorage.getItem('neuroflow_token');
const storedUser = localStorage.getItem('neuroflow_user');

export const useAuthStore = create((set) => ({
  token: storedToken || null,
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedToken,

  setSession: (token, user) => {
    if (token) {
      localStorage.setItem('neuroflow_token', token);
    } else {
      localStorage.removeItem('neuroflow_token');
    }

    if (user) {
      localStorage.setItem('neuroflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('neuroflow_user');
    }

    set({
      token,
      user,
      isAuthenticated: !!token,
    });
  },

  logout: () => {
    localStorage.removeItem('neuroflow_token');
    localStorage.removeItem('neuroflow_user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
