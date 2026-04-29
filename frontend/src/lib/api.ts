const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Auth
  async register(data: { name: string; email: string; password: string }) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  // Errors
  async createError(data: any) {
    return this.request<any>('/errors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getErrors(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<{ data: any[]; meta: any }>(`/errors${query}`);
  }

  async getError(id: string) {
    return this.request<any>(`/errors/${id}`);
  }

  async updateError(id: string, data: any) {
    return this.request<any>(`/errors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteError(id: string) {
    return this.request<any>(`/errors/${id}`, { method: 'DELETE' });
  }

  // Search
  async search(q: string, params?: Record<string, string>) {
    const allParams = { q, ...params };
    const query = '?' + new URLSearchParams(allParams).toString();
    return this.request<{ results: any[]; sources: string[] }>(`/search${query}`);
  }

  async autocomplete(q: string) {
    return this.request<{ id: string; title: string; severity: string }[]>(
      `/search/autocomplete?q=${encodeURIComponent(q)}`,
    );
  }

  // Upload
  async uploadImage(file: File, errorId?: string) {
    const formData = new FormData();
    formData.append('image', file);
    if (errorId) formData.append('errorId', errorId);

    return this.request<{ id: string; imageUrl: string; extractedText: string }>(
      '/upload/image',
      { method: 'POST', body: formData },
    );
  }

  // AI
  async aiSuggest(text: string) {
    return this.request<{
      suggestions: {
        suggestedTitle: string;
        suggestedCause: string;
        suggestedSolution: string;
        suggestedTags: string[];
      } | null;
      similarErrorIds: { errorId: string; score: number }[];
    }>('/ai/suggest', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // Feedback
  async submitFeedback(errorId: string, worked: boolean, comment?: string) {
    return this.request<any>(`/errors/${errorId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ worked, comment }),
    });
  }

  // Comments
  async getComments(errorId: string) {
    return this.request<any[]>(`/errors/${errorId}/comments`);
  }

  async addComment(errorId: string, content: string) {
    return this.request<any>(`/errors/${errorId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Tags
  async getTags() {
    return this.request<any[]>('/tags');
  }

  async searchTags(q: string) {
    return this.request<any[]>(`/tags/search?q=${encodeURIComponent(q)}`);
  }
}

export const api = new ApiClient();
