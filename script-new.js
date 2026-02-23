
const supabase = createClient(
    'https://iltgkpzaoweyzwlwozz.supabase.co',
    'sb_publishable_zZ0i2_-VOI_nNRns77aK6w_XTxeGOoc'  // 换成你复制的完整key
);

// ========== 登录/注册功能 ==========

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

// ========== 树洞功能 ==========

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

// ========== 初始化 ==========
// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    checkUser();
    loadPosts();
});
