const mysql = require('mysql');
const inquirer = require('inquirer');
const cTable = require('console.table');

const connection = mysql.createConnection({
    host: "localhost",
    
    // plan to use many statemnts in one query
    multipleStatements: true,

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
                    choices:['view data', 'add data','change data', 'quit']
                }
            ]);
    
            switch (userChoice) {
                case 'view data':
                    readData();
                    break;
                case 'add data':
                    addData();
                    break;
                case 'change data':
                    changeData();
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
                connection.query("SELECT role.id, role.title, role.salary, department.name AS dept FROM role INNER JOIN department ON role.department_id = department.id", function(err, res) {
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
                //prompt user for new dept name
                const {newDept} = await inquirer.prompt([
                    {
                        type:'input',
                        message:'What is your new department called',
                        name:'newDept'
                    }
                ])
                //insert new dept to DB
                    connection.query(`INSERT INTO ${addChoice} (name) VALUES (?); SELECT LAST_INSERT_ID()`,[newDept], function(err, res) {
                            if (err) throw err;
                            // Log all results of the SELECT statement
                            console.log('New department added');
                            console.log('ID | Name')
                            console.log(res[1][0]['LAST_INSERT_ID()'] +` | ${newDept}`);
                            askUser();
                          });
                break;
            case 'role':
            //grab department list for reference    
            connection.query('SELECT * FROM department', async (err, res) => {
                //prompt user for new role info
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
                        type:'list',
                        message:'Which department does this role live in (id)?',
                        name:'department_id',
                        choices: res.map(item => item.name)

                    }
                ])

                const dept = newRole.department_id    
                //change department id from name to id for query
                newRole.department_id = res.filter(role => role.name === newRole.department_id).map(item => item.id)[0];
                //insert new role to DB 
                connection.query(`INSERT INTO ${addChoice} SET ?`,newRole, function(err, res) {
                    if (err) throw err;        
                    console.log('New role added')
                    console.log('Title: ' + newRole.title)
                    console.log('Salary: ' + parseInt(newRole.salary))
                    console.log('Department: ' + dept )
                    askUser();
                });
                });
                break;
            default:
            //get data for prompts
            connection.query("SELECT title, id FROM role; SELECT CONCAT(first_name, ' ', last_name) AS name, id FROM employee", async (err, nameList)=>{
                //get input from user
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
                            type:'list',
                            message:'What is the role?',
                            name:'role_id',
                            choices: nameList[0].map(item => item.title)
                        },                        
                        {
                            type:'list',
                            message:'What is the role?',
                            name:'manager_id',
                            choices: () => {
                                const arr = nameList[1].map(item => item.name);
                                arr.push('no boss');
                                return arr;
                            }
                        }                        
                    ])
                    //change the role_id value from name to id for query
                    newEmployee.role_id = nameList[0].filter(role => role.title === newEmployee.role_id).map(item => item.id)[0];
                    //change manager_id value from name to id for query
                    (newEmployee.manager_id === 'no boss')? delete newEmployee['manager_id']: newEmployee.manager_id=nameList[1].filter(person => person.name === newEmployee.manager_id).map(item => item.id)[0];
                    //add employe to database
                    connection.query(`INSERT INTO ${addChoice} SET ?`,newEmployee, function(err, res) {
                            if (err) throw err;
                            // Log all results of the SELECT statement
                            console.log(`${newEmployee.first_name} ${newEmployee.last_name} was added to DB.`);
                            askUser();
                          });
            })
                break;
        }
}

//update employee data
const changeData = async () => {   
    connection.query("SELECT title, id FROM role; SELECT CONCAT(first_name, ' ', last_name) AS name, id FROM employee", async (err, nameList)=>{
        if (err) throw err;
        //get input from user
        const changeEmployee = await inquirer.prompt([
                {
                    type:'list',
                    message:`Which employee's records are you looking to update?`,
                    name:'name',
                    choices: nameList[1].map(item => item.name)
                        
                },
                {
                    type:'list',
                    message:'What do you want to update?',
                    name:'fieldChoice',
                    choices: ['role', 'manager']
                }                        
            ])
        //prompt user to pick the new role/manager from list
        const {newRoleManager} = await inquirer.prompt([
            {
                type: 'list',
                message: `Make your new ${changeEmployee.fieldChoice} choice below.`,
                name: 'newRoleManager',
                choices: () => {
                    switch (changeEmployee.fieldChoice) {
                        case 'role':
                            return nameList[0].map(item => item.title)
                            break;
                        default:
                            //create array of manager name choices
                            const arr = nameList[1].map(item => item.name);
                            //add the choice of no boss
                            arr.push('no boss');
                            //remove the changing employee themselves
                            arr.filter(item => item !== changeEmployee.name)
                            return arr; 
                            break;
                    }
                }
            }
        ])
            const employeeId = nameList[1].filter(person=>person.name === changeEmployee.name).map(item => item.id)[0]
            const newVal = newRoleManager;
            const queryObj = {};
            //change the role_id or manager_id value from name to id for query
            if (changeEmployee.fieldChoice === 'role') {
                queryObj.role_id = nameList[0].filter(role => role.title === newRoleManager).map(item => item.id)[0]
            } else {
                (newRoleManager === 'no boss')? queryObj.manager_id = null: queryObj.manager_id=nameList[1].filter(person => person.name === newRoleManager).map(item => item.id)[0];
            }
            
            //update database
            connection.query(`UPDATE employee SET ? WHERE id=?`,[queryObj,employeeId], function(err, res) {
                    if (err) throw err;
                    // Log all results of the SELECT statement
                    console.log(`${changeEmployee.name} has a new ${changeEmployee.fieldChoice}: ${newVal}`);
                    askUser();
                  });
    })
    
}
