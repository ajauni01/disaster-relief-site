(function () {
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

  function formDataToObject(formElement) {
    return Object.fromEntries(new FormData(formElement).entries());
  }

  function splitCommaValues(value) {
    return (value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function splitLineValues(value) {
    return (value || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  window.WRHApi = {
    page,
    API_BASE,
    STORAGE_KEYS,
    appState,
    navItems,
    pageTitle,
    severityClass,
    statusClass,
    getAdminToken,
    setAdminSession,
    clearAdminSession,
    loadAdminUserFromStorage,
    buildApiUrl,
    api,
    escapeHtml,
    toLocalDate,
    formDataToObject,
    splitCommaValues,
    splitLineValues
  };
})();
