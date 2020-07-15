const mysql = require('mysql');
const inquirer = require('inquirer');
const dbFunc = require('./db/db');

const connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "password",
    database: "cms_db"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    askUser();
});

const askUser = async () => {
    const {userChoice} = await inquirer.prompt([
                {
                    type:'list',
                    message: 'What would you like to do?',
                    name:'userChoice',
                    choices:['view data', 'add data', 'quit']
                }
            ]);
    
            switch (userChoice) {
                case 'view data':
                    readData();
                    break;
                case 'add data':
                    addData();
                    break;
                default:
                    console.log('bye, bye');
                    connection.end();
                    break;
            }
}

//view data fromt he three tables
const readData = async () =>{
    const {viewChoice} = await inquirer.prompt([
        {
            type: 'list',
            message: 'What view do you want to see?',
            name:'viewChoice',
            choices:['department', 'role', 'employee']
        }
    ])
        switch (viewChoice) {
            case 'department':
                connection.query("SELECT * FROM ??",[viewChoice], function(err, res) {
                    if (err) throw err;
                    // Log all results of the SELECT statement
                    console.table(res);
                    askUser();
                  });
                break;
            case 'role':
                connection.query("SELECT role.id, role.title, role.salary, department.name AS department_name FROM role INNER JOIN department ON role.department_id = department.id", function(err, res) {
                    if (err) throw err;
                    // Log all results of the SELECT statement
                    console.table(res);
                    askUser();
                  });
                break;
            default:
                // "SELECT employee.first_name, employee.last_name, role.title AS role, employee.manager_id FROM employee INNER JOIN role ON employee.role_id = role.id"
                connection.query("SELECT CONCAT(e.first_name, ' ' ,e.last_name) AS Employee, role.title, CONCAT(m.first_name, ' ', m.last_name) AS Manager FROM employee e LEFT JOIN employee m ON m.id = e.manager_id INNER JOIN role ON e.role_id=role.id",function(err, res) {
                    if (err) throw err;
                    // Log all results of the SELECT statement
                    console.table(res);
                    askUser();
                  });
                break;
        }
}

//add data to the tables
const addData = async () => {
    const {addChoice} = await inquirer.prompt([
        {
            type: 'list',
            message: 'What would you like to add?',
            name:'addChoice',
            choices:['department', 'role', 'employee']
        }
    ])
        switch (addChoice) {
            case 'department':
                const {newDept} = await inquirer.prompt([
                    {
                        type:'input',
                        message:'What is your new department called',
                        name:'newDept'
                    }
                ])
                    connection.query(`INSERT INTO ${addChoice} (name) VALUES (?)`,[newDept], function(err, res) {
                            if (err) throw err;
                            // Log all results of the SELECT statement
                            console.log(`new Dept added`);
                            askUser();
                          });
                break;
            case 'role':

                const newRole = await inquirer.prompt([
                    {
                        type:'input',
                        message:'What is your new role called?',
                        name:'title'
                    },
                    {
                        type:'input',
                        message:'What is the salary?',
                        name:'salary',
                        validate:(salary)=>{
                            if (isNaN(parseInt(salary))) {
                                console.log('\n Insert a number!')
                                return false
                            }
                            return true
                        }
                    },
                    {
                        type:'input',
                        message:'Which department does this role live in (id)?',
                        name:'department_id',
                    }
                ])
                    connection.query(`INSERT INTO ${addChoice} SET ?`,newRole, function(err, res) {
                            if (err) throw err;
                            // Log all results of the SELECT statement
                            console.log(`new role added`);
                            askUser();
                          });
                break;
            default:
                
            const newEmployee = await inquirer.prompt([
                    {
                        type:'input',
                        message:'Give me a FIRST NAME',
                        name:'first_name'
                    },
                    {
                        type:'input',
                        message:'Give me a LAST NAME',
                        name:'last_name'
                    },
                    {
                        type:'input',
                        message:'What is the role (id)?',
                        name:'role_id'
                    }
                ])
                    connection.query(`INSERT INTO ${addChoice} SET ?`,newEmployee, function(err, res) {
                            if (err) throw err;
                            // Log all results of the SELECT statement
                            console.log(`new employee added`);
                            askUser();
                          });
                break;
        }
}

//update employee data
const updateData = async () => {   
}

//dept list
const deptList = () => {
    connection.query('SELECT * FROM department', (err, res) => {
        if (err) throw err;
        return res
    })
}

