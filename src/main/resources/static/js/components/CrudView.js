import { Api, Toast } from '../api.js';

/**
 * Generic CRUD View Component
 * Renders a data table with Add/Edit/Delete + modal form
 * 
 * Usage: new CrudView({ title, endpoint, columns, formFields })
 *   columns: [{ key, label, render? }]
 *   formFields: [{ key, label, type, required?, options? }]
 */
export class CrudView {
    constructor({ title, endpoint, columns, formFields, idKey, actions }) {
        this.title = title;
        this.endpoint = endpoint;
        this.columns = columns;
        this.formFields = formFields;
        this.actions = actions || [];
        this.idKey = idKey || 'id';
        this._data = [];
        this._editingId = null;
    }

    getHtml() {
        return `
        <div class="page-container">
            <header class="page-header">
                <h1>${this.title}</h1>
                <div style="display:flex; gap: var(--space-sm);">
                    ${this.actions.map((a, i) => `<button class="btn-secondary crud-custom-action" data-index="${i}">${a.label}</button>`).join('')}
                    <button class="btn-primary" id="crud-add-btn">+ Add New</button>
                </div>
            </header>

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            ${this.columns.map(c => `<th>${c.label}</th>`).join('')}
                            <th style="width:120px; text-align:center;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="crud-table-body">
                        <tr><td colspan="${this.columns.length + 1}" style="text-align:center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Modal -->
            <div class="modal-overlay" id="crud-modal" style="display:none;">
                <div class="modal-content glass-panel">
                    <div class="modal-header">
                        <h2 id="crud-modal-title">Add ${this.title}</h2>
                        <button class="modal-close" id="crud-modal-close">&times;</button>
                    </div>
                    <form id="crud-form" class="modal-form">
                        ${this.formFields.map(f => this._renderFormField(f)).join('')}
                        <button type="submit" class="btn-primary" style="width:100%; margin-top: var(--space-md);">Save</button>
                    </form>
                </div>
            </div>
        </div>
        `;
    }

    _renderFormField(f) {
        if (f.type === 'select') {
            return `
            <div class="form-group">
                <label class="form-label" for="field-${f.key}">${f.label}</label>
                <select class="form-input form-select" id="field-${f.key}" ${f.required ? 'required' : ''}>
                    <option value="">-- Select --</option>
                </select>
            </div>`;
        }
        if (f.type === 'checkbox') {
            return `
            <div class="form-group" style="flex-direction:row; align-items:center; gap: var(--space-sm);">
                <input type="checkbox" id="field-${f.key}" />
                <label class="form-label" for="field-${f.key}" style="margin:0">${f.label}</label>
            </div>`;
        }
        return `
        <div class="form-group">
            <label class="form-label" for="field-${f.key}">${f.label}</label>
            <input class="form-input" type="${f.type || 'text'}" id="field-${f.key}" ${f.required ? 'required' : ''} />
        </div>`;
    }

    async mount() {
        this._addBtn = document.getElementById('crud-add-btn');
        this._modal = document.getElementById('crud-modal');
        this._modalTitle = document.getElementById('crud-modal-title');
        this._closeBtn = document.getElementById('crud-modal-close');
        this._form = document.getElementById('crud-form');
        this._tableBody = document.getElementById('crud-table-body');

        this._onAdd = () => this._openModal();
        this._onClose = () => this._closeModal();
        this._onSubmit = (e) => { e.preventDefault(); this._handleSubmit(); };
        this._onTableClick = (e) => this._handleTableAction(e);

        this._addBtn.addEventListener('click', this._onAdd);
        this._closeBtn.addEventListener('click', this._onClose);
        this._form.addEventListener('submit', this._onSubmit);
        this._tableBody.addEventListener('click', this._onTableClick);
        
        // Custom Actions
        document.querySelectorAll('.crud-custom-action').forEach(btn => {
            btn.onclick = (e) => {
                const idx = e.target.getAttribute('data-index');
                if (this.actions[idx] && typeof this.actions[idx].onClick === 'function') {
                    this.actions[idx].onClick();
                }
            };
        });

        // Load select options for form fields that have them
        for (const f of this.formFields) {
            if (f.type === 'select') {
                const sel = document.getElementById(`field-${f.key}`);
                if (!sel) continue;
                if (f.options && Array.isArray(f.options)) {
                    f.options.forEach(opt => {
                        const o = document.createElement('option');
                        o.value = typeof opt === 'object' ? opt.value : opt;
                        o.textContent = typeof opt === 'object' ? opt.label : opt;
                        sel.appendChild(o);
                    });
                } else if (f.optionsEndpoint) {
                    try {
                        const options = await Api.request(f.optionsEndpoint);
                        options.forEach(opt => {
                            const o = document.createElement('option');
                            o.value = opt[f.optionValue];
                            o.textContent = opt[f.optionLabel];
                            sel.appendChild(o);
                        });
                    } catch (e) { console.warn('Failed to load options for', f.key); }
                }
            }
        }

        await this._loadData();
    }

    async _loadData() {
        try {
            this._data = await Api.request(this.endpoint);
            if (!this._tableBody) return;
            this._renderTable();
        } catch (err) {
            console.error(err);
            Toast.error('Failed to load data');
        }
    }

    _renderTable() {
        if (this._data.length === 0) {
            this._tableBody.innerHTML = `<tr><td colspan="${this.columns.length + 1}" style="text-align:center; color: var(--color-muted);">No records found</td></tr>`;
            return;
        }
        this._tableBody.innerHTML = this._data.map(row => `
            <tr>
                ${this.columns.map(c => `<td>${c.render ? c.render(row[c.key], row) : (row[c.key] ?? '-')}</td>`).join('')}
                <td style="text-align:center;">
                    <button class="action-btn action-edit" data-id="${row[this.idKey]}">✏️</button>
                    <button class="action-btn action-delete" data-id="${row[this.idKey]}">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    _openModal(editRow = null) {
        this._editingId = editRow ? editRow[this.idKey] : null;
        this._modalTitle.textContent = editRow ? `Edit ${this.title}` : `Add ${this.title}`;

        this.formFields.forEach(f => {
            const el = document.getElementById(`field-${f.key}`);
            if (!el) return;
            if (f.type === 'checkbox') {
                el.checked = editRow ? !!editRow[f.key] : (f.defaultValue ?? false);
            } else {
                el.value = editRow ? (editRow[f.key] ?? '') : (f.defaultValue ?? '');
            }
        });

        this._modal.style.display = 'flex';
    }

    _closeModal() {
        this._modal.style.display = 'none';
        this._editingId = null;
        this._form.reset();
    }

    async _handleSubmit() {
        const body = {};
        this.formFields.forEach(f => {
            const el = document.getElementById(`field-${f.key}`);
            if (!el) return;
            if (f.type === 'checkbox') {
                body[f.key] = el.checked;
            } else if (f.type === 'number') {
                body[f.key] = el.value !== '' ? Number(el.value) : null;
            } else if (f.type === 'select') {
                // numeric IDs come back as numbers; static string options stay as strings
                const v = el.value;
                body[f.key] = v === '' ? null : (/^\d+$/.test(v) ? parseInt(v) : v);
            } else {
                body[f.key] = el.value || null;
            }
        });

        try {
            if (this._editingId) {
                await Api.request(`${this.endpoint}/${this._editingId}`, {
                    method: 'PUT', body: JSON.stringify(body)
                });
                Toast.success('Updated successfully');
            } else {
                await Api.request(this.endpoint, {
                    method: 'POST', body: JSON.stringify(body)
                });
                Toast.success('Created successfully');
            }
            this._closeModal();
            await this._loadData();
        } catch (err) {
            console.error(err);
        }
    }

    async _handleTableAction(e) {
        const btn = e.target.closest('.action-btn');
        console.log('[CrudView] table click', { target: e.target, btn, id: btn?.dataset?.id });
        if (!btn) return;
        const id = btn.dataset.id;

        if (btn.classList.contains('action-edit')) {
            const row = this._data.find(r => String(r[this.idKey]) === id);
            if (row) this._openModal(row);
        }

        if (btn.classList.contains('action-delete')) {
            console.log('[CrudView] delete clicked for id=', id, 'endpoint=', this.endpoint);
            const ok = await this._confirmDelete();
            if (!ok) {
                console.log('[CrudView] delete cancelled by user');
                return;
            }
            try {
                console.log('[CrudView] sending DELETE', `${this.endpoint}/${id}`);
                await Api.request(`${this.endpoint}/${id}`, { method: 'DELETE' });
                Toast.success('Deleted successfully');
                await this._loadData();
            } catch (err) {
                console.error('[CrudView] delete failed:', err);
            }
        }
    }

    _confirmDelete() {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.display = 'flex';
            overlay.style.zIndex = '10000';
            overlay.innerHTML = `
                <div class="modal-content glass-panel" style="max-width:400px;">
                    <div class="modal-header">
                        <h2>Silinməni təsdiqləyin</h2>
                    </div>
                    <div style="padding: var(--space-md);">
                        <p style="margin-bottom: var(--space-md);">Bu qeydi silmək istədiyinizə əminsiniz?</p>
                        <div style="display:flex; gap: var(--space-sm); justify-content:flex-end;">
                            <button type="button" class="btn-secondary" data-act="cancel">Ləğv et</button>
                            <button type="button" class="btn-primary" data-act="confirm" style="background:#d33;">Sil</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.addEventListener('click', (e) => {
                const act = e.target.dataset?.act;
                if (act === 'confirm') { overlay.remove(); resolve(true); }
                else if (act === 'cancel' || e.target === overlay) { overlay.remove(); resolve(false); }
            });
        });
    }

    unmount() {
        if (this._addBtn) this._addBtn.removeEventListener('click', this._onAdd);
        if (this._closeBtn) this._closeBtn.removeEventListener('click', this._onClose);
        if (this._form) this._form.removeEventListener('submit', this._onSubmit);
        if (this._tableBody) this._tableBody.removeEventListener('click', this._onTableClick);
        this._addBtn = null;
        this._modal = null;
        this._form = null;
        this._tableBody = null;
        this._data = [];
    }
}
