const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

// Puerto
const PORT = 4000;

// Crear carpeta uploads si no existe
const uploadsPath = path.join(__dirname, "public", "uploads");

if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Configuración de multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsPath);
    },

    filename: function (req, file, cb) {

        const nombreSeguro = file.originalname.replace(
            /[^a-zA-Z0-9.-]/g,
            "_"
        );

        cb(null, Date.now() + "-" + nombreSeguro);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

// Ruta para subir archivos
app.post("/upload", upload.single("archivo"), (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            error: "No se recibió ningún archivo"
        });
    }

    res.json({
        nombre: req.file.originalname,
        url: "/uploads/" + req.file.filename,
        tipo: req.file.mimetype
    });
});

// SOCKET.IO
io.on("connection", (socket) => {

    console.log("Usuario conectado:", socket.id);

    // Usuario entra
    socket.on("nuevo usuario", (usuario) => {

        console.log(usuario + " entró al chat");

        socket.broadcast.emit(
            "notificacion",
            usuario + " se ha conectado al chat"
        );
    });

    // Recibir mensaje
    socket.on("chat", (data) => {

        console.log(
            data.usuario + ": " + data.mensaje
        );

        // Enviar mensaje a todos
        io.emit("chat", data);
    });

    // Usuario escribiendo
    socket.on("typing", (data) => {

        socket.broadcast.emit("typing", data);
    });

    // Detener indicador de escritura
    socket.on("stopTyping", () => {

        socket.broadcast.emit("stopTyping");
    });

    // Archivo enviado
    socket.on("archivo", (data) => {

        io.emit("archivo", data);
    });

    // Desconexión
    socket.on("disconnect", () => {

        console.log(
            "Usuario desconectado:",
            socket.id
        );
    });
});

// Iniciar servidor
server.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("==============================");
    console.log(" CHAT NODE.JS FUNCIONANDO");
    console.log("==============================");
    console.log(
        `Servidor corriendo en http://localhost:${PORT}`
    );
    console.log("==============================");
});