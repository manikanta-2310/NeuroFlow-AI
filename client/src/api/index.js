import { apiClient } from './client';

export const api = {
  // Health
  health: {
    check: () => apiClient.get('/health').then((res) => res.data),
  },

  // Auth
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials).then((res) => res.data),
    register: (data) => apiClient.post('/auth/register', data).then((res) => res.data),
    me: () => apiClient.get('/auth/me').then((res) => res.data),
  },

  // Dashboard
  dashboard: {
    get: () => apiClient.get('/dashboard').then((res) => res.data),
  },

  // Workspaces
  workspaces: {
    list: () => apiClient.get('/workspaces').then((res) => res.data),
    getById: (id) => apiClient.get(`/workspaces/${id}`).then((res) => res.data),
    create: (data) => apiClient.post('/workspaces', data).then((res) => res.data),
    update: (id, data) => apiClient.patch(`/workspaces/${id}`, data).then((res) => res.data),
    delete: (id) => apiClient.delete(`/workspaces/${id}`).then((res) => res.data),
  },

  // Documents
  documents: {
    listByWorkspace: (workspaceId) =>
      apiClient.get(`/workspaces/${workspaceId}/documents`).then((res) => res.data),
    getById: (id) => apiClient.get(`/documents/${id}`).then((res) => res.data),
    upload: (workspaceId, formData) =>
      apiClient
        .post(`/workspaces/${workspaceId}/documents/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((res) => res.data),
    reprocess: (id) => apiClient.post(`/documents/${id}/reprocess`).then((res) => res.data),
    delete: (id) => apiClient.delete(`/documents/${id}`).then((res) => res.data),
  },

  // Chat
  chat: {
    getThreads: (workspaceId) =>
      apiClient.get(`/workspaces/${workspaceId}/chat`).then((res) => res.data),
    getMessages: (workspaceId, threadId) =>
      apiClient
        .get(`/workspaces/${workspaceId}/chat/${threadId}/messages`)
        .then((res) => res.data),
    sendMessage: (workspaceId, data) =>
      apiClient.post(`/workspaces/${workspaceId}/chat`, data).then((res) => res.data),
  },

  // Workflow Runs
  runs: {
    listByWorkspace: (workspaceId) =>
      apiClient.get(`/workspaces/${workspaceId}/runs`).then((res) => res.data),
    getById: (id) => apiClient.get(`/runs/${id}`).then((res) => res.data),
    summarize: (workspaceId, data) =>
      apiClient.post(`/workspaces/${workspaceId}/runs/summarize`, data).then((res) => res.data),
    compare: (workspaceId, data) =>
      apiClient.post(`/workspaces/${workspaceId}/runs/compare`, data).then((res) => res.data),
    meetingActionItems: (workspaceId, data) =>
      apiClient
        .post(`/workspaces/${workspaceId}/runs/meeting-action-items`, data)
        .then((res) => res.data),
    researchBrief: (workspaceId, data) =>
      apiClient
        .post(`/workspaces/${workspaceId}/runs/research-brief`, data)
        .then((res) => res.data),
  },
};
