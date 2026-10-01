const mongoose = require('mongoose');
const bcrypt = require ('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
    nombreUsuario: {type: String, required: true, unique: true}, 
    contraseña: {type: String, required: true},
    rol: {type: String, required: true} //admin o user
});

UsuarioSchema.pre('save', async function (next) {
    if (!this.isModified('contraseña')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.contraseña = await bcrypt.hash(this.contraseña, salt);
});

module.exports = mongoose.model('Usuario', UsuarioSchema);