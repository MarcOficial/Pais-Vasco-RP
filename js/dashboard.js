
(async function () {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('dashboard');
  initSidebarToggle();

  const userHasRoles = user.roles && user.roles.length > 0;


  if (userHasRoles) {
    const appealsCard = document.getElementById('appealsCard');
    if (appealsCard) appealsCard.style.display = '';
  }


  try {
    const [posts, blog] = await Promise.all([
      api('GET', '/api/posts'),
      api('GET', '/api/blog')
    ]);

    document.getElementById('statPosts').textContent = posts.length;
    document.getElementById('statBlog').textContent = blog.length;


    if (userHasRoles) {
      try {
        const [appeals, sanctions] = await Promise.all([
          api('GET', '/api/appeals'),
          api('GET', '/api/sanctions')
        ]);
        document.getElementById('statAppeals').textContent = appeals.filter(a => a.status === 'pending').length;
        document.getElementById('statSanctions').textContent = sanctions.filter(s => s.active).length;


        const recentAppealsEl = document.getElementById('recentAppeals');
        if (appeals.length === 0) {
          recentAppealsEl.innerHTML = '<p class="text-muted">No hay apelaciones</p>';
        } else {
          recentAppealsEl.innerHTML = appeals.slice(0, 5).map(a => `
                        <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                          <div>
                            <div style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(a.discordUser)}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${timeAgo(a.createdAt)}</div>
                          </div>
                          ${appealStatusBadge(a.status)}
                        </div>
                    `).join('');
        }
      } catch {

        document.getElementById('statAppeals').textContent = '-';
        document.getElementById('statSanctions').textContent = '-';
      }
    } else {

      document.getElementById('statAppeals').textContent = '-';
      document.getElementById('statSanctions').textContent = '-';
    }


    if (hasPermission('_global_dev', '_global_lead', '_global_admin')) {
      document.getElementById('statJobsCard').style.display = 'flex';
      document.getElementById('statPaymentsCard').style.display = 'flex';

      const [jobs, payments] = await Promise.all([
        api('GET', '/api/jobs'),
        api('GET', '/api/payments')
      ]);

      document.getElementById('statJobs').textContent = jobs.filter(j => j.status !== 'done' && j.status !== 'cancelled').length;
      document.getElementById('statPayments').textContent = payments.filter(p => p.status === 'pending').length;
    }


    const recentPostsEl = document.getElementById('recentPosts');
    if (posts.length === 0) {
      recentPostsEl.innerHTML = '<p class="text-muted">No hay posts aún</p>';
    } else {
      recentPostsEl.innerHTML = posts.slice(0, 5).map(p => `
                <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                  <div style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(p.title)}</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                    ${p.authorName || 'Anónimo'} · ${timeAgo(p.createdAt)}
                  </div>
                </div>
            `).join('');
    }
  } catch (err) {
    showToast('Error cargando datos del dashboard', 'error');
    console.error(err);
  }
})();
