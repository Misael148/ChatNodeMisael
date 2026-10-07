const socket = io();


// ELEMENTOS HTML

const login = document.getElementById("login");

const chat = document.getElementById("chat");

const inputUsuario =
    document.getElementById("usuario");

const btnIngresar =
    document.getElementById("btnIngresar");

const nombreUsuario =
    document.getElementById("nombreUsuario");

const inputMensaje =
    document.getElementById("mensaje");

const btnEnviar =
    document.getElementById("btnEnviar");

const mensajes =
    document.getElementById("mensajes");

const escribiendo =
    document.getElementById("escribiendo");

const ventanaMensajes =
    document.getElementById("ventanaMensajes");

const inputArchivo =
    document.getElementById("archivo");

const btnArchivo =
    document.getElementById("btnArchivo");

const sonido =
    document.getElementById("sonidoMensaje");


// VARIABLE DEL USUARIO

let usuarioActual = "";


// INGRESAR AL CHAT

btnIngresar.addEventListener(
    "click",
    ingresarChat
);


inputUsuario.addEventListener(
    "keypress",
    function (event) {

        if (event.key === "Enter") {
            ingresarChat();
        }
    }
);


function ingresarChat() {

    const nombre =
        inputUsuario.value.trim();

    if (nombre === "") {

        alert(
            "Por favor ingresa tu nombre"
        );

        return;
    }

    usuarioActual = nombre;

    nombreUsuario.textContent =
        usuarioActual;

    login.style.display = "none";

    chat.classList.remove("oculto");

    socket.emit(
        "nuevo usuario",
        usuarioActual
    );

    inputMensaje.focus();
}


// ENVIAR MENSAJE

btnEnviar.addEventListener(
    "click",
    enviarMensaje
);


inputMensaje.addEventListener(
    "keypress",
    function (event) {

        if (event.key === "Enter") {

            enviarMensaje();

        }
    }
);


function enviarMensaje() {

    const texto =
        inputMensaje.value.trim();

    if (texto === "") {
        return;
    }

    socket.emit(
        "chat",
        {
            usuario: usuarioActual,
            mensaje: texto
        }
    );

    socket.emit("stopTyping");

    inputMensaje.value = "";

    inputMensaje.focus();
}


// ESCRIBIENDO

inputMensaje.addEventListener(
    "input",
    function () {

        if (
            inputMensaje.value.trim()
            !== ""
        ) {

            socket.emit(
                "typing",
                usuarioActual
            );

        } else {

            socket.emit("stopTyping");

        }
    }
);


// RECIBIR MENSAJES

socket.on(
    "chat",
    function (data) {

        const div =
            document.createElement("div");

        div.classList.add("mensaje");

        const nombre =
            document.createElement("strong");

        nombre.textContent =
            data.usuario + ": ";

        const texto =
            document.createTextNode(
                data.mensaje
            );

        div.appendChild(nombre);

        div.appendChild(texto);

        mensajes.appendChild(div);

        reproducirSonido();

        bajarScroll();
    }
);


// NOTIFICACIONES

socket.on(
    "notificacion",
    function (texto) {

        const div =
            document.createElement("div");

        div.classList.add(
            "notificacion"
        );

        div.textContent = texto;

        mensajes.appendChild(div);

        bajarScroll();
    }
);


// USUARIO ESCRIBIENDO

socket.on(
    "typing",
    function (usuario) {

        escribiendo.textContent =
            usuario +
            " está escribiendo un mensaje...";
    }
);


socket.on(
    "stopTyping",
    function () {

        escribiendo.textContent = "";

    }
);


// ARCHIVOS

btnArchivo.addEventListener(
    "click",
    enviarArchivo
);


async function enviarArchivo() {

    const archivo =
        inputArchivo.files[0];

    if (!archivo) {

        alert(
            "Selecciona un archivo"
        );

        return;
    }

    if (usuarioActual === "") {

        alert(
            "Primero ingresa al chat"
        );

        return;
    }

    const formulario =
        new FormData();

    formulario.append(
        "archivo",
        archivo
    );

    btnArchivo.disabled = true;

    btnArchivo.textContent =
        "Subiendo...";

    try {

        const respuesta =
            await fetch(
                "/upload",
                {
                    method: "POST",
                    body: formulario
                }
            );

        if (!respuesta.ok) {

            throw new Error(
                "No se pudo subir el archivo"
            );

        }

        const datos =
            await respuesta.json();

        socket.emit(
            "archivo",
            {
                usuario:
                    usuarioActual,

                nombre:
                    datos.nombre,

                url:
                    datos.url,

                tipo:
                    datos.tipo
            }
        );

        inputArchivo.value = "";

    } catch (error) {

        console.error(error);

        alert(
            "Error al subir archivo"
        );

    } finally {

        btnArchivo.disabled = false;

        btnArchivo.textContent =
            "Enviar archivo";
    }
}


// RECIBIR ARCHIVOS

socket.on(
    "archivo",
    function (data) {

        const div =
            document.createElement("div");

        div.classList.add(
            "archivoMensaje"
        );


        const titulo =
            document.createElement("p");

        const fuerte =
            document.createElement("strong");

        fuerte.textContent =
            data.usuario +
            " envió un archivo:";

        titulo.appendChild(fuerte);

        div.appendChild(titulo);


        // IMAGEN

        if (
            data.tipo.startsWith(
                "image/"
            )
        ) {

            const imagen =
                document.createElement(
                    "img"
                );

            imagen.src = data.url;

            imagen.alt = data.nombre;

            div.appendChild(imagen);

        }


        // VIDEO

        else if (
            data.tipo.startsWith(
                "video/"
            )
        ) {

            const video =
                document.createElement(
                    "video"
                );

            video.src = data.url;

            video.controls = true;

            div.appendChild(video);

        }


        // OTRO DOCUMENTO

        const enlace =
            document.createElement("a");

        enlace.href = data.url;

        enlace.target = "_blank";

        enlace.download =
            data.nombre;

        enlace.textContent =
            "📎 " + data.nombre;

        div.appendChild(enlace);


        mensajes.appendChild(div);

        reproducirSonido();

        bajarScroll();
    }
);


// SONIDO

function reproducirSonido() {

    sonido.currentTime = 0;

    sonido.play()
        .catch(function () {

            console.log(
                "El navegador bloqueó " +
                "el sonido automático"
            );

        });
}


// BAJAR AUTOMÁTICAMENTE

function bajarScroll() {

    ventanaMensajes.scrollTop =
        ventanaMensajes.scrollHeight;
}