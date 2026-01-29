// ===================================
// Rose Fórum - Enhanced JavaScript
// ===================================

// Constants and Configuration
const STORAGE_KEY = 'rose_forum_posts';
const MAX_POSTS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 300;

// State Management
let currentPosts = [];
let filteredPosts = [];
let currentPage = 1;
let currentPostId = null;

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            return diffMinutes === 0 ? 'Agora' : `${diffMinutes} min atrás`;
        }
        return `${diffHours}h atrás`;
    } else if (diffDays === 1) {
        return 'Ontem';
    } else if (diffDays < 7) {
        return `${diffDays} dias atrás`;
    } else {
        return date.toLocaleDateString('pt-BR');
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Storage Management
function getAllPosts() {
    try {
        const posts = localStorage.getItem(STORAGE_KEY);
        return posts ? JSON.parse(posts) : [];
    } catch (error) {
        console.error('Erro ao carregar posts:', error);
        return [];
    }
}

function savePostsToStorage(posts) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
        return true;
    } catch (error) {
        console.error('Erro ao salvar posts:', error);
        showToast('Erro ao salvar posts', 'error');
        return false;
    }
}

function savePostToStorage(post) {
    const posts = getAllPosts();
    posts.unshift(post); // Add to beginning
    return savePostsToStorage(posts);
}

// Post Management
function createPost(title, content, category = '', tags = []) {
    const post = {
        id: generateId(),
        title: sanitizeHTML(title.trim()),
        content: sanitizeHTML(content.trim()),
        category: category || 'outro',
        tags: Array.isArray(tags) ? tags : [],
        date: new Date().toISOString(),
        views: 0,
        likes: 0
    };
    
    return post;
}

function updatePost(postId, updates) {
    const posts = getAllPosts();
    const index = posts.findIndex(p => p.id === postId);
    
    if (index !== -1) {
        posts[index] = { ...posts[index], ...updates };
        savePostsToStorage(posts);
        return true;
    }
    
    return false;
}

function deletePostById(postId) {
    const posts = getAllPosts();
    const filtered = posts.filter(p => p.id !== postId);
    
    if (filtered.length !== posts.length) {
        savePostsToStorage(filtered);
        return true;
    }
    
    return false;
}

// UI Functions
function displayPosts(posts = null, containerId = 'posts') {
    const postsToShow = posts || getAllPosts();
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    // Hide loading state
    const loadingElement = document.getElementById('loadingPosts');
    if (loadingElement) loadingElement.style.display = 'none';
    
    // Show empty state if no posts
    const emptyElement = document.getElementById('emptyPosts');
    if (emptyElement) {
        emptyElement.style.display = postsToShow.length === 0 ? 'block' : 'none';
    }
    
    if (postsToShow.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = postsToShow.map((post, index) => `
        <article class="post" data-post-id="${post.id}" onclick="viewPost('${post.id}')">
            <div class="post-header">
                <h3 class="post-title">${post.title}</h3>
                <span class="post-category category-${post.category}">${post.category}</span>
            </div>
            <div class="post-excerpt">
                <p>${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
            </div>
            <div class="post-meta">
                <span class="post-date" title="${new Date(post.date).toLocaleString('pt-BR')}">
                    📅 ${formatDate(post.date)}
                </span>
                <span class="post-views">👁️ ${post.views || 0}</span>
                <span class="post-likes">❤️ ${post.likes || 0}</span>
            </div>
            ${post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
            ` : ''}
        </article>
    `).join('');
    
    // Update stats
    updateStats();
}

function viewPost(postId) {
    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
        showToast('Post não encontrado', 'error');
        return;
    }
    
    // Increment views
    updatePost(postId, { views: (post.views || 0) + 1 });
    
    // Update modal content
    const viewer = document.getElementById('viewer');
    if (viewer) {
        document.getElementById('viewTitle').textContent = post.title;
        document.getElementById('viewContent').textContent = post.content;
        document.getElementById('viewDate').textContent = formatDate(post.date);
        document.getElementById('viewCategory').textContent = post.category;
        
        const tagsContainer = document.getElementById('viewTags');
        if (tagsContainer) {
            tagsContainer.innerHTML = post.tags.length > 0 
                ? post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')
                : '';
        }
        
        viewer.style.display = 'block';
        currentPostId = postId;
        
        // Add animation
        setTimeout(() => {
            viewer.classList.add('show');
        }, 10);
    }
}

function closeViewer() {
    const viewer = document.getElementById('viewer');
    if (viewer) {
        viewer.classList.remove('show');
        setTimeout(() => {
            viewer.style.display = 'none';
        }, 300);
    }
    currentPostId = null;
}

function editPost() {
    if (!currentPostId) return;
    
    const posts = getAllPosts();
    const post = posts.find(p => p.id === currentPostId);
    
    if (!post) return;
    
    // Redirect to create page with edit mode
    window.location.href = `create.html?edit=${currentPostId}`;
}

function deletePost() {
    if (!currentPostId) return;
    
    if (confirm('Tem certeza que deseja excluir este post?')) {
        if (deletePostById(currentPostId)) {
            closeViewer();
            loadPosts();
            showToast('Post excluído com sucesso', 'success');
        } else {
            showToast('Erro ao excluir post', 'error');
        }
    }
}

// Form Handling
function savePost() {
    const titleElement = document.getElementById('title');
    const contentElement = document.getElementById('content');
    const categoryElement = document.getElementById('category');
    const tagsElement = document.getElementById('tags');
    
    if (!titleElement || !contentElement) {
        showToast('Formulário não encontrado', 'error');
        return;
    }
    
    const title = titleElement.value.trim();
    const content = contentElement.value.trim();
    const category = categoryElement ? categoryElement.value : '';
    const tagsInput = tagsElement ? tagsElement.value.trim() : '';
    
    // Validation
    if (!title) {
        showError('title-error', 'O título é obrigatório');
        titleElement.focus();
        return;
    }
    
    if (title.length < 3) {
        showError('title-error', 'O título deve ter pelo menos 3 caracteres');
        titleElement.focus();
        return;
    }
    
    if (!content) {
        showError('content-error', 'O conteúdo é obrigatório');
        contentElement.focus();
        return;
    }
    
    if (content.length < 10) {
        showError('content-error', 'O conteúdo deve ter pelo menos 10 caracteres');
        contentElement.focus();
        return;
    }
    
    // Parse tags
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // Create post
    const post = createPost(title, content, category, tags);
    
    if (savePostToStorage(post)) {
        showToast('Post criado com sucesso!', 'success');
        
        // Show success modal
        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.style.display = 'block';
        } else {
            // Redirect to index if no modal
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
}

function saveDraft() {
    const title = document.getElementById('title')?.value.trim() || '';
    const content = document.getElementById('content')?.value.trim() || '';
    
    if (!title && !content) {
        showToast('Nada para salvar como rascunho', 'info');
        return;
    }
    
    const draft = {
        title,
        content,
        category: document.getElementById('category')?.value || '',
        tags: document.getElementById('tags')?.value || '',
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('rose_forum_draft', JSON.stringify(draft));
    showToast('Rascunho salvo', 'success');
}

function loadDraft() {
    try {
        const draft = localStorage.getItem('rose_forum_draft');
        if (!draft) return;
        
        const draftData = JSON.parse(draft);
        
        const titleElement = document.getElementById('title');
        const contentElement = document.getElementById('content');
        const categoryElement = document.getElementById('category');
        const tagsElement = document.getElementById('tags');
        
        if (titleElement) titleElement.value = draftData.title || '';
        if (contentElement) contentElement.value = draftData.content || '';
        if (categoryElement) categoryElement.value = draftData.category || '';
        if (tagsElement) tagsElement.value = draftData.tags || '';
        
        // Update character counts
        if (titleElement && document.getElementById('titleCount')) {
            document.getElementById('titleCount').textContent = titleElement.value.length;
        }
        if (contentElement && document.getElementById('contentCount')) {
            document.getElementById('contentCount').textContent = contentElement.value.length;
        }
        
        showToast('Rascunho carregado', 'info');
    } catch (error) {
        console.error('Erro ao carregar rascunho:', error);
    }
}

// Error Handling
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        setTimeout(() => {
            errorElement.textContent = '';
        }, 5000);
    }
}

function showToast(message, type = 'info') {
    // This function should be implemented in the HTML file
    // but we'll provide a fallback
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    const toastElement = document.getElementById('toast');
    if (toastElement && typeof window.showToast === 'function') {
        window.showToast(message, type);
    }
}

// Statistics
function updateStats() {
    const posts = getAllPosts();
    const today = new Date().toDateString();
    const todayPosts = posts.filter(post => 
        new Date(post.date).toDateString() === today
    );
    
    const elements = {
        totalPosts: document.getElementById('totalPosts'),
        todayPosts: document.getElementById('todayPosts'),
        footerPostCount: document.getElementById('footerPostCount')
    };
    
    Object.entries(elements).forEach(([key, element]) => {
        if (element) {
            switch(key) {
                case 'totalPosts':
                    element.textContent = posts.length;
                    break;
                case 'todayPosts':
                    element.textContent = todayPosts.length;
                    break;
                case 'footerPostCount':
                    element.textContent = posts.length;
                    break;
            }
        }
    });
    
    // Update categories count
    const categories = [...new Set(posts.map(post => post.category))];
    const categoryElement = document.getElementById('totalCategories');
    if (categoryElement) {
        categoryElement.textContent = categories.length;
    }
}

// Search and Filter
const searchPosts = debounce(function() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const posts = getAllPosts();
    
    if (!query) {
        displayPosts(posts);
        return;
    }
    
    const filtered = posts.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.content.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
    );
    
    displayPosts(filtered);
}, DEBOUNCE_DELAY);

function filterPosts() {
    const category = document.getElementById('categoryFilter')?.value || '';
    const posts = getAllPosts();
    
    const filtered = category ? 
        posts.filter(post => post.category === category) : 
        posts;
    
    displayPosts(filtered);
}

function sortPosts() {
    const sortBy = document.getElementById('sortBy')?.value || 'recentes';
    const posts = getAllPosts();
    
    let sorted = [...posts];
    
    switch(sortBy) {
        case 'recentes':
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'antigos':
            sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'titulo':
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'categoria':
            sorted.sort((a, b) => a.category.localeCompare(b.category));
            break;
    }
    
    displayPosts(sorted);
}

// Initialization
function initializeApp() {
    loadPosts();
    updateStats();
    
    // Load draft if on create page
    if (window.location.pathname.includes('create.html')) {
        loadDraft();
        
        // Check for edit mode
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        if (editId) {
            loadPostForEdit(editId);
        }
    }
    
    // Setup event listeners
    setupEventListeners();
}

function loadPostForEdit(postId) {
    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
        showToast('Post não encontrado para edição', 'error');
        return;
    }
    
    const titleElement = document.getElementById('title');
    const contentElement = document.getElementById('content');
    const categoryElement = document.getElementById('category');
    const tagsElement = document.getElementById('tags');
    
    if (titleElement) titleElement.value = post.title;
    if (contentElement) contentElement.value = post.content;
    if (categoryElement) categoryElement.value = post.category;
    if (tagsElement) tagsElement.value = post.tags.join(', ');
    
    // Update page title
    document.title = `Editando: ${post.title}`;
    
    // Change button text
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Atualizar Post';
        submitButton.onclick = () => updatePostData(postId);
    }
}

function updatePostData(postId) {
    const title = document.getElementById('title')?.value.trim();
    const content = document.getElementById('content')?.value.trim();
    const category = document.getElementById('category')?.value || '';
    const tagsInput = document.getElementById('tags')?.value.trim() || '';
    
    if (!title || !content) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    const updates = {
        title: sanitizeHTML(title),
        content: sanitizeHTML(content),
        category,
        tags,
        updatedAt: new Date().toISOString()
    };
    
    if (updatePost(postId, updates)) {
        showToast('Post atualizado com sucesso!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        showToast('Erro ao atualizar post', 'error');
    }
}

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchPosts);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchPosts();
            }
        });
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterPosts);
    }
    
    // Sort dropdown
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        sortBy.addEventListener('change', sortPosts);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N for new post
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            window.location.href = 'create.html';
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closeViewer();
            const createModal = document.getElementById('createModal');
            if (createModal) createModal.style.display = 'none';
        }
    });
    
    // Auto-save draft
    let draftTimeout;
    const autoSaveDraft = () => {
        clearTimeout(draftTimeout);
        draftTimeout = setTimeout(saveDraft, 5000); // Save after 5 seconds of inactivity
    };
    
    const titleElement = document.getElementById('title');
    const contentElement = document.getElementById('content');
    
    if (titleElement) titleElement.addEventListener('input', autoSaveDraft);
    if (contentElement) contentElement.addEventListener('input', autoSaveDraft);
}

// Legacy compatibility
function loadPosts() {
    displayPosts();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export for global access
window.RoseForum = {
    loadPosts,
    viewPost,
    savePost,
    saveDraft,
    searchPosts,
    filterPosts,
    sortPosts,
    closeViewer,
    editPost,
    deletePost,
    updateStats,
    getAllPosts,
    createPost,
    updatePost,
    deletePostById
};
