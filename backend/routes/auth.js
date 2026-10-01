const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

const router = express.Router();

router.post('/login', async (req, res) => {
const { nombreUsuario, contraseña } = req.body;
const usuario = await Usuario.findone({ nombreUsuario });

if(!usuario){
    return res.status(400).json({mensaje: 'Usuario no encontrado'});
}

const esCoincidiente = await bcrypt.compare(contraseña, usuario.contraseña)
if(!esCoincidiente) {
    return res.status(400).json({mensaje: 'Credenciales invalidas'});

}

const token = jwt.sign({id: usuario._id, rol: usuario.rol}, 'claveSecreta', {expiresIn: '1h'});
res.json({token})
});

module.exports = router;