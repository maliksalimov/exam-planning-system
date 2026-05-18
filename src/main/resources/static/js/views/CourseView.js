import { CrudView } from '../components/CrudView.js';

export default class CourseView extends CrudView {
    constructor() {
        super({
            title: 'Courses',
            endpoint: 'admin/courses',
            idKey: 'courseId',
            columns: [
                { key: 'courseCode', label: 'Code' },
                { key: 'courseName', label: 'Course Name' },
                { key: 'departmentName', label: 'Department' },
                { key: 'instructorName', label: 'Instructor' },
                { key: 'semester', label: 'Semester' }
            ],
            formFields: [
                { key: 'courseCode', label: 'Course Code', type: 'text', required: true },
                { key: 'courseName', label: 'Course Name', type: 'text', required: true },
                { key: 'semester', label: 'Semester', type: 'text', required: true },
                { key: 'departmentId', label: 'Department', type: 'select', required: true, optionsEndpoint: 'admin/departments', optionValue: 'departmentId', optionLabel: 'departmentName' },
                { key: 'instructorId', label: 'Instructor', type: 'select', required: true, optionsEndpoint: 'admin/instructors', optionValue: 'instructorId', optionLabel: 'fullName' }
            ]
        });
    }
}
