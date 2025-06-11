// Import necessary modules using ES Module syntax
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors'; // Import cors once
import { GameManager } from './gameManager.js';

// Initialize the express application
const app = express();

// Use CORS middleware for all routes.
// The Socket.IO server has its own CORS configuration below.
app.use(cors());

// Enable express to parse JSON bodies from incoming requests
app.use(express.json());

// Create an HTTP server using the express app
const server = createServer(app);

// Initialize Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    // Configure origins based on environment (production or development)
    origin: process.env.NODE_ENV === 'production'
      ? ["https://grand-alpaca-586a03.netlify.app"]
      : ["http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

// Initialize the GameManager to handle game logic
const gameManager = new GameManager();

// --- API Endpoints ---

// Health check endpoint for monitoring deployment status
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Socket.IO Event Handlers ---

// Listen for new client connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle 'create-game' event
  socket.on('create-game', (data) => {
    try {
      const { playerName } = data;
      const result = gameManager.createGame(socket.id, playerName);

      if (result.success) {
        socket.join(result.roomCode); // Add socket to the specific game room
        socket.emit('game-created', {
          roomCode: result.roomCode,
          player: result.player,
          gameState: result.gameState
        });
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      console.error('Error creating game:', error);
      socket.emit('error', { message: 'Failed to create game' });
    }
  });

  // Handle 'join-game' event
  socket.on('join-game', (data) => {
    try {
      const { playerName, roomCode } = data;
      const result = gameManager.joinGame(socket.id, playerName, roomCode);

      if (result.success) {
        socket.join(roomCode); // Add socket to the game room
        socket.emit('game-joined', {
          player: result.player,
          gameState: result.gameState
        });

        // Notify all players in the room about the new player
        io.to(roomCode).emit('player-joined', {
          player: result.player,
          players: result.gameState.players
        });
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  // Handle 'add-word' event
  socket.on('add-word', (data) => {
    try {
      const { roomCode, word } = data;
      const result = gameManager.addWord(socket.id, roomCode, word);

      if (result.success) {
        // Emit updated words to all players in the room
        io.to(roomCode).emit('word-added', {
          word,
          words: result.words
        });
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      console.error('Error adding word:', error);
      socket.emit('error', { message: 'Failed to add word' });
    }
  });

  // Handle 'start-game' event
  socket.on('start-game', (data) => {
    try {
      const { roomCode } = data;
      const result = gameManager.startGame(socket.id, roomCode);

      if (result.success) {
        // Iterate through players to send specific game state (chameleon vs. regular player)
        result.gameState.players.forEach(player => {
          const playerSocket = [...io.sockets.sockets.values()]
            .find(s => s.id === player.socketId);

          if (playerSocket) {
            playerSocket.emit('game-started', {
              gameState: {
                ...result.gameState,
                // Hide secret word from the chameleon
                secretWord: player.isChameleon ? null : result.gameState.secretWord
              },
              isChameleon: player.isChameleon
            });
          }
        });
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Handle 'advance-phase' event
  socket.on('advance-phase', (data) => {
    try {
      const { roomCode, phase } = data;
      const result = gameManager.advancePhase(roomCode, phase);

      if (result.success) {
        // Notify all players of the phase change
        io.to(roomCode).emit('phase-changed', {
          gamePhase: result.gamePhase,
          gameState: result.gameState
        });
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      console.error('Error advancing phase:', error);
      socket.emit('error', { message: 'Failed to advance phase' });
    }
  });

  // Handle 'vote' event
  socket.on('vote', (data) => {
    try {
      const { roomCode, targetPlayerId } = data;
      const result = gameManager.vote(socket.id, roomCode, targetPlayerId);

      if (result.success) {
        // Emit vote cast update to all players
        io.to(roomCode).emit('vote-cast', {
          votingResults: result.votingResults,
          gameState: result.gameState
        });

        // If voting is complete, send a final 'voting-complete' event after a short delay
        if (result.votingComplete) {
          setTimeout(() => {
            io.to(roomCode).emit('voting-complete', {
              gameState: result.gameState,
              suspectedChameleon: result.suspectedChameleon,
              actualChameleon: result.actualChameleon
            });
          }, 1000); // 1-second delay
        }
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      console.error('Error voting:', error);
      socket.emit('error', { message: 'Failed to vote' });
    }
  });

  // Handle 'chameleon-guess' event
  socket.on('chameleon-guess', (data) => {
    try {
      const { roomCode, guess } = data;
      const result = gameManager.makeChameleonGuess(socket.id, roomCode, guess);

      if (result.success) {
        // Emit chameleon guess results to all players
        io.to(roomCode).emit('chameleon-guessed', {
          guess,
          correct: result.correct,
          gameState: result.gameState
        });
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      console.error('Error with chameleon guess:', error);
      socket.emit('error', { message: 'Failed to process guess' });
    }
  });

  // Handle 'new-game' event
  socket.on('new-game', (data) => {
    try {
      const { roomCode } = data;
      const result = gameManager.newGame(roomCode);

      if (result.success) {
        // Notify all players that a new game has started
        io.to(roomCode).emit('new-game-started', {
          gameState: result.gameState
        });
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      console.error('Error starting new game:', error);
      socket.emit('error', { message: 'Failed to start new game' });
    }
  });

  // Handle 'leave-room' event
  socket.on('leave-room', (data) => {
    try {
      const { roomCode } = data;
      const result = gameManager.leaveRoom(socket.id, roomCode);

      if (result.success) {
        socket.leave(roomCode); // Remove socket from the room
        socket.emit('left-room');

        // Notify remaining players if the game state exists (i.e., room wasn't empty)
        if (result.gameState) {
          io.to(roomCode).emit('player-left', {
            players: result.gameState.players,
            gameState: result.gameState
          });
        }
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      socket.emit('error', { message: 'Failed to leave room' });
    }
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameManager.handleDisconnect(socket.id); // Let GameManager handle cleanup
  });
});

// --- Server Startup ---

// Define the port to listen on, using environment variable or default to 3001
const PORT = process.env.PORT || 3001;

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
