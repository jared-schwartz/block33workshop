const pg = require('pg')
const express = require('express')
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory')
const app = express()
const PORT = 3000;

app.use(express.json());

//Get Employees
app.get('/api/employees', async(req, res, next) => {
    try{
        const getemployees = await client.query(`
            SELECT * FROM employees;`)
        res.status(201).json(getemployees.rows);
    }catch(err){
        console.error('Error fetching employees',err); 
    }
})
//Get Departments
app.get('/api/departments', async(req, res, next) => {
    try{
        const getdepartments = await client.query(`
            SELECT * FROM departments;`);
        res.status(201).json(getdepartments.rows);
    }catch(err){
        console.error('Error fetching departments',err); 
    }
})

// Post Departments
app.post('/api/departments', async (req, res, next) => {
    try {
        const { name } = req.body;
        const postdepartments = await client.query(
            `INSERT INTO departments(name)
             VALUES ($1)
             RETURNING *`,
            [name] 
        );
        res.status(201).json(postdepartments.rows[0]); 
    } catch (err) {
        console.error('Error posting department', err);
        res.status(500).json({ error: 'Failed to create department' }); 
    }
})

// Post Employees
app.post('/api/employees', async (req, res, next) => {
    try {
        const { name, department_id } = req.body;
        const postemployees = await client.query(
            `INSERT INTO employees(name, department_id)
             VALUES ($1, $2)
             RETURNING *`,
            [name, department_id] 
        );
        res.status(201).json(postemployees.rows[0]); 
    } catch (err) {
        console.error('Error posting employees', err);
        res.status(500).json({ error: 'Failed to create employee' }); 
    }
})
//Delete Employees by ID
app.delete('/api/employees/:id', async (req, res, next) =>{
    try{
        const deleteemployee = await client.query(`
            DELETE from employees WHERE id=$1`,
        [req.params.id]);
        res.sendStatus(204);
    }catch(err){
        console.error('Error deleting employee',err);
    }
})

//Put Employees by ID
app.put('/api/employees/:id', async(req, res, next) =>{
    try{
        const updateemployee = await client.query(`
        UPDATE employees 
        SET department_id=$1,
        updated_at=now()
        WHERE id=$2
        RETURNING *`,[req.body.department_id, req.params.id]);
        res.send(updateemployee.rows[0]);
    }catch(err){
        console.error('Error updating employeee',err);
    }
})

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`)
});

async function init() {
    await client.connect();
    console.log("connected to database");
    let SQL = `
          drop table if exists employees;
          drop table if exists departments;
          create table departments(
            id serial primary key,
            name varchar(50) not null
          );
          create table employees(
            id serial primary key,
            name varchar(50) not null,
            created_at timestamp default now(),
            updated_at timestamp default now(),
            department_id integer references departments(id) not null
          );
      `;
      await client.query(SQL);
    console.log(`tables created`);
    SQL = `
    INSERT into departments(name) values('A Shift');
    INSERT into employees(name, department_id) values('Jared', (select id from departments where name='A Shift'));
    `;
    await client.query(SQL);
    console.log("data seeded");
};
  init();
