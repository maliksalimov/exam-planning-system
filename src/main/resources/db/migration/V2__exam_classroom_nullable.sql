-- Make classroom_id nullable in exams table
-- Reason: PDF §5.6 schema does not include classroom_id in exams.
--         Classroom assignment happens during planning, not at exam creation.
--
-- Apply manually on the remote MySQL server:
--   mysql -h sql12.freesqldatabase.com -u <user> -p <db> < V2__exam_classroom_nullable.sql

ALTER TABLE exams MODIFY COLUMN classroom_id BIGINT NULL;
