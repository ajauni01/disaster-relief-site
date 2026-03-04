(function () {
  const apiContext = window.WRHApi;

  if (!apiContext) {
    throw new Error('WRHApi must be loaded before public-pages.js');
  }

  const {
    page,
    appState,
    navItems,
    pageTitle,
    severityClass,
    statusClass,
    getAdminToken,
    loadAdminUserFromStorage,
    api,
    escapeHtml,
    toLocalDate,
    formDataToObject,
    splitCommaValues
  } = apiContext;

  const app = document.getElementById('app');
  let successTimer = null;

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

    const raw = formDataToObject(form);
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
    const skills = splitCommaValues(raw.skills);

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

  window.WRHPublicPages = {
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
  };
})();
