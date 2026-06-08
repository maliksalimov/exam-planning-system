package com.malik.examplanningsystem.config;

import com.malik.examplanningsystem.entity.*;
import com.malik.examplanningsystem.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository        userRepository;
    private final FacultyRepository     facultyRepository;
    private final DepartmentRepository  departmentRepository;
    private final InstructorRepository  instructorRepository;
    private final CourseRepository      courseRepository;
    private final ClassroomRepository   classroomRepository;
    private final StudentRepository     studentRepository;
    private final ExamRepository        examRepository;
    private final PasswordEncoder       passwordEncoder;

    // ── name pools ──────────────────────────────────────────────────────────────
    private static final String[] FIRST = {
        "Ali","Aysel","Murad","Leyla","Kamran","Nigar","Farid","Gunel","Elvin","Sevinc",
        "Tural","Aytac","Rashad","Sabina","Elnur","Nargiz","Orhan","Zulfiyya","Ceyhun","Arzu",
        "Vugar","Ulviyya","Fuad","Konul","Nicat","Lamiya","Tarlan","Shirin","Anar","Nuray",
        "Fagan","Gulnar","Namig","Samira","Emin","Jalal","Maryam","Ilkin","Rauf","Nilan"
    };
    private static final String[] LAST = {
        "Aliyev","Hasanov","Mammadov","Huseynov","Quliyev","Rzayev","Bagirov","Ahmadov",
        "Ismayilov","Karimov","Musayev","Jafarov","Abbasov","Nagiyev","Suleymanov","Asadov",
        "Orujov","Babayev","Valiyev","Eyvazov","Tahirov","Mirzayev","Gasimov","Ramazanov",
        "Hajiyev","Nazarov","Sharifov","Isgenderov","Yunusov","Salimov"
    };

    // ── faculty / department structure ───────────────────────────────────────────
    private static final String[][] FACULTY_DEPT = {
        {"Faculty of Engineering",
            "Computer Engineering","Electrical Engineering","Mechanical Engineering","Civil Engineering","Software Engineering"},
        {"Faculty of Natural Sciences",
            "Mathematics","Physics","Chemistry","Biology","Statistics"},
        {"Faculty of Medicine",
            "General Medicine","Surgery","Pediatrics","Pharmacology","Biochemistry"},
        {"Faculty of Law",
            "Civil Law","Criminal Law","International Law","Administrative Law","Constitutional Law"},
        {"Faculty of Economics",
            "Economics","Finance","Accounting","Business Administration","International Trade"},
        {"Faculty of Education",
            "Primary Education","Secondary Education","Special Education","Educational Psychology","Curriculum Studies"},
        {"Faculty of Architecture",
            "Architecture","Urban Planning","Interior Design","Landscape Architecture","Industrial Design"},
        {"Faculty of Arts and Humanities",
            "History","Philosophy","Literature","Linguistics","Cultural Studies"},
        {"Faculty of Social Sciences",
            "Sociology","Political Science","Anthropology","Geography","Public Administration"},
        {"Faculty of Communication",
            "Journalism","Public Relations","Radio and Television","New Media","Advertising"},
        {"Faculty of Agriculture",
            "Agronomy","Animal Science","Food Technology","Agricultural Economics","Horticulture"},
        {"Faculty of Pharmacy",
            "Pharmaceutical Sciences","Clinical Pharmacy","Pharmacognosy","Toxicology","Cosmetic Science"},
        {"Faculty of Dentistry",
            "General Dentistry","Orthodontics","Oral Surgery","Periodontics","Pedodontics"},
        {"Faculty of Mathematics",
            "Applied Mathematics","Pure Mathematics","Numerical Analysis","Operations Research","Data Science"},
        {"Faculty of Physics",
            "Theoretical Physics","Applied Physics","Nuclear Physics","Optics","Biophysics"},
        {"Faculty of Chemistry",
            "Organic Chemistry","Inorganic Chemistry","Physical Chemistry","Analytical Chemistry","Polymer Chemistry"},
        {"Faculty of Psychology",
            "Clinical Psychology","Developmental Psychology","Social Psychology","Neuropsychology","Counseling"},
        {"Faculty of Sports Science",
            "Physical Education","Sports Management","Coaching","Kinesiology","Recreation"},
        {"Faculty of International Relations",
            "Diplomacy","Foreign Policy","International Organizations","Security Studies","European Studies"},
        {"Faculty of Information Technology",
            "Cybersecurity","Artificial Intelligence","Database Systems","Networks","Cloud Computing"}
    };

    private static final String[][] COURSE_TEMPLATES = {
        {"Introduction to %s","Advanced %s","Research Methods in %s","Applications of %s","Seminar in %s"},
    };

    @Override
    public void run(ApplicationArguments args) {
        seedAdminUser();
        if (facultyRepository.count() == 0) {
            log.info("No data found — seeding demo dataset...");
            long start = System.currentTimeMillis();
            seedAll();
            log.info("Demo data seeded in {} ms", System.currentTimeMillis() - start);
        }
        if (examRepository.count() == 0) {
            seedExams();
        }
    }

    // ── admin ────────────────────────────────────────────────────────────────────
    private void seedAdminUser() {
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
            log.warn("==========================================================");
            log.warn("  Default admin account created.");
            log.warn("  Username : admin");
            log.warn("  Password : admin123");
            log.warn("  Change this password immediately after first login.");
            log.warn("==========================================================");
        }
    }

    // ── main seed ────────────────────────────────────────────────────────────────
    private void seedAll() {
        List<Faculty>    faculties    = seedFaculties();
        List<Department> departments  = seedDepartments(faculties);
        List<Instructor> instructors  = seedInstructors(departments);
        seedCourses(departments, instructors);
        seedClassrooms();
        seedStudents(departments);
    }

    // ── faculties ────────────────────────────────────────────────────────────────
    private List<Faculty> seedFaculties() {
        List<Faculty> list = new ArrayList<>();
        for (String[] row : FACULTY_DEPT) {
            Faculty f = new Faculty();
            f.setFacultyName(row[0]);
            list.add(f);
        }
        List<Faculty> saved = facultyRepository.saveAll(list);
        log.info("  {} faculties created", saved.size());
        return saved;
    }

    // ── departments ──────────────────────────────────────────────────────────────
    private List<Department> seedDepartments(List<Faculty> faculties) {
        List<Department> list = new ArrayList<>();
        for (int i = 0; i < FACULTY_DEPT.length; i++) {
            Faculty faculty = faculties.get(i);
            String[] deptNames = FACULTY_DEPT[i];
            for (int d = 1; d < deptNames.length; d++) {
                Department dept = new Department();
                dept.setDepartmentName(deptNames[d]);
                dept.setFaculty(faculty);
                list.add(dept);
            }
        }
        List<Department> saved = departmentRepository.saveAll(list);
        log.info("  {} departments created", saved.size());
        return saved;
    }

    // ── instructors (1–2 per department) ────────────────────────────────────────
    private List<Instructor> seedInstructors(List<Department> departments) {
        List<Instructor> list = new ArrayList<>();
        int seq = 1;
        for (int i = 0; i < departments.size(); i++) {
            Department dept = departments.get(i);
            int count = (i % 3 == 0) ? 2 : 1;   // every 3rd dept gets 2 instructors
            for (int n = 0; n < count; n++) {
                String first = FIRST[seq % FIRST.length];
                String last  = LAST[seq  % LAST.length];
                Instructor inst = new Instructor();
                inst.setStaffNo(String.format("STAFF-%04d", seq));
                inst.setFullName("Dr. " + first + " " + last);
                inst.setEmail(first.toLowerCase() + "." + last.toLowerCase() + seq + "@university.edu");
                inst.setDepartment(dept);
                inst.setIsAvailableForInvigilation(true);
                inst.setDutyCount(0);
                list.add(inst);
                seq++;
            }
        }
        List<Instructor> saved = instructorRepository.saveAll(list);
        log.info("  {} instructors created", saved.size());
        return saved;
    }

    // ── courses (2 per department) ────────────────────────────────────────────
    private void seedCourses(List<Department> departments, List<Instructor> instructors) {
        List<Course> list = new ArrayList<>();
        int courseSeq = 1;
        for (int i = 0; i < departments.size(); i++) {
            Department dept = departments.get(i);
            Instructor inst = instructors.get(i % instructors.size());
            for (int lvl = 1; lvl <= 2; lvl++) {
                Course c = new Course();
                c.setCourseCode(String.format("C%04d", courseSeq++));
                c.setCourseName(lvl == 1
                    ? "Introduction to " + dept.getDepartmentName()
                    : "Advanced Topics in " + dept.getDepartmentName());
                c.setInstructor(inst);
                c.setDepartment(dept);
                c.setSemester(lvl == 1 ? "Fall" : "Spring");
                c.setCreditHours(3);
                list.add(c);
            }
        }
        courseRepository.saveAll(list);
        log.info("  {} courses created", list.size());
    }

    // ── classrooms ────────────────────────────────────────────────────────────
    private void seedClassrooms() {
        String[][] rooms = {
            {"Main","Block A","A-101","50"},  {"Main","Block A","A-102","50"},
            {"Main","Block A","A-201","80"},  {"Main","Block A","A-202","80"},
            {"Main","Block B","B-101","100"}, {"Main","Block B","B-102","100"},
            {"Main","Block B","B-201","120"}, {"Main","Block B","B-301","150"},
            {"Main","Block C","C-101","200"}, {"Main","Block C","C-102","200"},
            {"Main","Block C","C-201","250"}, {"Main","Block C","C-301","300"},
            {"North","Science Bldg","S-101","60"},{"North","Science Bldg","S-201","60"},
            {"North","Science Bldg","S-301","90"},{"North","Science Bldg","S-401","90"},
            {"North","Tech Bldg","T-101","120"},  {"North","Tech Bldg","T-201","150"},
            {"South","Arts Bldg","AR-101","40"},  {"South","Arts Bldg","AR-201","40"},
            {"South","Law Bldg","L-101","80"},    {"South","Law Bldg","L-201","80"},
            {"South","Med Bldg","M-101","60"},    {"South","Med Bldg","M-201","60"},
            {"East","Amphi","AMP-1","400"},       {"East","Amphi","AMP-2","400"},
            {"East","Conf Hall","CONF-1","500"},  {"East","Conf Hall","CONF-2","500"},
            {"West","Annex A","AN-101","45"},     {"West","Annex A","AN-201","45"}
        };
        List<Classroom> list = new ArrayList<>();
        for (String[] r : rooms) {
            Classroom c = new Classroom();
            c.setCampus(r[0]); c.setBuilding(r[1]); c.setRoomName(r[2]);
            c.setCapacity(Integer.parseInt(r[3]));
            c.setIsAvailable(true);
            c.setTechnicalFeatures("Projector, Whiteboard");
            list.add(c);
        }
        classroomRepository.saveAll(list);
        log.info("  {} classrooms created", list.size());
    }

    // ── students (102 per department = 10,200 total) ──────────────────────────
    private void seedStudents(List<Department> departments) {
        int BATCH = 500;
        int total = 0;
        long tcBase = 10_000_000_000L;
        int stuSeq  = 1;

        List<Student> batch = new ArrayList<>(BATCH);

        for (Department dept : departments) {
            Faculty faculty = dept.getFaculty();
            for (int n = 0; n < 102; n++) {
                String first = FIRST[stuSeq % FIRST.length];
                String last  = LAST[(stuSeq * 7) % LAST.length];  // offset for variety

                Student s = new Student();
                s.setStudentNo(String.format("STU-%07d", stuSeq));
                s.setTcNo(String.valueOf(tcBase + stuSeq));
                s.setFullName(first + " " + last);
                s.setFaculty(faculty);
                s.setDepartment(dept);
                batch.add(s);
                stuSeq++;

                if (batch.size() == BATCH) {
                    studentRepository.saveAll(batch);
                    total += batch.size();
                    batch.clear();
                    log.info("  ... {} students inserted", total);
                }
            }
        }
        if (!batch.isEmpty()) {
            studentRepository.saveAll(batch);
            total += batch.size();
        }
        log.info("  {} students created", total);
    }

    // ── exams (40 exams across 10 days, 4 slots/day) ─────────────────────────
    private void seedExams() {
        List<Course> courses = courseRepository.findAll();
        if (courses.isEmpty()) return;

        LocalDate[] dates = {
            LocalDate.of(2026, 7,  1), LocalDate.of(2026, 7,  2), LocalDate.of(2026, 7,  3),
            LocalDate.of(2026, 7,  7), LocalDate.of(2026, 7,  8), LocalDate.of(2026, 7,  9),
            LocalDate.of(2026, 7, 14), LocalDate.of(2026, 7, 15), LocalDate.of(2026, 7, 16),
            LocalDate.of(2026, 7, 21)
        };
        LocalTime[] times = {
            LocalTime.of(9, 0), LocalTime.of(11, 0), LocalTime.of(13, 0), LocalTime.of(15, 0)
        };

        int total = Math.min(dates.length * times.length, courses.size());
        List<Exam> exams = new ArrayList<>(total);

        int slot = 0;
        outer:
        for (LocalDate date : dates) {
            for (LocalTime time : times) {
                if (slot >= total) break outer;
                Course course = courses.get(slot);
                String type = slot < 20 ? "MIDTERM" : "FINAL";

                Exam exam = new Exam();
                exam.setCourse(course);
                exam.setExamName(course.getCourseName() + (type.equals("MIDTERM") ? " Midterm" : " Final"));
                exam.setExamType(type);
                exam.setExamDate(date);
                exam.setExamTime(time);
                exam.setDuration(slot % 3 == 0 ? 120 : 90);
                exam.setIsCommonExam(false);
                exams.add(exam);
                slot++;
            }
        }

        examRepository.saveAll(exams);
        log.info("  {} exams created", exams.size());
    }
}
