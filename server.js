const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require('bcrypt'); // Importar bcrypt
const saltRounds = 10; // Número de rondas de sal para bcrypt
const session = require('express-session'); // Importar express-session

dotenv.config();

const app = express();
const PORT = 3000;

// Conexión a MongoDB Atlas
const mongoURI = process.env.MONGO_URI;
mongoose
    .connect(mongoURI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err));

const adminDomain = "@admin.com"; // Dominio para usuarios administradores

// Definición del esquema y modelo de usuario
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
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

app.use(session({
    secret: 'your_secret_key', // Cambia esto por una clave secreta segura
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Cambia a true si usas HTTPS
}));

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

app.get("/ProcesoDePago.html", (req, res) => {
    res.sendFile(path.join(__dirname, "src/ProcesoDePago.html"));
});

app.get("/user", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    res.sendFile(path.join(__dirname, "src/user.html"));
});

app.get('/products', async (req, res) => { // Obtener todos los productos
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).send("Error al obtener los productos");
    }
});

app.get('/products/:id', async (req, res) => { // Obtener un producto por ID
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

app.post("/login", async (req, res) => { // Inicio de sesión
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send("Usuario no encontrado o contraseña incorrecta");
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).send("Usuario no encontrado o contraseña incorrecta");
        }

        req.session.user = { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin }; // Guardar datos del usuario en la sesión
        res.json(req.session.user); // Enviar los datos del usuario como respuesta
    } catch (err) {
        res.status(500).send("Error en el inicio de sesión");
    }
});

app.post("/register", async (req, res) => { // Registro de usuario
    const { name, email, password } = req.body;
    try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send("El usuario ya existe");
        }

        // Verificar si el dominio del correo es de administrador
        const isAdmin = email.endsWith(adminDomain);

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Crear un nuevo usuario
        const newUser = new User({ name, email, password: hashedPassword, isAdmin });
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

app.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, category, imageUrl } = req.body;

    try {
        const product = await Product.findByIdAndUpdate(id, {
            name,
            description,
            price,
            stock,
            category,
            imageUrl
        }, { new: true });

        if (!product) {
            return res.status(404).send("Producto no encontrado");
        }

        res.send("Producto actualizado con éxito");
    } catch (error) {
        res.status(500).send("Error al actualizar el producto");
    }
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

app.post('/carrito', async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).send("Producto no encontrado");
        }

        const existingProduct = cart.find(item => item.productId === productId);
        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            cart.push({ productId, quantity });
        }
        res.send('Producto agregado al carrito');
    } catch (err) {
        res.status(500).send("Error al agregar el producto al carrito");
    }
});

app.post('/actualizar-carrito', async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        const cartItem = cart.find(item => item.productId === productId);
        if (!cartItem) {
            return res.status(400).send("Producto no encontrado en el carrito");
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).send("Producto no encontrado");
        }

        const quantityDifference = cartItem.quantity - quantity;
        if (quantityDifference > 0) {
            product.stock += quantityDifference;
        } else if (product.stock < -quantityDifference) {
            return res.status(400).send("Stock insuficiente");
        } else {
            product.stock += quantityDifference;
        }

        cartItem.quantity = quantity;
        await product.save();
        res.send('Cantidad actualizada en el carrito');
    } catch (err) {
        res.status(500).send("Error al actualizar la cantidad en el carrito");
    }
});

app.post('/vaciar-carrito', async (req, res) => {
    try {
        cart = [];
        res.send('Carrito vaciado');
    } catch (err) {
        res.status(500).send("Error al vaciar el carrito");
    }
});

app.post('/finalizar-compra', async (req, res) => {
    try {
        for (const item of cart) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock -= item.quantity;
                await product.save();
            }
        }
        cart = [];
        res.send('Compra finalizada con éxito');
    } catch (err) {
        res.status(500).send("Error al finalizar la compra");
    }
});

app.get('/carrito-products', async (req, res) => {
    try {
        const productIds = cart.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });
        const cartProducts = products.map(product => {
            const cartItem = cart.find(item => item.productId === product._id.toString());
            return {
                ...product.toObject(),
                quantity: cartItem.quantity
            };
        });
        res.json(cartProducts);
    } catch (err) {
        res.status(500).send("Error al obtener los productos del carrito");
    }
});

app.get("/logout", (req, res) => { // Cierre de sesión
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Error al cerrar sesión");
        }
        res.redirect("/login");
    });
});

app.get("/user-data", (req, res) => { // Ruta para obtener datos del usuario
    if (!req.session.user) {
        return res.status(401).send("No autorizado");
    }
    res.json(req.session.user);
});

app.post("/update-user", async (req, res) => {
    const { name, email } = req.body;
    const userId = req.session.user.id;

    try {
        // Verificar si el nuevo correo electrónico ya está en uso
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).send("El correo electrónico ya está en uso");
        }

        // Actualizar los datos del usuario
        await User.findByIdAndUpdate(userId, { name, email });
        req.session.user.name = name;
        req.session.user.email = email;
        res.send("Datos actualizados correctamente");
    } catch (err) {
        res.status(500).send("Error al actualizar los datos");
    }
});

app.post("/update-password", async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).send("Usuario no encontrado");
        }

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(400).send("Contraseña actual incorrecta");
        }

        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        await user.save();
        res.send("Contraseña actualizada correctamente");
    } catch (err) {
        res.status(500).send("Error al actualizar la contraseña");
    }
});

app.get("/loginAdmin", (req, res) => {
    res.sendFile(path.join(__dirname, "src/loginAdmin.html"));
});

app.get("/admin-dashboard", (req, res) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.redirect("/loginAdmin");
    }
    res.sendFile(path.join(__dirname, "src/GestionAdmin.html"));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
