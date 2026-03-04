(function () {
  const apiContext = window.WRHApi;

  if (!apiContext) {
    throw new Error('WRHApi must be loaded before renderer.js');
  }

  const { escapeHtml, toLocalDate } = apiContext;

  function renderSubtleMessage(message) {
    return `<p class="subtle">${escapeHtml(message)}</p>`;
  }

  function getAssignedVolunteerId(helpRequest) {
    return helpRequest.assignedVolunteer && helpRequest.assignedVolunteer._id
      ? String(helpRequest.assignedVolunteer._id)
      : '';
  }

  function renderOverviewMetricCard(label, value) {
    return `<article class="card"><p class="subtle">${escapeHtml(label)}</p><p class="status-value">${escapeHtml(value)}</p></article>`;
  }

  function renderRecentActivitySection(recentActivity) {
    if (!recentActivity.length) {
      return renderSubtleMessage('No activity yet.');
    }

    return `<ul class="activity-list">${recentActivity
      .map(
        (item) =>
          `<li><strong>${escapeHtml(item.action)}</strong> - ${escapeHtml(item.details)} <span class="subtle">(${toLocalDate(item.createdAt)})</span></li>`
      )
      .join('')}</ul>`;
  }

  function renderOverviewCards(data) {
    const recent = data.recentActivity || [];

    return `
      ${renderOverviewMetricCard('Total Help Requests', data.totalHelpRequests)}
      ${renderOverviewMetricCard('Open Requests', data.openRequests)}
      ${renderOverviewMetricCard('Resolved Requests', data.resolvedRequests)}
      ${renderOverviewMetricCard('Total Volunteers', data.totalVolunteers)}
      ${renderOverviewMetricCard('Available Volunteers', data.availableVolunteers)}
      ${renderOverviewMetricCard('Total Resources Available', data.totalResourcesAvailable)}
      <article class="card full-width">
        <h3>Recent Activity (last 5)</h3>
        ${renderRecentActivitySection(recent)}
      </article>
    `;
  }

  function getApprovedVolunteerOptions(adminVolunteers) {
    return ['<option value="">Unassigned</option>']
      .concat(
        adminVolunteers
          .filter((volunteer) => volunteer.approvalStatus === 'approved' && volunteer.isActive)
          .map(
            (volunteer) =>
              `<option value="${escapeHtml(volunteer._id)}">${escapeHtml(volunteer.name)} (${escapeHtml(volunteer.availabilityStatus)})</option>`
          )
      )
      .join('');
  }

  function renderHelpRequestStatusOptions(status) {
    return `
      <option value="new" ${status === 'new' ? 'selected' : ''}>New</option>
      <option value="in-progress" ${status === 'in-progress' ? 'selected' : ''}>In Progress</option>
      <option value="resolved" ${status === 'resolved' ? 'selected' : ''}>Resolved</option>
    `;
  }

  function renderHelpRequestRow(item, volunteerOptions) {
    return `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.contact)}</td>
        <td>${escapeHtml(item.location)}</td>
        <td>${escapeHtml(item.requestType)}</td>
        <td>${escapeHtml(item.urgency || 'medium')}</td>
        <td>
          <select id="help-status-${escapeHtml(item._id)}">
            ${renderHelpRequestStatusOptions(item.status)}
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
  }

  function renderVolunteerAvailabilityOptions(status) {
    return `
      <option value="available" ${status === 'available' ? 'selected' : ''}>Available</option>
      <option value="busy" ${status === 'busy' ? 'selected' : ''}>Busy</option>
    `;
  }

  function renderVolunteerApprovalOptions(status) {
    return `
      <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
      <option value="approved" ${status === 'approved' ? 'selected' : ''}>Approved</option>
      <option value="rejected" ${status === 'rejected' ? 'selected' : ''}>Rejected</option>
    `;
  }

  function renderVolunteerRow(item) {
    return `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.phone)}<br/><span class="subtle">${escapeHtml(item.email)}</span></td>
        <td>${escapeHtml((item.skills || []).join(', ') || '-')}</td>
        <td>
          <select id="vol-status-${escapeHtml(item._id)}">
            ${renderVolunteerAvailabilityOptions(item.availabilityStatus)}
          </select>
          <input id="vol-task-${escapeHtml(item._id)}" placeholder="Assigned task" value="${escapeHtml(item.assignedTask || '')}" />
        </td>
        <td>${escapeHtml(item.assignedTask || '-')}</td>
        <td>
          <select id="vol-approval-${escapeHtml(item._id)}">
            ${renderVolunteerApprovalOptions(item.approvalStatus)}
          </select>
        </td>
        <td class="row-actions">
          <button class="button button-compact" data-action="save-approval" data-id="${escapeHtml(item._id)}" type="button">Save Approval</button>
          <button class="button button-compact" data-action="save-availability" data-id="${escapeHtml(item._id)}" type="button">Save Availability</button>
          <button class="button button-compact button-danger" data-action="remove-volunteer" data-id="${escapeHtml(item._id)}" type="button">Remove</button>
        </td>
      </tr>
    `;
  }

  function renderInventoryRow(item) {
    return `
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
    `;
  }

  function renderAnnouncementRow(item) {
    return `
      <tr>
        <td>${escapeHtml(item.title)}<br/><span class="subtle">${escapeHtml(item.body)}</span></td>
        <td>${item.published ? 'Published' : 'Unpublished'}</td>
        <td>${escapeHtml(toLocalDate(item.createdAt))}</td>
        <td><button class="button button-compact" data-action="toggle-publish" data-id="${escapeHtml(item._id)}" data-published="${item.published ? 'true' : 'false'}" type="button">${item.published ? 'Unpublish' : 'Publish'}</button></td>
      </tr>
    `;
  }

  function renderChartRow(label, value, maxValue) {
    return `<div class="chart-row"><span>${escapeHtml(label)} (${escapeHtml(value)})</span><div class="bar"><i style="width:${(value / maxValue) * 100}%"></i></div></div>`;
  }

  function renderAdminUserRow(userItem) {
    return `
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
    `;
  }

  function renderActivityLogRow(log) {
    return `
      <tr>
        <td>${escapeHtml(toLocalDate(log.createdAt))}</td>
        <td>${escapeHtml(log.actorEmail || 'system')}</td>
        <td>${escapeHtml(log.action)}</td>
        <td>${escapeHtml(log.details)}</td>
      </tr>
    `;
  }

  window.WRHRenderer = {
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
  };
})();
