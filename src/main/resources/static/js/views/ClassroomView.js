import { CrudView } from '../components/CrudView.js';

export default class ClassroomView extends CrudView {
    constructor() {
        super({
            title: 'Classrooms',
            endpoint: 'admin/classrooms',
            idKey: 'classroomId',
            columns: [
                { key: 'campus', label: 'Campus' },
                { key: 'building', label: 'Building' },
                { key: 'roomName', label: 'Room' },
                { key: 'capacity', label: 'Capacity' },
                { key: 'isAvailableForExam', label: 'Available', render: (val) => val ? '<span class="badge badge--success">Yes</span>' : '<span class="badge badge--danger">No</span>' }
            ],
            formFields: [
                { key: 'campus', label: 'Campus', type: 'text', required: true },
                { key: 'building', label: 'Building', type: 'text', required: true },
                { key: 'roomName', label: 'Room Name', type: 'text', required: true },
                { key: 'capacity', label: 'Capacity', type: 'number', required: true },
                { key: 'isAvailableForExam', label: 'Is Available for Exams?', type: 'checkbox' }
            ]
        });
    }
}
