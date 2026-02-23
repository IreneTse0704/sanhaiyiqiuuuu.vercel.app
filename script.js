const supabase = createClient(
    'https://iltgkpzaoweyzwlwozz.supabase.co',
    'sb_publishable_zZ0i2_-VOI_nNRns77aK6w_XTxeGOoc'
);

// ==================== 登录/注册功能 ====================

// 检查登录状态
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        // 已登录，获取用户信息
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('id', user.id)
            .maybeSingle();
        
        // 更新界面
        const userStatus = document.getElementById('userStatus');
        if (userStatus) {
            userStatus.innerHTML = `
                <span style="margin-right: 10px;">👋 欢迎回来，${profile?.username || '小伙伴'}</span>
                <button onclick="signOut()" style="padding: 5px 10px; background: #1E4A6F; color: white; border: none; border-radius: 5px; cursor: pointer;">退出</button>
            `;
        }
    } else {
        // 未登录，显示登录按钮
        const userStatus = document.getElementById('userStatus');
        if (userStatus) {
            userStatus.innerHTML = `
                <button onclick="showAuthModal()" style="padding: 8px 16px; background: #1E4A6F; color: white; border: none; border-radius: 5px; cursor: pointer;">登录/注册</button>
            `;
        }
    }
}

// 显示登录框
function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'flex';
}

// 隐藏登录框
function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

// 注册
async function signUp() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    
    if (!email || !password) {
        alert('请输入邮箱和密码');
        return;
    }
    
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });
    
    if (error) {
        alert('注册失败：' + error.message);
    } else {
        alert('注册成功！请完善个人信息');
        hideAuthModal();
        const profileModal = document.getElementById('profileModal');
        if (profileModal) profileModal.style.display = 'flex';
    }
}

// 登录
async function signIn() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    
    if (!email || !password) {
        alert('请输入邮箱和密码');
        return;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) {
        alert('登录失败：' + error.message);
    } else {
        alert('登录成功！');
        hideAuthModal();
        checkUser();
    }
}

// 保存个人信息
async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        alert('请先登录');
        return;
    }
    
    const username = document.getElementById('username')?.value;
    const mbti = document.getElementById('mbti')?.value;
    const gender = document.getElementById('gender')?.value;
    const birthday = document.getElementById('birthday')?.value;
    const location = document.getElementById('location')?.value;
    
    if (!username) {
        alert('请输入昵称');
        return;
    }
    
    const profile = {
        id: user.id,
        username: username,
        mbti: mbti || null,
        gender: gender || null,
        birthday: birthday || null,
        location: location || null
    };
    
    const { error } = await supabase
        .from('user_profiles')
        .insert([profile]);
    
    if (error) {
        alert('保存失败：' + error.message);
    } else {
        alert('信息保存成功！');
        const profileModal = document.getElementById('profileModal');
        if (profileModal) profileModal.style.display = 'none';
        checkUser();
    }
}

// 退出登录
async function signOut() {
    await supabase.auth.signOut();
    checkUser();
}

// ========== 树洞功能（Supabase版） ==========

// 获取树洞留言
async function getTreeholePosts() {
    const { data, error } = await supabase
        .from('treehole_posts')
        .select(`
            *,
            user_profiles (username),
            treehole_replies (*)
        `)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('获取留言失败:', error);
        return [];
    }
    return data || [];
}

// 发布树洞留言
async function publishPost() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        alert('请先登录');
        showAuthModal();
        return;
    }
    
    const content = document.getElementById('postContent')?.value;
    if (!content) {
        alert('请输入内容');
        return;
    }
    
    const anonymous = document.getElementById('anonymous')?.checked || false;
    
    const { error } = await supabase
        .from('treehole_posts')
        .insert([{
            user_id: user.id,
            content: content,
            is_anonymous: anonymous
        }]);
    
    if (error) {
        alert('发布失败：' + error.message);
    } else {
        alert('发布成功！');
        const postContent = document.getElementById('postContent');
        if (postContent) postContent.value = '';
        loadPosts();
    }
}

// 加载并显示留言
async function loadPosts() {
    const posts = await getTreeholePosts();
    const container = document.getElementById('postsContainer');
    if (!container) return;
    
    if (posts.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">还没有留言，来做第一个吧！</p>';
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div style="background: rgba(255,255,255,0.7); border-radius: 10px; padding: 15px; margin-bottom: 15px; backdrop-filter: blur(5px);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #1E4A6F;">
                <span style="font-weight: bold;">${post.is_anonymous ? '匿名' : (post.user_profiles?.username || '小伙伴')}</span>
                <span style="font-size: 0.8rem;">${new Date(post.created_at).toLocaleString()}</span>
            </div>
            <div style="margin-bottom: 10px;">${post.content}</div>
            ${post.treehole_replies?.map(reply => `
                <div style="margin-left: 20px; padding: 8px; background: rgba(124, 185, 232, 0.1); border-radius: 5px; margin-top: 5px;">
                    <span style="color: ${reply.replier === '阿秋' ? '#D4A373' : '#1E4A6F'}; font-weight: bold;">${reply.replier}：</span>
                    <span>${reply.content}</span>
                </div>
            `).join('') || ''}
        </div>
    `).join('');
}

// ==================== 原有的所有功能（保持不变） ====================

// 初始化留言数据
let messages = [];

// 从localStorage加载数据
function loadFromLocalStorage() {
    // 加载书籍数据
    const savedBooks = localStorage.getItem('books');
    if (savedBooks) {
        books = JSON.parse(savedBooks);
    }
    
    // 加载电影数据
    const savedMovies = localStorage.getItem('movies');
    if (savedMovies) {
        movies = JSON.parse(savedMovies);
    }
}

// 保存数据到localStorage
function saveToLocalStorage() {
    localStorage.setItem('books', JSON.stringify(books));
    localStorage.setItem('movies', JSON.stringify(movies));
}

// 页面加载时初始化数据
loadFromLocalStorage();

// 页面导航
function navigateTo(page) {
    const homePage = document.getElementById('home-page');
    const treeholePage = document.getElementById('treehole-page');
    const papersPage = document.getElementById('papers-page');
    const artsPage = document.getElementById('arts-page');
    const journalPage = document.getElementById('journal-page');
    
    // 隐藏所有页面
    homePage.classList.remove('active');
    treeholePage.classList.remove('active');
    papersPage.classList.remove('active');
    artsPage.classList.remove('active');
    journalPage.classList.remove('active');
    
    // 显示目标页面
    switch(page) {
        case 'home':
            homePage.classList.add('active');
            break;
        case 'treehole':
            treeholePage.classList.add('active');
            renderMessages();
            break;
        case 'papers':
            papersPage.classList.add('active');
            renderPapers();
            renderStickyNotes();
            break;
        case 'arts':
            artsPage.classList.add('active');
            renderBooks();
            renderMovies();
            break;
        case 'journal':
            journalPage.classList.add('active');
            initJournalPage();
            break;
    }
    
    // 更新导航按钮状态
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
}

// 烟花效果函数
function createFirework(x, y) {
    const particleCount = 50;
    const colors = [
        'rgba(255, 255, 255, 1)',
        'rgba(255, 255, 255, 0.9)',
        'rgba(255, 255, 255, 0.8)',
        'rgba(192, 192, 192, 1)',    // 银色
        'rgba(192, 192, 192, 0.9)',
        'rgba(192, 192, 192, 0.8)',
        'rgba(220, 220, 220, 1)',    // 浅银色
        'rgba(220, 220, 220, 0.9)'
    ];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework-particle';
        
        // 随机颜色
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = color;
        particle.style.boxShadow = `0 0 6px ${color}, 0 0 12px ${color}`;
        
        // 随机大小
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // 初始位置
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        // 随机方向和距离
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const velocity = Math.random() * 100 + 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        document.body.appendChild(particle);
        
        // 动画
        let posX = x;
        let posY = y;
        let opacity = 1;
        let currentVx = vx;
        let currentVy = vy;
        let gravity = 0.5;
        
        const animate = () => {
            currentVy += gravity;
            posX += currentVx * 0.02;
            posY += currentVy * 0.02;
            opacity -= 0.015;
            
            particle.style.left = posX + 'px';
            particle.style.top = posY + 'px';
            particle.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        
        requestAnimationFrame(animate);
    }
}

// 显示卡片信息并导航到对应页面
function showCardInfo(cardName, event) {
    // 创建烟花效果
    if (event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        createFirework(centerX, centerY);
    }
    
    // 根据卡片名称导航到对应页面
    switch(cardName) {
        case '论文之海':
            navigateTo('papers');
            break;
        case '文艺之秋':
            navigateTo('arts');
            break;
        case '日志之海':
            navigateTo('journal');
            break;
        case '问答之海':
            navigateTo('treehole');
            break;
        default:
            alert(cardName);
    }
}

// 渲染留言列表
function renderMessages() {
    const messagesList = document.getElementById('messagesList');
    
    if (messages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🌊</div>
                <div class="empty-state-text">还没有留言，成为第一个留言的人吧！</div>
            </div>
        `;
        return;
    }
    
    messagesList.innerHTML = messages.map(message => `
        <div class="message-item" data-id="${message.id}">
            <div class="message-header">
                <span class="message-author">${message.author}</span>
                <span class="message-time">${message.time}</span>
            </div>
            <div class="message-content">${message.content}</div>
            ${message.replies.length > 0 ? `
                <div class="replies">
                    ${message.replies.map(reply => `
                        <div class="reply">
                            <div class="reply-header">
                                <span class="reply-author">${reply.author}</span>
                                <span class="reply-time">${reply.time}</span>
                            </div>
                            <div class="reply-content">${reply.content}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div class="reply-section">
                <div class="reply-input-container">
                    <input 
                        type="text" 
                        class="reply-name-input" 
                        id="replyName-${message.id}"
                        placeholder="你的名字（可选）"
                    >
                    <textarea 
                        class="reply-content-input" 
                        id="replyContent-${message.id}"
                        placeholder="写下你的评论..."
                        rows="2"
                    ></textarea>
                    <button class="reply-btn" onclick="submitReply(${message.id})">
                        发送评论
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // 滚动到底部
    messagesList.scrollTop = messagesList.scrollHeight;
}

// 提交评论
function submitReply(messageId) {
    const nameInput = document.getElementById(`replyName-${messageId}`);
    const contentInput = document.getElementById(`replyContent-${messageId}`);
    
    const name = nameInput.value.trim() || '匿名访客';
    const content = contentInput.value.trim();
    
    if (!content) {
        alert('请输入评论内容！');
        return;
    }
    
    // 找到对应的留言
    const message = messages.find(m => m.id === messageId);
    if (!message) {
        alert('留言不存在！');
        return;
    }
    
    // 创建新评论
    const newReply = {
        author: name,
        content: content,
        time: getCurrentTime()
    };
    
    // 添加到评论列表
    message.replies.push(newReply);
    
    // 清空输入框
    nameInput.value = '';
    contentInput.value = '';
    
    // 重新渲染留言列表
    renderMessages();
    
    // 显示成功提示
    alert('评论发送成功！');
}

// 提交留言
function submitMessage() {
    const nameInput = document.getElementById('visitorName');
    const contentInput = document.getElementById('messageContent');
    
    const name = nameInput.value.trim() || '匿名访客';
    const content = contentInput.value.trim();
    
    if (!content) {
        alert('请输入留言内容！');
        return;
    }
    
    // 创建新留言
    const newMessage = {
        id: messages.length + 1,
        author: name,
        content: content,
        time: getCurrentTime(),
        replies: []
    };
    
    // 添加到留言列表
    messages.unshift(newMessage);
    
    // 清空输入框
    nameInput.value = '';
    contentInput.value = '';
    
    // 重新渲染留言列表
    renderMessages();
    
    // 显示成功提示
    alert('留言发送成功！感谢你的分享～');
}

// 获取当前时间
function getCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 添加一些互动效果
document.addEventListener('DOMContentLoaded', function() {
    // 卡片悬停效果增强
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // 导航按钮点击效果
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'translateY(-2px)';
            }, 100);
        });
    });
    
    // 提交按钮点击效果
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'translateY(-2px)';
            }, 100);
        });
    }
});

// 添加页面滚动效果
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (header) {
        if (window.scrollY > 50) {
            header.style.transform = 'translateY(-10px)';
            header.style.opacity = '0.9';
        } else {
            header.style.transform = 'translateY(0)';
            header.style.opacity = '1';
        }
    }
});

// 添加键盘快捷键
document.addEventListener('keydown', function(e) {
    // ESC键返回首页
    if (e.key === 'Escape') {
        navigateTo('home');
    }
    
    // Ctrl/Cmd + Enter 提交留言
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const treeholePage = document.getElementById('treehole-page');
        if (treeholePage.classList.contains('active')) {
            submitMessage();
        }
    }
});

// 书籍数据
let books = [];

// 电影数据
let movies = [];

// 当前评分状态
let currentBookRating = 0;
let currentMovieRating = 0;

// 渲染书籍列表
function renderBooks() {
    const booksList = document.getElementById('booksList');
    
    if (books.length === 0) {
        booksList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📖</div>
                <div class="empty-state-text">还没有添加任何小说</div>
            </div>
        `;
    } else {
        booksList.innerHTML = books.map(book => `
            <div class="book-item" data-id="${book.id}">
                <div class="book-header">
                    <h4 class="book-title">${book.title}</h4>
                    <div class="book-rating" data-type="book" data-id="${book.id}" data-rating="${book.rating}">
                        ${renderClickableSnowflakes('book', book.id, book.rating)}
                    </div>
                </div>
                <div class="book-author">作者：${book.author}</div>
                ${book.review ? `<p class="book-review">${book.review}</p>` : ''}
                <div class="book-actions">
                    <button class="action-btn edit-btn" onclick="editBook(${book.id})">编辑</button>
                    <button class="action-btn delete-btn" onclick="deleteBook(${book.id})">删除</button>
                </div>
            </div>
        `).join('');
    }
    
    // 为新渲染的雪花评分添加点击事件
    attachRatingClickEvents();
}

// 渲染电影列表
function renderMovies() {
    const moviesList = document.getElementById('moviesList');
    
    if (movies.length === 0) {
        moviesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎬</div>
                <div class="empty-state-text">还没有添加任何电影</div>
            </div>
        `;
    } else {
        moviesList.innerHTML = movies.map(movie => `
            <div class="movie-item" data-id="${movie.id}">
                <div class="movie-header">
                    <h4 class="movie-title">${movie.title}</h4>
                    <div class="movie-rating" data-type="movie" data-id="${movie.id}" data-rating="${movie.rating}">
                        ${renderClickableSnowflakes('movie', movie.id, movie.rating)}
                    </div>
                </div>
                <div class="movie-director">导演：${movie.director}</div>
                ${movie.review ? `<p class="movie-review">${movie.review}</p>` : ''}
                <div class="movie-actions">
                    <button class="action-btn edit-btn" onclick="editMovie(${movie.id})">编辑</button>
                    <button class="action-btn delete-btn" onclick="deleteMovie(${movie.id})">删除</button>
                </div>
            </div>
        `).join('');
    }
    
    // 为新渲染的雪花评分添加点击事件
    attachRatingClickEvents();
}

// 渲染可点击的雪花评分
function renderClickableSnowflakes(type, id, rating) {
    let snowflakes = '';
    for (let i = 1; i <= 5; i++) {
        const filledClass = i <= rating ? 'filled' : 'empty';
        snowflakes += `<span class="snowflake ${filledClass} clickable" data-type="${type}" data-id="${id}" data-rating="${i}">❄️</span>`;
    }
    return snowflakes;
}

// 为雪花评分添加点击事件
function attachRatingClickEvents() {
    const clickableSnowflakes = document.querySelectorAll('.snowflake.clickable');
    clickableSnowflakes.forEach(snowflake => {
        snowflake.addEventListener('click', function(e) {
            e.stopPropagation();
            const type = this.dataset.type;
            const id = parseInt(this.dataset.id);
            const rating = parseInt(this.dataset.rating);
            
            // 更新数据
            if (type === 'book') {
                const book = books.find(b => b.id === id);
                if (book) {
                    book.rating = rating;
                    renderBooks();
                    // 保存到localStorage
                    saveToLocalStorage();
                }
            } else if (type === 'movie') {
                const movie = movies.find(m => m.id === id);
                if (movie) {
                    movie.rating = rating;
                    renderMovies();
                    // 保存到localStorage
                    saveToLocalStorage();
                }
            }
        });
    });
}

// 设置评分
function setRating(type, rating) {
    if (type === 'book') {
        currentBookRating = rating;
        updateRatingDisplay('book', rating);
    } else if (type === 'movie') {
        currentMovieRating = rating;
        updateRatingDisplay('movie', rating);
    }
}

// 更新评分显示
function updateRatingDisplay(type, rating) {
    const ratingContainer = document.getElementById(type + 'Rating');
    const snowflakes = ratingContainer.querySelectorAll('.snowflake');
    
    snowflakes.forEach((snowflake, index) => {
        if (index < rating) {
            snowflake.classList.add('filled');
            snowflake.classList.remove('empty');
        } else {
            snowflake.classList.remove('filled');
            snowflake.classList.add('empty');
        }
    });
    
    // 更新隐藏的输入值
    document.getElementById(type + 'RatingValue').value = rating;
}

// 显示书籍表单
function showBookForm(bookId = null) {
    const modal = document.getElementById('bookModal');
    const title = document.getElementById('bookModalTitle');
    
    // 重置表单
    document.getElementById('bookId').value = '';
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookAuthor').value = '';
    document.getElementById('bookReview').value = '';
    currentBookRating = 0;
    updateRatingDisplay('book', 0);
    
    if (bookId) {
        // 编辑模式
        const book = books.find(b => b.id === bookId);
        if (book) {
            title.textContent = '编辑小说';
            document.getElementById('bookId').value = book.id;
            document.getElementById('bookTitle').value = book.title;
            document.getElementById('bookAuthor').value = book.author;
            document.getElementById('bookReview').value = book.review || '';
            currentBookRating = book.rating;
            updateRatingDisplay('book', book.rating);
        }
    } else {
        // 添加模式
        title.textContent = '添加小说';
    }
    
    modal.style.display = 'block';
}

// 显示电影表单
function showMovieForm(movieId = null) {
    const modal = document.getElementById('movieModal');
    const title = document.getElementById('movieModalTitle');
    
    // 重置表单
    document.getElementById('movieId').value = '';
    document.getElementById('movieTitle').value = '';
    document.getElementById('movieDirector').value = '';
    document.getElementById('movieReview').value = '';
    currentMovieRating = 0;
    updateRatingDisplay('movie', 0);
    
    if (movieId) {
        // 编辑模式
        const movie = movies.find(m => m.id === movieId);
        if (movie) {
            title.textContent = '编辑电影';
            document.getElementById('movieId').value = movie.id;
            document.getElementById('movieTitle').value = movie.title;
            document.getElementById('movieDirector').value = movie.director;
            document.getElementById('movieReview').value = movie.review || '';
            currentMovieRating = movie.rating;
            updateRatingDisplay('movie', movie.rating);
        }
    } else {
        // 添加模式
        title.textContent = '添加电影';
    }
    
    modal.style.display = 'block';
}

// 关闭书籍弹窗
function closeBookModal() {
    document.getElementById('bookModal').style.display = 'none';
}

// 关闭电影弹窗
function closeMovieModal() {
    document.getElementById('movieModal').style.display = 'none';
}

// 保存书籍
function saveBook() {
    const id = document.getElementById('bookId').value;
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const review = document.getElementById('bookReview').value.trim();
    const rating = currentBookRating;
    
    if (!title) {
        alert('请输入书名');
        return;
    }
    
    if (!author) {
        alert('请输入作者');
        return;
    }
    
    if (rating === 0) {
        alert('请选择评分');
        return;
    }
    
    if (id) {
        // 编辑现有书籍
        const book = books.find(b => b.id === parseInt(id));
        if (book) {
            book.title = title;
            book.author = author;
            book.rating = rating;
            book.review = review;
        }
    } else {
        // 添加新书籍
        const newBook = {
            id: books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1,
            title: title,
            author: author,
            rating: rating,
            review: review
        };
        books.unshift(newBook);
    }
    
    // 保存到localStorage
    saveToLocalStorage();
    
    renderBooks();
    closeBookModal();
    alert(id ? '小说更新成功！' : '小说添加成功！');
}

// 保存电影
function saveMovie() {
    const id = document.getElementById('movieId').value;
    const title = document.getElementById('movieTitle').value.trim();
    const director = document.getElementById('movieDirector').value.trim();
    const review = document.getElementById('movieReview').value.trim();
    const rating = currentMovieRating;
    
    if (!title) {
        alert('请输入电影名');
        return;
    }
    
    if (!director) {
        alert('请输入导演');
        return;
    }
    
    if (rating === 0) {
        alert('请选择评分');
        return;
    }
    
    if (id) {
        // 编辑现有电影
        const movie = movies.find(m => m.id === parseInt(id));
        if (movie) {
            movie.title = title;
            movie.director = director;
            movie.rating = rating;
            movie.review = review;
        }
    } else {
        // 添加新电影
        const newMovie = {
            id: movies.length > 0 ? Math.max(...movies.map(m => m.id)) + 1 : 1,
            title: title,
            director: director,
            rating: rating,
            review: review
        };
        movies.unshift(newMovie);
    }
    
    // 保存到localStorage
    saveToLocalStorage();
    
    renderMovies();
    closeMovieModal();
    alert(id ? '电影更新成功！' : '电影添加成功！');
}

// 编辑书籍
function editBook(id) {
    showBookForm(id);
}

// 编辑电影
function editMovie(id) {
    showMovieForm(id);
}

// 删除书籍
function deleteBook(id) {
    if (confirm('确定要删除这本小说吗？')) {
        books = books.filter(b => b.id !== id);
        // 保存到localStorage
        saveToLocalStorage();
        renderBooks();
    }
}

// 删除电影
function deleteMovie(id) {
    if (confirm('确定要删除这部电影吗？')) {
        movies = movies.filter(m => m.id !== id);
        // 保存到localStorage
        saveToLocalStorage();
        renderMovies();
    }
}

// 点击弹窗外部关闭弹窗
window.onclick = function(event) {
    const bookModal = document.getElementById('bookModal');
    const movieModal = document.getElementById('movieModal');
    
    if (event.target === bookModal) {
        closeBookModal();
    }
    
    if (event.target === movieModal) {
        closeMovieModal();
    }
}

// ==================== 日志之海功能 ====================

// 日历状态
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // 1-12
let selectedDate = null;
let journalData = {};

// 从localStorage加载日志数据
function loadJournalData() {
    const stored = localStorage.getItem('journalData');
    if (stored) {
        journalData = JSON.parse(stored);
    }
}

// 保存日志数据到localStorage
function saveJournalData() {
    localStorage.setItem('journalData', JSON.stringify(journalData));
}

// 渲染日历
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    
    if (!calendarGrid) return;
    
    // 更新选择器的值
    yearSelect.value = currentYear;
    monthSelect.value = currentMonth;
    
    // 获取当月第一天是星期几（0-6，0表示周日）
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    
    // 获取当月有多少天
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // 获取今天的日期
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentYear && (today.getMonth() + 1) === currentMonth;
    
    // 构建日历HTML
    let html = `
        <div class="calendar-weekday">日</div>
        <div class="calendar-weekday">一</div>
        <div class="calendar-weekday">二</div>
        <div class="calendar-weekday">三</div>
        <div class="calendar-weekday">四</div>
        <div class="calendar-weekday">五</div>
        <div class="calendar-weekday">六</div>
    `;
    
    // 添加空白格子（月初之前的空白）
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // 添加日期格子
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasEntry = journalData[dateKey] && journalData[dateKey].trim() !== '';
        const isToday = isCurrentMonth && day === today.getDate();
        const isSelected = selectedDate === dateKey;
        
        let classes = 'calendar-day';
        if (hasEntry) classes += ' has-entry';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        
        html += `<div class="${classes}" onclick="selectDate('${dateKey}')">${day}</div>`;
    }
    
    calendarGrid.innerHTML = html;
}

// 选择日期
function selectDate(dateKey) {
    selectedDate = dateKey;
    
    // 更新选中日期显示
    const dateValue = document.getElementById('dateValue');
    if (dateValue) {
        const [year, month, day] = dateKey.split('-');
        dateValue.textContent = `${year}年${parseInt(month)}月${parseInt(day)}日`;
    }
    
    // 加载该日期的日志内容
    const journalTextarea = document.getElementById('journalContent');
    if (journalTextarea) {
        journalTextarea.value = journalData[dateKey] || '';
    }
    
    // 重新渲染日历以更新选中状态
    renderCalendar();
}

// 上一个月
function prevMonth() {
    currentMonth--;
    if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    renderCalendar();
}

// 下一个月
function nextMonth() {
    currentMonth++;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    }
    renderCalendar();
}

// 年份改变
function yearChanged() {
    const yearSelect = document.getElementById('yearSelect');
    currentYear = parseInt(yearSelect.value);
    renderCalendar();
}

// 月份改变
function monthChanged() {
    const monthSelect = document.getElementById('monthSelect');
    currentMonth = parseInt(monthSelect.value);
    renderCalendar();
}

// 保存日志
function saveJournal() {
    if (!selectedDate) {
        alert('请先选择一个日期！');
        return;
    }
    
    const journalTextarea = document.getElementById('journalContent');
    const content = journalTextarea.value.trim();
    
    if (content) {
        journalData[selectedDate] = content;
    } else {
        delete journalData[selectedDate];
    }
    
    saveJournalData();
    renderCalendar();
    
    alert('日志保存成功！');
}

// 初始化年份选择器
function initYearSelect() {
    const yearSelect = document.getElementById('yearSelect');
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 50;
    const endYear = currentYear + 10;
    
    yearSelect.innerHTML = '';
    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year + '年';
        yearSelect.appendChild(option);
    }
    
    yearSelect.value = currentYear;
}

// 初始化月份选择器
function initMonthSelect() {
    const monthSelect = document.getElementById('monthSelect');
    if (!monthSelect) return;
    
    // 不需要动态生成，HTML中已经有静态选项
    // 只需要设置当前值
    monthSelect.value = currentMonth;
}

// 初始化日志之海页面
function initJournalPage() {
    loadJournalData();
    initYearSelect();
    initMonthSelect();
    
    // 默认选中今天
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth() + 1;
    
    // 渲染日历
    renderCalendar();
}

// 页面加载时初始化日志数据
document.addEventListener('DOMContentLoaded', function() {
    loadJournalData();
    initYearSelect();
    initMonthSelect();
});

// 论文数据
let papers = [];

// 当前筛选状态
let currentDisciplineFilter = 'all';
let currentJournalLevelFilter = 'all';

// 渲染论文列表
function renderPapers() {
    const papersList = document.getElementById('papersList');
    const totalPapers = document.getElementById('totalPapers');
    const readPapers = document.getElementById('readPapers');
    const favoritePapers = document.getElementById('favoritePapers');
    
    if (!papersList) return;
    
    // 根据筛选条件过滤论文
    let filteredPapers = papers.filter(paper => {
        const disciplineMatch = currentDisciplineFilter === 'all' || paper.discipline === currentDisciplineFilter;
        const journalLevelMatch = currentJournalLevelFilter === 'all' || paper.journalLevel === currentJournalLevelFilter;
        return disciplineMatch && journalLevelMatch;
    });
    
    // 更新统计信息
    if (totalPapers) totalPapers.textContent = papers.length;
    if (readPapers) readPapers.textContent = papers.filter(p => p.isRead).length;
    if (favoritePapers) favoritePapers.textContent = papers.filter(p => p.isFavorite).length;
    
    if (filteredPapers.length === 0) {
        papersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎓</div>
                <div class="empty-state-text">欢迎来到学术的世界</div>
            </div>
        `;
    } else {
        papersList.innerHTML = filteredPapers.map(paper => `
            <div class="paper-item ${paper.isRead ? 'read' : ''} ${paper.isFavorite ? 'favorite' : ''}" data-id="${paper.id}">
                <div class="paper-header">
                    <h4 class="paper-title">${paper.title}</h4>
                    <div class="paper-actions">
                        <button class="action-btn read-btn ${paper.isRead ? 'active' : ''}" onclick="toggleRead(${paper.id})">
                            ${paper.isRead ? '✓ 已读' : '○ 未读'}
                        </button>
                        <button class="action-btn favorite-btn ${paper.isFavorite ? 'active' : ''}" onclick="toggleFavorite(${paper.id})">
                            ${paper.isFavorite ? '★ 已收藏' : '☆ 收藏'}
                        </button>
                        <button class="action-btn delete-btn" onclick="deletePaper(${paper.id})">删除</button>
                    </div>
                </div>
                <div class="paper-info">
                    <span class="paper-author">作者：${paper.author}</span>
                    <span class="paper-year">年份：${paper.year}</span>
                    <span class="paper-discipline">${getDisciplineLabel(paper.discipline)}</span>
                    <span class="paper-journal">${getJournalLevelLabel(paper.journalLevel)}</span>
                </div>
                ${paper.abstract ? `<p class="paper-abstract">${paper.abstract}</p>` : ''}
            </div>
        `).join('');
    }
}

// 筛选论文
function filterPapers(filterType, filterValue) {
    if (filterType === 'discipline') {
        currentDisciplineFilter = filterValue;
        // 更新学科筛选按钮状态
        document.querySelectorAll('.papers-filter-section:first-of-type .filter-tag').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filterValue) {
                btn.classList.add('active');
            }
        });
    } else if (filterType === 'journalLevel') {
        currentJournalLevelFilter = filterValue;
        // 更新期刊等级筛选按钮状态
        document.querySelectorAll('.papers-filter-section:last-of-type .filter-tag').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filterValue) {
                btn.classList.add('active');
            }
        });
    }
    
    renderPapers();
}

// 获取学科标签
function getDisciplineLabel(discipline) {
    const labels = {
        'medicine': '医学',
        'computer': '计算机科学',
        'biology': '生物学',
        'chemistry': '化学',
        'physics': '物理学',
        'math': '数学',
        'engineering': '工程学',
        'psychology': '心理学',
        'economics': '经济学'
    };
    return labels[discipline] || discipline;
}

// 获取期刊等级标签
function getJournalLevelLabel(journalLevel) {
    const labels = {
        'nature': 'Nature/Science',
        'cell': 'Cell',
        'lancet': '柳叶刀',
        'nejm': 'NEJM',
        'q1': 'Q1期刊',
        'q2': 'Q2期刊',
        'q3': 'Q3期刊',
        'q4': 'Q4期刊',
        'core': '北大核心',
        'ei': 'EI会议',
        'sci': 'SCI',
        'ssci': 'SSCI',
        'cssci': 'CSSCI'
    };
    return labels[journalLevel] || journalLevel;
}

// 切换已读状态
function toggleRead(id) {
    const paper = papers.find(p => p.id === id);
    if (paper) {
        paper.isRead = !paper.isRead;
        renderPapers();
    }
}

// 切换收藏状态
function toggleFavorite(id) {
    const paper = papers.find(p => p.id === id);
    if (paper) {
        paper.isFavorite = !paper.isFavorite;
        renderPapers();
    }
}

// 删除论文
function deletePaper(id) {
    if (confirm('确定要删除这篇论文吗？')) {
        papers = papers.filter(p => p.id !== id);
        renderPapers();
    }
}

// 添加论文
function addPaper() {
    const title = prompt('请输入论文标题：');
    if (!title || !title.trim()) {
        alert('请输入有效的论文标题！');
        return;
    }
    
    const author = prompt('请输入作者：');
    if (!author || !author.trim()) {
        alert('请输入有效的作者！');
        return;
    }
    
    const year = prompt('请输入发表年份：');
    if (!year || isNaN(year)) {
        alert('请输入有效的年份！');
        return;
    }
    
    const abstract = prompt('请输入论文摘要（可选）：') || '';
    
    const newPaper = {
        id: papers.length > 0 ? Math.max(...papers.map(p => p.id)) + 1 : 1,
        title: title.trim(),
        author: author.trim(),
        discipline: 'computer',
        journalLevel: 'sci',
        year: parseInt(year),
        isRead: false,
        isFavorite: false,
        abstract: abstract.trim()
    };
    
    papers.unshift(newPaper);
    renderPapers();
    alert('论文添加成功！');
}

// 渲染便签
function renderStickyNotes() {
    // 便签功能的占位函数
    // 可以根据需要添加便签功能
}

// 便利贴数据
let stickyNotes = [];

// 从localStorage加载便利贴数据
function loadStickyNotes() {
    const savedStickyNotes = localStorage.getItem('stickyNotes');
    if (savedStickyNotes) {
        stickyNotes = JSON.parse(savedStickyNotes);
    }
}

// 保存便利贴数据到localStorage
function saveStickyNotesToStorage() {
    localStorage.setItem('stickyNotes', JSON.stringify(stickyNotes));
}

// 渲染便利贴列表
function renderStickyNotes() {
    const stickyNotesGrid = document.getElementById('stickyNotesGrid');
    
    if (!stickyNotesGrid) return;
    
    if (stickyNotes.length === 0) {
        stickyNotesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">还没有便利贴，点击"添加便利贴"开始记录吧！</div>
            </div>
        `;
    } else {
        stickyNotesGrid.innerHTML = stickyNotes.map(note => `
            <div class="sticky-note" style="background-color: ${note.color}" data-id="${note.id}">
                <div class="sticky-note-header">
                    <h4 class="sticky-note-title">${note.title}</h4>
                    <div class="sticky-note-actions">
                        <button class="sticky-note-action-btn edit-btn" onclick="editStickyNote(${note.id})">✏️</button>
                        <button class="sticky-note-action-btn delete-btn" onclick="deleteStickyNote(${note.id})">🗑️</button>
                    </div>
                </div>
                <p class="sticky-note-content">${note.content}</p>
                <span class="sticky-note-date">${note.date}</span>
            </div>
        `).join('');
    }
}

// 显示便利贴表单
function showStickyNoteForm() {
    const modal = document.getElementById('stickyNoteModal');
    const modalTitle = document.getElementById('stickyNoteModalTitle');
    
    // 清空表单
    document.getElementById('stickyNoteId').value = '';
    document.getElementById('stickyNoteTitle').value = '';
    document.getElementById('stickyNoteContent').value = '';
    document.getElementById('stickyNoteColor').value = '#E0C9A6';
    
    // 重置颜色选择
    document.querySelectorAll('.sticky-note-color-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector('.sticky-note-color-option[data-color="#E0C9A6"]').classList.add('selected');
    
    modalTitle.textContent = '添加便利贴';
    modal.style.display = 'block';
}

// 关闭便利贴弹窗
function closeStickyNoteModal() {
    const modal = document.getElementById('stickyNoteModal');
    modal.style.display = 'none';
}

// 选择便利贴颜色
function selectStickyNoteColor(color) {
    document.getElementById('stickyNoteColor').value = color;
    
    // 更新选中状态
    document.querySelectorAll('.sticky-note-color-option').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.color === color) {
            btn.classList.add('selected');
        }
    });
}

// 保存便利贴
function saveStickyNote() {
    const id = document.getElementById('stickyNoteId').value;
    const title = document.getElementById('stickyNoteTitle').value.trim();
    const content = document.getElementById('stickyNoteContent').value.trim();
    const color = document.getElementById('stickyNoteColor').value;
    
    if (!title) {
        alert('请输入便利贴标题！');
        return;
    }
    
    if (!content) {
        alert('请输入便利贴内容！');
        return;
    }
    
    if (id) {
        // 编辑现有便利贴
        const note = stickyNotes.find(n => n.id === parseInt(id));
        if (note) {
            note.title = title;
            note.content = content;
            note.color = color;
            note.date = new Date().toLocaleString('zh-CN');
        }
    } else {
        // 添加新便利贴
        const newNote = {
            id: stickyNotes.length > 0 ? Math.max(...stickyNotes.map(n => n.id)) + 1 : 1,
            title: title,
            content: content,
            color: color,
            date: new Date().toLocaleString('zh-CN')
        };
        stickyNotes.unshift(newNote);
    }
    
    saveStickyNotesToStorage();
    renderStickyNotes();
    closeStickyNoteModal();
}

// 编辑便利贴
function editStickyNote(id) {
    const note = stickyNotes.find(n => n.id === id);
    if (!note) return;
    
    const modal = document.getElementById('stickyNoteModal');
    const modalTitle = document.getElementById('stickyNoteModalTitle');
    
    // 填充表单
    document.getElementById('stickyNoteId').value = note.id;
    document.getElementById('stickyNoteTitle').value = note.title;
    document.getElementById('stickyNoteContent').value = note.content;
    document.getElementById('stickyNoteColor').value = note.color;
    
    // 更新颜色选择
    document.querySelectorAll('.sticky-note-color-option').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.color === note.color) {
            btn.classList.add('selected');
        }
    });
    
    modalTitle.textContent = '编辑便利贴';
    modal.style.display = 'block';
}

// 删除便利贴
function deleteStickyNote(id) {
    if (confirm('确定要删除这张便利贴吗？')) {
        stickyNotes = stickyNotes.filter(n => n.id !== id);
        saveStickyNotesToStorage();
        renderStickyNotes();
    }
}

// 页面加载时初始化便利贴数据
loadStickyNotes();

// ==================== 页面初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    // 默认显示首页
    navigateTo('home');
    
    // 为输入框添加回车提交功能
    const messageContent = document.getElementById('messageContent');
    if (messageContent) {
        messageContent.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitMessage();
            }
        });
    }
    
    // 检查登录状态
    checkUser();
    loadPosts();
});
