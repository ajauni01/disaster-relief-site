(function () {
  const app = document.getElementById('app');
  const page = document.body.dataset.page || 'home';
  const defaultApiBase =
    window.location.port === '3000'
      ? ''
      : `${window.location.protocol === 'file:' ? 'http:' : window.location.protocol}//${window.location.hostname || 'localhost'}:3000`;
  const API_BASE = window.__API_BASE__ || defaultApiBase;

  const STORAGE_KEYS = {
    adminToken: 'wrh_admin_token',
    adminUser: 'wrh_admin_user'
  };

  const appState = {
    siteInfo: null,
    adminUser: null,
    adminVolunteers: [],
    helpRequests: [],
    inventoryItems: [],
    cmsData: null,
    adminUsers: [],
    activityLogs: []
  };

  let successTimer = null;

  const navItems = [
    { key: 'home', label: 'Home', href: 'index.html' },
    { key: 'alerts', label: 'Alerts', href: 'alerts.html' },
    { key: 'map', label: 'Map', href: 'map.html' },
    { key: 'shelters', label: 'Shelters', href: 'shelters.html' },
    { key: 'request-help', label: 'Request Help', href: 'request-help.html' },
    { key: 'volunteer', label: 'Volunteer', href: 'volunteer.html' },
    { key: 'donations', label: 'Donations', href: 'donations.html' },
    { key: 'resources', label: 'Resources', href: 'resources.html' },
    { key: 'updates', label: 'Updates', href: 'updates.html' }
  ];

  const pageTitle = {
    alerts: 'Active Alerts',
    map: 'Live Map',
    shelters: 'Shelters',
    'request-help': 'Request Help',
    volunteer: 'Volunteer Signup',
    donations: 'Donations',
    resources: 'Preparedness Resources',
    updates: 'Community Updates',
    admin: 'Admin Portal'
  };

  const severityClass = {
    extreme: 'severity-extreme',
    high: 'severity-high',
    moderate: 'severity-moderate',
    info: 'severity-info'
  };

  const statusClass = {
    good: 'status-good',
    warning: 'status-warning',
    critical: 'status-critical',
    info: 'status-info'
  };

  function getAdminToken() {
    return localStorage.getItem(STORAGE_KEYS.adminToken) || '';
  }

  function setAdminSession(token, user) {
    localStorage.setItem(STORAGE_KEYS.adminToken, token);
    localStorage.setItem(STORAGE_KEYS.adminUser, JSON.stringify(user));
    appState.adminUser = user;
  }

  function clearAdminSession() {
    localStorage.removeItem(STORAGE_KEYS.adminToken);
    localStorage.removeItem(STORAGE_KEYS.adminUser);
    appState.adminUser = null;
  }

  function loadAdminUserFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEYS.adminUser);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function buildApiUrl(path) {
    if (/^https?:\/\//.test(path)) {
      return path;
    }
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return API_BASE ? `${API_BASE}${normalized}` : normalized;
  }

  async function api(path, options) {
    const opts = options || {};
    const auth = opts.auth === true;
    const method = opts.method || 'GET';
    const headers = { ...(opts.headers || {}) };

    if (auth) {
      const token = getAdminToken();
      if (!token) {
        const authError = new Error('Admin authentication required');
        authError.statusCode = 401;
        throw authError;
      }
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(buildApiUrl(path), {
      method,
      headers,
      body: opts.body
    });

    const raw = await response.text();
    let payload = {};

    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch (error) {
        payload = {};
      }
    }

    if (!response.ok) {
      const message = payload.message || `Request failed (${response.status})`;
      const requestError = new Error(message);
      requestError.statusCode = response.status;
      throw requestError;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'success') && !payload.success) {
      throw new Error(payload.message || 'Request failed');
    }

    return Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function toLocalDate(isoDate) {
    if (!isoDate) {
      return '-';
    }
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return date.toLocaleString();
  }

  function renderBase() {
    app.innerHTML = `
      <div class="page-shell">
        <header class="site-header">
          <div class="emergency-strip" id="emergencyStripText">Emergency? Call 911</div>
          <div class="container header-row">
            <a class="brand" href="index.html" aria-label="Wayne Relief Hub home">
              <span class="brand-badge">W</span>
              <span>Wayne Relief Hub</span>
            </a>
            <nav class="site-nav" id="siteNav"></nav>
            <div class="header-actions">
              <a id="adminEntry" class="admin-entry" href="admin.html">Admin Login</a>
              <button class="nav-toggle" id="menuToggle" aria-label="Toggle navigation">☰</button>
            </div>
          </div>
        </header>
        <main id="pageContent"></main>
        <section class="section section-muted faq-section" aria-labelledby="faqHeading">
          <div class="container">
            <h2 id="faqHeading">Frequently Asked Questions</h2>
            <div class="faq-list" id="faqList">
              <article class="faq-item">
                <button class="faq-question" type="button" aria-expanded="false">
                  How do I request emergency help?
                  <span class="faq-icon">+</span>
                </button>
                <div class="faq-answer" hidden>
                  Go to the Request Help page, fill in your contact and need details, then submit. A response team can review it from the admin dashboard.
                </div>
              </article>
              <article class="faq-item">
                <button class="faq-question" type="button" aria-expanded="false">
                  Where can I find open shelters?
                  <span class="faq-icon">+</span>
                </button>
                <div class="faq-answer" hidden>
                  Open the Shelters page to see available locations and occupancy. The map page also lists open shelter markers.
                </div>
              </article>
              <article class="faq-item">
                <button class="faq-question" type="button" aria-expanded="false">
                  How can I sign up as a volunteer?
                  <span class="faq-icon">+</span>
                </button>
                <div class="faq-answer" hidden>
                  Use the Volunteer form with your skills, availability, and location. Admins can review and approve volunteer submissions.
                </div>
              </article>
              <article class="faq-item">
                <button class="faq-question" type="button" aria-expanded="false">
                  Is this information updated in real time?
                  <span class="faq-icon">+</span>
                </button>
                <div class="faq-answer" hidden>
                  Alerts, requests, volunteers, and inventory are served from the backend database and update as records change.
                </div>
              </article>
            </div>
          </div>
        </section>
        <footer class="site-footer">
          <div class="container footer-grid">
            <div>
              <h3>Wayne Disaster Relief</h3>
              <p>Wayne, Nebraska</p>
            </div>
            <div>
              <h4>Navigation</h4>
              <a href="alerts.html">Active Alerts</a><br />
              <a href="map.html">Live Map</a><br />
              <a href="shelters.html">Find Shelter</a><br />
              <a href="volunteer.html">Volunteer</a>
            </div>
            <div>
              <h4>Resources</h4>
              <a href="resources.html">Preparedness</a><br />
              <a href="updates.html">Updates</a><br />
              <a href="donations.html">Donate</a>
            </div>
            <div>
              <h4>Emergency Hotlines</h4>
              <div id="hotlineList">
                <p><strong>911</strong></p>
                <p class="subtle-light">(402) 375-2660</p>
              </div>
            </div>
          </div>
          <div class="container footer-meta">
            &copy; 2026 Wayne Disaster Relief Hub. All rights reserved. <a href="admin.html">Admin</a>
          </div>
        </footer>
        <div id="successModal" class="modal-backdrop" hidden>
          <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="successTitle">
            <h3 id="successTitle">Submission Successful</h3>
            <p id="successMessage">Your form was submitted.</p>
            <button id="successClose" class="button button-primary" type="button">Close</button>
          </div>
        </div>
      </div>
    `;

    const nav = document.getElementById('siteNav');
    nav.innerHTML = navItems
      .map((item) => {
        const isActive = item.key === page ? 'active' : '';
        return `<a class="${isActive}" href="${item.href}">${item.label}</a>`;
      })
      .join('');

    const menuToggle = document.getElementById('menuToggle');
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });

    const modal = document.getElementById('successModal');
    const closeButton = document.getElementById('successClose');
    closeButton.addEventListener('click', closeSuccessPopup);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeSuccessPopup();
      }
    });

    const faqButtons = document.querySelectorAll('.faq-question');
    faqButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const answer = button.nextElementSibling;
        const isOpen = button.getAttribute('aria-expanded') === 'true';

        faqButtons.forEach((btn) => {
          btn.setAttribute('aria-expanded', 'false');
          const sibling = btn.nextElementSibling;
          if (sibling) {
            sibling.hidden = true;
          }
        });

        if (!isOpen && answer) {
          button.setAttribute('aria-expanded', 'true');
          answer.hidden = false;
        }
      });
    });

    updateAdminEntry();
    hydrateSiteInfo();
  }

  function updateAdminEntry() {
    const adminLink = document.getElementById('adminEntry');
    if (!adminLink) {
      return;
    }

    const hasToken = Boolean(getAdminToken());
    const user = appState.adminUser || loadAdminUserFromStorage();

    if (user && hasToken) {
      adminLink.textContent = 'Admin Dashboard';
      adminLink.classList.add('logged-in');
    } else {
      adminLink.textContent = 'Admin Login';
      adminLink.classList.remove('logged-in');
    }

    adminLink.href = 'admin.html';
  }

  async function hydrateSiteInfo() {
    try {
      const data = await api('/api/site-info');
      appState.siteInfo = data;

      const emergencyStrip = document.getElementById('emergencyStripText');
      if (emergencyStrip && data.emergencyMessage) {
        emergencyStrip.textContent = data.emergencyMessage;
      }

      const hotlineList = document.getElementById('hotlineList');
      if (hotlineList && Array.isArray(data.hotlineNumbers) && data.hotlineNumbers.length) {
        hotlineList.innerHTML = data.hotlineNumbers
          .map((line, index) => {
            if (index === 0) {
              return `<p><strong>${escapeHtml(line)}</strong></p>`;
            }
            return `<p class="subtle-light">${escapeHtml(line)}</p>`;
          })
          .join('');
      }

      const announcementList = document.getElementById('publicAnnouncementList');
      if (announcementList && Array.isArray(data.announcements) && data.announcements.length) {
        announcementList.innerHTML = data.announcements
          .slice(0, 3)
          .map(
            (announcement) => `
            <article class="feed-item">
              <div class="feed-meta">
                <span class="tag">Announcement</span>
                <span class="subtle">${toLocalDate(announcement.createdAt)}</span>
              </div>
              <h3>${escapeHtml(announcement.title)}</h3>
              <p>${escapeHtml(announcement.body)}</p>
            </article>
          `
          )
          .join('');
      } else if (announcementList) {
        announcementList.innerHTML = '<p class="subtle">No public announcements at this time.</p>';
      }
    } catch (error) {
      // Silently fallback to static defaults on public pages.
    }
  }

  function showSuccessPopup(message) {
    const modal = document.getElementById('successModal');
    const text = document.getElementById('successMessage');
    text.textContent = message;
    modal.hidden = false;

    if (successTimer) {
      clearTimeout(successTimer);
    }
    successTimer = setTimeout(() => {
      closeSuccessPopup();
    }, 2200);
  }

  function closeSuccessPopup() {
    const modal = document.getElementById('successModal');
    if (modal) {
      modal.hidden = true;
    }
    if (successTimer) {
      clearTimeout(successTimer);
      successTimer = null;
    }
  }

  function renderSectionIntro(introText) {
    return `
      <section class="section">
        <div class="container">
          <h1 class="page-title">${escapeHtml(pageTitle[page] || 'Wayne Relief Hub')}</h1>
          <p class="page-intro">${escapeHtml(introText)}</p>
        </div>
      </section>
    `;
  }

  function setContent(html) {
    const target = document.getElementById('pageContent');
    target.innerHTML = html;
  }

  async function renderHome() {
    setContent(`
      <section class="hero">
        <div class="container">
          <h1>Wayne Disaster Relief Hub</h1>
          <p>Real-time alerts, shelters, road closures, and community support all in one place.</p>
          <div class="cta-grid">
            <a href="shelters.html" class="cta-card">Find Shelter <span>-></span></a>
            <a href="request-help.html" class="cta-card">Request Help <span>-></span></a>
            <a href="volunteer.html" class="cta-card">Volunteer <span>-></span></a>
            <a href="map.html" class="cta-card">View Live Map <span>-></span></a>
          </div>
        </div>
      </section>

      <section class="section" id="activeAlertSection"></section>

      <section class="section section-muted">
        <div class="container">
          <h2>Community Status</h2>
          <div id="statusGrid" class="card-grid"></div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <h2>Get Help Right Now</h2>
          <div class="help-grid">
            <a class="help-shortcut help-food" href="request-help.html"><h3>I need food</h3><p class="subtle">Immediate assistance</p></a>
            <a class="help-shortcut help-transport" href="request-help.html"><h3>I need transportation</h3><p class="subtle">Immediate assistance</p></a>
            <a class="help-shortcut help-medical" href="request-help.html"><h3>I need medical help</h3><p class="subtle">Immediate assistance</p></a>
          </div>
        </div>
      </section>

      <section class="section section-muted">
        <div class="container">
          <h2>Right Now</h2>
          <div id="updatesList" class="list-stack"></div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <h2>Public Announcements</h2>
          <div id="publicAnnouncementList" class="list-stack">
            <p class="subtle">Loading announcements...</p>
          </div>
        </div>
      </section>

      <section class="cta-band">
        <div class="container">
          <h2>Help Us Help Wayne</h2>
          <p>Your contribution supports emergency response, shelters, and community recovery.</p>
          <a href="donations.html" class="button button-light">Make a Donation</a>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <h2>Preparedness Resources</h2>
          <div id="resourceGrid" class="grid-4"></div>
        </div>
      </section>
    `);

    try {
      const data = await api('/api/dashboard');

      const alertSection = document.getElementById('activeAlertSection');
      if (data.activeAlert) {
        const severity = severityClass[data.activeAlert.severity] || severityClass.info;
        alertSection.innerHTML = `
          <div class="container">
            <div class="alert-banner">
              <div>
                <span class="alert-pill ${severity}">${escapeHtml(data.activeAlert.severity)}</span>
                <h2>${escapeHtml(data.activeAlert.type)}</h2>
                <p class="subtle">Issued ${escapeHtml(data.activeAlert.issuedTime)} | Valid until ${escapeHtml(data.activeAlert.validUntil)}</p>
              </div>
              <a href="alerts.html" class="button button-primary">View Details</a>
            </div>
          </div>
        `;
      }

      const statusGrid = document.getElementById('statusGrid');
      statusGrid.innerHTML = data.statusTiles
        .map((tile) => {
          const stateClass = statusClass[tile.status] || 'status-info';
          return `
            <article class="card">
              <p class="subtle">${escapeHtml(tile.label)}</p>
              <p class="status-value ${stateClass}">${escapeHtml(tile.value)}</p>
            </article>
          `;
        })
        .join('');

      const updatesList = document.getElementById('updatesList');
      updatesList.innerHTML = data.updates
        .slice(0, 4)
        .map(
          (item) => `
          <article class="feed-item">
            <div class="feed-meta">
              <span class="tag">${escapeHtml(item.category)}</span>
              <span class="subtle">${escapeHtml(item.timestampLabel)}</span>
            </div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.snippet)}</p>
          </article>
        `
        )
        .join('');

      const resourceGrid = document.getElementById('resourceGrid');
      resourceGrid.innerHTML = data.resources
        .slice(0, 4)
        .map(
          (resource) => `
          <article class="card">
            <h3>${escapeHtml(resource.title)}</h3>
            <p class="subtle">${escapeHtml(resource.description)}</p>
          </article>
        `
        )
        .join('');

      await hydrateSiteInfo();
    } catch (error) {
      const target = document.getElementById('updatesList');
      target.innerHTML = `<div class="error">Unable to load dashboard data: ${escapeHtml(error.message)}</div>`;
    }
  }

  async function renderAlerts() {
    setContent(`
      ${renderSectionIntro('Monitor all active and recent emergency alerts for Wayne.')}
      <section class="section section-muted">
        <div class="container">
          <div id="alertsList" class="list-stack"></div>
        </div>
      </section>
    `);

    try {
      const alerts = await api('/api/alerts');
      document.getElementById('alertsList').innerHTML = alerts
        .map((alert) => {
          const severity = severityClass[alert.severity] || severityClass.info;
          return `
            <article class="card">
              <span class="alert-pill ${severity}">${escapeHtml(alert.severity)}</span>
              <h3>${escapeHtml(alert.type)}</h3>
              <p class="subtle">Issued ${escapeHtml(alert.issuedTime)} | Valid until ${escapeHtml(alert.validUntil)}</p>
              <p>Status: <strong>${escapeHtml(alert.status)}</strong></p>
            </article>
          `;
        })
        .join('');
    } catch (error) {
      document.getElementById('alertsList').innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
    }
  }

  async function renderMap() {
    setContent(`
      ${renderSectionIntro('Map integration can be connected to GIS or Google Maps APIs. Open shelters are listed below.')}
      <section class="section section-muted">
        <div class="container">
          <div class="placeholder">
            <h3>Live Map Placeholder</h3>
            <p>Attach a map provider and plot shelters, closures, and incidents in real time.</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <h2>Open Shelter Markers</h2>
          <div id="mapShelters" class="list-stack"></div>
        </div>
      </section>
    `);

    try {
      const shelters = await api('/api/shelters?openOnly=true');
      document.getElementById('mapShelters').innerHTML = shelters
        .map(
          (shelter) => `
          <article class="card">
            <h3>${escapeHtml(shelter.name)}</h3>
            <p>${escapeHtml(shelter.address)}</p>
            <p class="subtle">Capacity ${escapeHtml(shelter.occupancy)} / ${escapeHtml(shelter.capacity)}</p>
          </article>
        `
        )
        .join('');
    } catch (error) {
      document.getElementById('mapShelters').innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
    }
  }

  async function renderShelters() {
    setContent(`
      ${renderSectionIntro('Find available shelters with current occupancy estimates.')}
      <section class="section section-muted">
        <div class="container">
          <div id="shelterList" class="card-grid"></div>
        </div>
      </section>
    `);

    try {
      const shelters = await api('/api/shelters');
      document.getElementById('shelterList').innerHTML = shelters
        .map((shelter) => {
          const isOpenText = shelter.isOpen ? 'Open' : 'Closed';
          return `
            <article class="card">
              <h3>${escapeHtml(shelter.name)}</h3>
              <p>${escapeHtml(shelter.address)}</p>
              <p class="subtle">Status: ${escapeHtml(isOpenText)}</p>
              <p><strong>${escapeHtml(shelter.occupancy)} / ${escapeHtml(shelter.capacity)}</strong> occupied</p>
            </article>
          `;
        })
        .join('');
    } catch (error) {
      document.getElementById('shelterList').innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
    }
  }

  function attachFormHandler(formId, endpoint, transform) {
    const form = document.getElementById(formId);
    const result = document.getElementById('formResult');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      result.innerHTML = '';

      const formData = new FormData(form);
      const raw = Object.fromEntries(formData.entries());
      const payload = transform(raw);

      try {
        await api(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        form.reset();
        result.innerHTML = '<div class="success">Submission received successfully.</div>';
        showSuccessPopup('Your form was submitted successfully. Our team has received your request.');
      } catch (error) {
        result.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
      }
    });
  }

  function renderRequestHelp() {
    setContent(`
      ${renderSectionIntro('Submit immediate needs to local response teams.')}
      <section class="section section-muted">
        <div class="container">
          <div class="form-card">
            <form id="helpForm" class="form-grid">
              <div>
                <label for="helpName">Name</label>
                <input id="helpName" name="name" required />
              </div>
              <div>
                <label for="helpLocation">Location</label>
                <input id="helpLocation" name="location" required />
              </div>
              <div>
                <label for="helpContact">Best Contact</label>
                <input id="helpContact" name="contact" required />
              </div>
              <div>
                <label for="helpType">Type of Help</label>
                <select id="helpType" name="requestType" required>
                  <option value="food">Food</option>
                  <option value="transportation">Transportation</option>
                  <option value="medical">Medical</option>
                  <option value="shelter">Shelter</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label for="helpUrgency">Urgency</label>
                <select id="helpUrgency" name="urgency" required>
                  <option value="high">High</option>
                  <option value="medium" selected>Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label for="helpDescription">Description</label>
                <textarea id="helpDescription" name="description" required></textarea>
              </div>
              <button type="submit" class="button button-primary">Submit Request</button>
            </form>
            <div id="formResult"></div>
          </div>
        </div>
      </section>
    `);

    attachFormHandler('helpForm', '/api/help-requests', (raw) => raw);
  }

  function renderVolunteer() {
    setContent(`
      ${renderSectionIntro('Join response efforts by registering your skills and availability.')}
      <section class="section section-muted">
        <div class="container">
          <div class="form-card">
            <form id="volunteerForm" class="form-grid">
              <div>
                <label for="volName">Name</label>
                <input id="volName" name="name" required />
              </div>
              <div>
                <label for="volEmail">Email</label>
                <input id="volEmail" name="email" type="email" required />
              </div>
              <div>
                <label for="volPhone">Phone</label>
                <input id="volPhone" name="phone" required />
              </div>
              <div>
                <label for="volSkills">Skills (comma separated)</label>
                <input id="volSkills" name="skills" placeholder="Medical, Logistics, Driving" />
              </div>
              <div>
                <label for="volAvailability">Availability</label>
                <input id="volAvailability" name="availability" placeholder="Weeknights, Weekends" required />
              </div>
              <div>
                <label for="volLocation">Location</label>
                <input id="volLocation" name="location" required />
              </div>
              <button type="submit" class="button button-primary">Register as Volunteer</button>
            </form>
            <div id="formResult"></div>
          </div>
        </div>
      </section>
    `);

    attachFormHandler('volunteerForm', '/api/volunteers', (raw) => {
      const skills = raw.skills
        ? raw.skills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean)
        : [];

      return { ...raw, skills };
    });
  }

  function renderDonations() {
    setContent(`
      ${renderSectionIntro('Donate to support shelters, emergency supplies, and recovery operations.')}
      <section class="section section-muted">
        <div class="container">
          <div class="form-card">
            <form id="donationForm" class="form-grid">
              <div>
                <label for="donName">Name</label>
                <input id="donName" name="name" required />
              </div>
              <div>
                <label for="donEmail">Email</label>
                <input id="donEmail" name="email" type="email" required />
              </div>
              <div>
                <label for="donAmount">Amount (USD)</label>
                <input id="donAmount" name="amount" type="number" min="1" step="0.01" required />
              </div>
              <div>
                <label for="donMessage">Message (optional)</label>
                <textarea id="donMessage" name="message"></textarea>
              </div>
              <button type="submit" class="button button-primary">Submit Donation Intent</button>
            </form>
            <div id="formResult"></div>
          </div>
        </div>
      </section>
    `);

    attachFormHandler('donationForm', '/api/donations', (raw) => ({ ...raw, amount: Number(raw.amount) }));
  }

  async function renderResources() {
    setContent(`
      ${renderSectionIntro('Review preparedness guides to keep your household ready.')}
      <section class="section section-muted">
        <div class="container">
          <div id="resourceList" class="card-grid"></div>
        </div>
      </section>
    `);

    try {
      const resources = await api('/api/resources');
      document.getElementById('resourceList').innerHTML = resources
        .map(
          (resource) => `
          <article class="card">
            <h3>${escapeHtml(resource.title)}</h3>
            <p>${escapeHtml(resource.description)}</p>
            <p class="subtle">Type: ${escapeHtml(resource.type)}</p>
          </article>
        `
        )
        .join('');
    } catch (error) {
      document.getElementById('resourceList').innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
    }
  }

  async function renderUpdates() {
    setContent(`
      ${renderSectionIntro('Latest operations, closures, and assistance activity.')}
      <section class="section section-muted">
        <div class="container">
          <div id="updatesPageList" class="list-stack"></div>
        </div>
      </section>
    `);

    try {
      const updates = await api('/api/updates');
      document.getElementById('updatesPageList').innerHTML = updates
        .map(
          (item) => `
          <article class="feed-item">
            <div class="feed-meta">
              <span class="tag">${escapeHtml(item.category)}</span>
              <span class="subtle">${escapeHtml(item.timestampLabel)}</span>
            </div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.snippet)}</p>
          </article>
        `
        )
        .join('');
    } catch (error) {
      document.getElementById('updatesPageList').innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
    }
  }

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

        const formData = new FormData(loginForm);
        const payload = Object.fromEntries(formData.entries());

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

    function bindAdminActions(user) {
      const actionMessage = document.getElementById('adminActionMessage');

      function setActionMessage(kind, message) {
        if (!actionMessage) {
          return;
        }
        actionMessage.innerHTML = `<div class="${kind}">${escapeHtml(message)}</div>`;
      }

      const logoutButton = document.getElementById('adminLogout');
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

      const applyFilters = document.getElementById('applyHelpFilters');
      applyFilters.addEventListener('click', async () => {
        await loadHelpRequests();
      });

      const manualVolunteerForm = document.getElementById('manualVolunteerForm');
      manualVolunteerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(manualVolunteerForm);
        const raw = Object.fromEntries(formData.entries());

        const payload = {
          ...raw,
          skills: raw.skills
            ? raw.skills
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
            : []
        };

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

      const inventoryForm = document.getElementById('inventoryForm');
      inventoryForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(inventoryForm);
        const raw = Object.fromEntries(formData.entries());

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

      const emergencyForm = document.getElementById('emergencyForm');
      emergencyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const emergencyMessage = document.getElementById('cmsEmergency').value;

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

      const hotlineForm = document.getElementById('hotlineForm');
      hotlineForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const hotlines = document
          .getElementById('cmsHotlines')
          .value.split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

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

      const announcementForm = document.getElementById('announcementForm');
      announcementForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const title = document.getElementById('annTitle').value;
        const body = document.getElementById('annBody').value;
        const published = document.getElementById('annPublished').checked;

        try {
          await api('/api/admin/cms/announcements', {
            method: 'POST',
            auth: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body, published })
          });

          announcementForm.reset();
          document.getElementById('annPublished').checked = true;
          setActionMessage('success', 'Announcement posted.');
          showSuccessPopup('Announcement saved.');
          await Promise.all([loadCms(), hydrateSiteInfo()]);
        } catch (error) {
          setActionMessage('error', error.message);
        }
      });

      const helpRequestsWrap = document.getElementById('helpRequestsWrap');
      helpRequestsWrap.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }

        const action = target.dataset.action;
        const id = target.dataset.id;
        if (!action || !id) {
          return;
        }

        try {
          if (action === 'view-help') {
            const details = await api(`/api/admin/help-requests/${id}`, { auth: true });
            const detailsWrap = document.getElementById('helpDetailsWrap');
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

          if (action === 'save-status') {
            const status = document.getElementById(`help-status-${id}`).value;
            await api(`/api/admin/help-requests/${id}/status`, {
              method: 'PATCH',
              auth: true,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status })
            });

            setActionMessage('success', 'Request status updated.');
            await Promise.all([loadHelpRequests(), loadOverview(), loadAnalytics(), loadVolunteers()]);
          }

          if (action === 'assign-volunteer') {
            const volunteerId = document.getElementById(`help-assign-${id}`).value;
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

      const volunteersWrap = document.getElementById('volunteersWrap');
      volunteersWrap.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }

        const action = target.dataset.action;
        const id = target.dataset.id;
        if (!action || !id) {
          return;
        }

        try {
          if (action === 'save-approval') {
            const approvalStatus = document.getElementById(`vol-approval-${id}`).value;
            await api(`/api/admin/volunteers/${id}/approval`, {
              method: 'PATCH',
              auth: true,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ approvalStatus })
            });
            setActionMessage('success', 'Volunteer approval updated.');
            await Promise.all([loadVolunteers(), loadHelpRequests(), loadOverview()]);
          }

          if (action === 'save-availability') {
            const availabilityStatus = document.getElementById(`vol-status-${id}`).value;
            const assignedTask = document.getElementById(`vol-task-${id}`).value;
            await api(`/api/admin/volunteers/${id}/availability`, {
              method: 'PATCH',
              auth: true,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ availabilityStatus, assignedTask })
            });
            setActionMessage('success', 'Volunteer availability updated.');
            await Promise.all([loadVolunteers(), loadOverview()]);
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

      const inventoryWrap = document.getElementById('inventoryWrap');
      inventoryWrap.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }

        const action = target.dataset.action;
        const id = target.dataset.id;
        if (!action || !id) {
          return;
        }

        try {
          if (action === 'save-resource') {
            const quantity = Number(document.getElementById(`inv-qty-${id}`).value);
            const lowStockThreshold = Number(document.getElementById(`inv-low-${id}`).value);
            await api(`/api/admin/inventory/${id}`, {
              method: 'PATCH',
              auth: true,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quantity, lowStockThreshold })
            });
            setActionMessage('success', 'Resource updated.');
            await Promise.all([loadInventory(), loadOverview()]);
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

      const announcementsWrap = document.getElementById('announcementsWrap');
      announcementsWrap.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }

        const action = target.dataset.action;
        const id = target.dataset.id;
        if (action !== 'toggle-publish' || !id) {
          return;
        }

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

      if (user.role === 'super-admin') {
        const addAdminForm = document.getElementById('addAdminForm');
        addAdminForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const payload = Object.fromEntries(new FormData(addAdminForm).entries());

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

        const adminUsersWrap = document.getElementById('adminUsersWrap');
        adminUsersWrap.addEventListener('click', async (event) => {
          const target = event.target;
          if (!(target instanceof HTMLElement)) {
            return;
          }

          const action = target.dataset.action;
          const id = target.dataset.id;
          if (!action || !id) {
            return;
          }

          try {
            if (action === 'update-admin-role') {
              const role = document.getElementById(`admin-role-${id}`).value;
              await api(`/api/admin/users/${id}/role`, {
                method: 'PATCH',
                auth: true,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
              });
              setActionMessage('success', 'Admin role updated.');
              await loadSuperAdminData();
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

    async function loadOverview() {
      const data = await api('/api/admin/overview', { auth: true });
      const target = document.getElementById('overviewCards');
      target.innerHTML = `
        <article class="card"><p class="subtle">Total Help Requests</p><p class="status-value">${escapeHtml(data.totalHelpRequests)}</p></article>
        <article class="card"><p class="subtle">Open Requests</p><p class="status-value">${escapeHtml(data.openRequests)}</p></article>
        <article class="card"><p class="subtle">Resolved Requests</p><p class="status-value">${escapeHtml(data.resolvedRequests)}</p></article>
        <article class="card"><p class="subtle">Total Volunteers</p><p class="status-value">${escapeHtml(data.totalVolunteers)}</p></article>
        <article class="card"><p class="subtle">Available Volunteers</p><p class="status-value">${escapeHtml(data.availableVolunteers)}</p></article>
        <article class="card"><p class="subtle">Total Resources Available</p><p class="status-value">${escapeHtml(data.totalResourcesAvailable)}</p></article>
      `;

      const recent = data.recentActivity || [];
      target.insertAdjacentHTML(
        'beforeend',
        `
        <article class="card full-width">
          <h3>Recent Activity (last 5)</h3>
          ${
            recent.length
              ? `<ul class="activity-list">${recent
                  .map((item) => `<li><strong>${escapeHtml(item.action)}</strong> - ${escapeHtml(item.details)} <span class="subtle">(${toLocalDate(item.createdAt)})</span></li>`)
                  .join('')}</ul>`
              : '<p class="subtle">No activity yet.</p>'
          }
        </article>
      `
      );
    }

    async function loadHelpRequests() {
      const status = document.getElementById('helpFilterStatus').value;
      const urgency = document.getElementById('helpFilterUrgency').value;
      const query = new URLSearchParams();
      if (status) query.set('status', status);
      if (urgency) query.set('urgency', urgency);
      const endpoint = `/api/admin/help-requests${query.toString() ? `?${query.toString()}` : ''}`;

      appState.helpRequests = await api(endpoint, { auth: true });
      renderHelpRequestsTable();
    }

    function renderHelpRequestsTable() {
      const wrap = document.getElementById('helpRequestsWrap');
      if (!appState.helpRequests.length) {
        wrap.innerHTML = '<p class="subtle">No help requests found.</p>';
        return;
      }

      const volunteerOptions = ['<option value="">Unassigned</option>']
        .concat(
          appState.adminVolunteers
            .filter((v) => v.approvalStatus === 'approved' && v.isActive)
            .map((v) => `<option value="${escapeHtml(v._id)}">${escapeHtml(v.name)} (${escapeHtml(v.availabilityStatus)})</option>`)
        )
        .join('');

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
              .map((item) => {
                const assignedId = item.assignedVolunteer && item.assignedVolunteer._id ? String(item.assignedVolunteer._id) : '';
                return `
                  <tr>
                    <td>${escapeHtml(item.name)}</td>
                    <td>${escapeHtml(item.contact)}</td>
                    <td>${escapeHtml(item.location)}</td>
                    <td>${escapeHtml(item.requestType)}</td>
                    <td>${escapeHtml(item.urgency || 'medium')}</td>
                    <td>
                      <select id="help-status-${escapeHtml(item._id)}">
                        <option value="new" ${item.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="in-progress" ${item.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                      </select>
                    </td>
                    <td>
                      <select id="help-assign-${escapeHtml(item._id)}">
                        ${volunteerOptions}
                      </select>
                    </td>
                    <td class="row-actions">
                      <button class="button button-compact" data-action="save-status" data-id="${escapeHtml(item._id)}" type="button">Save Status</button>
                      <button class="button button-compact" data-action="assign-volunteer" data-id="${escapeHtml(item._id)}" type="button">Assign</button>
                      <button class="button button-compact" data-action="view-help" data-id="${escapeHtml(item._id)}" type="button">Details</button>
                    </td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      `;

      appState.helpRequests.forEach((item) => {
        const select = document.getElementById(`help-assign-${item._id}`);
        if (select) {
          const assignedId = item.assignedVolunteer && item.assignedVolunteer._id ? String(item.assignedVolunteer._id) : '';
          select.value = assignedId;
        }
      });
    }

    async function loadVolunteers() {
      appState.adminVolunteers = await api('/api/admin/volunteers', { auth: true });

      const wrap = document.getElementById('volunteersWrap');
      if (!appState.adminVolunteers.length) {
        wrap.innerHTML = '<p class="subtle">No volunteers available.</p>';
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
              .map(
                (item) => `
              <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.phone)}<br/><span class="subtle">${escapeHtml(item.email)}</span></td>
                <td>${escapeHtml((item.skills || []).join(', ') || '-')}</td>
                <td>
                  <select id="vol-status-${escapeHtml(item._id)}">
                    <option value="available" ${item.availabilityStatus === 'available' ? 'selected' : ''}>Available</option>
                    <option value="busy" ${item.availabilityStatus === 'busy' ? 'selected' : ''}>Busy</option>
                  </select>
                  <input id="vol-task-${escapeHtml(item._id)}" placeholder="Assigned task" value="${escapeHtml(item.assignedTask || '')}" />
                </td>
                <td>${escapeHtml(item.assignedTask || '-')}</td>
                <td>
                  <select id="vol-approval-${escapeHtml(item._id)}">
                    <option value="pending" ${item.approvalStatus === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="approved" ${item.approvalStatus === 'approved' ? 'selected' : ''}>Approved</option>
                    <option value="rejected" ${item.approvalStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
                  </select>
                </td>
                <td class="row-actions">
                  <button class="button button-compact" data-action="save-approval" data-id="${escapeHtml(item._id)}" type="button">Save Approval</button>
                  <button class="button button-compact" data-action="save-availability" data-id="${escapeHtml(item._id)}" type="button">Save Availability</button>
                  <button class="button button-compact button-danger" data-action="remove-volunteer" data-id="${escapeHtml(item._id)}" type="button">Remove</button>
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    }

    async function loadInventory() {
      appState.inventoryItems = await api('/api/admin/inventory', { auth: true });
      const wrap = document.getElementById('inventoryWrap');

      if (!appState.inventoryItems.length) {
        wrap.innerHTML = '<p class="subtle">No inventory items found.</p>';
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
              .map(
                (item) => `
              <tr class="${item.isLowStock ? 'low-stock-row' : ''}">
                <td>${escapeHtml(item.name)} ${item.isLowStock ? '<span class="tag tag-warning">Low stock</span>' : ''}</td>
                <td>${escapeHtml(item.category)}</td>
                <td><input id="inv-qty-${escapeHtml(item._id)}" type="number" min="0" value="${escapeHtml(item.quantity)}" /></td>
                <td>${escapeHtml(item.location || '-')}</td>
                <td><input id="inv-low-${escapeHtml(item._id)}" type="number" min="0" value="${escapeHtml(item.lowStockThreshold)}" /></td>
                <td>${escapeHtml(toLocalDate(item.updatedAt))}</td>
                <td class="row-actions">
                  <button class="button button-compact" data-action="save-resource" data-id="${escapeHtml(item._id)}" type="button">Update</button>
                  <button class="button button-compact button-danger" data-action="remove-resource" data-id="${escapeHtml(item._id)}" type="button">Remove</button>
                </td>
              </tr>
            `
              )
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
                .map(
                  (item) => `
                <tr>
                  <td>${escapeHtml(item.title)}<br/><span class="subtle">${escapeHtml(item.body)}</span></td>
                  <td>${item.published ? 'Published' : 'Unpublished'}</td>
                  <td>${escapeHtml(toLocalDate(item.createdAt))}</td>
                  <td><button class="button button-compact" data-action="toggle-publish" data-id="${escapeHtml(item._id)}" data-published="${item.published ? 'true' : 'false'}" type="button">${item.published ? 'Unpublish' : 'Publish'}</button></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
        : '<p class="subtle">No announcements created yet.</p>';
    }

    async function loadAnalytics() {
      const data = await api('/api/admin/analytics', { auth: true });
      const summary = document.getElementById('analyticsSummary');
      const charts = document.getElementById('analyticsCharts');

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
          <div class="chart-row"><span>High (${escapeHtml(urgency.high)})</span><div class="bar"><i style="width:${(urgency.high / maxUrgency) * 100}%"></i></div></div>
          <div class="chart-row"><span>Medium (${escapeHtml(urgency.medium)})</span><div class="bar"><i style="width:${(urgency.medium / maxUrgency) * 100}%"></i></div></div>
          <div class="chart-row"><span>Low (${escapeHtml(urgency.low)})</span><div class="bar"><i style="width:${(urgency.low / maxUrgency) * 100}%"></i></div></div>
        </article>
        <article class="card">
          <h3>Resolved vs Unresolved</h3>
          <div class="chart-row"><span>Resolved (${escapeHtml(resolution.resolved)})</span><div class="bar"><i style="width:${(resolution.resolved / maxResolution) * 100}%"></i></div></div>
          <div class="chart-row"><span>Unresolved (${escapeHtml(resolution.unresolved)})</span><div class="bar"><i style="width:${(resolution.unresolved / maxResolution) * 100}%"></i></div></div>
        </article>
      `;
    }

    async function loadSuperAdminData() {
      appState.adminUsers = await api('/api/admin/users', { auth: true });
      appState.activityLogs = await api('/api/admin/activity-logs?limit=20', { auth: true });

      const usersWrap = document.getElementById('adminUsersWrap');
      const logsWrap = document.getElementById('activityLogWrap');

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
              .map(
                (userItem) => `
              <tr>
                <td>${escapeHtml(userItem.email)}</td>
                <td>
                  <select id="admin-role-${escapeHtml(userItem._id)}">
                    <option value="admin" ${userItem.role === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="super-admin" ${userItem.role === 'super-admin' ? 'selected' : ''}>Super Admin</option>
                  </select>
                </td>
                <td>${escapeHtml(toLocalDate(userItem.createdAt))}</td>
                <td class="row-actions">
                  <button class="button button-compact" data-action="update-admin-role" data-id="${escapeHtml(userItem._id)}" type="button">Update Role</button>
                  <button class="button button-compact button-danger" data-action="remove-admin" data-id="${escapeHtml(userItem._id)}" type="button">Remove</button>
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
        : '<p class="subtle">No admin users found.</p>';

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
              .map(
                (log) => `
              <tr>
                <td>${escapeHtml(toLocalDate(log.createdAt))}</td>
                <td>${escapeHtml(log.actorEmail || 'system')}</td>
                <td>${escapeHtml(log.action)}</td>
                <td>${escapeHtml(log.details)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
        : '<p class="subtle">No activity entries available.</p>';
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
