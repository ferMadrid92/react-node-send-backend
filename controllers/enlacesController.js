const Enlaces = require("../models/Enlace");
const shortid = require("shortid");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");

exports.nuevoEnlace = async (req, res, next) => {
  // revisar si hay errores
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }
  //console.log(req.body)

  // crear un objeto de enlace
  const { nombre_original, nombre } = req.body;

  const enlace = new Enlaces();
  enlace.url = shortid.generate();
  enlace.nombre = nombre;
  enlace.nombre_original = nombre_original;

  // si el usuario está autenticado
  if (req.usuario) {
    const { password, descargas } = req.body;

    // asignar a enlace el numero de descargas
    if (descargas) {
      enlace.descargas = descargas;
    }

    // asignar un password
    if (password) {
      const salt = await bcrypt.genSalt(10);
      enlace.password = await bcrypt.hash(password, salt);
    }

    // asignar el autor
    enlace.autor = req.usuario.id;
  }

  // almacenar en la bdd
  try {
    await enlace.save();
    return res.json({ msg: `${enlace.url}` });
  } catch (error) {
    console.error(error);
  }
  next();
};

// obtener listado de todos los enlaces
exports.todosEnlaces = async (req, res) => {
  try {
    const enlaces = await Enlaces.find({}).select("url -_id");
    res.json({ enlaces });
  } catch (error) {
    console.log(error);
  }
};

// retorna si el enlace tiene password o no
exports.tienePassword = async (req, res, next) => {
  const { url } = req.params;
  // verificar si existe el enlace
  const enlace = await Enlaces.findOne({ url });

  if (!enlace) {
    return res.status(404).json({ msg: "Ese enlace no existe" });
  }

  if (enlace.password) {
    return res.json({
      password: true,
      enlace: enlace.url,
      archivo: enlace.nombre,
      descargas: enlace.descargas,
    });
  }

  next();
};

// verifica si el password es correcto
exports.validarPassword = async (req, res, next) => {
  const { url } = req.params;
  const { password } = req.body;

  // consultar por el enlace
  const enlace = await Enlaces.findOne({ url });

  // verificar el password
  if (bcrypt.compareSync(password, enlace.password)) {
    // permitir al usuario descargar el archivo
    next();
  } else {
    return res.status(401).json({ msg: "Contraseña Incorrecta" });
  }
};

// Obtener el enlace
exports.obtenerEnlace = async (req, res, next) => {
  const { url } = req.params;
  // verificar si existe el enlace
  const enlace = await Enlaces.findOne({ url });

  if (!enlace) {
    return res.status(404).json({ msg: "Ese enlace no existe" });
  }

  // si el enlace existe
  res.json({
    archivo: enlace.nombre,
    password: false,
    descargas: enlace.descargas,
  });

  next();
};