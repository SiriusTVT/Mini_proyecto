const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.redirect('/Main.html');
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/Login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/Register.html'));
});

app.get('/Main.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/Main.html'));
});

app.post('/login', (req, res) => {
    // Aquí puedes manejar la lógica de inicio de sesión
    res.send('Inicio de sesión exitoso');
});

app.post('/register', (req, res) => {
    // Aquí puedes manejar la lógica de registro
    res.send('Registro exitoso');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});