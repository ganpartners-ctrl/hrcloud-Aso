/**
 * HRCloud Malaysia — Frontend API Layer
 * ======================================
 * Drop this file in your project as /api.js
 * Then replace localStorage calls with these functions.
 *
 * Usage in HTML app:
 *   <script src="api.js"></script>
 *   const employees = await HRApi.employees.list('CO001');
 *
 * All methods return plain JS objects/arrays matching
 * the same shape previously stored in localStorage.
 */

(function (global) {
  'use strict';

  const BASE = (window.HRCLOUD_API_URL || 'http://localhost:4000') + '/api';

  // ── Token management ────────────────────────────────────────────────────
  const Auth = {
    getToken:   () => sessionStorage.getItem('hrcloud_token'),
    setToken:   (t) => sessionStorage.setItem('hrcloud_token', t),
    clearToken: () => sessionStorage.removeItem('hrcloud_token'),
    getUser:    () => { try { return JSON.parse(atob((Auth.getToken()||'').split('.')[1]||'e30=')); } catch { return null; } },
  };

  // ── Core fetch wrapper ───────────────────────────────────────────────────
  async function req(method, path, body, opts = {}) {
    const token = Auth.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      ...opts,
    });

    if (res.status === 401) {
      Auth.clearToken();
      window.dispatchEvent(new Event('hrcloud:session-expired'));
      throw new Error('Session expired — please login again');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  const get  = (path)        => req('GET',    path);
  const post = (path, body)  => req('POST',   path, body);
  const put  = (path, body)  => req('PUT',    path, body);
  const del  = (path)        => req('DELETE', path);

  // ── API Modules ──────────────────────────────────────────────────────────

  const HRApi = {

    // ── Auth ──────────────────────────────────────────────────────────────
    auth: {
      async loginPlatform(id, password) {
        const r = await post('/auth/platform', { id, password });
        if (r.token) Auth.setToken(r.token);
        return r;
      },
      async loginSuperAdmin(id, password, companyId) {
        const r = await post('/auth/superadmin', { id, password, companyId });
        if (r.token) Auth.setToken(r.token);
        return r;
      },
      async loginEmployee(id, password, companyId) {
        const r = await post('/auth/employee', { id, password, companyId });
        if (r.token) Auth.setToken(r.token);
        return r;
      },
      logout() { Auth.clearToken(); },
      getUser: Auth.getUser,
      getToken: Auth.getToken,
    },

    // ── Companies ─────────────────────────────────────────────────────────
    companies: {
      list:   ()     => get('/companies'),
      get:    (id)   => get(`/companies/${id}`),
      create: (data) => post('/companies', data),
      update: (id, data) => put(`/companies/${id}`, data),
    },

    // ── Employees ─────────────────────────────────────────────────────────
    employees: {
      list:   (companyId, filters = {}) => {
        const q = new URLSearchParams({ companyId, ...filters }).toString();
        return get(`/employees?${q}`);
      },
      get:    (id)   => get(`/employees/${id}`),
      create: (data) => post('/employees', data),
      update: (id, data) => put(`/employees/${id}`, data),
      terminate: (id) => del(`/employees/${id}`),
    },

    // ── Payroll ───────────────────────────────────────────────────────────
    payroll: {
      batches: {
        list:   (companyId) => get(`/payroll/batches?companyId=${companyId}`),
        create: (data)      => post('/payroll/batches', data),
        updateStatus: (id, status, note, actor) =>
          put(`/payroll/batches/${id}/status`, { status, note, actor }),
      },
      entries: {
        list:   (companyId, batchId) => get(`/payroll/entries?companyId=${companyId}&batchId=${batchId}`),
        upsert: (data)  => post('/payroll/entries', data),
        remove: (id)    => del(`/payroll/entries/${id}`),
      },
    },

    // ── Leaves ────────────────────────────────────────────────────────────
    leaves: {
      list:    (companyId, employeeId) => {
        const q = new URLSearchParams({ companyId, ...(employeeId ? { employeeId } : {}) }).toString();
        return get(`/leaves?${q}`);
      },
      apply:   (data) => post('/leaves', data),
      approve: (id, approvedBy)       => put(`/leaves/${id}/approve`, { approvedBy }),
      reject:  (id, rejectedBy, reason) => put(`/leaves/${id}/reject`, { rejectedBy, reason }),
    },

    // ── Config ────────────────────────────────────────────────────────────
    config: {
      hr: {
        get:    (companyId) => get(`/config/hr/${companyId}`),
        save:   (companyId, data) => put(`/config/hr/${companyId}`, data),
      },
      leave: {
        get:    (companyId) => get(`/config/leave/${companyId}`),
        save:   (companyId, data) => put(`/config/leave/${companyId}`, data),
      },
      payroll: {
        get:    (companyId) => get(`/config/payroll/${companyId}`),
        save:   (companyId, data) => put(`/config/payroll/${companyId}`, data),
      },
    },

    // ── Licenses ──────────────────────────────────────────────────────────
    licenses: {
      list:   ()     => get('/licenses'),
      get:    (companyId) => get(`/licenses/${companyId}`),
      upsert: (data) => post('/licenses', data),
      update: (companyId, data) => put(`/licenses/${companyId}`, data),
    },

    // ── Billing ───────────────────────────────────────────────────────────
    billing: {
      list:     (companyId) => get(`/billing${companyId ? '?companyId=' + companyId : ''}`),
      create:   (data)      => post('/billing', data),
      markPaid: (id, receiptNo) => put(`/billing/${id}/pay`, { receiptNo }),
      autoRun:  (month)     => post('/billing/auto-run', { month }),
    },

    // ── CRM ───────────────────────────────────────────────────────────────
    crm: {
      list:   (type) => get(`/crm${type ? '?type=' + type : ''}`),
      create: (type, data) => post('/crm', { type, data }),
      update: (id, data)   => put(`/crm/${id}`, { data }),
      remove: (id)         => del(`/crm/${id}`),
    },

    // ── Support ───────────────────────────────────────────────────────────
    support: {
      tickets: {
        list:   (filters = {}) => get(`/support?${new URLSearchParams(filters)}`),
        create: (data)  => post('/support', data),
        update: (id, data) => put(`/support/${id}`, data),
      },
      replies: {
        list:   (ticketId)    => get(`/support/${ticketId}/replies`),
        create: (ticketId, data) => post(`/support/${ticketId}/replies`, data),
      },
    },

    // ── Audit Log ─────────────────────────────────────────────────────────
    audit: {
      list:  (limit = 200, module) => get(`/audit?limit=${limit}${module ? '&module=' + module : ''}`),
      add:   (data) => post('/audit', data),
      clear: ()     => del('/audit'),
    },

    // ── Company Groups ────────────────────────────────────────────────────
    groups: {
      list:   ()     => get('/groups'),
      upsert: (data) => post('/groups', data),
      remove: (id)   => del(`/groups/${id}`),
    },

    // ── Email ─────────────────────────────────────────────────────────────
    email: {
      settings: {
        get:  ()     => get('/email/settings'),
        save: (data) => put('/email/settings', data),
      },
      rules: {
        list:   ()     => get('/email/rules'),
        upsert: (data) => post('/email/rules', data),
        hit:    (id)   => put(`/email/rules/${id}/hit`, {}),
        remove: (id)   => del(`/email/rules/${id}`),
      },
    },

    // ── Platform Admin ────────────────────────────────────────────────────
    platform: {
      staff: {
        list:   ()     => get('/platform/staff'),
        upsert: (data) => post('/platform/staff', data),
        setPassword: (id, password) => put(`/platform/staff/${id}/password`, { password }),
      },
      notif: {
        get:  ()     => get('/platform/notif'),
        save: (data) => put('/platform/notif', data),
      },
      tiers: {
        list:   ()     => get('/platform/tiers'),
        upsert: (data) => post('/platform/tiers', data),
      },
    },

    // ── Helpers ───────────────────────────────────────────────────────────
    helpers: {
      /**
       * Replace a single localStorage read with a DB fetch.
       * Usage: const emps = await HRApi.helpers.fromDB('hrcl_v4_employees', () => HRApi.employees.list(coId));
       */
      async fromDB(lsKey, fetchFn) {
        try {
          return await fetchFn();
        } catch (e) {
          console.warn(`[HRApi] DB fetch failed for ${lsKey}, falling back to localStorage:`, e.message);
          try { return JSON.parse(localStorage.getItem(lsKey) || 'null'); } catch { return null; }
        }
      },

      /**
       * Save to DB and keep localStorage in sync as fallback.
       */
      async toDB(lsKey, saveFn, data) {
        try {
          const result = await saveFn(data);
          try { localStorage.setItem(lsKey, JSON.stringify(data)); } catch {}
          return result;
        } catch (e) {
          console.warn(`[HRApi] DB save failed for ${lsKey}:`, e.message);
          try { localStorage.setItem(lsKey, JSON.stringify(data)); } catch {}
          return data;
        }
      },
    },
  };

  // Expose globally
  global.HRApi = HRApi;
  console.log('[HRApi] Initialized — API base:', BASE);

})(window);
