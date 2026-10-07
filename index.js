const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 4000;

// Carpeta para archivos subidos
const uploadsPath = path.join(__dirname, "public", "uploads");

if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Configuración de Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsPath);
    },
    filename: function (req, file, cb) {
        const nombreSeguro = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, Date.now() + "-" + nombreSeguro);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

// Subir archivos
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

// Socket.IO
io.on("connection", (socket) => {
    console.log("Usuario conectado:", socket.id);

    socket.on("nuevo usuario", (usuario) => {
        socket.data.usuario = usuario;

        socket.broadcast.emit(
            "notificacion",
            `${usuario} se ha conectado al chat`
        );
    });

    socket.on("chat", (data) => {
        io.emit("chat", data);
    });

    socket.on("typing", (usuario) => {
        socket.broadcast.emit("typing", usuario);
    });

    socket.on("stopTyping", () => {
        socket.broadcast.emit("stopTyping");
    });

    socket.on("archivo", (data) => {
        io.emit("archivo", data);
    });

    socket.on("disconnect", () => {
        if (socket.data.usuario) {
            socket.broadcast.emit(
                "notificacion",
                `${socket.data.usuario} se ha desconectado del chat`
            );
        }

        console.log("Usuario desconectado:", socket.id);
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log("======================================");
    console.log(" CHAT NODE.JS - MISAEL ALEXANDER");
    console.log("======================================");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log("======================================");
});
