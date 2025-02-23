const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = 3000;

// Conexión a MongoDB Atlas
const mongoURI = process.env.MONGO_URI;
mongoose
    .connect(mongoURI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err));

// Definición del esquema y modelo de usuario
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.redirect("/Main.html");
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "src/Login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "src/Register.html"));
});

app.get("/Main.html", (req, res) => {
    res.sendFile(path.join(__dirname, "src/Main.html"));
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res
                .status(400)
                .send("Usuario no encontrado o contraseña incorrecta");
        }
        res.send("Inicio de sesión exitoso");
    } catch (err) {
        res.status(500).send("Error en el inicio de sesión");
    }
});

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send("El usuario ya existe");
        }

        // Crear un nuevo usuario
        const newUser = new User({ name, email, password });
        await newUser.save();
        res.send("Registro exitoso");
    } catch (err) {
        res.status(500).send("Error en el registro");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
