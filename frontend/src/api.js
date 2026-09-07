const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
  const data = response.status === 204 ? null : await response.json()
  if (!response.ok) throw new Error(data?.message || 'Request failed')
  return data
}

export const api = {
  books: (params = {}) => request(`/books?${new URLSearchParams(params)}`),
  addBook: (book) => request('/books', { method: 'POST', body: JSON.stringify(book) }),
  transactions: () => request('/transactions'),
  issue: (payload) => request('/transactions/issue', { method: 'POST', body: JSON.stringify(payload) }),
  returnBook: (id) => request(`/transactions/${id}/return`, { method: 'POST' }),
  analytics: () => request('/analytics')
}
