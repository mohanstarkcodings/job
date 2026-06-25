create database jobBoardPlatformDB;

use jobBoardPlatformDB;

#users table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL,
    role ENUM('Pending','Candidate','Employer','Admin') DEFAULT 'Pending',
    provider ENUM('local', 'google') DEFAULT 'local',
    account_status ENUM('Active', 'Suspended','PendingDeletion') DEFAULT 'Active',
    deletion_date DATETIME NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

select * from  users;
delete from users where user_id = 10;

# employer profile Table
CREATE TABLE employer_profiles (
    employer_id INT PRIMARY KEY,
    company_logo VARCHAR(500) NULL,
    company_name VARCHAR(255) NOT NULL,
    company_description TEXT NULL,
    contact_number VARCHAR(20) NOT NULL,
    website VARCHAR(255) NULL,
    industry_type VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    company_size VARCHAR(50) NULL,
    founded YEAR NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_employer_profile_user
    FOREIGN KEY (employer_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

select * from employer_profiles;

CREATE TABLE candidate_profiles (
    candidate_id INT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    profile_photo VARCHAR(500) NULL,
    phone_number VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    professional_headline VARCHAR(255) NULL,
    skills TEXT NULL,
    degree VARCHAR(150) NULL,
    college_name VARCHAR(255) NULL,
    graduation_year YEAR NULL,
    cgpa DECIMAL(3,2) NULL,
    experience_level ENUM('Fresher', 'Experienced') NOT NULL,
    years_of_experience DECIMAL(4,1) DEFAULT 0,
    linkedin_url VARCHAR(500) NULL,
    github_url VARCHAR(500) NULL,
    portfolio_url VARCHAR(500) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_candidate_profile_user
    FOREIGN KEY (candidate_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

select * from  candidate_profiles;
SELECT * FROM resume;
CREATE TABLE jobs (
    job_id INT PRIMARY KEY AUTO_INCREMENT,
    employer_id INT NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    job_description TEXT NOT NULL,
    required_skills TEXT NOT NULL,
    experience_required ENUM('Fresher', 'Experienced') NOT NULL,
    salary VARCHAR(100) NULL,
    job_type ENUM('Full-Time', 'Part-Time', 'Internship', 'Contract') NOT NULL,
    work_mode ENUM('Remote', 'Hybrid', 'On-Site') NOT NULL,
    location VARCHAR(255) NOT NULL,
    vacancies INT NOT NULL CHECK(vacancies > 0),
    application_deadline DATE NOT NULL,
    job_status ENUM('Open', 'Closed', 'Removed') DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_employer
    FOREIGN KEY (employer_id)
    REFERENCES employer_profiles(employer_id)
    ON DELETE CASCADE
);

select * from jobs;
# 
CREATE TABLE company_posts (
    post_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_type ENUM('Image', 'Video', 'Article', 'Document') NOT NULL,
    title VARCHAR(255) NULL,
    content TEXT NULL,
    file_path VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

select * from company_posts;

-- CREATE TABLE resumes (
--     resume_id INT PRIMARY KEY AUTO_INCREMENT,
--     candidate_id INT UNIQUE,
--     file_name VARCHAR(255) NOT NULL,
--     file_path VARCHAR(500) NOT NULL,
--     uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     CONSTRAINT fk_resume_candidate
--     FOREIGN KEY (candidate_id)
--     REFERENCES candidate_profiles(candidate_id)
--     ON DELETE CASCADE
-- );

CREATE TABLE resume (
    resume_id INT PRIMARY KEY AUTO_INCREMENT,
    candidate_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_resumes_candidate
    FOREIGN KEY (candidate_id)
    REFERENCES candidate_profiles(candidate_id)
    ON DELETE CASCADE
);

select * from  resume;

CREATE TABLE job_applications (
    application_id INT PRIMARY KEY AUTO_INCREMENT,
    candidate_id INT NOT NULL,
    job_id INT NOT NULL,
    resume_id INT NOT NULL,
    application_status ENUM(
        'Pending',
        'Reviewing',
        'Shortlisted',
        'Interview Scheduled',
        'Rejected',
        'Hired'
    ) DEFAULT 'Pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_application_candidate
    FOREIGN KEY (candidate_id)
    REFERENCES candidate_profiles(candidate_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_application_job
    FOREIGN KEY (job_id)
    REFERENCES jobs(job_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_application_resume
    FOREIGN KEY (resume_id)
    REFERENCES resume(resume_id)
    ON DELETE CASCADE
);

select * from  job_applications;

CREATE TABLE application_answers (
    answer_id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT NOT NULL,
    question_name VARCHAR(255) NOT NULL,
    answer_value TEXT NOT NULL,
    CONSTRAINT fk_answer_application
    FOREIGN KEY (application_id)
    REFERENCES job_applications(application_id)
    ON DELETE CASCADE
);


select * from application_answers;

CREATE TABLE notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    application_id INT NULL,
    notification_type ENUM(
        'New Application',
        'Shortlisted',
        'Interview Scheduled',
        'Rejected',
        'Hired',
        'System'
    ) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_notification_application
    FOREIGN KEY (application_id)
    REFERENCES job_applications(application_id)
    ON DELETE CASCADE
);

select * from notifications;

CREATE TABLE posts (
    post_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content TEXT NULL,
    media_type ENUM(
        'Image',
        'Video',
        'Document',
        'Article'
    ) NOT NULL,
    file_name VARCHAR(255) NULL,
    file_path VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_posts_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

select * from posts;

alter table posts drop foreign key fk_post_user;
CREATE TABLE saved_posts (
    saved_post_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_saved_post_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_saved_post
FOREIGN KEY (post_id)
REFERENCES posts(post_id)
ON DELETE CASCADE,

    CONSTRAINT uq_saved_post
    UNIQUE (user_id, post_id)
);

 SELECT
          sp.saved_post_id,
          sp.saved_at,

          p.post_id,
          p.content,
          p.media_type,
          p.file_name,
          p.file_path,
          p.created_at,

          u.user_id,
          u.email,
          u.role

        FROM saved_posts sp

        INNER JOIN posts p
          ON sp.post_id = p.post_id

        INNER JOIN users u
          ON p.user_id = u.user_id

        WHERE sp.user_id = 14

        ORDER BY sp.saved_at DESC;
        
        
        
select * from saved_posts;
select * from users;
CREATE TABLE password_reset_otps (
    otp_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    otp_code CHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_otp_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

select * from password_reset_otps;

CREATE TABLE email_verification_otps (
    otp_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    otp_code CHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_email_otp_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

CREATE TABLE password_reset_tokens (
    token_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    reset_token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reset_token_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL,
    role ENUM('Pending','Candidate','Employer','Admin') DEFAULT 'Pending',
    provider ENUM('local', 'google') DEFAULT 'local',
    account_status ENUM('Active', 'Suspended','PendingDeletion') DEFAULT 'Active',
    deletion_date DATETIME NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
insert into users(email,password_hash,role,provider,account_status,is_verified) 
values ('admin@gmail.com','$2b$10$5QX0ITa0r/MjDjKEcjgk0uBR0Z2BWh.T1FRQ0Q5wLr7cHmSGyg7G6','Admin','local','Active');

insert into users(email,password_hash,role,provider,account_status,is_verified) 
values ('employer5@gmail.com','$2b$10$5QX0ITa0r/MjDjKEcjgk0uBR0Z2BWh.T1FRQ0Q5wLr7cHmSGyg7G6','Employer','local','Active',TRUE);

insert into users(email,password_hash,role,provider,account_status,is_verified) 
values ('candidate5@gmail.com','$2b$10$5QX0ITa0r/MjDjKEcjgk0uBR0Z2BWh.T1FRQ0Q5wLr7cHmSGyg7G6','Candidate','local','Active',true);

INSERT INTO employer_profiles (
    employer_id, company_logo, company_name, company_description, 
    contact_number, website, industry_type, city, state, 
    country, company_size, founded
) VALUES (
    13, 'https://example.com', 'TechCorp Solutions', 
    'A leading provider of enterprise cloud software and AI integration.', 
    '+1-555-0198', 'https://techcorpsolutions.com', 'Technology', 
    'San Francisco', 'California', 'United States', '501-1000 employees', 2015
);


INSERT INTO jobs (
    employer_id, job_title, job_description, required_skills, 
    experience_required, salary, job_type, work_mode, 
    location, vacancies, application_deadline, job_status
) VALUES (
    13, 'Senior Cloud Engineer', 'We are looking for a Senior Cloud Engineer to manage our enterprise AWS infrastructure and deploy secure AI scaling solutions.', 
    'AWS, Terraform, Python, Docker, Kubernetes', 
    'Experienced', '$130,000 - $160,000 / year', 'Full-Time', 'Remote', 
    'San Francisco, California', 3, '2026-08-31', 'Open'
);

INSERT INTO jobs (
    employer_id, job_title, job_description, required_skills, 
    experience_required, salary, job_type, work_mode, 
    location, vacancies, application_deadline, job_status
) VALUES (
    13, 'Clinical Research Assistant', 'Join our core lab team to assist in clinical data entry, documentation, and routine testing compliance audits.', 
    'Clinical Data Management, Excel, Lab Safety, Communication', 
    'Fresher', '£28,000 / year', 'Full-Time', 'On-Site', 
    'London, United Kingdom', 2, '2026-07-15', 'Open'
);

INSERT INTO jobs (
    employer_id, job_title, job_description, required_skills, 
    experience_required, salary, job_type, work_mode, 
    location, vacancies, application_deadline, job_status
) VALUES (
    13, 'Financial Analyst Intern', 'Looking for an enthusiastic intern to assist our wealth management team with market research and client portfolio mapping.', 
    'Financial Modeling, Excel, PowerPoint, Market Research', 
    'Fresher', '$40 / hour', 'Internship', 'Hybrid', 
    'Sydney, New South Wales', 1, '2026-07-01', 'Open'
);

INSERT INTO jobs (
    employer_id, job_title, job_description, required_skills, 
    experience_required, salary, job_type, work_mode, 
    location, vacancies, application_deadline, job_status
) VALUES (
    13, 'Remote English Tutor', 'Conduct live online tutoring sessions for high school students. Prepare learning materials and track student progress.', 
    'English Literature, Pedagogy, Zoom, Patient Communication', 
    'Experienced', 'Competitive hourly rate', 'Part-Time', 'Remote', 
    'Toronto, Ontario', 10, '2026-09-10', 'Open'
);

INSERT INTO jobs (
    employer_id, job_title, job_description, required_skills, 
    experience_required, salary, job_type, work_mode, 
    location, vacancies, application_deadline, job_status
) VALUES (
    13, 'Site Civil Engineer', 'Oversee construction workflows, enforce safety protocols, and coordinate directly with architects on commercial builds.', 
    'AutoCAD, Project Estimation, Site Management, Safety Compliance', 
    'Experienced', '₹6,00,000 - ₹8,00,000 / annum', 'Contract', 'On-Site', 
    'Mumbai, Maharashtra', 4, '2026-08-05', 'Open'
);

INSERT INTO candidate_profiles (
    candidate_id, 
    full_name, 
    profile_photo, 
    phone_number, 
    city, 
    state, 
    country, 
    professional_headline, 
    skills, 
    degree, 
    college_name, 
    graduation_year, 
    cgpa, 
    experience_level, 
    years_of_experience, 
    linkedin_url, 
    github_url, 
    portfolio_url
) VALUES (
    14, 
    'John Doe', 
    'https://example.com', 
    '+1-555-0198', 
    'San Francisco', 
    'California', 
    'United States', 
    'Full Stack Software Engineer', 
    'Java, Spring Boot, MySQL, React, AWS, Docker', 
    'Bachelor of Science in Computer Science', 
    'State University', 
    2023, 
    3.85, 
    'Experienced', 
    3.5, 
    'https://linkedin.com', 
    'https://github.com', 
    'https://johndoe.dev'
);
select * from users;

notifications for employers:
-- 1. Notification for a newly submitted application
INSERT INTO notifications (user_id, application_id, notification_type, message, is_read)
VALUES (13, 1, 'New Application', 'Your application for xxx has been received.', FALSE);

-- 2. Notification for a newly submitted application
INSERT INTO notifications (user_id, application_id, notification_type, message, is_read)
VALUES (13, 9, 'New Application', 'Your application for yyy received.', FALSE);

-- 3. Notification for a newly submitted application
INSERT INTO notifications (user_id, application_id, notification_type, message, is_read)
VALUES (13, 10, 'New Application', 'Your application for zzz has been received.', FALSE);

notification for candidates:
-- 1. Notification for a shortlisted candidate
INSERT INTO notifications (user_id, application_id, notification_type, message, is_read)
VALUES (14, 1, 'Shortlisted', 'Congratulations! You have been shortlisted for the UX Designer role.', FALSE);

-- 2. Notification for an upcoming interview (marked as already read)
INSERT INTO notifications (user_id, application_id, notification_type, message, is_read)
VALUES (14, 9, 'Interview Scheduled', 'Your interview is scheduled for Friday at 10:00 AM.', TRUE);

-- 3. Notification for a rejection
INSERT INTO notifications (user_id, application_id, notification_type, message, is_read)
VALUES (14, 10, 'Rejected', 'Thank you for your interest. Unfortunately, we went with another candidate.', FALSE);




-- 6. System alert (application_id is NULL because it is not tied to a specific job)
INSERT INTO notifications (user_id, application_id, notification_type, message, is_read)
VALUES (14, NULL, 'System', 'Your password was successfully updated 10 minutes ago.', true);
