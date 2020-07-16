const mysql = require('mysql');

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

//add row function
const addRow = (table, paramObj) => {
    connection.query(`INSERT INTO ?? SET ?`, [table, paramObj], function (err, res) {
        if (err) throw err;
    });
}
//deletion function
const deleteRow = (table, num) =>{
    connection.query('DELETE FROM ?? WHERE id=?',[table, num], (err,res)=>{
        if (err) throw err
    })
}

const endConnection = () => {
    connection.end();
}

module.exports = {
    addRow,
    deleteRow,
    endConnection
}