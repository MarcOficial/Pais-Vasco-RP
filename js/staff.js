// IDs autorizados para gestionar el staff
const allowedIds = [
    "1394639946643411048", // tu ID
    "1394639946643411048"  // otro ID si quieres
];

let allStaff = [];
let activeRoleFilter = 'all';

(async function () {
    const user = await requireAuth();
    if (!user) return;

    renderSidebar('staff');
    initSidebarToggle();

    // Mostrar botón solo si el usuario tiene un ID autorizado
    if (allowedIds.includes(user.discordId)) {
        document.getElementById('addStaffBtn').style.display = 'inline-flex';
    }

    loadStaff();
})();

async function loadStaff() {
    try {
        allStaff = await api('GET', '/api/staff');
        buildRoleFilters();
        renderStaff();
    } catch (err) {
        showToast('Error cargando staff', 'error');
    }
}

function buildRoleFilters() {
    const roles = new Set();
    allStaff.forEach(s => (s.roles || []).forEach(r => roles.add(r)));

    const container = document.getElementById('roleFilters');
    container.innerHTML = `
        <button class="filter-chip ${activeRoleFilter === 'all' ? 'active' : ''}" onclick="filterRole('all')">Todos</button>
        ${[...roles].map(r => `
            <button class="filter-chip ${activeRoleFilter === r ? 'active' : ''}" onclick="filterRole('${r}')">${r}</button>
        `).join('')}
    `;
}

function filterRole(role) {
    activeRoleFilter = role;
    buildRoleFilters();
    renderStaff();
}

function renderStaff() {
    const container = document.getElementById('staffGrid');
    let filtered = allStaff;

    if (activeRoleFilter !== 'all') {
        filtered = allStaff.filter(s => (s.roles || []).includes(activeRoleFilter));
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="icon">👥</div>
                <h3>No se encontraron miembros</h3>
            </div>`;
        return;
    }

    container.innerHTML = filtered.map((member, i) => {
        const avatar = member.avatar || `https://cdn.discordapp.com/embed/avatars/${parseInt(member.discordId || '0') % 5}.png`;
        const roleColors = member.roleColors || {};

        return `
            <div class="staff-card animate-in stagger-${Math.min(i + 1, 6)}">
                <img src="${avatar}" alt="${escapeHtml(member.globalName || member.username)}" class="staff-avatar">
                <div class="staff-name">${escapeHtml(member.globalName || member.username)}</div>
                <div class="staff-username">@${escapeHtml(member.username)}</div>
                <div class="staff-roles">
                    ${(member.roles || []).map(r => {
                        const color = roleColors[r] || '#7c3aed';
                        return `<span class="badge" style="background: ${color}22; color: ${color}; border: 1px solid ${color}44;">${r}</span>`;
                    }).join('')}
                </div>

                ${member.addedManually ? `
                    <div class="mt-1">
                        <span class="badge badge-muted">Agregado manualmente</span>
                        ${allowedIds.includes(currentUser.discordId)
                            ? `<button class="btn btn-sm btn-danger mt-1" onclick="removeStaff('${member._id}')">Eliminar</button>`
                            : ''}
                    </div>` : ''}
            </div>
        `;
    }).join('');
}

async function addStaff() {
    // Protección extra: solo IDs autorizados pueden añadir
    if (!allowedIds.includes(currentUser.discordId)) {
        showToast("No tienes permiso para añadir staff", "error");
        return;
    }

    const roles = document.getElementById('staffRoles').value.split(',').map(r => r.trim()).filter(Boolean);

    try {
        await api('POST', '/api/staff', {
            discordId: document.getElementById('staffDiscordId').value,
            username: document.getElementById('staffUsername').value,
            globalName: document.getElementById('staffGlobalName').value,
            roles,
            notes: document.getElementById('staffNotes').value
        });
        showToast('Miembro agregado', 'success');
        closeModal('staffModal');
        loadStaff();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function removeStaff(id) {
    if (!allowedIds.includes(currentUser.discordId)) {
        showToast("No tienes permiso para eliminar staff", "error");
        return;
    }

    const ok = await showConfirm('¿Eliminar este miembro?', { title: 'Eliminar miembro' });
    if (!ok) return;

    try {
        await api('DELETE', `/api/staff/${id}`);
        showToast('Miembro eliminado', 'success');
        loadStaff();
    } catch (err) {
        showToast(err.message, 'error');
    }
}
