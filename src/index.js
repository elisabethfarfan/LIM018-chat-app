const express = require('express');
const morgan = require('morgan');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');

const client = require('./conexion_db');

const port = process.env.PORT || 4000;
const app = express();
const server = http.createServer(app);

const routingRoutes = require('./routes/routing.routes');
// const authUsersRoutes = require('./routes/authUsersRoutes');

const io = new Server(server, {
  cors: {
    credentials: true,
    origin: '*',
 
  },
});

client
  .connect()
  .then((res) => console.log('conectado a la BD'))
  .catch((error) => console.log('error de conexión', error));

app.use(
  cors({
    credentials: true,
    origin: true,

  })
);
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

app.use(morgan('dev'));
app.use(express.json());

app.use(routingRoutes);
app.use((err, req, res, next) => {
  // res.header('Access-Control-Allow-Origin', '*');
  // res.header(
  //   'Access-Control-Allow-Headers',
  //   'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method'
  // );
  // res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  // res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
  return res.json({
    message: err.message,
  });
});


let allUsers = [];

io.on('connection', (socket) => {
  // console.log('a user connected', socket.id);

  socket.on('userConected', (user) => {
    // const userDuplicate = allUsers.find((element) => element.id === user.id);

    // if (!userDuplicate) {
      allUsers.push(user);
      socket.broadcast.emit('allUsers', allUsers);
    // }
  });

  socket.on('userDisconnected', (userLogout) => {
    allUsers = allUsers.filter((e) => e.id !== userLogout.id);
    socket.broadcast.emit('userLogout', userLogout);
  });
  socket.on('userChanged', (user) => {
    allUsers = allUsers.map((e) => {
      if (e.id === user.id) {
        e.imguser = user.imguser;
        e.name = user.name;
      }
      return e;
    });

    socket.broadcast.emit('allUsers', allUsers);
  });

  socket.on('chatmessage', (message) => {
    socket.broadcast.emit('message', message);
  });

  socket.on('nameChanel', (chanel) => {
    socket.broadcast.emit('namesChanels', chanel);
  });

  socket.on('removeChannel', (idChannel) => {
    socket.broadcast.emit('removedChannel', idChannel);
    socket.emit('removedChannel', idChannel);
  });

  socket.on('editChanel', (newDataChannel) => {
    socket.broadcast.emit('editedChanel', newDataChannel);
    socket.emit('editedChanel', newDataChannel);
  });

  socket.on('dataDirectMessage', (message) => {
    socket.broadcast.emit('messagePersonal', message);
  });
});
server.listen(port);

module.exports = {
  app,
};