import { CrudView } from '../components/CrudView.js';
import { Auth, } from '../auth.js';
import { Toast } from '../api.js';

export default class StudentView extends CrudView {
    constructor() {
        super({
            title: 'Students',
            endpoint: 'admin/students',
            idKey: 'studentId',
            columns: [
                { key: 'studentNo', label: 'Student No', render: (v, row) => v ?? row.stringNo ?? '-' },
                { key: 'tcNo', label: 'TC No' },
                { key: 'fullName', label: 'Full Name' },
                { key: 'facultyName', label: 'Faculty' },
                { key: 'departmentName', label: 'Department' }
            ],
            formFields: [
                { key: 'studentNo', label: 'Student Number', type: 'text', required: true },
                { key: 'tcNo', label: 'TC Identity Number', type: 'text', required: true },
                { key: 'fullName', label: 'Full Name', type: 'text', required: true },
                { key: 'facultyId',    label: 'Faculty',    type: 'select', required: true, optionsEndpoint: 'admin/faculties',    optionValue: 'facultyId',    optionLabel: 'facultyName' },
                { key: 'departmentId', label: 'Department', type: 'select', required: true, optionsEndpoint: 'admin/departments', optionValue: 'departmentId', optionLabel: 'departmentName' }
            ]
        });
    }

    getHtml() {
        const base = super.getHtml();
        // Inject hidden file input + import modal after closing </div> of page-container
        return base.replace(
            '</div>\n        ',
            `</div>

        <!-- CSV/Excel Import Modal -->
        <div class="modal-overlay" id="import-modal" style="display:none;">
            <div class="modal-content glass-panel" style="max-width:480px;">
                <div class="modal-header">
                    <h2>Import Students from CSV / Excel</h2>
                    <button class="modal-close" id="import-modal-close">&times;</button>
                </div>
                <div style="padding: var(--space-md);">
                    <p style="margin-bottom: var(--space-sm); color: var(--color-muted); font-size:0.9rem;">
                        Expected columns (row 1 = header):<br>
                        <code>studentNo, tcNo, fullName, facultyId, departmentId</code>
                    </p>
                    <input type="file" id="import-file-input" accept=".csv,.xls,.xlsx"
                        style="display:block; width:100%; margin: var(--space-md) 0; padding: var(--space-sm); border: 1px dashed var(--color-border); border-radius: var(--radius-sm); cursor:pointer;" />
                    <div id="import-result" style="display:none; margin-bottom: var(--space-md);"></div>
                    <div style="display:flex; gap: var(--space-sm); justify-content:flex-end;">
                        <button class="btn-secondary" id="import-cancel-btn">Cancel</button>
                        <button class="btn-primary" id="import-submit-btn">Upload</button>
                    </div>
                </div>
            </div>
        </div>

        `
        );
    }

    // Inject "Import CSV/Excel" button into the page header action area
    _injectImportButton() {
        const addBtn = document.getElementById('crud-add-btn');
        if (!addBtn) return;
        const importBtn = document.createElement('button');
        importBtn.className = 'btn-secondary';
        importBtn.id = 'open-import-btn';
        importBtn.textContent = 'Import CSV/Excel';
        addBtn.parentElement.insertBefore(importBtn, addBtn);
    }

    async mount() {
        await super.mount();
        this._injectImportButton();

        const openBtn   = document.getElementById('open-import-btn');
        const modal     = document.getElementById('import-modal');
        const closeBtn  = document.getElementById('import-modal-close');
        const cancelBtn = document.getElementById('import-cancel-btn');
        const submitBtn = document.getElementById('import-submit-btn');
        const fileInput = document.getElementById('import-file-input');
        const resultDiv = document.getElementById('import-result');

        const openModal  = () => { resultDiv.style.display = 'none'; fileInput.value = ''; modal.style.display = 'flex'; };
        const closeModal = () => { modal.style.display = 'none'; };

        openBtn .addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        submitBtn.addEventListener('click', async () => {
            const file = fileInput.files[0];
            if (!file) { Toast.error('Please select a file first.'); return; }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Uploading…';

            try {
                const formData = new FormData();
                formData.append('file', file);

                const headers = {};
                if (Auth.isAuthenticated()) {
                    headers['Authorization'] = `Bearer ${Auth.getToken()}`;
                }

                const response = await fetch('http://localhost:8081/api/admin/students/import', {
                    method: 'POST',
                    headers,
                    body: formData
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    Toast.error(err.message || 'Import failed');
                    return;
                }

                const result = await response.json();
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = `
                    <div style="background: var(--color-surface); border-radius: var(--radius-sm); padding: var(--space-sm);">
                        <p>✅ Imported: <strong>${result.imported}</strong></p>
                        <p>⏭ Skipped (duplicates/errors): <strong>${result.skipped}</strong></p>
                        ${result.errors.length ? `<details style="margin-top:var(--space-xs);">
                            <summary style="cursor:pointer; color:var(--color-warning);">${result.errors.length} row error(s)</summary>
                            <ul style="font-size:0.85rem; margin-top:var(--space-xs);">
                                ${result.errors.map(e => `<li>${e}</li>`).join('')}
                            </ul>
                        </details>` : ''}
                    </div>`;
                Toast.success(`Import done: ${result.imported} added, ${result.skipped} skipped`);
                await this._loadData();
            } catch (err) {
                Toast.error('Upload error: ' + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Upload';
            }
        });
    }

    unmount() {
        super.unmount();
        const openBtn = document.getElementById('open-import-btn');
        if (openBtn) openBtn.remove();
    }
}
