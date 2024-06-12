const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');

const app = express();
const port = 5090;
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'formdata',
  password: '12112003',
});

client.connect()
  .then(() => {
    console.log('Connected to the database');
    return client.query(`
      CREATE TABLE IF NOT EXISTS personal_info (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(100),
        age INT
      );
    `);
  })
  .catch(err => console.error('Connection error', err.stack));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/add-person', (req, res) => {
  const { first_name, last_name, email, age } = req.body;

  client.query('INSERT INTO personal_info (first_name, last_name, email, age) VALUES ($1, $2, $3, $4)', [first_name, last_name, email, age])
    .then(() => res.redirect('/report'))
    .catch(err => {
      console.error('Error executing query', err.stack);
      res.send('Error adding personal information');
    });
});

app.post('/update-person', (req, res) => {
  const { id, first_name, last_name, email, age } = req.body;

  client.query('UPDATE personal_info SET first_name = $1, last_name = $2, email = $3, age = $4 WHERE id = $5', [first_name, last_name, email, age, id])
    .then(() => res.redirect('/report'))
    .catch(err => {
      console.error('Error executing query', err.stack);
      res.send('Error updating personal information');
    });
});

app.post('/delete-person', (req, res) => {
  const { id } = req.body;

  client.query('SELECT 1 FROM personal_info WHERE id = $1', [id])
    .then(result => {
      if (result.rows.length === 0) {
        res.send('No ID is there');
      } else {
        return client.query('DELETE FROM personal_info WHERE id = $1', [id])
          .then(() => res.redirect('/report'))
          .catch(err => {
            console.error('Error executing query', err.stack);
            res.send('Error deleting personal information');
          });
      }
    })
    .catch(err => {
      console.error('Error executing query', err.stack);
      res.send('Error checking ID');
    });
});

app.get('/report', (req, res) => {
  client.query('SELECT * FROM personal_info')
    .then(result => {
      const data = result.rows;
      let html = `
        <h1>Personal Information Report</h1>
        <table border="1">
          <tr>
            <th>ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Age</th>
            <th>Actions</th>
          </tr>`;

      data.forEach(row => {
        html += `
          <tr>
            <td>${row.id}</td>
            <td>${row.first_name}</td>
            <td>${row.last_name}</td>
            <td>${row.email}</td>
            <td>${row.age}</td>
            <td>
              <form action="/update-person" method="post">
                <input type="hidden" name="id" value="${row.id}" />
                <input type="text" name="first_name" value="${row.first_name}" required />
                <input type="text" name="last_name" value="${row.last_name}" required />
                <input type="email" name="email" value="${row.email}" required />
                <input type="number" name="age" value="${row.age}" required />
                <button type="submit">Update</button>
              </form>
              <form action="/delete-person" method="post" style="margin-top: 10px;">
                <input type="hidden" name="id" value="${row.id}" />
                <button type="submit">Delete</button>
              </form>
            </td>
          </tr>`;
      });

      html += '</table>';
      res.send(html);
    })
    .catch(err => {
      console.error('Error executing query', err.stack);
      res.send('Error fetching personal information');
    });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
