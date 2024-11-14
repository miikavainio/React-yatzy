const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'https://react-yatzy.onrender.com', methods: ['GET', 'POST'] }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Temporarily allow all origins for debugging
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;


let gameState = {
  players: [],
  currentTurn: 0,
  dice: [0, 0, 0, 0, 0],
  scores: {},
};

io.on('connection', (socket) => {
  socket.on('ping', () => {
    console.log('Ping received from', socket.id);
    io.emit('pong', 'Pong from server');
  });

  socket.on('joinGame', (username) => {
    gameState.players.push({ id: socket.id, name: username });
    io.emit('gameState', gameState); // Broadcast the updated game state
  });

  socket.on('rollDice', (selectedDice) => {
    gameState.dice = gameState.dice.map((die, index) =>
      selectedDice.includes(index) ? die : Math.ceil(Math.random() * 6)
    );
    
    console.log('Emitting game state:', gameState);  // Debug log
    io.emit('gameState', gameState); // Broadcast the updated game state to all clients
  });

  socket.on('disconnect', () => {
    console.log('A player disconnected:', socket.id);
    gameState.players = gameState.players.filter((p) => p.id !== socket.id);
    io.emit('gameState', gameState); // Update all clients with the new game state
  });
});


app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});


server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/test', (req, res) => {
  res.send('Server is working!');
});
