USE cms_db;

INSERT INTO  department (name)
VALUES ('Sales'), ('Legal'), ('Finance'), ('IT'), ('HR');

INSERT INTO role (title, salary, department_id)
VALUES ('Manager', 90000, 1),
('Salesman', 100000, 1),
('Sales assistant', 40000, 1),
('Manager', 80000, 2),
('Lawyer', 75000, 2),
('Paralegal', 60000, 2),
('Manager', 75000, 3),
('Accountant', 50000, 3),
('Analyst', 70000, 3),
('Manager', 90000, 4),
('System Admin', 80000, 4),
('Software Engineer', 85000, 4),
('Manager', 55000, 5),
('Specialist', 45000, 5);


INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ('John', 'Smith', 1, null),
('John', 'Snow', 2, 1),
('John', 'Wick', 3, 1),
('Jane', 'Doe', 4, null),
('Jane', 'Eyer', 5, 4),
('Jane', 'Austin', 6, 4);
