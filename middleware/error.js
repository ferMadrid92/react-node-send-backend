// crear un middleware de error
exports.errorHandler = (err, req, res, next) => {
    // enviar respuesta con código 500 y mensaje de error
    res.status(500).json({msg: 'Ha ocurrido un error al procesar tu solicitud'});
    // opcionalmente, puedes registrar el error en la consola o en un archivo
    console.error(err);
  }
  

  