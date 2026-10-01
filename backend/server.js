const express = require ('express');
const mongoose = require ('mongoose');
const bodyParser = require ('body-parser');
const cors = require ('cors');

//servidor http
const app = express();

//configuraciones al servidor http
app.use(bodyParser.json());
app.use(cors());

//conectarse a la bd
mongoose.connect('mongodb://localhost:27017/sistema-servicios-medicos-distancia')
    .then(()=> console.log("Conexion a MongoDB exitosa"))
    .catch(err => console.error("Error al conectar a MongoDB: ", err))
;
//rutas
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

//configurar puerto para backend
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Servidor ejecutándose en el puerto: ${port}`)
});