const API_BASE = '';
let currentUser = null;


async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
            currentUser = await res.json();
            return currentUser;
        }
        return null;
    } catch {
        return null;
    }
}

async function requireAuth() {
    const user = await checkAuth();
    if (!user) {
        window.location.href = '/';
        return null;
    }

    try {
        const syncRes = await fetch(`${API_BASE}/api/auth/sync-roles`, { credentials: 'include' });
        if (syncRes.ok) {
            const synced = await syncRes.json();
            currentUser.roles = synced.roles;
            currentUser.accessiblePages = synced.accessiblePages;
            currentUser.permissions = synced.permissions || [];
        }
    } catch { }
    return user;
}

function hasPermission(...perms) {
    if (!currentUser || !currentUser.permissions) return false;
    return perms.some(p => currentUser.permissions.includes(p));
}


async function api(method, url, data = null, isFormData = false) {
    const opts = {
        method,
        credentials: 'include',
        headers: {}
    };

    if (data) {
        if (isFormData) {
            opts.body = data;
        } else {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(data);
        }
    }

    const res = await fetch(`${API_BASE}${url}`, opts);
    const json = await res.json();

    if (!res.ok) {
        throw new Error(json.error || 'Error en la solicitud');
    }

    return json;
}


function initToasts() {
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

function showToast(message, type = 'info') {
    initToasts();
    const container = document.querySelector('.toast-container');

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}


function showConfirm(message, { title = 'Confirmación', confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'danger' } = {}) {
    return new Promise((resolve) => {

        const existing = document.getElementById('customConfirmOverlay');
        if (existing) existing.remove();

        const iconMap = {
            danger: '⚠️',
            warning: '⚡',
            info: 'ℹ️',
            success: '✅'
        };

        const overlay = document.createElement('div');
        overlay.id = 'customConfirmOverlay';
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-icon">${iconMap[type] || '⚠️'}</div>
                <h3 class="confirm-title">${title}</h3>
                <p class="confirm-message">${message}</p>
                <div class="confirm-actions">
                    <button class="btn btn-secondary confirm-cancel">${cancelText}</button>
                    <button class="btn btn-${type} confirm-ok">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);


        requestAnimationFrame(() => overlay.classList.add('active'));

        function cleanup(result) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            resolve(result);
        }

        overlay.querySelector('.confirm-cancel').addEventListener('click', () => cleanup(false));
        overlay.querySelector('.confirm-ok').addEventListener('click', () => cleanup(true));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(false);
        });


        function onKey(e) {
            if (e.key === 'Escape') { cleanup(false); document.removeEventListener('keydown', onKey); }
        }
        document.addEventListener('keydown', onKey);
    });
}


function renderSidebar(activePage) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || !currentUser) return;

    const pages = currentUser.accessiblePages || [];
    const hasPage = (page) => pages.includes(page);

    let nav = `
    <div class="nav-section">
      <div class="nav-section-title">General</div>
      ${hasPage('dashboard') ? `<a href="/dashboard" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">
        <span class="icon">📊</span> Dashboard
      </a>` : ''}
      ${hasPage('posts') ? `<a href="/posts" class="nav-link ${activePage === 'posts' ? 'active' : ''}">
        <span class="icon">📢</span> Updates
      </a>` : ''}
      ${hasPage('blog') ? `<a href="/blog" class="nav-link ${activePage === 'blog' ? 'active' : ''}">
        <span class="icon">📝</span> Blog
      </a>` : ''}
      ${hasPage('staff') ? `<a href="/staff" class="nav-link ${activePage === 'staff' ? 'active' : ''}">
        <span class="icon">👥</span> Equipo de Staff
      </a>` : ''}
      ${hasPage('appeals') ? `<a href="/appeals" class="nav-link ${activePage === 'appeals' ? 'active' : ''}">
        <span class="icon">📋</span> Apelaciones
      </a>` : ''}
    </div>
  `;

    if (hasPage('sanctions')) {
        nav += `
      <div class="nav-section">
        <div class="nav-section-title">Moderación</div>
        <a href="/sanctions" class="nav-link ${activePage === 'sanctions' ? 'active' : ''}">
          <span class="icon">🔨</span> Sanciones
        </a>
      </div>
    `;
    }

    if (hasPage('jobs') || hasPage('payments')) {
        nav += `
      <div class="nav-section">
        <div class="nav-section-title">Desarrollo</div>
        ${hasPage('jobs') ? `<a href="/jobs" class="nav-link ${activePage === 'jobs' ? 'active' : ''}">
          <span class="icon">💼</span> Trabajos
        </a>` : ''}
        ${hasPage('payments') ? `<a href="/payments" class="nav-link ${activePage === 'payments' ? 'active' : ''}">
          <span class="icon">💰</span> Pagos
        </a>` : ''}
      </div>
    `;
    }

    if (hasPage('settings')) {
        nav += `
      <div class="nav-section">
        <div class="nav-section-title">Administración</div>
        <a href="/settings" class="nav-link ${activePage === 'settings' ? 'active' : ''}">
          <span class="icon">⚙️</span> Ajustes / Roles
        </a>
      </div>
    `;
    }

    nav += `
      <div class="nav-section" style="margin-top: auto; padding-bottom: 20px;">
        <a href="https://www.roblox.com/es/communities/35578037/Ander-Productions#!/about" target="_blank" class="nav-link" style="background: rgba(255,255,255,0.03); justify-content: center;">
          <span class="icon">🎮</span> Grupo de Roblox
        </a>
      </div>
    `;

    sidebar.innerHTML = `
    <div class="sidebar-header">
      <img src="/img/pvrp-5.png" alt="Logo" style="height: 32px; width: auto; object-fit: contain;">
      <span class="sidebar-logo">PV:RP</span>
    </div>
    <nav class="sidebar-nav" style="display: flex; flex-direction: column;">${nav}</nav>
    <div class="sidebar-user">
      <img src="${currentUser.avatar}" alt="${currentUser.username}" class="sidebar-user-avatar">
      <div class="sidebar-user-info">
        <div class="sidebar-user-name">${currentUser.globalName || currentUser.username}</div>
        <div class="sidebar-user-role">${currentUser.roles.join(', ') || 'Usuario Público'}</div>
      </div>
      <button class="btn-logout" onclick="window.location.href='/auth/logout'" title="Cerrar sesión">🚪</button>
    </div>
  `;
}


function initSidebarToggle() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle) {
                sidebar.classList.remove('open');
            }
        });
    }
}


function createParticles() {
    const container = document.querySelector('.particles');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 8 + 's';
        p.style.animationDuration = (6 + Math.random() * 6) + 's';
        p.style.width = (2 + Math.random() * 3) + 'px';
        p.style.height = p.style.width;
        container.appendChild(p);
    }
}


function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}


document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});


function openLightbox(src) {
    let lightbox = document.getElementById('lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.className = 'lightbox';
        lightbox.innerHTML = '<img src="" alt="Preview">';
        lightbox.addEventListener('click', () => lightbox.classList.remove('active'));
        document.body.appendChild(lightbox);
    }
    lightbox.querySelector('img').src = src;
    lightbox.classList.add('active');
}


function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateTime(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    const intervals = [
        { label: 'año', seconds: 31536000 },
        { label: 'mes', seconds: 2592000 },
        { label: 'día', seconds: 86400 },
        { label: 'hora', seconds: 3600 },
        { label: 'minuto', seconds: 60 }
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `hace ${count} ${interval.label}${count > 1 ? (interval.label === 'mes' ? 'es' : 's') : ''}`;
        }
    }
    return 'hace un momento';
}


function staggerAnimation(selector) {
    const items = document.querySelectorAll(selector);
    items.forEach((item, i) => {
        item.style.animationDelay = `${i * 0.05}s`;
        item.classList.add('animate-in');
    });
}


function initUploadZone(zoneId, previewId) {
    const zone = document.getElementById(zoneId);
    const preview = document.getElementById(previewId);
    if (!zone) return;

    const input = zone.querySelector('input[type="file"]');
    const instructions = zone.querySelectorAll('.icon, p');

    zone.addEventListener('click', () => {
        if (input) input.click();
    });

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length && input) {
            input.files = e.dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        }
    });

    if (input && preview) {
        input.addEventListener('change', () => {
            const files = input.files;

            if (files.length === 0) {
                instructions.forEach(el => el.style.display = 'block');
                if (preview.tagName === 'IMG') {
                    preview.style.display = 'none';
                    preview.src = '';
                } else {
                    preview.textContent = '';
                    preview.style.display = 'none';
                }
                return;
            }

            
            instructions.forEach(el => el.style.display = 'none');

            if (preview.tagName === 'IMG') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(files[0]);
            } else {
                preview.textContent = files.length === 1
                    ? '1 archivo seleccionado'
                    : `${files.length} archivos seleccionados`;
                preview.style.display = 'block';
            }
        });
    }
}


function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


function copyToClipboard(text) {
    return new Promise((resolve, reject) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(resolve).catch(reject);
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                textArea.remove();
                resolve();
            } catch (err) {
                textArea.remove();
                reject(err);
            }
        }
    });
}


function initCustomSelects() {
    document.querySelectorAll('select.form-control:not(.custom-select-initialized)').forEach(sel => {
        sel.classList.add('custom-select-initialized');
        sel.style.display = 'none';

        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select';

        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';

        const selectedOpt = sel.options[sel.selectedIndex];
        trigger.innerHTML = `<span class="custom-select-value">${selectedOpt ? selectedOpt.text : ''}</span><span class="custom-select-arrow">▾</span>`;

        const dropdown = document.createElement('div');
        dropdown.className = 'custom-select-dropdown';

        Array.from(sel.options).forEach((opt, i) => {
            const item = document.createElement('div');
            item.className = 'custom-select-option' + (i === sel.selectedIndex ? ' selected' : '');
            item.textContent = opt.text;
            item.dataset.value = opt.value;

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                sel.value = opt.value;
                sel.dispatchEvent(new Event('change'));
                trigger.querySelector('.custom-select-value').textContent = opt.text;
                dropdown.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
                item.classList.add('selected');
                wrapper.classList.remove('open');
            });

            dropdown.appendChild(item);
        });

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();

            document.querySelectorAll('.custom-select.open').forEach(cs => {
                if (cs !== wrapper) cs.classList.remove('open');
            });
            wrapper.classList.toggle('open');
        });

        wrapper.appendChild(trigger);
        wrapper.appendChild(dropdown);
        sel.parentNode.insertBefore(wrapper, sel.nextSibling);
    });


    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select.open').forEach(cs => cs.classList.remove('open'));
    });
}


document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initCustomSelects, 100);
});


function sanctionTypeBadge(type) {
    const map = {
        warn: ['⚠️ Warn', 'badge-warning'],
        mute: ['🔇 Mute', 'badge-info'],
        kick: ['👢 Kick', 'badge-warning'],
        ban: ['🔨 Ban', 'badge-danger'],
        other: ['📝 Otro', 'badge-muted']
    };
    const [label, cls] = map[type] || map.other;
    return `<span class="badge ${cls}">${label}</span>`;
}

function jobStatusBadge(status) {
    const map = {
        pending: ['⏳ Pendiente', 'badge-warning'],
        'in-progress': ['🔄 En progreso', 'badge-info'],
        review: ['👀 En revisión', 'badge-primary'],
        done: ['✅ Completado', 'badge-success'],
        cancelled: ['❌ Cancelado', 'badge-danger']
    };
    const [label, cls] = map[status] || ['Desconocido', 'badge-muted'];
    return `<span class="badge ${cls}">${label}</span>`;
}

function paymentStatusBadge(status) {
    const map = {
        pending: ['⏳ Pendiente', 'badge-warning'],
        paid: ['✅ Pagado', 'badge-success'],
        cancelled: ['❌ Cancelado', 'badge-danger']
    };
    const [label, cls] = map[status] || ['Desconocido', 'badge-muted'];
    return `<span class="badge ${cls}">${label}</span>`;
}

function appealStatusBadge(status) {
    const map = {
        pending: ['⏳ Pendiente', 'badge-warning'],
        approved: ['✅ Aprobada', 'badge-success'],
        denied: ['❌ Denegada', 'badge-danger']
    };
    const [label, cls] = map[status] || ['Desconocido', 'badge-muted'];
    return `<span class="badge ${cls}">${label}</span>`;
}

function priorityBadge(priority) {
    const map = {
        low: ['Baja', 'badge-muted'],
        medium: ['Media', 'badge-info'],
        high: ['Alta', 'badge-warning'],
        urgent: ['Urgente', 'badge-danger']
    };
    const [label, cls] = map[priority] || ['Media', 'badge-info'];
    return `<span class="badge ${cls}">${label}</span>`;
}
