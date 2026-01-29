// ===================================
// Rose Fórum - Enhanced JavaScript
// ===================================

// Constants and Configuration
const STORAGE_KEY = 'rose_forum_posts';
const MAX_POSTS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 300;

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Update theme button icon
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

function updateThemeIcon() {
    const themeToggle = document.querySelector('.theme-toggle');
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    if (themeToggle) {
        themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }
}

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

function getAllComments() {
    try {
        const comments = localStorage.getItem('rose_forum_comments');
        return comments ? JSON.parse(comments) : [];
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
        return [];
    }
}

function saveCommentsToStorage(comments) {
    try {
        localStorage.setItem('rose_forum_comments', JSON.stringify(comments));
        return true;
    } catch (error) {
        console.error('Erro ao salvar comentários:', error);
        return false;
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
        likes: 0,
        upvotes: 0,
        downvotes: 0,
        userVote: null,
        author: getCurrentUser().name
    };
    
    return post;
}

function createComment(postId, content, parentId = null) {
    const comment = {
        id: generateId(),
        postId: postId,
        parentId: parentId,
        content: sanitizeHTML(content.trim()),
        author: getCurrentUser().name,
        date: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0,
        userVote: null,
        replies: []
    };
    
    return comment;
}

function getCurrentUser() {
    const user = localStorage.getItem('rose_forum_user');
    if (user) {
        return JSON.parse(user);
    }
    
    // Create default user
    const defaultUser = {
        name: `Usuário${Math.floor(Math.random() * 1000)}`,
        avatar: null,
        joinDate: new Date().toISOString()
    };
    
    localStorage.setItem('rose_forum_user', JSON.stringify(defaultUser));
    return defaultUser;
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

// Display Functions
function displayPosts(posts = null, containerId = 'posts') {
    const postsToShow = posts || getAllPosts();
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-state" id="loadingPosts">
            <div class="loading-spinner"></div>
            <p>Carregando posts...</p>
        </div>
    `;
    
    // Simulate loading delay for better UX
    setTimeout(() => {
        // Hide loading state
        const loadingElement = document.getElementById('loadingPosts');
        if (loadingElement) loadingElement.style.display = 'none';
        
        // Show empty state if no posts
        const emptyElement = document.getElementById('emptyPosts');
        if (emptyElement) {
            emptyElement.style.display = postsToShow.length === 0 ? 'block' : 'none';
        }
        
        if (postsToShow.length === 0) {
            container.innerHTML = `
                <div class="empty-state" id="emptyPosts">
                    <div class="empty-icon">📝</div>
                    <h3>Nenhum post encontrado</h3>
                    <p>Seja o primeiro a compartilhar algo com a comunidade!</p>
                    <button class="btn btn-primary" onclick="openCreateModal()">
                        Criar Primeiro Post
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = postsToShow.map((post, index) => {
            const score = (post.upvotes || 0) - (post.downvotes || 0);
            const comments = getAllComments().filter(c => c.postId === post.id && !c.parentId);
            const categoryText = post.category ? `r/${post.category}` : 'r/RoseFórum';
            
            return `
            <article class="reddit-post" data-post-id="${post.id}" style="animation-delay: ${index * 0.05}s">
                <div class="reddit-post-header">
                    <div class="subreddit-info">
                        <div class="subreddit-icon">🌹</div>
                        <div>
                            <span class="subreddit-name">${categoryText}</span>
                            <span class="post-meta-info">
                                Postado por u/${post.author || 'anonymous'} • ${formatDate(post.date)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="reddit-post-content">
                    <div class="reddit-vote-column">
                        <button class="reddit-vote-btn ${post.userVote === 'up' ? 'upvoted' : ''}" 
                                onclick="event.stopPropagation(); votePost('${post.id}', 'up')">
                            ▲
                        </button>
                        <span class="reddit-score karma-display ${score >= 0 ? 'karma-positive' : 'karma-negative'}">${score}</span>
                        <button class="reddit-vote-btn ${post.userVote === 'down' ? 'downvoted' : ''}" 
                                onclick="event.stopPropagation(); votePost('${post.id}', 'down')">
                            ▼
                        </button>
                    </div>
                    
                    <div class="reddit-post-body">
                        <h3 class="reddit-post-title" onclick="viewPost('${post.id}')">
                            ${post.title}
                        </h3>
                        
                        ${post.content.length > 200 ? `
                            <div class="reddit-post-text">
                                ${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}
                            </div>
                        ` : ''}
                        
                        ${post.tags.length > 0 ? `
                            <div class="post-tags">
                                ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                        
                        <div class="reddit-post-actions">
                            <button class="reddit-action-btn" onclick="viewPost('${post.id}')">
                                💬 ${comments.length} Comentários
                            </button>
                            <button class="reddit-action-btn" onclick="sharePost('${post.id}')">
                                🔗 Compartilhar
                            </button>
                            <button class="reddit-action-btn" onclick="savePost('${post.id}')">
                                📁 Salvar
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        `;}).join('');
        
        // Update stats
        updateStats();
        
        // Add entrance animations
        const postsElements = container.querySelectorAll('.post');
        postsElements.forEach((post, index) => {
            post.style.opacity = '0';
            post.style.transform = 'translateY(20px)';
            setTimeout(() => {
                post.style.transition = 'all 0.6s ease-out';
                post.style.opacity = '1';
                post.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 500);
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
        const score = (post.upvotes || 0) - (post.downvotes || 0);
        
        document.getElementById('viewTitle').textContent = post.title;
        document.getElementById('viewContent').innerHTML = `
            <div class="post-content">
                <p>${post.content}</p>
                <div class="post-votes">
                    <button class="post-vote-btn post-upvote ${post.userVote === 'up' ? 'upvoted' : ''}" 
                            onclick="votePost('${post.id}', 'up')">
                        👍
                    </button>
                    <span class="post-score">${score}</span>
                    <button class="post-vote-btn post-downvote ${post.userVote === 'down' ? 'downvoted' : ''}" 
                            onclick="votePost('${post.id}', 'down')">
                        👎
                    </button>
                </div>
            </div>
            <div class="comments-section">
                <div class="comments-header">
                    <h3 class="comments-title">Comentários</h3>
                    <span class="comments-count" id="comments-count">0</span>
                </div>
                <div class="comment-form" id="comment-form-${postId}">
                    <textarea class="comment-textarea" placeholder="Adicione um comentário..." 
                              maxlength="500" oninput="updateCharCount(this, 500)"></textarea>
                    <div class="comment-actions">
                        <span class="comment-char-count">0/500</span>
                        <button class="btn btn-primary" onclick="addComment('${postId}', this.parentElement.previousElementSibling.value)">
                            Comentar
                        </button>
                    </div>
                </div>
                <div id="comments-${postId}" class="comments-container">
                    <!-- Comments will be loaded here -->
                </div>
            </div>
        `;
        
        document.getElementById('viewDate').textContent = `Por ${post.author || 'Anônimo'} • ${formatDate(post.date)}`;
        document.getElementById('viewCategory').textContent = post.category;
        
        const tagsContainer = document.getElementById('viewTags');
        if (tagsContainer) {
            tagsContainer.innerHTML = post.tags.length > 0 
                ? post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')
                : '';
        }
        
        viewer.style.display = 'block';
        currentPostId = postId;
        
        // Load comments
        loadComments(postId);
        
        // Update comments count
        const comments = getAllComments().filter(c => c.postId === postId && !c.parentId);
        const countElement = document.getElementById('comments-count');
        if (countElement) {
            countElement.textContent = comments.length;
        }
        
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
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Show with animation
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Vote Functions
function votePost(postId, voteType) {
    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) return;
    
    const currentVote = post.userVote;
    
    // Remove previous vote
    if (currentVote === 'up') post.upvotes--;
    if (currentVote === 'down') post.downvotes--;
    
    // Add new vote
    if (currentVote === voteType) {
        post.userVote = null; // Remove vote
    } else {
        post.userVote = voteType;
        if (voteType === 'up') post.upvotes++;
        if (voteType === 'down') post.downvotes++;
    }
    
    updatePost(postId, { 
        upvotes: post.upvotes, 
        downvotes: post.downvotes, 
        userVote: post.userVote 
    });
    
    updatePostVoteButtons(postId, post.userVote);
    showToast(voteType === 'up' ? '👍 Voto registrado!' : '👎 Voto registrado!', 'success');
}

function voteComment(commentId, voteType) {
    const comments = getAllComments();
    const comment = comments.find(c => c.id === commentId);
    
    if (!comment) return;
    
    const currentVote = comment.userVote;
    
    // Remove previous vote
    if (currentVote === 'up') comment.upvotes--;
    if (currentVote === 'down') comment.downvotes--;
    
    // Add new vote
    if (currentVote === voteType) {
        comment.userVote = null;
    } else {
        comment.userVote = voteType;
        if (voteType === 'up') comment.upvotes++;
        if (voteType === 'down') comment.downvotes++;
    }
    
    saveCommentsToStorage(comments);
    updateCommentVoteButtons(commentId, comment.userVote);
    showToast('Voto no comentário registrado!', 'success');
}

function updatePostVoteButtons(postId, userVote) {
    const upBtn = document.querySelector(`[data-post-id="${postId}"] .post-upvote`);
    const downBtn = document.querySelector(`[data-post-id="${postId}"] .post-downvote`);
    const score = document.querySelector(`[data-post-id="${postId}"] .post-score`);
    
    if (upBtn) {
        upBtn.classList.toggle('upvoted', userVote === 'up');
        upBtn.classList.remove('downvoted');
    }
    
    if (downBtn) {
        downBtn.classList.toggle('downvoted', userVote === 'down');
        downBtn.classList.remove('upvoted');
    }
    
    if (score) {
        const posts = getAllPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
            score.textContent = post.upvotes - post.downvotes;
        }
    }
}

function updateCommentVoteButtons(commentId, userVote) {
    const upBtn = document.querySelector(`[data-comment-id="${commentId}"] .comment-upvote`);
    const downBtn = document.querySelector(`[data-comment-id="${commentId}"] .comment-downvote`);
    const score = document.querySelector(`[data-comment-id="${commentId}"] .vote-count`);
    
    if (upBtn) {
        upBtn.classList.toggle('upvoted', userVote === 'up');
        upBtn.classList.remove('downvoted');
    }
    
    if (downBtn) {
        downBtn.classList.toggle('downvoted', userVote === 'down');
        downBtn.classList.remove('upvoted');
    }
    
    if (score) {
        const comments = getAllComments();
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
            score.textContent = comment.upvotes - comment.downvotes;
        }
    }
}

// Friends Functions
function openFriendsModal() {
    const modal = document.getElementById('friendsModal');
    if (modal) {
        modal.style.display = 'flex';
        loadFriends();
        loadFriendRequests();
        toggleUserMenu();
    }
}

function closeFriendsModal() {
    const modal = document.getElementById('friendsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function addFriend() {
    const usernameInput = document.getElementById('friendUsername');
    const username = usernameInput.value.trim();
    
    if (!username) {
        showToast('Digite um nome de usuário', 'error');
        return;
    }
    
    if (username === getCurrentUser().name) {
        showToast('Você não pode adicionar a si mesmo', 'error');
        return;
    }
    
    const friends = getFriends();
    if (friends.some(f => f.username === username)) {
        showToast('Este usuário já é seu amigo', 'error');
        return;
    }
    
    // Create friend request (simulated)
    const request = {
        id: generateId(),
        from: getCurrentUser().name,
        to: username,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    saveFriendRequest(request);
    showToast('Solicitação de amizade enviada!', 'success');
    usernameInput.value = '';
    
    // Simulate acceptance for demo
    setTimeout(() => {
        acceptFriendRequest(request.id);
    }, 2000 + Math.random() * 3000);
}

function getFriends() {
    try {
        const friends = localStorage.getItem('rox_friends');
        return friends ? JSON.parse(friends) : [];
    } catch (error) {
        console.error('Erro ao carregar amigos:', error);
        return [];
    }
}

function saveFriend(friend) {
    try {
        const friends = getFriends();
        friends.push(friend);
        localStorage.setItem('rox_friends', JSON.stringify(friends));
        return true;
    } catch (error) {
        console.error('Erro ao salvar amigo:', error);
        return false;
    }
}

function getFriendRequests() {
    try {
        const requests = localStorage.getItem('rox_friend_requests');
        return requests ? JSON.parse(requests) : [];
    } catch (error) {
        console.error('Erro ao carregar solicitações:', error);
        return [];
    }
}

function saveFriendRequest(request) {
    try {
        const requests = getFriendRequests();
        requests.push(request);
        localStorage.setItem('rox_friend_requests', JSON.stringify(requests));
        return true;
    } catch (error) {
        console.error('Erro ao salvar solicitação:', error);
        return false;
    }
}

function acceptFriendRequest(requestId) {
    const requests = getFriendRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);
    
    if (requestIndex === -1) return;
    
    const request = requests[requestIndex];
    
    // Add to friends list
    const friend = {
        id: generateId(),
        username: request.from === getCurrentUser().name ? request.to : request.from,
        addedAt: new Date().toISOString(),
        status: 'online'
    };
    
    saveFriend(friend);
    
    // Remove request
    requests.splice(requestIndex, 1);
    localStorage.setItem('rox_friend_requests', JSON.stringify(requests));
    
    loadFriends();
    loadFriendRequests();
    showToast(`${friend.username} agora é seu amigo!`, 'success');
}

function denyFriendRequest(requestId) {
    const requests = getFriendRequests();
    const filteredRequests = requests.filter(r => r.id !== requestId);
    
    localStorage.setItem('rox_friend_requests', JSON.stringify(filteredRequests));
    loadFriendRequests();
    showToast('Solicitação recusada', 'info');
}

function removeFriend(friendId) {
    const friends = getFriends();
    const filteredFriends = friends.filter(f => f.id !== friendId);
    
    localStorage.setItem('rox_friends', JSON.stringify(filteredFriends));
    loadFriends();
    showToast('Amigo removido', 'info');
}

function loadFriends() {
    const friends = getFriends();
    const friendsList = document.getElementById('friendsList');
    
    if (!friendsList) return;
    
    if (friends.length === 0) {
        friendsList.innerHTML = '<div class="empty-friends">Você ainda não tem amigos</div>';
        return;
    }
    
    friendsList.innerHTML = friends.map(friend => `
        <div class="friend-item">
            <div class="friend-info">
                <div class="friend-avatar">${friend.username.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="friend-name">${friend.username}</div>
                    <div class="friend-status">${friend.status}</div>
                </div>
            </div>
            <div class="friend-actions">
                <button onclick="removeFriend('${friend.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

function loadFriendRequests() {
    const requests = getFriendRequests();
    const requestsContainer = document.getElementById('friendRequests');
    const currentUser = getCurrentUser();
    
    if (!requestsContainer) return;
    
    // Get requests for current user
    const userRequests = requests.filter(r => r.to === currentUser.name && r.status === 'pending');
    
    if (userRequests.length === 0) {
        requestsContainer.innerHTML = '<div class="empty-friends">Nenhuma solicitação pendente</div>';
        return;
    }
    
    requestsContainer.innerHTML = userRequests.map(request => `
        <div class="friend-item">
            <div class="friend-info">
                <div class="friend-avatar">${request.from.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="friend-name">${request.from}</div>
                    <div class="friend-status">Solicitou amizade</div>
                </div>
            </div>
            <div class="friend-actions">
                <button class="accept" onclick="acceptFriendRequest('${request.id}')">Aceitar</button>
                <button class="deny" onclick="denyFriendRequest('${request.id}')">Recusar</button>
            </div>
        </div>
    `).join('');
}

// Chat Functions
function openChatModal() {
    const modal = document.getElementById('chatModal');
    if (modal) {
        modal.style.display = 'flex';
        loadChatMessages();
        toggleUserMenu();
    }
}

function closeChatModal() {
    const modal = document.getElementById('chatModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const user = getCurrentUser();
    const chatMessage = {
        id: generateId(),
        author: user.name,
        text: sanitizeHTML(message),
        timestamp: new Date().toISOString(),
        isOwn: true
    };
    
    // Add message to chat
    addChatMessage(chatMessage);
    
    // Save to storage
    saveChatMessage(chatMessage);
    
    // Clear input
    input.value = '';
    
    // Simulate response after delay
    setTimeout(() => {
        simulateChatResponse();
    }, 1000 + Math.random() * 2000);
}

function addChatMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${message.isOwn ? 'own' : 'other'}`;
    messageElement.innerHTML = `
        <div class="chat-author">${message.author}</div>
        <div class="chat-text">${message.text}</div>
        <div class="chat-time">${formatDate(message.timestamp)}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function loadChatMessages() {
    const messages = getChatMessages();
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = '';
    
    // Add welcome message if no messages
    if (messages.length === 0) {
        addChatMessage({
            id: generateId(),
            author: 'Sistema',
            text: 'Bem-vindo ao bate-papo do Roxe! Envie uma mensagem para começar.',
            timestamp: new Date().toISOString(),
            isOwn: false
        });
    } else {
        messages.forEach(message => addChatMessage(message));
    }
}

function getChatMessages() {
    try {
        const messages = localStorage.getItem('rox_chat_messages');
        return messages ? JSON.parse(messages) : [];
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        return [];
    }
}

function saveChatMessage(message) {
    try {
        const messages = getChatMessages();
        messages.push(message);
        
        // Keep only last 50 messages
        if (messages.length > 50) {
            messages.splice(0, messages.length - 50);
        }
        
        localStorage.setItem('rox_chat_messages', JSON.stringify(messages));
        return true;
    } catch (error) {
        console.error('Erro ao salvar mensagem:', error);
        return false;
    }
}

function simulateChatResponse() {
    const responses = [
        'Interessante! Conte mais sobre isso.',
        'Eu concordo com você.',
        'Isso me faz pensar...',
        'Boa observação!',
        'Você tem um ponto válido.',
        'Hmm, nunca pensei por esse ângulo.',
        'Legal! 😊',
        'Com certeza!',
        'Faz sentido.',
        'Eu gostaria de saber mais.'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const botMessage = {
        id: generateId(),
        author: 'BotRoxe',
        text: randomResponse,
        timestamp: new Date().toISOString(),
        isOwn: false
    };
    
    addChatMessage(botMessage);
    saveChatMessage(botMessage);
}

// Share Post Functions
function addComment(postId, content, parentId = null) {
    if (!content.trim()) {
        showToast('Digite um comentário!', 'error');
        return;
    }
    
    const comment = createComment(postId, content, parentId);
    const comments = getAllComments();
    
    if (parentId) {
        // Add as reply
        const parentComment = comments.find(c => c.id === parentId);
        if (parentComment) {
            parentComment.replies.push(comment.id);
        }
    }
    
    comments.push(comment);
    saveCommentsToStorage(comments);
    
    // Clear form
    const textarea = document.querySelector(`#comment-form-${postId} .comment-textarea`);
    if (textarea) textarea.value = '';
    
    // Update character count
    const charCount = document.querySelector(`#comment-form-${postId} .comment-char-count`);
    if (charCount) charCount.textContent = '0/500';
    
    // Reload comments
    loadComments(postId);
    showToast('Comentário adicionado! 💬', 'success');
}

function loadComments(postId) {
    const comments = getAllComments();
    const postComments = comments.filter(c => c.postId === postId && !c.parentId);
    const container = document.querySelector(`#comments-${postId}`);
    
    if (!container) return;
    
    if (postComments.length === 0) {
        container.innerHTML = `
            <div class="no-comments">
                <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = postComments.map(comment => renderComment(comment)).join('');
}

function renderComment(comment) {
    const replies = getAllComments().filter(c => c.parentId === comment.id);
    const score = comment.upvotes - comment.downvotes;
    
    return `
        <div class="comment" data-comment-id="${comment.id}">
            <div class="comment-header">
                <div class="comment-author">
                    <div class="comment-avatar">${comment.author.charAt(0).toUpperCase()}</div>
                    <div class="comment-info">
                        <div class="comment-name">${comment.author}</div>
                        <div class="comment-date">${formatDate(comment.date)}</div>
                    </div>
                </div>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-footer">
                <div class="vote-buttons">
                    <button class="vote-btn comment-upvote ${comment.userVote === 'up' ? 'upvoted' : ''}" 
                            onclick="voteComment('${comment.id}', 'up')">
                        👍
                    </button>
                    <span class="vote-count">${score}</span>
                    <button class="vote-btn comment-downvote ${comment.userVote === 'down' ? 'downvoted' : ''}" 
                            onclick="voteComment('${comment.id}', 'down')">
                        👎
                    </button>
                </div>
                <button class="reply-btn" onclick="showReplyForm('${comment.id}')">
                    💬 Responder
                </button>
            </div>
            
            ${replies.length > 0 ? `
                <div class="replies">
                    ${replies.map(reply => renderComment(reply)).join('')}
                </div>
            ` : ''}
            
            <div id="reply-form-${comment.id}" style="display: none;" class="reply-form">
                <textarea class="comment-textarea" placeholder="Escreva sua resposta..." 
                          maxlength="500" oninput="updateCharCount(this, 500)"></textarea>
                <div class="comment-actions">
                    <span class="comment-char-count">0/500</span>
                    <div>
                        <button class="btn btn-sm btn-outline" onclick="hideReplyForm('${comment.id}')">
                            Cancelar
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="addComment('${comment.postId}', this.parentElement.parentElement.previousElementSibling.value, '${comment.id}')">
                            Responder
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showReplyForm(commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    if (form) {
        form.style.display = 'block';
        form.querySelector('textarea').focus();
    }
}

function openCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) {
        modal.style.display = 'flex';
        // Clear form
        document.getElementById('quickTitle').value = '';
        document.getElementById('quickContent').value = '';
        document.getElementById('quickCategory').value = '';
        document.getElementById('quickTags').value = '';
        document.getElementById('titleCount').textContent = '0';
        document.getElementById('contentCount').textContent = '0';
    }
}

function closeCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function quickCreatePost() {
    const title = document.getElementById('quickTitle')?.value.trim();
    const content = document.getElementById('quickContent')?.value.trim();
    const category = document.getElementById('quickCategory')?.value || '';
    const tagsInput = document.getElementById('quickTags')?.value.trim() || '';
    
    if (!title || !content) {
        showToast('Preencha título e conteúdo', 'error');
        return;
    }
    
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    const post = createPost(title, content, category, tags);
    
    if (savePostToStorage(post)) {
        showToast('Post criado com sucesso!', 'success');
        closeCreateModal();
        displayPosts();
        updateStats();
        updateProfileDisplay();
        updateCommunityStats();
    } else {
        showToast('Erro ao criar post', 'error');
    }
}

function updateCharCount(textarea, maxLength) {
    const currentLength = textarea.value.length;
    const charCount = textarea.parentElement.querySelector('.comment-char-count');
    if (charCount) {
        charCount.textContent = `${currentLength}/${maxLength}`;
    }
}

// ... (rest of the code remains the same)

function searchPosts() {
    const query = document.getElementById('redditSearch')?.value.toLowerCase() || '';
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

// Initialize App Function
function initializeApp() {
    console.log('Roxe Forum inicializando...');
    
    // Carregar tema
    loadTheme();
    updateThemeIcon();
    
    // Carregar posts
    loadPosts();
    updateStats();
    updateProfileDisplay();
    updateCommunityStats();
    
    // Mostrar posts existentes ou estado vazio
    setTimeout(() => {
        const posts = getAllPosts();
        if (posts.length === 0) {
            const emptyElement = document.getElementById('emptyPosts');
            const loadingElement = document.getElementById('loadingPosts');
            if (emptyElement) emptyElement.style.display = 'block';
            if (loadingElement) loadingElement.style.display = 'none';
        } else {
            displayPosts(posts);
        }
    }, 500);
    
    console.log('Roxe Forum inicializado!');
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

// Back to Top Function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide back to top button based on scroll position
window.addEventListener('scroll', function() {
    const backToTopButton = document.querySelector('.back-to-top');
    if (backToTopButton) {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    }
});

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
    deletePostById,
    votePost,
    voteComment,
    addComment,
    loadComments,
    showReplyForm,
    hideReplyForm,
    updateCharCount,
    getCurrentUser,
    getAllComments
};
