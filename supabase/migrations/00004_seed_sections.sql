-- SERHUB Sections Seed Data
-- CHE Self-Evaluation Report Structure

-- Level 1 sections (main chapters)
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('0', 'Executive Summary', 'Overview of the self-evaluation report highlighting key findings and recommendations', 1, null, 0),
('1', 'The Institution and the Parent Unit', 'Description of the institution, its mission, and organizational structure', 1, null, 1),
('2', 'Internal Quality Assurance', 'Quality assurance policies, procedures, and continuous improvement processes', 1, null, 2),
('3', 'The Department and the Study Program', 'Comprehensive evaluation of the academic department and its programs', 1, null, 3);

-- Level 2 sections under Chapter 1
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('1.1', 'Institution Summary', 'Brief overview of the institution including history, size, and scope', 2, (select id from serhub_sections where number = '1'), 1),
('1.2', 'Mission Statement', 'The institution''s mission, vision, and strategic goals', 2, (select id from serhub_sections where number = '1'), 2),
('1.3', 'Parent Unit Description', 'Description of the faculty or school housing the department', 2, (select id from serhub_sections where number = '1'), 3),
('1.4', 'Decision-Making Process', 'Governance structure and decision-making procedures', 2, (select id from serhub_sections where number = '1'), 4);

-- Level 2 sections under Chapter 2
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('2.1', 'QA Policy Compliance', 'Compliance with national and institutional quality assurance requirements', 2, (select id from serhub_sections where number = '2'), 1),
('2.2', 'Stakeholder Participation', 'Involvement of stakeholders in quality assurance processes', 2, (select id from serhub_sections where number = '2'), 2),
('2.3', 'Action Plan', 'Strategic action plan for quality improvement', 2, (select id from serhub_sections where number = '2'), 3),
('2.4', 'Stakeholder Involvement', 'Mechanisms for ongoing stakeholder engagement', 2, (select id from serhub_sections where number = '2'), 4),
('2.5', 'Report Accessibility', 'Public availability and transparency of quality reports', 2, (select id from serhub_sections where number = '2'), 5),
('2.6', 'Previous Recommendations', 'Response to recommendations from previous evaluations', 2, (select id from serhub_sections where number = '2'), 6),
('2.7', 'Lessons Learned', 'Insights and lessons from quality assurance activities', 2, (select id from serhub_sections where number = '2'), 7),
('2.8', 'Strengths and Challenges', 'Analysis of institutional strengths and areas for improvement', 2, (select id from serhub_sections where number = '2'), 8),
('2.9', 'Section Summary', 'Summary of internal quality assurance chapter', 2, (select id from serhub_sections where number = '2'), 9);

-- Level 2 sections under Chapter 3
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.1', 'Study Programs', 'Overview and analysis of academic programs', 2, (select id from serhub_sections where number = '3'), 1),
('3.2', 'Teaching and Learning Outcomes', 'Assessment of teaching quality and student learning outcomes', 2, (select id from serhub_sections where number = '3'), 2),
('3.3', 'Students', 'Student population, admissions, support services, and outcomes', 2, (select id from serhub_sections where number = '3'), 3),
('3.4', 'Academic Faculty and Human Resources', 'Faculty composition, qualifications, and development', 2, (select id from serhub_sections where number = '3'), 4),
('3.5', 'Diversity', 'Diversity and inclusion policies and practices', 2, (select id from serhub_sections where number = '3'), 5),
('3.6', 'Research', 'Research activities, output, and impact', 2, (select id from serhub_sections where number = '3'), 6),
('3.7', 'Infrastructure', 'Physical and technological infrastructure', 2, (select id from serhub_sections where number = '3'), 7),
('3.8', 'Ultra-Orthodox Study Program', 'Special track for ultra-orthodox students (if applicable)', 2, (select id from serhub_sections where number = '3'), 8);

-- Level 3 sections under 3.1 Study Programs
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.1.1', 'The Study Program/s', 'Detailed description of degree programs and curricula', 3, (select id from serhub_sections where number = '3.1'), 1),
('3.1.2', 'Training and Fieldwork', 'Practical training, internships, and fieldwork requirements', 3, (select id from serhub_sections where number = '3.1'), 2),
('3.1.3', 'Community Engagement', 'Community service and social responsibility activities', 3, (select id from serhub_sections where number = '3.1'), 3),
('3.1.4', 'Internationalization', 'International partnerships, exchange programs, and global engagement', 3, (select id from serhub_sections where number = '3.1'), 4),
('3.1.5', 'Section Summary', 'Summary of study programs section', 3, (select id from serhub_sections where number = '3.1'), 5);

-- Level 3 sections under 3.2 Teaching and Learning
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.2.1', 'Teaching', 'Teaching methods, pedagogical approaches, and innovation', 3, (select id from serhub_sections where number = '3.2'), 1),
('3.2.2', 'Learning Outcomes', 'Definition and assessment of intended learning outcomes', 3, (select id from serhub_sections where number = '3.2'), 2),
('3.2.3', 'Section Summary', 'Summary of teaching and learning outcomes section', 3, (select id from serhub_sections where number = '3.2'), 3);

-- Level 3 sections under 3.3 Students
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.3.1', 'Admission and Graduation', 'Admission criteria, processes, and graduation rates', 3, (select id from serhub_sections where number = '3.3'), 1),
('3.3.2', 'Graduate Studies', 'Master''s and doctoral programs (if applicable)', 3, (select id from serhub_sections where number = '3.3'), 2),
('3.3.3', 'Student Support Services', 'Academic advising, counseling, and student services', 3, (select id from serhub_sections where number = '3.3'), 3),
('3.3.4', 'Alumni', 'Alumni relations, tracking, and outcomes', 3, (select id from serhub_sections where number = '3.3'), 4),
('3.3.5', 'Section Summary', 'Summary of students section', 3, (select id from serhub_sections where number = '3.3'), 5);

-- Level 3 sections under 3.4 Academic Faculty
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.4.1', 'Policy', 'Faculty recruitment, retention, and promotion policies', 3, (select id from serhub_sections where number = '3.4'), 1),
('3.4.2', 'Department Chair and Committees', 'Leadership structure and committee organization', 3, (select id from serhub_sections where number = '3.4'), 2),
('3.4.3', 'Academic Faculty', 'Faculty profiles, qualifications, and expertise', 3, (select id from serhub_sections where number = '3.4'), 3),
('3.4.4', 'Professional Development', 'Faculty development programs and opportunities', 3, (select id from serhub_sections where number = '3.4'), 4),
('3.4.5', 'Technical and Administrative Staff', 'Support staff composition and roles', 3, (select id from serhub_sections where number = '3.4'), 5),
('3.4.6', 'Section Summary', 'Summary of academic faculty section', 3, (select id from serhub_sections where number = '3.4'), 6);

-- Level 3 sections under 3.7 Infrastructure
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.7.1', 'Physical Infrastructure', 'Buildings, classrooms, laboratories, and facilities', 3, (select id from serhub_sections where number = '3.7'), 1),
('3.7.2', 'Libraries and Databases', 'Library resources, digital collections, and research databases', 3, (select id from serhub_sections where number = '3.7'), 2),
('3.7.3', 'Section Summary', 'Summary of infrastructure section', 3, (select id from serhub_sections where number = '3.7'), 3);

-- Level 3 sections under 3.8 Ultra-Orthodox Program
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.8.1', 'Overview', 'Introduction to the ultra-orthodox study track', 3, (select id from serhub_sections where number = '3.8'), 1),
('3.8.2', 'The Study Program', 'Curriculum adaptations and special requirements', 3, (select id from serhub_sections where number = '3.8'), 2),
('3.8.3', 'Faculty', 'Teaching staff for the ultra-orthodox track', 3, (select id from serhub_sections where number = '3.8'), 3),
('3.8.4', 'Students', 'Student population and characteristics', 3, (select id from serhub_sections where number = '3.8'), 4),
('3.8.5', 'Infrastructure', 'Dedicated facilities and resources', 3, (select id from serhub_sections where number = '3.8'), 5);
