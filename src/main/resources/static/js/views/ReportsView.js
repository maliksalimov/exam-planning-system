import { Api, Toast } from '../api.js';
import { TNR_REGULAR, TNR_BOLD } from '../utils/TimesNewRomanFont.js';

// ─── jsPDF helper ────────────────────────────────────────────────────────────
function _getJsPDF() {
    const ctor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!ctor) throw new Error('jsPDF library not loaded.');
    return ctor;
}

function _createDoc() {
    const jsPDF = _getJsPDF();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.addFileToVFS('TimesNewRoman.ttf', TNR_REGULAR);
    doc.addFont('TimesNewRoman.ttf', 'TimesNewRoman', 'normal');

    doc.addFileToVFS('TimesNewRoman-Bold.ttf', TNR_BOLD);
    doc.addFont('TimesNewRoman-Bold.ttf', 'TimesNewRoman', 'bold');

    doc.setFont('TimesNewRoman', 'normal');
    return doc;
}

// ─── PDF builder ─────────────────────────────────────────────────────────────
function _buildPdf(title, subtitle, columns, rows, filename) {
    const doc = _createDoc();

    // ── Header ──
    doc.setFont('TimesNewRoman', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(30, 58, 138);
    doc.text('UNIVERSITY EXAM MANAGEMENT SYSTEM', 105, 15, { align: 'center' });

    doc.setFont('TimesNewRoman', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text('Exam Planning and Invigilator Assignment Module', 105, 22, { align: 'center' });

    doc.setFont('TimesNewRoman', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(17, 17, 17);
    doc.text(title, 105, 30, { align: 'center' });

    let lineY = 34;
    if (subtitle) {
        doc.setFont('TimesNewRoman', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(subtitle, 105, 37, { align: 'center' });
        lineY = 41;
    }

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.4);
    doc.line(10, lineY, 200, lineY);

    doc.setFont('TimesNewRoman', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated: ' + new Date().toLocaleString(), 200, lineY + 5, { align: 'right' });

    // ── Table ──
    doc.autoTable({
        head: [columns],
        body: rows,
        startY: lineY + 9,
        styles: {
            font: 'TimesNewRoman',
            fontStyle: 'normal',
            fontSize: 11,
            cellPadding: 4,
            overflow: 'linebreak',
            textColor: [20, 20, 20]
        },
        headStyles: {
            font: 'TimesNewRoman',
            fontStyle: 'bold',
            fontSize: 11,
            fillColor: [239, 246, 255],
            textColor: [30, 64, 175],
            lineColor: [147, 197, 253],
            lineWidth: 0.3
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251]
        },
        margin: { left: 10, right: 10 }
    });

    doc.save(filename.endsWith('.pdf') ? filename : filename + '.pdf');
}

// ─── View ─────────────────────────────────────────────────────────────────────
export default class ReportsView {
    getHtml() {
        return `
        <div class="page-container">
            <header class="page-header">
                <h1>📊 Reports & PDF Exports</h1>
            </header>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg);">

                <!-- CLASSROOM EXAM LIST -->
                <div class="card" style="display: flex; flex-direction: column; gap: var(--space-md);">
                    <h3 style="color: var(--color-primary); margin: 0;">🏫 Classroom Exam List</h3>
                    <p style="color: var(--color-muted); font-size: var(--font-size-sm); margin: 0;">
                        Classrooms, exams, and invigilators for the selected exam.
                    </p>
                    <div class="form-group">
                        <label class="form-label" for="rpt-exam-cls">Exam</label>
                        <select id="rpt-exam-cls" class="form-input">
                            <option value="">-- Select Exam --</option>
                        </select>
                    </div>
                    <button class="btn-primary" id="rpt-cls-pdf">📄 Generate PDF</button>
                    <div id="rpt-cls-preview" style="font-size: var(--font-size-sm); color: var(--color-muted);"></div>
                </div>

                <!-- INVIGILATOR DUTY ASSIGNMENT -->
                <div class="card" style="display: flex; flex-direction: column; gap: var(--space-md);">
                    <h3 style="color: var(--color-accent); margin: 0;">📋 Invigilator Duty Assignment</h3>
                    <p style="color: var(--color-muted); font-size: var(--font-size-sm); margin: 0;">
                        Invigilator duty distribution list for the selected exam.
                    </p>
                    <div class="form-group">
                        <label class="form-label" for="rpt-exam-inv">Exam</label>
                        <select id="rpt-exam-inv" class="form-input">
                            <option value="">-- Select Exam --</option>
                        </select>
                    </div>
                    <button class="btn-accent" id="rpt-inv-pdf" style="background: var(--color-accent);">📄 Generate PDF</button>
                    <div id="rpt-inv-preview" style="font-size: var(--font-size-sm); color: var(--color-muted);"></div>
                </div>

                <!-- INVIGILATOR WORKLOAD REPORT -->
                <div class="card" style="display: flex; flex-direction: column; gap: var(--space-md); grid-column: 1/-1;">
                    <h3 style="color: var(--color-success); margin: 0;">⚖️ Invigilator Workload Report</h3>
                    <p style="color: var(--color-muted); font-size: var(--font-size-sm); margin: 0;">
                        Total invigilator duty counts for all instructors.
                    </p>
                    <button class="btn-secondary" id="rpt-load-pdf">📄 Workload Report PDF</button>
                    <div id="rpt-load-preview"></div>
                </div>

            </div>
        </div>
        `;
    }

    async mount() {
        // ── Populate exam dropdowns ────────────────────────────────
        try {
            const exams = await Api.getAll('admin/exams');
            const clsSel = document.getElementById('rpt-exam-cls');
            const invSel = document.getElementById('rpt-exam-inv');
            exams.forEach(e => {
                const label = `${e.examName} (${e.examDate} ${e.examTime || ''})`;
                [clsSel, invSel].forEach(sel => {
                    const opt = document.createElement('option');
                    opt.value = e.examId;
                    opt.dataset.date = e.examDate;
                    opt.dataset.name = e.examName;
                    opt.textContent = label;
                    sel.appendChild(opt);
                });
            });
        } catch (err) {
            Toast.error('Failed to load exams: ' + err.message);
        }

        // ── Classroom exam list ───────────────────────────────────
        document.getElementById('rpt-cls-pdf').onclick = async () => {
            const sel = document.getElementById('rpt-exam-cls');
            const examId = sel.value;
            if (!examId) { Toast.error('Please select an exam first.'); return; }
            const examOpt = sel.options[sel.selectedIndex];
            const examName = examOpt.dataset.name;
            const examDate = examOpt.dataset.date;
            const preview = document.getElementById('rpt-cls-preview');
            const btn = document.getElementById('rpt-cls-pdf');
            btn.disabled = true;
            preview.textContent = 'Loading data…';
            try {
                const all = await Api.request('admin/invigilator-assignments');
                const filtered = all.filter(a => String(a.examId) === String(examId));
                if (!filtered.length) {
                    preview.textContent = '⚠ No assignments found for this exam.';
                    return;
                }

                const byRoom = {};
                filtered.forEach(a => {
                    if (!byRoom[a.classroomName]) byRoom[a.classroomName] = { invigilators: [] };
                    byRoom[a.classroomName].examTime = a.examTime;
                    byRoom[a.classroomName].invigilators.push(a.instructorName);
                });

                const columns = ['Classroom', 'Time', 'Exam', 'Invigilator(s)'];
                const rows = Object.entries(byRoom).map(([room, d]) => [
                    room,
                    String(d.examTime || ''),
                    examName,
                    d.invigilators.join(', ')
                ]);

                _buildPdf(
                    'Classroom Exam List',
                    `${examName} | ${examDate}`,
                    columns, rows,
                    `${examDate}_Classroom_Exam_List`
                );
                preview.textContent = `✅ PDF generated for ${rows.length} classroom(s).`;
            } catch (err) {
                console.error(err);
                preview.textContent = 'Error: ' + err.message;
            } finally {
                btn.disabled = false;
            }
        };

        // ── Invigilator duty assignment ───────────────────────────
        document.getElementById('rpt-inv-pdf').onclick = async () => {
            const sel = document.getElementById('rpt-exam-inv');
            const examId = sel.value;
            if (!examId) { Toast.error('Please select an exam first.'); return; }
            const examOpt = sel.options[sel.selectedIndex];
            const examName = examOpt.dataset.name;
            const examDate = examOpt.dataset.date;
            const preview = document.getElementById('rpt-inv-preview');
            const btn = document.getElementById('rpt-inv-pdf');
            btn.disabled = true;
            preview.textContent = 'Loading data…';
            try {
                const all = await Api.request('admin/invigilator-assignments');
                const filtered = all.filter(a => String(a.examId) === String(examId));
                if (!filtered.length) {
                    preview.textContent = '⚠ No assignments found for this exam.';
                    return;
                }

                const columns = ['#', 'Invigilator', 'Classroom', 'Time'];
                const rows = filtered.map((a, i) => [
                    String(i + 1),
                    a.instructorName,
                    a.classroomName,
                    String(a.examTime || '')
                ]);

                _buildPdf(
                    'Invigilator Duty Assignment List',
                    `${examName} | ${examDate}`,
                    columns, rows,
                    `${examDate}_Invigilator_Duties`
                );
                preview.textContent = `✅ PDF generated for ${rows.length} assignment(s).`;
            } catch (err) {
                console.error(err);
                preview.textContent = 'Error: ' + err.message;
            } finally {
                btn.disabled = false;
            }
        };

        // ── Invigilator workload report ───────────────────────────
        document.getElementById('rpt-load-pdf').onclick = async () => {
            const preview = document.getElementById('rpt-load-preview');
            const btn = document.getElementById('rpt-load-pdf');
            btn.disabled = true;
            preview.textContent = 'Loading data…';
            try {
                const instructors = await Api.getAll('admin/instructors');
                const sorted = [...instructors].sort((a, b) => (b.dutyCount || 0) - (a.dutyCount || 0));

                const columns = ['#', 'Instructor', 'Department', 'Total Duties'];
                const rows = sorted.map((i, idx) => [
                    String(idx + 1),
                    i.fullName,
                    i.departmentName || '-',
                    String(i.dutyCount ?? 0)
                ]);

                const today = new Date().toISOString().slice(0, 10);
                _buildPdf(
                    'Invigilator Workload Report',
                    `All Terms — ${today}`,
                    columns, rows,
                    `${today}_Workload_Report`
                );
                preview.innerHTML = sorted.map(i =>
                    `<span class="badge badge--info" style="margin:2px">${i.fullName}: ${i.dutyCount ?? 0}</span>`
                ).join('');
            } catch (err) {
                console.error(err);
                preview.textContent = 'Error: ' + err.message;
            } finally {
                btn.disabled = false;
            }
        };
    }

    unmount() {}
}
