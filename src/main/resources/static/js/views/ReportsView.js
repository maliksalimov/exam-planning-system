import { Api, Toast } from '../api.js';
import { TNR_REGULAR, TNR_BOLD } from '../utils/TimesNewRomanFont.js';

// ─── jsPDF helper ────────────────────────────────────────────────────────────
function _getJsPDF() {
    const ctor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!ctor) throw new Error('jsPDF kütüphanesi yüklenmedi.');
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
    doc.text('ÜNİVERSİTE SINAV YÖNETİM SİSTEMİ', 105, 15, { align: 'center' });

    doc.setFont('TimesNewRoman', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text('Sınav Planlama ve Gözetmen Atama Modülü', 105, 22, { align: 'center' });

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
    doc.text('Oluşturulma: ' + new Date().toLocaleString('tr-TR'), 200, lineY + 5, { align: 'right' });

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
                <h1>📊 Raporlar ve PDF Çıktıları</h1>
            </header>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg);">

                <!-- SINIF BAZLI SINAV LİSTESİ -->
                <div class="card" style="display: flex; flex-direction: column; gap: var(--space-md);">
                    <h3 style="color: var(--color-primary); margin: 0;">🏫 Sınıf Bazlı Sınav Listesi</h3>
                    <p style="color: var(--color-muted); font-size: var(--font-size-sm); margin: 0;">
                        Seçilen sınav için sınıfları, sınavları ve gözetmenleri gösteren liste.
                    </p>
                    <div class="form-group">
                        <label class="form-label" for="rpt-exam-cls">Sınav</label>
                        <select id="rpt-exam-cls" class="form-input">
                            <option value="">-- Sınav Seçin --</option>
                        </select>
                    </div>
                    <button class="btn-primary" id="rpt-cls-pdf">📄 PDF Oluştur</button>
                    <div id="rpt-cls-preview" style="font-size: var(--font-size-sm); color: var(--color-muted);"></div>
                </div>

                <!-- GÖZETMEN GÖREV DAĞILIM LİSTESİ -->
                <div class="card" style="display: flex; flex-direction: column; gap: var(--space-md);">
                    <h3 style="color: var(--color-accent); margin: 0;">📋 Gözetmen Görev Dağılımı</h3>
                    <p style="color: var(--color-muted); font-size: var(--font-size-sm); margin: 0;">
                        Seçilen sınavın gözetmen görevlerinin dağılım listesi.
                    </p>
                    <div class="form-group">
                        <label class="form-label" for="rpt-exam-inv">Sınav</label>
                        <select id="rpt-exam-inv" class="form-input">
                            <option value="">-- Sınav Seçin --</option>
                        </select>
                    </div>
                    <button class="btn-accent" id="rpt-inv-pdf" style="background: var(--color-accent);">📄 PDF Oluştur</button>
                    <div id="rpt-inv-preview" style="font-size: var(--font-size-sm); color: var(--color-muted);"></div>
                </div>

                <!-- TÜM GÖZETMEN İŞ YÜKÜ -->
                <div class="card" style="display: flex; flex-direction: column; gap: var(--space-md); grid-column: 1/-1;">
                    <h3 style="color: var(--color-success); margin: 0;">⚖️ Gözetmen İş Yükü Raporu</h3>
                    <p style="color: var(--color-muted); font-size: var(--font-size-sm); margin: 0;">
                        Tüm öğretim elemanlarının toplam gözetmenlik sayılarını gösteren dağılım listesi.
                    </p>
                    <button class="btn-secondary" id="rpt-load-pdf">📄 İş Yükü Listesi PDF</button>
                    <div id="rpt-load-preview"></div>
                </div>

            </div>
        </div>
        `;
    }

    async mount() {
        // ── Populate exam dropdowns ────────────────────────────────
        try {
            const exams = await Api.request('admin/exams');
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
            Toast.error('Sınavlar yüklenemedi: ' + err.message);
        }

        // ── Sınıf bazlı sınav listesi ─────────────────────────────
        document.getElementById('rpt-cls-pdf').onclick = async () => {
            const sel = document.getElementById('rpt-exam-cls');
            const examId = sel.value;
            if (!examId) { Toast.error('Önce bir sınav seçin.'); return; }
            const examOpt = sel.options[sel.selectedIndex];
            const examName = examOpt.dataset.name;
            const examDate = examOpt.dataset.date;
            const preview = document.getElementById('rpt-cls-preview');
            const btn = document.getElementById('rpt-cls-pdf');
            btn.disabled = true;
            preview.textContent = 'Veri yükleniyor…';
            try {
                const all = await Api.request('admin/invigilator-assignments');
                const filtered = all.filter(a => String(a.examId) === String(examId));
                if (!filtered.length) {
                    preview.textContent = '⚠ Bu sınav için kayıtlı atama bulunamadı.';
                    return;
                }

                const byRoom = {};
                filtered.forEach(a => {
                    if (!byRoom[a.classroomName]) byRoom[a.classroomName] = { invigilators: [] };
                    byRoom[a.classroomName].examTime = a.examTime;
                    byRoom[a.classroomName].invigilators.push(a.instructorName);
                });

                const columns = ['Derslik', 'Saat', 'Sınav Adı', 'Gözetmen(ler)'];
                const rows = Object.entries(byRoom).map(([room, d]) => [
                    room,
                    String(d.examTime || ''),
                    examName,
                    d.invigilators.join(', ')
                ]);

                _buildPdf(
                    'Sınıf Bazlı Sınav Listesi',
                    `${examName} | ${examDate}`,
                    columns, rows,
                    `${examDate}_Sinif_Sinav_Listesi`
                );
                preview.textContent = `✅ ${rows.length} sınıf için PDF oluşturuldu.`;
            } catch (err) {
                console.error(err);
                preview.textContent = 'Hata: ' + err.message;
            } finally {
                btn.disabled = false;
            }
        };

        // ── Gözetmen görev dağılım listesi ────────────────────────
        document.getElementById('rpt-inv-pdf').onclick = async () => {
            const sel = document.getElementById('rpt-exam-inv');
            const examId = sel.value;
            if (!examId) { Toast.error('Önce bir sınav seçin.'); return; }
            const examOpt = sel.options[sel.selectedIndex];
            const examName = examOpt.dataset.name;
            const examDate = examOpt.dataset.date;
            const preview = document.getElementById('rpt-inv-preview');
            const btn = document.getElementById('rpt-inv-pdf');
            btn.disabled = true;
            preview.textContent = 'Veri yükleniyor…';
            try {
                const all = await Api.request('admin/invigilator-assignments');
                const filtered = all.filter(a => String(a.examId) === String(examId));
                if (!filtered.length) {
                    preview.textContent = '⚠ Bu sınav için kayıtlı atama bulunamadı.';
                    return;
                }

                const columns = ['Sıra', 'Gözetmen', 'Derslik', 'Saat'];
                const rows = filtered.map((a, i) => [
                    String(i + 1),
                    a.instructorName,
                    a.classroomName,
                    String(a.examTime || '')
                ]);

                _buildPdf(
                    'Gözetmen Görev Dağılım Listesi',
                    `${examName} | ${examDate}`,
                    columns, rows,
                    `${examDate}_Gozetmen_Gorevlendirme`
                );
                preview.textContent = `✅ ${rows.length} görev için PDF oluşturuldu.`;
            } catch (err) {
                console.error(err);
                preview.textContent = 'Hata: ' + err.message;
            } finally {
                btn.disabled = false;
            }
        };

        // ── İş yükü raporu ────────────────────────────────────────
        document.getElementById('rpt-load-pdf').onclick = async () => {
            const preview = document.getElementById('rpt-load-preview');
            const btn = document.getElementById('rpt-load-pdf');
            btn.disabled = true;
            preview.textContent = 'Veri yükleniyor…';
            try {
                const instructors = await Api.request('admin/instructors');
                const sorted = [...instructors].sort((a, b) => (b.dutyCount || 0) - (a.dutyCount || 0));

                const columns = ['Sıra', 'Öğretim Elemanı', 'Bölüm', 'Toplam Görev'];
                const rows = sorted.map((i, idx) => [
                    String(idx + 1),
                    i.fullName,
                    i.departmentName || '-',
                    String(i.dutyCount ?? 0)
                ]);

                const today = new Date().toISOString().slice(0, 10);
                _buildPdf(
                    'Gözetmen İş Yükü Raporu',
                    `Tüm Dönem — ${today}`,
                    columns, rows,
                    `${today}_Is_Yuku_Raporu`
                );
                preview.innerHTML = sorted.map(i =>
                    `<span class="badge badge--info" style="margin:2px">${i.fullName}: ${i.dutyCount ?? 0}</span>`
                ).join('');
            } catch (err) {
                console.error(err);
                preview.textContent = 'Hata: ' + err.message;
            } finally {
                btn.disabled = false;
            }
        };
    }

    unmount() {}
}
