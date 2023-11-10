// subida de archivos
const multer = require("multer");
const shortid = require("shortid");
const fs = require('fs');
const Enlaces = require('../models/Enlace');


exports.subirArchivo = async (req, res, next) => {

    const configuracionMulter = {
        limits: { fileSize: req.usuario ? 1024 * 1024 * 30 : 1024 * 1024 },
        storage: (fileStorage = multer.diskStorage({
          destination: (req, file, cb) => {
            cb(null, __dirname + "/../uploads");
          },
          filename: (req, file, cb) => {
            const extension = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
            cb(null, `${shortid.generate()}${extension}`);
          },
        })),
      };
      
      const upload = multer(configuracionMulter).single("archivo");

  upload(req, res, async (error) => {

    if(!error) {
        res.json({archivo: req.file.filename});
    } else {
        console.log(error);
        return next();
    }
  })
  
};

exports.eliminarArchivo = async (req, res, next) => {
  try {
      // obtener el nombre del archivo
      const archivo = req.params.archivo;
      // verificar si el archivo existe
      const existe = fs.existsSync(__dirname + `/../uploads/${archivo}`);
      // si el archivo existe, eliminarlo
      if (existe) {
          fs.unlinkSync(__dirname + `/../uploads/${archivo}`);
          return next();
      }
  } catch (error) {
      console.error(error)
  }
};


// descarga un archivo
exports.descargar = async (req, res, next) => {

  // obtener el enlace
  const { archivo } =  req.params;
  const enlace = await Enlaces.findOne({ nombre: archivo});

  // verificar si el enlace existe
  if(!enlace) {
    // enviar respuesta con código 404 y mensaje de error    
    return res.status(404).json({msg: 'El archivo que intentas descargar ya no está disponible'});
  }

  // si el enlace existe, continuar con la lógica de descarga y eliminación
  const archivoDescarga = __dirname + '/../uploads/' + archivo;
  try {
    res.download(archivoDescarga);
  } catch (error) {
      // enviar respuesta con código 500 y mensaje de error
      return res.status(500).json({msg: 'Ha ocurrido un error al descargar el archivo'});
  } 

  // eliminar el archivo y la entrada de la bdd
  // si las descargas son iguales a 1 : borrar la entrada y borrar el archivo
  const { descargas, nombre } = enlace;

  if(descargas === 1) {
      
      // eliminar el archivo
      req.archivo = nombre

      // elminar entrada de la bdd
      await Enlaces.findOneAndRemove(enlace.id);
      next();
  } else {
      // si las descargas son > 1 : restar 1
      enlace.descargas--;
      await enlace.save();
  }  
}