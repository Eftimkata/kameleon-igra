import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './gameManager.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://grand-alpaca-586a03.netlify.app"] 
      : ["http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const gameManager = new GameManager();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-game', (data) => {
    try {
      const { playerName } = data;
      const result = gameManager.createGame(socket.id, playerName);
      
      if (result.success) {
        socket.join(result.roomCode);
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

  socket.on('join-game', (data) => {
    try {
      const { playerName, roomCode } = data;
      const result = gameManager.joinGame(socket.id, playerName, roomCode);
      
      if (result.success) {
        socket.join(roomCode);
        socket.emit('game-joined', {
          player: result.player,
          gameState: result.gameState
        });
        
        // Notify all players in the room
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

  socket.on('add-word', (data) => {
    try {
      const { roomCode, word } = data;
      const result = gameManager.addWord(socket.id, roomCode, word);
      
      if (result.success) {
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

  socket.on('start-game', (data) => {
    try {
      const { roomCode } = data;
      const result = gameManager.startGame(socket.id, roomCode);
      
      if (result.success) {
        // Send different data to chameleon vs regular players
        result.gameState.players.forEach(player => {
          const playerSocket = [...io.sockets.sockets.values()]
            .find(s => s.id === player.socketId);
          
          if (playerSocket) {
            playerSocket.emit('game-started', {
              gameState: {
                ...result.gameState,
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

  socket.on('advance-phase', (data) => {
    try {
      const { roomCode, phase } = data;
      const result = gameManager.advancePhase(roomCode, phase);
      
      if (result.success) {
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

  socket.on('vote', (data) => {
    try {
      const { roomCode, targetPlayerId } = data;
      const result = gameManager.vote(socket.id, roomCode, targetPlayerId);
      
      if (result.success) {
        io.to(roomCode).emit('vote-cast', {
          votingResults: result.votingResults,
          gameState: result.gameState
        });

        // Check if voting is complete
        if (result.votingComplete) {
          setTimeout(() => {
            io.to(roomCode).emit('voting-complete', {
              gameState: result.gameState,
              suspectedChameleon: result.suspectedChameleon,
              actualChameleon: result.actualChameleon
            });
          }, 1000);
        }
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      console.error('Error voting:', error);
      socket.emit('error', { message: 'Failed to vote' });
    }
  });

  socket.on('chameleon-guess', (data) => {
    try {
      const { roomCode, guess } = data;
      const result = gameManager.makeChameleonGuess(socket.id, roomCode, guess);
      
      if (result.success) {
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

  socket.on('new-game', (data) => {
    try {
      const { roomCode } = data;
      const result = gameManager.newGame(roomCode);
      
      if (result.success) {
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

  socket.on('leave-room', (data) => {
    try {
      const { roomCode } = data;
      const result = gameManager.leaveRoom(socket.id, roomCode);
      
      if (result.success) {
        socket.leave(roomCode);
        socket.emit('left-room');
        
        // Notify remaining players
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

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameManager.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});