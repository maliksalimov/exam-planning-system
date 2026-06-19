import { Toast } from '../api.js';

export const PdfGenerator = {
    async _generateFromHtml(htmlContent, filename) {
        if (!window.html2pdf) {
            Toast.error('PDF library not loaded.');
            return;
        }

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '210mm';
        container.innerHTML = `
            <div style="font-family: 'Inter', sans-serif; color: #111; padding: 20px; font-size: 11px;">
                ${htmlContent}
            </div>
        `;
        document.body.appendChild(container);

        try {
            await window.html2pdf().set({
                margin:       10,
                filename:     filename.endsWith('.pdf') ? filename : filename + '.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(container).save();
        } finally {
            document.body.removeChild(container);
        }
    },

    _getHeader(title, subtitle = '') {
        return `
            <div style="margin-bottom: 20px; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                <h1 style="margin: 0; color: #1e3a8a; font-size: 16px; text-transform: uppercase;">UNIVERSITY EXAM MANAGEMENT SYSTEM</h1>
                <div style="color: #4b5563; font-size: 10px; margin-bottom: 15px;">Exam Planning and Invigilator Assignment Module</div>
                <h2 style="margin: 0; font-size: 18px; color: #111;">${title}</h2>
                ${subtitle ? `<div style="color: #6b7280; font-size: 12px; margin-top: 5px;">${subtitle}</div>` : ''}
                <div style="font-size: 9px; color: #9ca3af; margin-top: 10px; text-align: right;">
                    Generated: ${new Date().toLocaleString('en-US')}
                </div>
            </div>
        `;
    },

    async generateExamRoomStudentList(room, examData) {
        const header = this._getHeader(`${room.classroom} — Student List`, `${examData.examName} | ${examData.examDate} ${examData.examTime}`);

        let html = `
            ${header}
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: bold; font-size: 12px;">
                <div>Invigilator(s): <span style="font-weight:normal;">${room.invigilatorNames.join(' | ')}</span></div>
                <div>Rule: <span style="font-weight:normal;">${room.invigilatorRule || ''}</span></div>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #eff6ff; border-bottom: 2px solid #93c5fd;">
                        <th style="padding: 8px; text-align: left;">#</th>
                        <th style="padding: 8px; text-align: left;">Student No</th>
                        <th style="padding: 8px; text-align: left;">Room / Hall</th>
                        <th style="padding: 8px; text-align: left;">Seat No</th>
                    </tr>
                </thead>
                <tbody>
                    ${room.studentNumbers.map((no, idx) => `
                        <tr style="border-bottom: 1px solid #e5e7eb; background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                            <td style="padding: 8px;">${idx + 1}</td>
                            <td style="padding: 8px;">${no}</td>
                            <td style="padding: 8px;">${room.classroom}</td>
                            <td style="padding: 8px;">${idx + 1}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="font-weight: bold;">Total Students: ${room.studentNumbers.length} / ${room.capacity}</div>
        `;

        await this._generateFromHtml(html, `${room.classroom.replace(/\\s+/g, '_')}_Student_List`);
    },

    async generateInvigilatorSignSheet(room, examData) {
        const header = this._getHeader(`Invigilator Sign Sheet — ${room.classroom}`, `${examData.examName} | ${examData.examDate} ${examData.examTime}`);

        let html = `
            ${header}
            <div style="margin-bottom: 15px; font-weight: bold; font-size: 12px;">
                Room Capacity: <span style="font-weight:normal;">${room.capacity}</span> &nbsp;&nbsp;|&nbsp;&nbsp;
                Student Count: <span style="font-weight:normal;">${room.studentsAssigned || room.studentNumbers?.length || '-'}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background: #eff6ff; border-bottom: 2px solid #93c5fd;">
                        <th style="padding: 10px; text-align: left;">#</th>
                        <th style="padding: 10px; text-align: left;">Invigilator Name</th>
                        <th style="padding: 10px; text-align: center;">Start Signature</th>
                        <th style="padding: 10px; text-align: center;">End Signature</th>
                    </tr>
                </thead>
                <tbody>
                    ${room.invigilatorNames.map((name, idx) => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px;">${idx + 1}</td>
                            <td style="padding: 10px;">${name.replace(/\\s*\\(duties:\\s*\\d+\\)/, '')}</td>
                            <td style="padding: 10px; text-align: center;">__________________</td>
                            <td style="padding: 10px; text-align: center;">__________________</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="padding: 15px; border: 1px dashed #d1d5db; background: #f9fafb; font-size: 10px; color: #4b5563;">
                <b>Declaration:</b> Invigilators declare that they have supervised the exam for the relevant course honestly and in accordance with the rules.
            </div>
        `;

        await this._generateFromHtml(html, `${room.classroom.replace(/\\s+/g, '_')}_Sign_Sheet`);
    },

    async generateStudentExamCard(student) {
        const header = this._getHeader('Student Exam Location Document');

        let html = `
            ${header}
            <div style="margin-bottom: 20px; font-size: 12px; line-height: 1.6;">
                <strong>Full Name:</strong> ${student.fullName}<br>
                <strong>Student No:</strong> ${student.studentNo}<br>
                <strong>Department:</strong> ${student.departmentName || '-'}<br>
                <strong>Faculty:</strong> ${student.facultyName || '-'}
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #eff6ff; border-bottom: 2px solid #93c5fd;">
                        <th style="padding: 8px; text-align: left;">Course / Exam Name</th>
                        <th style="padding: 8px; text-align: left;">Date</th>
                        <th style="padding: 8px; text-align: left;">Time</th>
                        <th style="padding: 8px; text-align: left;">Campus / Building</th>
                        <th style="padding: 8px; text-align: left;">Classroom</th>
                        <th style="padding: 8px; text-align: left;">Seat</th>
                    </tr>
                </thead>
                <tbody>
                    ${(student.exams || []).map((ex, idx) => `
                        <tr style="border-bottom: 1px solid #e5e7eb; background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                            <td style="padding: 8px;">${ex.courseName}</td>
                            <td style="padding: 8px;">${ex.examDate}</td>
                            <td style="padding: 8px;">${ex.examTime}</td>
                            <td style="padding: 8px;">${ex.campus} / ${ex.building}</td>
                            <td style="padding: 8px; font-weight: bold;">${ex.classroom}</td>
                            <td style="padding: 8px;">${ex.seatNumber || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-top: 15px; font-size: 9px; color: #6b7280;">This document is for informational purposes only.</div>
        `;

        await this._generateFromHtml(html, `${student.studentNo}_Exam_Location`);
    },

    async generateGeneralExamPlan(examData) {
        const header = this._getHeader('General Exam Plan', `${examData.examName} | ${examData.examDate} ${examData.examTime}`);

        let html = `
            ${header}
            <div style="display: flex; gap: 20px; font-weight: bold; margin-bottom: 20px; font-size: 12px; background: #f3f4f6; padding: 10px; border-radius: 4px;">
                <div>Total Students: <span style="color:#2563eb">${examData.totalStudents}</span></div>
                <div>Rooms Used: <span style="color:#2563eb">${examData.classroomsUsed}</span></div>
                <div>Total Invigilators: <span style="color:#2563eb">${examData.invigilatorsAssigned}</span></div>
            </div>

            ${(examData.classrooms || []).map((room, idx) => `
                <div style="border: 1px solid #d1d5db; margin-bottom: 20px; border-radius: 6px; overflow: hidden; page-break-inside: avoid;">
                    <div style="background: #e0e7ff; padding: 10px; font-weight: bold; color: #1e40af; border-bottom: 1px solid #d1d5db;">
                        Room ${idx + 1}: ${room.classroom}
                    </div>
                    <div style="padding: 10px;">
                        <div style="margin-bottom: 5px;"><strong>Capacity:</strong> ${room.capacity} &nbsp;|&nbsp; <strong>Students:</strong> ${room.studentsAssigned} &nbsp;|&nbsp; <em>${room.invigilatorRule || ''}</em></div>
                        <div style="margin-bottom: 10px;"><strong>Invigilators:</strong> ${room.invigilatorNames.join(', ')}</div>
                        <div>
                            <strong>Student Numbers:</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px;">
                                ${room.studentNumbers.map(no => `<span style="background:#f3f4f6; padding: 2px 6px; border:1px solid #e5e7eb; border-radius:3px; font-size:10px;">${no}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;

        await this._generateFromHtml(html, `${examData.examName.replace(/\\s+/g, '_')}_General_Plan`);
    },

    async generateClassroomExamList(date, assignments) {
        const header = this._getHeader('Classroom-Based Exam List', `Date: ${date}`);

        let html = `
            ${header}
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #eff6ff; border-bottom: 2px solid #93c5fd;">
                        <th style="padding: 10px; text-align: left;">Classroom</th>
                        <th style="padding: 10px; text-align: left;">Time</th>
                        <th style="padding: 10px; text-align: left;">Exam / Course Name</th>
                        <th style="padding: 10px; text-align: center;">Student Count</th>
                        <th style="padding: 10px; text-align: left;">Invigilator(s)</th>
                    </tr>
                </thead>
                <tbody>
                    ${(assignments || []).map((a, idx) => `
                        <tr style="border-bottom: 1px solid #e5e7eb; background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                            <td style="padding: 10px; font-weight: bold;">${a.classroom || '-'}</td>
                            <td style="padding: 10px;">${a.examTime || '-'}</td>
                            <td style="padding: 10px;">${a.examName || '-'}</td>
                            <td style="padding: 10px; text-align: center;">${a.studentCount || '-'}</td>
                            <td style="padding: 10px;">${(a.invigilators || []).join(', ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        await this._generateFromHtml(html, `${date}_Classroom_Exam_List`);
    },

    async generateInvigilatorDutyList(date, duties) {
        const header = this._getHeader('Invigilator Duty Assignment List', `Date/Period: ${date}`);

        let html = `
            ${header}
            <div style="font-weight: bold; margin-bottom: 10px;">Total Duties: ${(duties || []).length}</div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #eff6ff; border-bottom: 2px solid #93c5fd;">
                        <th style="padding: 10px; text-align: left;">#</th>
                        <th style="padding: 10px; text-align: left;">Instructor</th>
                        <th style="padding: 10px; text-align: left;">Exam Name</th>
                        <th style="padding: 10px; text-align: left;">Time</th>
                        <th style="padding: 10px; text-align: left;">Classroom / Hall</th>
                        <th style="padding: 10px; text-align: center;">Total Duties</th>
                    </tr>
                </thead>
                <tbody>
                    ${(duties || []).map((d, idx) => `
                        <tr style="border-bottom: 1px solid #e5e7eb; background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                            <td style="padding: 10px;">${idx + 1}</td>
                            <td style="padding: 10px; font-weight:bold;">${d.instructorName || '-'}</td>
                            <td style="padding: 10px;">${d.examName || '-'}</td>
                            <td style="padding: 10px;">${d.examTime || '-'}</td>
                            <td style="padding: 10px;">${d.classroom || '-'}</td>
                            <td style="padding: 10px; text-align: center;">
                                <span style="background: #dbeafe; padding: 2px 8px; border-radius: 12px; color: #1e3a8a; font-weight:bold;">
                                    ${d.dutyCount ?? '-'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        await this._generateFromHtml(html, `${date}_Invigilator_Duty_List`);
    }
};
