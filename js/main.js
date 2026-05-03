// ==================== Mock API Implementation ====================
// This mock API replaces the need for a backend server for demonstration purposes.
const mockData = {
  users: [
    { id: 1, fullName: "Demo User", email: "user@example.com", studentId: "12345", password: "password" }
  ],
  books: [
    { id: 1, title: "Data Structures and Algorithms", author: "Robert Lafore", category: "Computer Science", coverImage: "https://via.placeholder.com/150x200?text=DSA" },
    { id: 2, title: "Introduction to Machine Learning", author: "Ethem Alpaydin", category: "AI & ML", coverImage: "https://via.placeholder.com/150x200?text=ML" },
    { id: 3, title: "Quantum Physics for Beginners", author: "Michael Brooks", category: "Physics", coverImage: "https://via.placeholder.com/150x200?text=Physics" },
    { id: 4, title: "Modern Web Development", author: "Kyle Simpson", category: "Web Development", coverImage: "https://via.placeholder.com/150x200?text=Web" },
    { id: 5, title: "Clean Code", author: "Robert C. Martin", category: "Computer Science", coverImage: "https://via.placeholder.com/150x200?text=Clean+Code" },
    { id: 6, title: "Deep Learning Illustrated", author: "Jon Krohn", category: "AI & ML", coverImage: "https://via.placeholder.com/150x200?text=Deep+Learning" },
    { id: 7, title: "Astrophysics for People in a Hurry", author: "Neil deGrasse Tyson", category: "Physics", coverImage: "https://via.placeholder.com/150x200?text=Astrophysics" },
    { id: 8, title: "Eloquent JavaScript", author: "Marijn Haverbeke", category: "Web Development", coverImage: "https://via.placeholder.com/150x200?text=JS" }
  ],
  events: [
    { id: 1, title: "Research Paper Writing Workshop", date: "2026-04-15", time: "14:00 - 16:00", location: "Main Library, Room B12", description: "Learn effective strategies for writing academic research papers." },
    { id: 2, title: "Digital Resources Orientation", date: "2026-04-20", time: "10:00 - 11:30", location: "Library Computer Lab", description: "Tour of our digital databases, e-books, and research tools." },
    { id: 3, title: "Book Club: Classic Literature", date: "2026-05-01", time: "16:00 - 17:30", location: "Library Reading Room", description: "Monthly discussion on selected classic novels." }
  ],
  favorites: [],
  complaints: []
};

// Mock Fetch function to handle requests locally
async function mockFetch(url, options = {}) {
  const path = url.replace(/^http:\/\/127\.0\.0\.1:5000\/api/, '');
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;
  const token = localStorage.getItem('token');

  console.log(`Mock Request: ${method} ${path}`, body);

  // Helper for responses
  const unauthorized = () => ({ ok: false, status: 401, json: async () => ({ message: 'Not authorized' }) });
  const success = (data) => ({ ok: true, status: 200, json: async () => data });
  const error = (msg) => ({ ok: false, status: 400, json: async () => ({ message: msg }) });

  // Auth check for protected routes
  if (!['/login', '/register'].includes(path) && !token) return unauthorized();

  // Route Handlers
  if (path === '/login' && method === 'POST') {
    const user = mockData.users.find(u => u.email === body.email && u.password === body.password);
    if (user) return success({ token: 'mock-jwt-token', user });
    return error('Invalid email or password');
  }

  if (path === '/register' && method === 'POST') {
    if (mockData.users.some(u => u.email === body.email)) return error('Email already exists');
    const newUser = { id: mockData.users.length + 1, ...body };
    mockData.users.push(newUser);
    return success({ message: 'User registered' });
  }

  if (path === '/user/profile') {
    return success(mockData.users[0]); // Always return first user for demo
  }

  if (path.startsWith('/books')) {
    let filtered = [...mockData.books];
    const urlParts = path.split('?');
    if (urlParts.length > 1) {
      const urlParams = new URLSearchParams(urlParts[1]);
      const search = urlParams.get('search');
      const category = urlParams.get('category');

      if (search) {
        filtered = filtered.filter(b => 
          b.title.toLowerCase().includes(search.toLowerCase()) || 
          b.author.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (category && category !== 'All') {
        filtered = filtered.filter(b => b.category === category);
      }
    }
    return success(filtered);
  }

  if (path === '/events') return success(mockData.events);

  if (path === '/user/favorites') {
    if (method === 'GET') {
      const favs = mockData.favorites.map(id => mockData.books.find(b => b.id === id)).filter(Boolean);
      return success(favs);
    }
    if (method === 'POST') {
      if (!mockData.favorites.includes(body.bookId)) mockData.favorites.push(body.bookId);
      return success({ message: 'Added' });
    }
  }

  if (path.startsWith('/user/favorites/') && method === 'DELETE') {
    const bookId = parseInt(path.split('/').pop());
    mockData.favorites = mockData.favorites.filter(id => id !== bookId);
    return success({ message: 'Removed' });
  }

  if (path === '/complaints' && method === 'POST') {
    mockData.complaints.push(body);
    return success({ message: 'Complaint submitted' });
  }

  if (path === '/events/register' && method === 'POST') {
    return success({ message: 'Registered for event' });
  }

  return error('Endpoint not found');
}

// Override global fetch with mockFetch
window.fetch = mockFetch;

// ==================== Original Application Logic ====================
const API_BASE = 'http://127.0.0.1:5000';

function getToken() {
  return localStorage.getItem('token');
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = 'index.html';
  }
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

async function loadUserProfile() {
  try {
    const res = await fetch(`${API_BASE}/api/user/profile`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Not authorized');
    const user = await res.json();

    const usernameDisplay = document.getElementById('usernameDisplay');
    if (usernameDisplay) usernameDisplay.textContent = user.fullName;

    const welcomeMsg = document.getElementById('welcomeMessage');
    if (welcomeMsg) welcomeMsg.textContent = `Welcome, ${user.fullName}!`;

    return user;
  } catch (error) {
    console.error('Profile load error:', error);
    if (error.message === 'Not authorized') logout();
  }
}

function setupGlobalSearch() {
  const searchInput = document.getElementById('globalSearch');
  const searchBtn = document.getElementById('searchBtn');
  if (!searchInput || !searchBtn) return;

  const performSearch = () => {
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `books.html?search=${encodeURIComponent(query)}`;
    } else {
      window.location.href = 'books.html';
    }
  };

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        window.location.href = 'home.html';
      } else {
        alert('Login failed: ' + (data.message || JSON.stringify(data)));
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const studentId = document.getElementById('studentId').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, studentId, password, confirmPassword })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Registration successful! Please login.');
        window.location.href = 'index.html';
      } else {
        alert('Registration failed: ' + (data.message || JSON.stringify(data)));
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const isAuthPage = loginForm || registerForm;
  if (isAuthPage) return;

  requireAuth();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  await loadUserProfile();
  setupGlobalSearch();

  if (document.getElementById('recentBooks')) {
    loadRecentBooks();
    loadUpcomingEvents();
  }

  if (document.getElementById('booksGrid')) {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search') || '';
    const category = urlParams.get('category') || 'All';

    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch && searchQuery) {
      globalSearch.value = searchQuery;
    }

    const catFilter = document.getElementById('categoryFilter');
    if (catFilter) {
      catFilter.value = category;
      catFilter.addEventListener('change', (e) => {
        const selectedCat = e.target.value;
        const searchVal = document.getElementById('globalSearch')?.value.trim() || '';
        let newUrl = 'books.html?';
        if (searchVal) newUrl += `search=${encodeURIComponent(searchVal)}&`;
        newUrl += `category=${encodeURIComponent(selectedCat)}`;
        window.history.pushState({}, '', newUrl);
        fetchBooks(searchVal, selectedCat);
      });
    }
    await fetchBooks(searchQuery, category);
  }

  if (document.getElementById('favoritesGrid')) {
    loadFavoritesPage();
  }

  if (document.getElementById('eventsList')) {
    loadEvents();
  }

  if (document.getElementById('complaintForm')) {
    document.getElementById('complaintForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const issueType = document.getElementById('issueType').value;
      const message = document.getElementById('complaintMessage').value;
      try {
        const res = await fetch(`${API_BASE}/api/complaints`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ issueType, message })
        });
        if (res.ok) {
          alert('Thank you! Your feedback has been submitted.');
          document.getElementById('complaintForm').reset();
        } else {
          const data = await res.json();
          alert('Submission failed: ' + (data.message || JSON.stringify(data)));
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });
  }
});

async function fetchBooks(search = '', category = 'All') {
  const grid = document.getElementById('booksGrid');
  if (!grid) return;
  let url = `${API_BASE}/api/books?`;
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (category !== 'All') url += `category=${encodeURIComponent(category)}&`;
  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch books');
    const books = await res.json();
    renderBookGrid(books, grid, true);
  } catch (error) {
    console.error(error);
    grid.innerHTML = '<p>Failed to load books.</p>';
  }
}

function renderBookGrid(books, container, showFavButton = true) {
  container.innerHTML = books.map(book => `
    <div class="book-card">
      <img src="${book.coverImage || 'https://via.placeholder.com/150x200?text=No+Cover'}" alt="${book.title}">
      <h4>${book.title}</h4>
      <p>${book.author}</p>
      ${showFavButton
        ? `<button class="btn-fav" onclick="addToFavorites(${book.id})">♥ Add to Favorites</button>`
        : `<button class="btn-remove-fav" onclick="removeFromFavorites(${book.id})">Remove</button>`
      }
    </div>
  `).join('');
}

window.addToFavorites = async function(bookId) {
  try {
    const res = await fetch(`${API_BASE}/api/user/favorites`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ bookId })
    });
    if (res.ok) {
      alert('Book added to favorites!');
    } else {
      const data = await res.json();
      alert('Could not add: ' + (data.message || ''));
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

window.removeFromFavorites = async function(bookId) {
  try {
    const res = await fetch(`${API_BASE}/api/user/favorites/${bookId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.ok) {
      alert('Removed from favorites.');
      loadFavoritesPage();
    } else {
      const data = await res.json();
      alert('Could not remove: ' + (data.message || ''));
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

async function loadFavoritesPage() {
  const grid = document.getElementById('favoritesGrid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/api/user/favorites`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch favorites');
    const books = await res.json();

    if (books.length === 0) {
      grid.innerHTML = '<p>You have no favorite books yet.</p>';
      return;
    }

    renderBookGrid(books, grid, false);
  } catch (error) {
    console.error(error);
    grid.innerHTML = '<p>Failed to load favorites.</p>';
  }
}

window.registerForEvent = async function(eventId) {
  try {
    const res = await fetch(`${API_BASE}/api/events/register`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ eventId })
    });
    if (res.ok) {
      alert('Successfully registered for the event!');
    } else {
      const data = await res.json();
      alert('Registration failed: ' + (data.message || ''));
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

async function loadRecentBooks() {
  try {
    const res = await fetch(`${API_BASE}/api/books`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed');
    const books = await res.json();
    const container = document.getElementById('recentBooks');
    if (container) renderBookGrid(books.slice(0, 4), container, true);
  } catch (err) {
    console.error(err);
  }
}

async function loadUpcomingEvents() {
  const container = document.getElementById('upcomingEvents');
  if (!container) return;
  try {
    const res = await fetch(`${API_BASE}/api/events`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed');
    const events = await res.json();
    const upcoming = events.slice(0, 3);
    container.innerHTML = upcoming.map(event => `
      <div class="event-card">
        <h4>${event.title}</h4>
        <p>${event.description}</p>
        <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()} | <strong>Time:</strong> ${event.time}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <button class="btn-register" onclick="registerForEvent(${event.id})">Register</button>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function loadEvents() {
  const container = document.getElementById('eventsList');
  if (!container) return;
  try {
    const res = await fetch(`${API_BASE}/api/events`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed');
    const events = await res.json();
    container.innerHTML = events.map(event => `
      <div class="event-card">
        <h4>${event.title}</h4>
        <p>${event.description}</p>
        <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()} | <strong>Time:</strong> ${event.time}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <button class="btn-register" onclick="registerForEvent(${event.id})">Register</button>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Failed to load events.</p>';
  }
}
