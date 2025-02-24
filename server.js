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

// Definición del esquema de productos
const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    stock: Number,
    category: String,
    imageUrl: String
});

const Product = mongoose.model('Product', productSchema);

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

app.get("/PaginaPrincipal.html", (req, res) => {
    res.sendFile(path.join(__dirname, "src/PaginaPrincipal.html"));
});

app.get("/GestionProductos.html", (req, res) => {
    res.sendFile(path.join(__dirname, "src/GestionProductos.html"));
});

app.get("/ConsultaProducto.html", (req, res) => {
    res.sendFile(path.join(__dirname, "src/ConsultaProducto.html"));
});

app.get("/carrito", (req, res) => {
    res.sendFile(path.join(__dirname, "src/carrito.html"));
});

app.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).send("Error al obtener los productos");
    }
});

app.get('/products/:id', async (req, res) => {
    console.log(`Received request for product ID: ${req.params.id}`); // Registro de depuración
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            console.log("Producto no encontrado"); // Registro de depuración
            return res.status(404).send("Producto no encontrado");
        }
        res.json(product);
    } catch (err) {
        console.error("Error al obtener el producto:", err); // Registro de depuración
        res.status(500).send("Error al obtener el producto");
    }
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

app.post('/add-product', async (req, res) => {
    const { name, description, price, stock, category, imageUrl } = req.body;
    const newProduct = new Product({ name, description, price, stock, category, imageUrl });
    await newProduct.save();
    res.send('Producto agregado con éxito');
});

app.delete('/products/:id', async (req, res) => {
    try {
        const result = await Product.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el producto' });
    }
});

let cart = [];

app.post('/carrito', (req, res) => {
    const { productId } = req.body;
    cart.push(productId);
    res.send('Producto agregado al carrito');
});

app.post('/vaciar-carrito', (req, res) => {
    cart = [];
    res.send('Carrito vaciado');
});

app.get('/carrito-products', async (req, res) => {
    try {
        const products = await Product.find({ _id: { $in: cart } });
        res.json(products);
    } catch (err) {
        res.status(500).send("Error al obtener los productos del carrito");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
