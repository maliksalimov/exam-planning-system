import { CrudView } from '../components/CrudView.js';

export default class ExamView extends CrudView {
    constructor() {
        super({
            title: 'Exams',
            endpoint: 'admin/exams',
            idKey: 'examId',
            columns: [
                { key: 'examName', label: 'Exam Name' },
                { key: 'examType', label: 'Type', render: (v) => v ? `<span class="badge badge--info">${v}</span>` : '-' },
                { key: 'examDate', label: 'Date' },
                { key: 'examTime', label: 'Time' },
                { key: 'duration', label: 'Duration (min)' },
                { key: 'courseName', label: 'Course' },
                { key: 'classroomName', label: 'Classroom' },
                { key: 'isCommonExam', label: 'Common', render: (val) => val ? '<span class="badge badge--info">Yes</span>' : '<span class="badge badge--success">No</span>' }
            ],
            formFields: [
                { key: 'examName', label: 'Exam Name', type: 'text', required: true },
                {
                    key: 'examType', label: 'Exam Type', type: 'select', required: true,
                    options: [
                        { value: 'MIDTERM', label: 'Midterm' },
                        { value: 'FINAL',   label: 'Final' },
                        { value: 'QUIZ',    label: 'Quiz' },
                        { value: 'MAKEUP',  label: 'Makeup' }
                    ]
                },
                { key: 'examDate', label: 'Exam Date', type: 'date', required: true },
                { key: 'examTime', label: 'Exam Time', type: 'time', required: true },
                { key: 'duration', label: 'Duration (minutes)', type: 'number', required: true, defaultValue: 90 },
                { key: 'courseId',    label: 'Course',    type: 'select', required: true, optionsEndpoint: 'admin/courses',    optionValue: 'courseId',    optionLabel: 'courseName' },
                { key: 'classroomId', label: 'Classroom', type: 'select', required: true, optionsEndpoint: 'admin/classrooms', optionValue: 'classroomId', optionLabel: 'roomName' },
                { key: 'isCommonExam', label: 'Is Common Exam?', type: 'checkbox' }
            ]
        });
    }
}
