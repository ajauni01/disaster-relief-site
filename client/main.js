(function () {
  const apiContext = window.WRHApi;
  const publicPages = window.WRHPublicPages;
  const renderer = window.WRHRenderer;

  if (!apiContext || !publicPages || !renderer) {
    console.error('Required scripts missing: api.js, public-pages.js, renderer.js');
    return;
  }

  const {
    page,
    appState,
    getAdminToken,
    setAdminSession,
    clearAdminSession,
    api,
    escapeHtml,
    toLocalDate,
    formDataToObject,
    splitCommaValues,
    splitLineValues
  } = apiContext;

  const {
    renderBase,
    updateAdminEntry,
    hydrateSiteInfo,
    showSuccessPopup,
    closeSuccessPopup,
    renderSectionIntro,
    setContent,
    renderHome,
    renderAlerts,
    renderMap,
    renderShelters,
    renderRequestHelp,
    renderVolunteer,
    renderDonations,
    renderResources,
    renderUpdates
  } = publicPages;

  const {
    renderSubtleMessage,
    getAssignedVolunteerId,
    renderOverviewCards,
    getApprovedVolunteerOptions,
    renderHelpRequestRow,
    renderVolunteerRow,
    renderInventoryRow,
    renderAnnouncementRow,
    renderChartRow,
    renderAdminUserRow,
    renderActivityLogRow
  } = renderer;

function renderAdmin() {
  setContent(`
    ${renderSectionIntro('Secure admin access for operations, requests, volunteers, resources, CMS updates, and analytics.')}
    <section class="section section-muted">
      <div class="container">
        <div id="adminAuthPanel" class="form-card"></div>
        <div id="adminDashboardPanel" class="admin-dashboard" hidden></div>
      </div>
    </section>
  `);

  initializeAdminPage();
}

async function initializeAdminPage() {
  const authPanel = document.getElementById('adminAuthPanel');
  const dashboardPanel = document.getElementById('adminDashboardPanel');

  function renderLogin(errorMessage) {
    authPanel.hidden = false;
    dashboardPanel.hidden = true;
    authPanel.classList.add('admin-login-card');
    authPanel.innerHTML = `
      <h2>Admin Login</h2>
      <p class="subtle">Use your authorized admin credentials.</p>
      <form id="adminLoginForm" class="form-grid">
        <div>
          <label for="adminEmail">Email</label>
          <input id="adminEmail" name="email" type="email" required />
        </div>
        <div>
          <label for="adminPassword">Password</label>
          <input id="adminPassword" name="password" type="password" required />
        </div>
        <button type="submit" class="button button-primary">Sign In</button>
      </form>
      <div id="adminAuthMessage">${errorMessage ? `<div class="error">${escapeHtml(errorMessage)}</div>` : ''}</div>
    `;

    const loginForm = document.getElementById('adminLoginForm');
    const messageBox = document.getElementById('adminAuthMessage');

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      messageBox.innerHTML = '';

      const payload = formDataToObject(loginForm);

      try {
        const data = await api('/api/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        setAdminSession(data.token, data.user);
        updateAdminEntry();
        showSuccessPopup('Admin login successful.');
        renderDashboard(data.user);
      } catch (error) {
        messageBox.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
      }
    });
  }

  function renderDashboard(user) {
    authPanel.hidden = true;
    dashboardPanel.hidden = false;
    authPanel.classList.remove('admin-login-card');

    const superAdminSection =
      user.role === 'super-admin'
        ? `
      <section class="table-card admin-section admin-super">
        <h2>Super Admin Controls</h2>
        <form id="addAdminForm" class="form-grid admin-form-inline">
          <div>
            <label for="newAdminEmail">Admin Email</label>
            <input id="newAdminEmail" name="email" type="email" required />
          </div>
          <div>
            <label for="newAdminPassword">Password</label>
            <input id="newAdminPassword" name="password" type="password" minlength="8" required />
          </div>
          <div>
            <label for="newAdminRole">Role</label>
            <select id="newAdminRole" name="role">
              <option value="admin">Admin</option>
              <option value="super-admin">Super Admin</option>
            </select>
          </div>
          <button type="submit" class="button button-primary">Add Admin</button>
        </form>
        <div id="adminUsersWrap" class="table-scroll"></div>
        <h3>Activity Log</h3>
        <div id="activityLogWrap" class="table-scroll"></div>
      </section>
    `
        : '';

    dashboardPanel.innerHTML = `
      <div class="admin-toolbar">
        <div>
          <h2>Welcome, ${escapeHtml(user.email)}</h2>
          <p class="subtle">Role: ${escapeHtml(user.role)}</p>
        </div>
        <button id="adminLogout" class="button button-outline" type="button">Logout</button>
      </div>

      <div id="adminActionMessage" class="admin-alert"></div>

      <section class="table-card admin-section admin-overview">
        <h2>Operations Overview</h2>
        <div id="overviewCards" class="admin-grid-cards"></div>
      </section>

      <section class="table-card admin-section admin-help">
        <h2>Help Requests Management</h2>
        <div class="admin-filters">
          <div>
            <label for="helpFilterStatus">Status</label>
            <select id="helpFilterStatus">
              <option value="">All</option>
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label for="helpFilterUrgency">Urgency</label>
            <select id="helpFilterUrgency">
              <option value="">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button id="applyHelpFilters" class="button button-primary" type="button">Apply Filters</button>
        </div>
        <div id="helpRequestsWrap" class="table-scroll"></div>
        <div id="helpDetailsWrap"></div>
      </section>

      <section class="table-card admin-section admin-volunteer">
        <h2>Volunteer Management</h2>
        <form id="manualVolunteerForm" class="form-grid admin-form-inline">
          <div>
            <label for="mvName">Name</label>
            <input id="mvName" name="name" required />
          </div>
          <div>
            <label for="mvEmail">Email</label>
            <input id="mvEmail" name="email" type="email" required />
          </div>
          <div>
            <label for="mvPhone">Contact</label>
            <input id="mvPhone" name="phone" required />
          </div>
          <div>
            <label for="mvSkills">Skills (comma separated)</label>
            <input id="mvSkills" name="skills" />
          </div>
          <div>
            <label for="mvAvailability">Availability</label>
            <input id="mvAvailability" name="availability" required />
          </div>
          <div>
            <label for="mvLocation">Location</label>
            <input id="mvLocation" name="location" required />
          </div>
          <button type="submit" class="button button-primary">Add Volunteer</button>
        </form>
        <div id="volunteersWrap" class="table-scroll"></div>
      </section>

      <section class="table-card admin-section admin-inventory">
        <h2>Resource Inventory Management</h2>
        <form id="inventoryForm" class="form-grid admin-form-inline">
          <div>
            <label for="invName">Resource name</label>
            <input id="invName" name="name" required />
          </div>
          <div>
            <label for="invCategory">Category</label>
            <input id="invCategory" name="category" required />
          </div>
          <div>
            <label for="invQuantity">Quantity</label>
            <input id="invQuantity" name="quantity" type="number" min="0" required />
          </div>
          <div>
            <label for="invLocation">Location (optional)</label>
            <input id="invLocation" name="location" />
          </div>
          <div>
            <label for="invLowStock">Low stock threshold</label>
            <input id="invLowStock" name="lowStockThreshold" type="number" min="0" value="10" required />
          </div>
          <button type="submit" class="button button-primary">Add Resource</button>
        </form>
        <div id="inventoryWrap" class="table-scroll"></div>
      </section>

      <section class="table-card admin-section admin-cms">
        <h2>Website Information Updates (CMS)</h2>
        <form id="emergencyForm" class="form-grid">
          <div>
            <label for="cmsEmergency">Homepage emergency message</label>
            <input id="cmsEmergency" name="emergencyMessage" required />
          </div>
          <button class="button button-primary" type="submit">Update Emergency Message</button>
        </form>

        <form id="hotlineForm" class="form-grid top-gap">
          <div>
            <label for="cmsHotlines">Hotline numbers (one per line)</label>
            <textarea id="cmsHotlines" name="hotlineNumbers"></textarea>
          </div>
          <button class="button button-primary" type="submit">Update Hotlines</button>
        </form>

        <form id="announcementForm" class="form-grid top-gap">
          <div>
            <label for="annTitle">Announcement title</label>
            <input id="annTitle" name="title" required />
          </div>
          <div>
            <label for="annBody">Announcement body</label>
            <textarea id="annBody" name="body" required></textarea>
          </div>
          <div class="checkbox-row">
            <input id="annPublished" name="published" type="checkbox" checked />
            <label for="annPublished">Publish immediately</label>
          </div>
          <button class="button button-primary" type="submit">Post Announcement</button>
        </form>
        <div id="announcementsWrap" class="top-gap"></div>
      </section>

      <section class="table-card admin-section admin-analytics">
        <h2>Basic Analytics</h2>
        <div id="analyticsSummary" class="admin-grid-cards"></div>
        <div id="analyticsCharts" class="analytics-grid"></div>
      </section>

      ${superAdminSection}
    `;

    bindAdminActions(user);
    refreshAdminDashboard(user);
  }

  async function validateExistingSession() {
    const token = getAdminToken();
    if (!token) {
      renderLogin('');
      return;
    }

    try {
      const user = await api('/api/admin/auth/me', { auth: true });
      appState.adminUser = user;
      updateAdminEntry();
      renderDashboard(user);
    } catch (error) {
      clearAdminSession();
      updateAdminEntry();
      renderLogin('Please log in again.');
    }
  }

  function createActionMessageSetter() {
    const actionMessage = document.getElementById('adminActionMessage');
    return function setActionMessage(kind, message) {
      if (!actionMessage) {
        return;
      }
      actionMessage.innerHTML = `<div class="${kind}">${escapeHtml(message)}</div>`;
    };
  }

  function getEventAction(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return null;
    }

    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) {
      return null;
    }

    return { target, action, id };
  }

  function bindAdminActions(user) {
    const setActionMessage = createActionMessageSetter();

    bindLogoutAction();
    bindHelpFilterAction();
    bindVolunteerFormAction(setActionMessage);
    bindInventoryFormAction(setActionMessage);
    bindEmergencyMessageFormAction(setActionMessage);
    bindHotlineFormAction(setActionMessage);
    bindAnnouncementFormAction(setActionMessage);
    bindHelpRequestTableActions(setActionMessage);
    bindVolunteerTableActions(setActionMessage);
    bindInventoryTableActions(setActionMessage);
    bindAnnouncementTableActions(setActionMessage);

    if (user.role === 'super-admin') {
      bindSuperAdminActions(setActionMessage);
    }
  }

  function bindLogoutAction() {
    const logoutButton = document.getElementById('adminLogout');
    if (!logoutButton) {
      return;
    }

    logoutButton.addEventListener('click', async () => {
      try {
        await api('/api/admin/auth/logout', { method: 'POST', auth: true });
      } catch (error) {
        // ignore logout transport error and clear local state anyway
      }

      clearAdminSession();
      updateAdminEntry();
      showSuccessPopup('You have been logged out.');
      renderLogin('');
    });
  }

  function bindHelpFilterAction() {
    const applyFilters = document.getElementById('applyHelpFilters');
    if (!applyFilters) {
      return;
    }

    applyFilters.addEventListener('click', async () => {
      await loadHelpRequests();
    });
  }

  function bindVolunteerFormAction(setActionMessage) {
    const manualVolunteerForm = document.getElementById('manualVolunteerForm');
    if (!manualVolunteerForm) {
      return;
    }

    manualVolunteerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const raw = formDataToObject(manualVolunteerForm);
      const payload = { ...raw, skills: splitCommaValues(raw.skills) };

      try {
        await api('/api/admin/volunteers', {
          method: 'POST',
          auth: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        manualVolunteerForm.reset();
        setActionMessage('success', 'Volunteer added.');
        showSuccessPopup('Volunteer added successfully.');
        await Promise.all([loadVolunteers(), loadOverview(), loadAnalytics()]);
      } catch (error) {
        setActionMessage('error', error.message);
      }
    });
  }

  function bindInventoryFormAction(setActionMessage) {
    const inventoryForm = document.getElementById('inventoryForm');
    if (!inventoryForm) {
      return;
    }

    inventoryForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const raw = formDataToObject(inventoryForm);

      try {
        await api('/api/admin/inventory', {
          method: 'POST',
          auth: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: raw.name,
            category: raw.category,
            quantity: Number(raw.quantity),
            location: raw.location,
            lowStockThreshold: Number(raw.lowStockThreshold)
          })
        });

        inventoryForm.reset();
        setActionMessage('success', 'Resource added.');
        showSuccessPopup('Inventory resource added successfully.');
        await Promise.all([loadInventory(), loadOverview()]);
      } catch (error) {
        setActionMessage('error', error.message);
      }
    });
  }

  function bindEmergencyMessageFormAction(setActionMessage) {
    const emergencyForm = document.getElementById('emergencyForm');
    if (!emergencyForm) {
      return;
    }

    emergencyForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const emergencyInput = document.getElementById('cmsEmergency');
      const emergencyMessage = emergencyInput ? emergencyInput.value : '';

      try {
        await api('/api/admin/cms/emergency-message', {
          method: 'PUT',
          auth: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emergencyMessage })
        });

        setActionMessage('success', 'Emergency message updated.');
        showSuccessPopup('Emergency message updated.');
        await hydrateSiteInfo();
        await loadCms();
      } catch (error) {
        setActionMessage('error', error.message);
      }
    });
  }

  function bindHotlineFormAction(setActionMessage) {
    const hotlineForm = document.getElementById('hotlineForm');
    if (!hotlineForm) {
      return;
    }

    hotlineForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const hotlinesInput = document.getElementById('cmsHotlines');
      const hotlines = splitLineValues(hotlinesInput ? hotlinesInput.value : '');

      try {
        await api('/api/admin/cms/hotlines', {
          method: 'PUT',
          auth: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hotlineNumbers: hotlines })
        });

        setActionMessage('success', 'Hotlines updated.');
        showSuccessPopup('Hotline numbers updated.');
        await hydrateSiteInfo();
        await loadCms();
      } catch (error) {
        setActionMessage('error', error.message);
      }
    });
  }

  function bindAnnouncementFormAction(setActionMessage) {
    const announcementForm = document.getElementById('announcementForm');
    if (!announcementForm) {
      return;
    }

    announcementForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const titleInput = document.getElementById('annTitle');
      const bodyInput = document.getElementById('annBody');
      const publishedInput = document.getElementById('annPublished');
      const title = titleInput ? titleInput.value : '';
      const body = bodyInput ? bodyInput.value : '';
      const published = publishedInput ? publishedInput.checked : false;

      try {
        await api('/api/admin/cms/announcements', {
          method: 'POST',
          auth: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, published })
        });

        announcementForm.reset();
        if (publishedInput) {
          publishedInput.checked = true;
        }
        setActionMessage('success', 'Announcement posted.');
        showSuccessPopup('Announcement saved.');
        await Promise.all([loadCms(), hydrateSiteInfo()]);
      } catch (error) {
        setActionMessage('error', error.message);
      }
    });
  }

  function bindHelpRequestTableActions(setActionMessage) {
    const helpRequestsWrap = document.getElementById('helpRequestsWrap');
    if (!helpRequestsWrap) {
      return;
    }

    helpRequestsWrap.addEventListener('click', async (event) => {
      const actionData = getEventAction(event);
      if (!actionData) {
        return;
      }

      const { action, id } = actionData;

      try {
        if (action === 'view-help') {
          const details = await api(`/api/admin/help-requests/${id}`, { auth: true });
          const detailsWrap = document.getElementById('helpDetailsWrap');
          if (detailsWrap) {
            detailsWrap.innerHTML = `
              <div class="card top-gap">
                <h3>Request Details</h3>
                <p><strong>Name:</strong> ${escapeHtml(details.name)}</p>
                <p><strong>Contact:</strong> ${escapeHtml(details.contact)}</p>
                <p><strong>Location:</strong> ${escapeHtml(details.location)}</p>
                <p><strong>Help Type:</strong> ${escapeHtml(details.requestType)}</p>
                <p><strong>Urgency:</strong> ${escapeHtml(details.urgency || 'medium')}</p>
                <p><strong>Status:</strong> ${escapeHtml(details.status)}</p>
                <p><strong>Description:</strong> ${escapeHtml(details.description)}</p>
              </div>
            `;
          }
          return;
        }

        if (action === 'save-status') {
          const statusSelect = document.getElementById(`help-status-${id}`);
          const status = statusSelect ? statusSelect.value : '';
          await api(`/api/admin/help-requests/${id}/status`, {
            method: 'PATCH',
            auth: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          });

          setActionMessage('success', 'Request status updated.');
          await Promise.all([loadHelpRequests(), loadOverview(), loadAnalytics(), loadVolunteers()]);
          return;
        }

        if (action === 'assign-volunteer') {
          const volunteerSelect = document.getElementById(`help-assign-${id}`);
          const volunteerId = volunteerSelect ? volunteerSelect.value : '';
          await api(`/api/admin/help-requests/${id}/assign-volunteer`, {
            method: 'PATCH',
            auth: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ volunteerId: volunteerId || null })
          });

          setActionMessage('success', 'Volunteer assignment updated.');
          await Promise.all([loadHelpRequests(), loadVolunteers(), loadOverview()]);
        }
      } catch (error) {
        setActionMessage('error', error.message);
      }
    });
  }

  function bindVolunteerTableActions(setActionMessage) {
    const volunteersWrap = document.getElementById('volunteersWrap');
    if (!volunteersWrap) {
      return;
    }

    volunteersWrap.addEventListener('click', async (event) => {
      const actionData = getEventAction(event);
      if (!actionData) {
        return;
      }

      const { action, id } = actionData;

      try {
        if (action === 'save-approval') {
          const approvalSelect = document.getElementById(`vol-approval-${id}`);
          const approvalStatus = approvalSelect ? approvalSelect.value : '';
          await api(`/api/admin/volunteers/${id}/approval`, {
            method: 'PATCH',
            auth: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approvalStatus })
          });

          setActionMessage('success', 'Volunteer approval updated.');
          await Promise.all([loadVolunteers(), loadHelpRequests(), loadOverview()]);
          return;
        }

        if (action === 'save-availability') {
          const availabilitySelect = document.getElementById(`vol-status-${id}`);
          const taskInput = document.getElementById(`vol-task-${id}`);
          const availabilityStatus = availabilitySelect ? availabilitySelect.value : '';
          const assignedTask = taskInput ? taskInput.value : '';

          await api(`/api/admin/volunteers/${id}/availability`, {
            method: 'PATCH',
            auth: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ availabilityStatus, assignedTask })
          });

          setActionMessage('success', 'Volunteer availability updated.');
          await Promise.all([loadVolunteers(), loadOverview()]);
          return;
        }

        if (action === 'remove-volunteer') {
          await api(`/api/admin/volunteers/${id}`, {
            method: 'DELETE',
            auth: true
          });

          setActionMessage('success', 'Volunteer removed.');
          await Promise.all([loadVolunteers(), loadHelpRequests(), loadOverview(), loadAnalytics()]);
        }
      } catch (error) {
        setActionMessage('error', error.message);
      }
    });
  }

  function bindInventoryTableActions(setActionMessage) {
    const inventoryWrap = document.getElementById('inventoryWrap');
    if (!inventoryWrap) {
      return;
    }

    inventoryWrap.addEventListener('click', async (event) => {
      const actionData = getEventAction(event);
      if (!actionData) {
        return;
      }

      const { action, id } = actionData;

      try {
        if (action === 'save-resource') {
          const quantityInput = document.getElementById(`inv-qty-${id}`);
          const lowStockInput = document.getElementById(`inv-low-${id}`);
          const quantity = Number(quantityInput ? quantityInput.value : 0);
          const lowStockThreshold = Number(lowStockInput ? lowStockInput.value : 0);

          await api(`/api/admin/inventory/${id}`, {
            method: 'PATCH',
            auth: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity, lowStockThreshold })
          });

          setActionMessage('success', 'Resource updated.');
          await Promise.all([loadInventory(), loadOverview()]);
          return;
        }

        if (action === 'remove-resource') {
          await api(`/api/admin/inventory/${id}`, {
            method: 'DELETE',
            auth: true
          });

          setActionMessage('success', 'Resource removed.');
          await Promise.all([loadInventory(), loadOverview()]);
        }
      } catch (error) {
        setActionMessage('error', error.message);
      }
    });
  }

  function bindAnnouncementTableActions(setActionMessage) {
    const announcementsWrap = document.getElementById('announcementsWrap');
    if (!announcementsWrap) {
      return;
    }

    announcementsWrap.addEventListener('click', async (event) => {
      const actionData = getEventAction(event);
      if (!actionData || actionData.action !== 'toggle-publish') {
        return;
      }

      const { target, id } = actionData;
      const published = target.dataset.published !== 'true';

      try {
        await api(`/api/admin/cms/announcements/${id}/publish`, {
          method: 'PATCH',
          auth: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published })
        });

        setActionMessage('success', 'Announcement publish status updated.');
        await Promise.all([loadCms(), hydrateSiteInfo()]);
      } catch (error) {
        setActionMessage('error', error.message);
      }
    });
  }

  function bindSuperAdminActions(setActionMessage) {
    const addAdminForm = document.getElementById('addAdminForm');
    if (addAdminForm) {
      addAdminForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const payload = formDataToObject(addAdminForm);

        try {
          await api('/api/admin/users', {
            method: 'POST',
            auth: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          addAdminForm.reset();
          setActionMessage('success', 'Admin user added.');
          await loadSuperAdminData();
        } catch (error) {
          setActionMessage('error', error.message);
        }
      });
    }

    const adminUsersWrap = document.getElementById('adminUsersWrap');
    if (!adminUsersWrap) {
      return;
    }

    adminUsersWrap.addEventListener('click', async (event) => {
      const actionData = getEventAction(event);
      if (!actionData) {
        return;
      }

      const { action, id } = actionData;

      try {
        if (action === 'update-admin-role') {
          const roleSelect = document.getElementById(`admin-role-${id}`);
          const role = roleSelect ? roleSelect.value : 'admin';
          await api(`/api/admin/users/${id}/role`, {
            method: 'PATCH',
            auth: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
          });

          setActionMessage('success', 'Admin role updated.');
          await loadSuperAdminData();
          return;
        }

        if (action === 'remove-admin') {
          await api(`/api/admin/users/${id}`, {
            method: 'DELETE',
            auth: true
          });

          setActionMessage('success', 'Admin user removed.');
          await loadSuperAdminData();
        }
      } catch (error) {
        setActionMessage('error', error.message);
      }
    });
  }

  async function refreshAdminDashboard(user) {
    try {
      await Promise.all([loadOverview(), loadVolunteers(), loadInventory(), loadCms(), loadAnalytics()]);
      await loadHelpRequests();

      if (user.role === 'super-admin') {
        await loadSuperAdminData();
      }
    } catch (error) {
      if (error.statusCode === 401) {
        clearAdminSession();
        updateAdminEntry();
        renderLogin('Session expired. Please login again.');
        return;
      }

      const actionMessage = document.getElementById('adminActionMessage');
      if (actionMessage) {
        actionMessage.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
      }
    }
  }

  // Admin dashboard render helpers keep load* functions focused on data fetching.
  // Admin data loaders: fetch from API, then delegate to focused render helpers.
  async function loadOverview() {
    const data = await api('/api/admin/overview', { auth: true });
    const target = document.getElementById('overviewCards');
    if (!target) {
      return;
    }

    target.innerHTML = renderOverviewCards(data);
  }

  async function loadHelpRequests() {
    const statusInput = document.getElementById('helpFilterStatus');
    const urgencyInput = document.getElementById('helpFilterUrgency');
    const status = statusInput ? statusInput.value : '';
    const urgency = urgencyInput ? urgencyInput.value : '';
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (urgency) query.set('urgency', urgency);
    const endpoint = `/api/admin/help-requests${query.toString() ? `?${query.toString()}` : ''}`;

    appState.helpRequests = await api(endpoint, { auth: true });
    renderHelpRequestsTable();
  }

  function renderHelpRequestsTable() {
    const wrap = document.getElementById('helpRequestsWrap');
    if (!wrap) {
      return;
    }

    if (!appState.helpRequests.length) {
      wrap.innerHTML = renderSubtleMessage('No help requests found.');
      return;
    }

    const volunteerOptions = getApprovedVolunteerOptions(appState.adminVolunteers);

    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Location</th>
            <th>Type</th>
            <th>Urgency</th>
            <th>Status</th>
            <th>Assigned Volunteer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${appState.helpRequests
            .map((item) => renderHelpRequestRow(item, volunteerOptions))
            .join('')}
        </tbody>
      </table>
    `;

    appState.helpRequests.forEach((item) => {
      const select = document.getElementById(`help-assign-${item._id}`);
      if (select) {
        select.value = getAssignedVolunteerId(item);
      }
    });
  }

  async function loadVolunteers() {
    appState.adminVolunteers = await api('/api/admin/volunteers', { auth: true });

    const wrap = document.getElementById('volunteersWrap');
    if (!wrap) {
      return;
    }

    if (!appState.adminVolunteers.length) {
      wrap.innerHTML = renderSubtleMessage('No volunteers available.');
      return;
    }

    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Skills</th>
            <th>Availability</th>
            <th>Assigned Task</th>
            <th>Approval</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${appState.adminVolunteers
            .map((item) => renderVolunteerRow(item))
            .join('')}
        </tbody>
      </table>
    `;
  }

  async function loadInventory() {
    appState.inventoryItems = await api('/api/admin/inventory', { auth: true });
    const wrap = document.getElementById('inventoryWrap');
    if (!wrap) {
      return;
    }

    if (!appState.inventoryItems.length) {
      wrap.innerHTML = renderSubtleMessage('No inventory items found.');
      return;
    }

    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Resource name</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Location</th>
            <th>Low stock threshold</th>
            <th>Last updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${appState.inventoryItems
            .map((item) => renderInventoryRow(item))
            .join('')}
        </tbody>
      </table>
    `;
  }

  async function loadCms() {
    appState.cmsData = await api('/api/admin/cms', { auth: true });
    const cms = appState.cmsData;

    const emergencyInput = document.getElementById('cmsEmergency');
    const hotlinesInput = document.getElementById('cmsHotlines');

    if (emergencyInput) {
      emergencyInput.value = cms.emergencyMessage || '';
    }

    if (hotlinesInput) {
      hotlinesInput.value = (cms.hotlineNumbers || []).join('\n');
    }

    const announcementsWrap = document.getElementById('announcementsWrap');
    const announcements = (cms.announcements || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (!announcementsWrap) {
      return;
    }

    announcementsWrap.innerHTML = announcements.length
      ? `
      <h3>Announcements</h3>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${announcements
              .map((item) => renderAnnouncementRow(item))
              .join('')}
          </tbody>
        </table>
      </div>
    `
      : renderSubtleMessage('No announcements created yet.');
  }

  async function loadAnalytics() {
    const data = await api('/api/admin/analytics', { auth: true });
    const summary = document.getElementById('analyticsSummary');
    const charts = document.getElementById('analyticsCharts');
    if (!summary || !charts) {
      return;
    }

    summary.innerHTML = `
      <article class="card"><p class="subtle">Total Volunteer Signups</p><p class="status-value">${escapeHtml(data.totalSignups)}</p></article>
      <article class="card"><p class="subtle">Total Help Requests</p><p class="status-value">${escapeHtml(data.totalHelpRequests)}</p></article>
      <article class="card"><p class="subtle">Most Requested Help Type</p><p class="status-value">${escapeHtml(data.mostRequestedHelpType.type)}</p><p class="subtle">Count: ${escapeHtml(data.mostRequestedHelpType.count)}</p></article>
    `;

    const urgency = data.requestsByUrgency || { high: 0, medium: 0, low: 0 };
    const resolution = data.resolvedVsUnresolved || { resolved: 0, unresolved: 0 };
    const maxUrgency = Math.max(urgency.high, urgency.medium, urgency.low, 1);
    const maxResolution = Math.max(resolution.resolved, resolution.unresolved, 1);

    charts.innerHTML = `
      <article class="card">
        <h3>Requests by Urgency</h3>
        ${renderChartRow('High', urgency.high, maxUrgency)}
        ${renderChartRow('Medium', urgency.medium, maxUrgency)}
        ${renderChartRow('Low', urgency.low, maxUrgency)}
      </article>
      <article class="card">
        <h3>Resolved vs Unresolved</h3>
        ${renderChartRow('Resolved', resolution.resolved, maxResolution)}
        ${renderChartRow('Unresolved', resolution.unresolved, maxResolution)}
      </article>
    `;
  }

  async function loadSuperAdminData() {
    appState.adminUsers = await api('/api/admin/users', { auth: true });
    appState.activityLogs = await api('/api/admin/activity-logs?limit=20', { auth: true });

    const usersWrap = document.getElementById('adminUsersWrap');
    const logsWrap = document.getElementById('activityLogWrap');
    if (!usersWrap || !logsWrap) {
      return;
    }

    usersWrap.innerHTML = appState.adminUsers.length
      ? `
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
            ${appState.adminUsers
              .map((userItem) => renderAdminUserRow(userItem))
              .join('')}
          </tbody>
        </table>
    `
      : renderSubtleMessage('No admin users found.');

    logsWrap.innerHTML = appState.activityLogs.length
      ? `
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
          </thead>
          <tbody>
            ${appState.activityLogs
              .map((log) => renderActivityLogRow(log))
              .join('')}
          </tbody>
        </table>
    `
      : renderSubtleMessage('No activity entries available.');
  }

  validateExistingSession();
}

renderBase();

const pageMap = {
  home: renderHome,
  alerts: renderAlerts,
  map: renderMap,
  shelters: renderShelters,
  'request-help': renderRequestHelp,
  volunteer: renderVolunteer,
  donations: renderDonations,
  resources: renderResources,
  updates: renderUpdates,
  admin: renderAdmin
};

const pageRenderer = pageMap[page] || renderHome;
pageRenderer();

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeSuccessPopup();
  }
});
})();
