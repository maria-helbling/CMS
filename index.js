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
    //start the user interface
    askUser();
});

const askUser = async () => {
    const { userChoice } = await inquirer.prompt([
        {
            type: 'list',
            message: 'What would you like to do?',
            name: 'userChoice',
            choices: ['view data', 'add data', 'change data', 'delete data', 'quit']
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
        case 'delete data':
            deleteData();
            break;
        default:
            console.log('bye, bye');
            connection.end();
            break;
    }
}

//view data from the three tables
const readData = async () => {
    const { viewChoice } = await inquirer.prompt([
        {
            type: 'list',
            message: 'What view do you want to see?',
            name: 'viewChoice',
            choices: ['department','department budget', 'role', 'employee', 'employees by manager']
        }
    ])
    switch (viewChoice) {
        case 'department':
            connection.query("SELECT * FROM ??", [viewChoice], function (err, res) {
                if (err) throw err;
                // Log all results of the SELECT statement
                console.log('\n')
                console.table('All departments',res);
                askUser();
            });
            break;
        case 'department budget':
            //grab dept list to show customer
            connection.query("SELECT department.name, SUM(role.salary) AS budget  FROM department INNER JOIN role ON department.id = role.department_id GROUP BY department.name", async (err, res) => {
                if (err) throw err;
                // Log all results of the SELECT statement
                const {deptBudChoice} = await inquirer.prompt([
                    {
                        type:'list',
                        message: 'Do you want all departments or a particular one?',
                        name:'deptBudChoice',
                        choices: () =>{
                            let choiceArr = res.map(item=>item.name);
                            choiceArr.unshift('view all');
                            return choiceArr;
                        }
                    }
                ]);

                //check user choice
                if (deptBudChoice==='view all') { 
                    console.log('\n')
                    console.table('Utilized budget:',res)
                } else {
                    console.log('\n')
                    console.table(`Utilized budget for ${deptBudChoice}`,res.filter(item=>item.name===deptBudChoice))
                };
                
                //back to the start
                askUser();
            });
            break;
        case 'role':
            connection.query("SELECT role.id, role.title, role.salary, department.name AS dept FROM role INNER JOIN department ON role.department_id = department.id", function (err, res) {
                if (err) throw err;
                // Log all results of the SELECT statement
                console.log('\n')
                console.table('All roles',res);
                askUser();
            });
            break;
        case 'employees by manager':
            //pull up list of employees to populate prompt list
            connection.query("SELECT CONCAT(first_name, ' ', last_name) AS name, manager_id, id FROM employee", async (error, result) => {
                if (error) throw error;
                const {managerFilter} = await inquirer.prompt([
                    {
                        type:'list',
                        message:'Which manager do you want to filter by?',
                        name:'managerFilter',
                        choices: result.filter(person =>person.manager_id == null).map(person => person.name)
                    }
                ])
                index = result.filter(person=>person.name === managerFilter).map(item=>item.id)[0]
                console.log(index)
                //show results
                connection.query("SELECT e.id, CONCAT(e.first_name, ' ' ,e.last_name) AS Employee, role.title, CONCAT(m.first_name, ' ', m.last_name) AS Manager, e.manager_id FROM employee e LEFT JOIN employee m ON m.id = e.manager_id INNER JOIN role ON e.role_id=role.id WHERE e.manager_id = ? OR e.id=?",[index, index] ,function (err, res) {
                    if (err) throw err;
                    //remove uninformative data from user view
                    res.forEach(element => {
                       delete element.manager_id
                    });
                    // Log all results of the SELECT statement
                    console.log('\n')
                    console.table(`${managerFilter} and the team`,res);
                    askUser();
                });
            })
            break;
        default:
            // "SELECT employee.first_name, employee.last_name, role.title AS role, employee.manager_id FROM employee INNER JOIN role ON employee.role_id = role.id"
            connection.query("SELECT CONCAT(e.first_name, ' ' ,e.last_name) AS Employee, role.title, CONCAT(m.first_name, ' ', m.last_name) AS Manager FROM employee e LEFT JOIN employee m ON m.id = e.manager_id INNER JOIN role ON e.role_id=role.id", function (err, res) {
                if (err) throw err;
                // Log all results of the SELECT statement
                console.log('\n')
                console.table('All employees',res);
                askUser();
            });
            break;
    }
}

//add data to the tables
const addData = async () => {
    const { addChoice } = await inquirer.prompt([
        {
            type: 'list',
            message: 'What would you like to add?',
            name: 'addChoice',
            choices: ['department', 'role', 'employee']
        }
    ])
    switch (addChoice) {
        case 'department':
            //prompt user for new dept name
            const { newDept } = await inquirer.prompt([
                {
                    type: 'input',
                    message: 'What is your new department called',
                    name: 'newDept'
                }
            ])
            //insert new dept to DB
            connection.query(`INSERT INTO ${addChoice} (name) VALUES (?)`, [newDept], function (err, res) {
                if (err) throw err;
                // Log all results of the SELECT statement
                console.log('\n')
                console.log(`${newDept} department added to database`);
                console.log('\n')
                askUser();
            });
            break;
        case 'role':
            //grab department list for reference    
            connection.query('SELECT * FROM department', async (err, res) => {
                if (err) throw err;
                //prompt user for new role info
                const newRole = await inquirer.prompt([
                    {
                        type: 'input',
                        message: 'What is your new role called?',
                        name: 'title'
                    },
                    {
                        type: 'input',
                        message: 'What is the salary?',
                        name: 'salary',
                        validate: (salary) => {
                            if (isNaN(parseInt(salary))) {
                                console.log('\n Insert a number!')
                                return false
                            }
                            return true
                        }
                    },
                    {
                        type: 'list',
                        message: 'Which department does this role live in (id)?',
                        name: 'department_id',
                        choices: res.map(item => item.name)

                    }
                ])

                const dept = newRole.department_id
                //change department id from name to id for query
                newRole.department_id = res.filter(role => role.name === newRole.department_id).map(item => item.id)[0];
                //insert new role to DB 
                connection.query(`INSERT INTO ${addChoice} SET ?`, newRole, function (err, res) {
                    if (err) throw err;
                    console.log('\n')
                    console.table('New role added',[{title: newRole.title, salary: parseInt(newRole.salary),department: dept}])
                    askUser();
                });
            });
            break;
        default:
            //get data for prompts
            connection.query("SELECT title, id FROM role; SELECT CONCAT(first_name, ' ', last_name) AS name, id FROM employee", async (err, nameList) => {
                if (err) throw err;
                //get input from user
                const newEmployee = await inquirer.prompt([
                    {
                        type: 'input',
                        message: 'Give me a FIRST NAME',
                        name: 'first_name'
                    },
                    {
                        type: 'input',
                        message: 'Give me a LAST NAME',
                        name: 'last_name'
                    },
                    {
                        type: 'list',
                        message: 'What is the role?',
                        name: 'role_id',
                        choices: nameList[0].map(item => item.title)
                    },
                    {
                        type: 'list',
                        message: 'What is the role?',
                        name: 'manager_id',
                        choices: () => {
                            const arr = nameList[1].map(item => item.name);
                            arr.push('no boss');
                            return arr;
                        }
                    }
                ])
                const newEmpCopy = {...newEmployee}
                //change the role_id value from name to id for query
                newEmployee.role_id = nameList[0].filter(role => role.title === newEmployee.role_id).map(item => item.id)[0];
                //change manager_id value from name to id for query
                (newEmployee.manager_id === 'no boss') ? delete newEmployee['manager_id'] : newEmployee.manager_id = nameList[1].filter(person => person.name === newEmployee.manager_id).map(item => item.id)[0];
                //add employe to database
                connection.query(`INSERT INTO ${addChoice} SET ?`, newEmployee, function (err, res) {
                    if (err) throw err;
                    // Log all results of the SELECT statement
                    console.log('\n')
                    console.table(`New employee added`, [{name: newEmpCopy.first_name + ' ' + newEmpCopy.last_name, role: newEmpCopy.role_id, manager: newEmpCopy.manager_id}]);
                    askUser();
                });
            })
            break;
    }
}

//update employee data
const changeData = async () => {
    //get inputs for lists in prompts
    connection.query("SELECT title, id FROM role; SELECT CONCAT(first_name, ' ', last_name) AS name, id FROM employee", async (err, nameList) => {
        if (err) throw err;
        //get input from user
        const changeEmployee = await inquirer.prompt([
            {
                type: 'list',
                message: `Which employee's records are you looking to update?`,
                name: 'name',
                choices: nameList[1].map(item => item.name)

            },
            {
                type: 'list',
                message: 'What do you want to update?',
                name: 'fieldChoice',
                choices: ['role', 'manager']
            }
        ])
        //prompt user to pick the new role/manager from list
        const { newRoleManager } = await inquirer.prompt([
            {
                type: 'list',
                message: `Make your new ${changeEmployee.fieldChoice} choice below.`,
                name: 'newRoleManager',
                choices: () => {
                    switch (changeEmployee.fieldChoice) {
                        case 'role':
                            //display possible role titles
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
        //setting variables to output values to user and use values for query
        const employeeId = nameList[1].filter(person => person.name === changeEmployee.name).map(item => item.id)[0]
        const newVal = newRoleManager;
        const queryObj = {};

        //change the role_id or manager_id value from name to id for query
        if (changeEmployee.fieldChoice === 'role') {
            queryObj.role_id = nameList[0].filter(role => role.title === newRoleManager).map(item => item.id)[0]
        } else {
            (newRoleManager === 'no boss') ? queryObj.manager_id = null : queryObj.manager_id = nameList[1].filter(person => person.name === newRoleManager).map(item => item.id)[0];
        }

        //update database
        connection.query(`UPDATE employee SET ? WHERE id=?`, [queryObj, employeeId], function (err, res) {
            if (err) throw err;
            // Log all results of the SELECT statement
            console.log('\n')
            console.log(`${changeEmployee.name} has a new ${changeEmployee.fieldChoice}: ${newVal}`);
            askUser();
        });
    })

}

//delete data from the tables
const deleteData = async () => {
    //ask user which table they would like to delete from
    const { tableChoice } = await inquirer.prompt([
        {
            type: 'list',
            message: 'What would you like to delete?',
            name: 'tableChoice',
            choices: ['department', 'role', 'employee', 'NO NO, I don\'t want to delete anything!']
        }
    ]);
    switch (tableChoice) {
        case 'department':
            //get the list for deletion
            connection.query(`SELECT * FROM ??`, tableChoice, async (err, res) => {
                if (err) throw err;
                const { target } = await inquirer.prompt([
                    {
                        type: 'rawlist',
                        message: `Which ${tableChoice} wouild you like to delete?`,
                        name: 'target',
                        choices: res.map(dept => dept.name)
                    }
                ])
                //check if the chosen department has employees in it.
                connection.query('SELECT department.id AS dept_id, department.name, role.id AS role_id, CONCAT(employee.first_name, " ", employee.last_name) AS employee FROM department INNER JOIN role ON department.id = role.department_id INNER JOIN employee ON role.id = employee.role_id WHERE department.name = ?',[target],async (error, result)=>{
                    if (error) throw error;
                    if (result.length) {
                        //ask user if they are sure about deleting also the employee info
                        const {yesNo} = await inquirer.prompt([
                            {
                                type:'confirm',
                                message:`Deleting the ${target} department from the database will also delete all its employees and their data from the database. They are: ${res.map(person=>person.employee).join(', ')}. Do you want to delete?`,
                                name:'yesNo'
                            }
                        ]);
                        if  (!yesNo) {
                            console.log('\n')
                            console.log('No harm done!')
                            console.log('\n')

                            askUser();
                        }
                                                
                    }
                    deleteRow(tableChoice, res.filter(item=>item.name === target)[0].id);
                    console.log('\n');
                    console.log(`${tableChoice} ${target} was removed from database.`);
                    console.log('\n');

                    askUser();


                })
            })
           
            break;
        case 'role':
            //get all roles to populate list for selection
            connection.query(`SELECT * FROM ??`, tableChoice, async (err, res) => {
                if (err) throw err;
                const { target } = await inquirer.prompt([
                    {
                        type: 'rawlist',
                        message: `Which ${tableChoice} wouild you like to delete?`,
                        name: 'target',
                        choices: res.map(rol => rol.title)
                    }
                ])
                //check if the chosen department has employees in it.
                connection.query('SELECT role.id AS role_id, role.title, CONCAT(employee.first_name, " ", employee.last_name) AS employee FROM role INNER JOIN employee ON role.id = employee.role_id WHERE role.title = ?',[target],async (error, result)=>{
                    if (error) throw error;
                    if (result.length) {
                        //ask user if they are sure about deleting also the employee info
                        const {yesNo} = await inquirer.prompt([
                            {
                                type:'confirm',
                                message:`Deleting the ${target} role from the database will also delete all its employees and their data from the database. They are: ${result.map(person=>person.employee).join(', ')}. Do you want to delete?`,
                                name:'yesNo'
                            }
                        ]);
                        if  (!yesNo) {
                            console.log('\n')
                            console.log('No harm done!')
                            console.log('\n')
                            askUser();
                        } else {
                            //call delete function
                            deleteRow(tableChoice, res.filter(item=>item.title === target)[0].id);
                            console.log('\n')
                            console.log(`${tableChoice} ${target} was removed from database.`)
                            console.log('\n')
                            askUser();
                        }
                                                
                    }
                    
                })
            })
            break;
        case 'employee':
            connection.query(`SELECT CONCAT(first_name, ' ', last_name) AS name, id FROM ??`, tableChoice, async (err, res) => {
                if (err) throw err;
                const { target } = await inquirer.prompt([
                    {
                        type: 'rawlist',
                        message: `Which ${tableChoice} wouild you like to delete?`,
                        name: 'target',
                        choices: res.map(person => person.name)
                    }
                ])
                const {yesNo} = await inquirer.prompt([
                    {
                        type:'confirm',
                        message:`Deleting ${target} from the database will permanently delete all of their data! Do you want to delete?`,
                        name:'yesNo'
                    }
                ]);
                if  (!yesNo) {
                    console.log('\n')
                    console.log('No harm done!')
                    console.log('\n')
                    askUser();
                } else {
                deleteRow(tableChoice, res.filter(item=>item.name === target)[0].id);
                console.log('\n')
                console.log(`${tableChoice} ${target} was removed from database.`)
                console.log('\n')
                askUser();
                }
            })
            break;
        default:
            console.log('\n')
            console.log('No harm done!')
            console.log('\n')
            askUser();
            break;
    }


}

const deleteRow = (table, num) =>{
    connection.query('DELETE FROM ?? WHERE id=?',[table, num], (err,res)=>{
        if (err) throw err
    })
}