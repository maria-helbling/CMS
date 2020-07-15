DROP DATABASE IF EXISTS cms_db;

CREATE DATABASE cms_db;

USE cms_db;

CREATE TABLE department (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(30) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE role (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(45) NOT NULL,
  salary DECIMAL NOT NULL,
  department_id INTEGER,
  PRIMARY KEY (id),
  CONSTRAINT FK_DeptRole FOREIGN KEY (department_id) REFERENCES department(id)
);

CREATE TABLE employee (
  id INT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(30),
  last_name VARCHAR(30) NOT NULL,
  role_id INT,
  manager_id INT DEFAULT NULL,
  PRIMARY KEY (id),
  CONSTRAINT FK_RoleEmp FOREIGN KEY (role_id) REFERENCES role(id),
  CONSTRAINT FK_RoleRole FOREIGN KEY (manager_id) REFERENCES employee(id)
);