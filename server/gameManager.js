export class GameManager {
  constructor() {
    this.games = new Map(); // roomCode -> gameState
    this.playerRooms = new Map(); // socketId -> roomCode
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  createGame(socketId, playerName) {
    try {
      const roomCode = this.generateRoomCode();
      const playerId = this.generatePlayerId();
      
      const player = {
        id: playerId,
        socketId,
        name: playerName,
        isHost: true,
        isReady: true,
        isChameleon: false
      };

      const gameState = {
        roomCode,
        players: [player],
        words: [],
        secretWord: '',
        gamePhase: 'lobby',
        votingResults: {},
        votes: new Map(), // socketId -> targetPlayerId
        winner: null,
        chameleonGuess: ''
      };

      this.games.set(roomCode, gameState);
      this.playerRooms.set(socketId, roomCode);

      return {
        success: true,
        roomCode,
        player,
        gameState: this.getPublicGameState(gameState)
      };
    } catch (error) {
      console.error('Error in createGame:', error);
      return { success: false, error: 'Failed to create game' };
    }
  }

  joinGame(socketId, playerName, roomCode) {
    try {
      const gameState = this.games.get(roomCode);
      if (!gameState) {
        return { success: false, error: 'Room not found' };
      }

      if (gameState.gamePhase !== 'lobby') {
        return { success: false, error: 'Game already in progress' };
      }

      if (gameState.players.length >= 8) {
        return { success: false, error: 'Room is full' };
      }

      const playerId = this.generatePlayerId();
      const player = {
        id: playerId,
        socketId,
        name: playerName,
        isHost: false,
        isReady: true,
        isChameleon: false
      };

      gameState.players.push(player);
      this.playerRooms.set(socketId, roomCode);

      return {
        success: true,
        player,
        gameState: this.getPublicGameState(gameState)
      };
    } catch (error) {
      console.error('Error in joinGame:', error);
      return { success: false, error: 'Failed to join game' };
    }
  }

  addWord(socketId, roomCode, word) {
    try {
      const gameState = this.games.get(roomCode);
      if (!gameState) {
        return { success: false, error: 'Room not found' };
      }

      if (gameState.gamePhase !== 'lobby') {
        return { success: false, error: 'Cannot add words during game' };
      }

      if (gameState.words.includes(word)) {
        return { success: false, error: 'Word already exists' };
      }

      gameState.words.push(word);

      return {
        success: true,
        words: gameState.words
      };
    } catch (error) {
      console.error('Error in addWord:', error);
      return { success: false, error: 'Failed to add word' };
    }
  }

  startGame(socketId, roomCode) {
    try {
      const gameState = this.games.get(roomCode);
      if (!gameState) {
        return { success: false, error: 'Room not found' };
      }

      const player = gameState.players.find(p => p.socketId === socketId);
      if (!player || !player.isHost) {
        return { success: false, error: 'Only host can start game' };
      }

      if (gameState.players.length < 3) {
        return { success: false, error: 'Need at least 3 players' };
      }

      if (gameState.words.length < 8) {
        return { success: false, error: 'Need at least 8 words' };
      }

      // Assign chameleon randomly
      const chameleonIndex = Math.floor(Math.random() * gameState.players.length);
      gameState.players.forEach((player, index) => {
        player.isChameleon = index === chameleonIndex;
      });

      // Pick random word
      gameState.secretWord = gameState.words[Math.floor(Math.random() * gameState.words.length)];
      gameState.gamePhase = 'reveal';
      gameState.votingResults = {};
      gameState.votes.clear();

      return {
        success: true,
        gameState
      };
    } catch (error) {
      console.error('Error in startGame:', error);
      return { success: false, error: 'Failed to start game' };
    }
  }

  advancePhase(roomCode, phase) {
    try {
      const gameState = this.games.get(roomCode);
      if (!gameState) {
        return { success: false, error: 'Room not found' };
      }

      gameState.gamePhase = phase;

      return {
        success: true,
        gamePhase: phase,
        gameState: this.getPublicGameState(gameState)
      };
    } catch (error) {
      console.error('Error in advancePhase:', error);
      return { success: false, error: 'Failed to advance phase' };
    }
  }

  vote(socketId, roomCode, targetPlayerId) {
    try {
      const gameState = this.games.get(roomCode);
      if (!gameState) {
        return { success: false, error: 'Room not found' };
      }

      if (gameState.gamePhase !== 'voting') {
        return { success: false, error: 'Not in voting phase' };
      }

      const voter = gameState.players.find(p => p.socketId === socketId);
      if (!voter) {
        return { success: false, error: 'Player not found' };
      }

      if (targetPlayerId === voter.id) {
        return { success: false, error: 'Cannot vote for yourself' };
      }

      // Record the vote
      gameState.votes.set(socketId, targetPlayerId);

      // Count votes
      const voteCounts = {};
      for (const targetId of gameState.votes.values()) {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }

      gameState.votingResults = voteCounts;

      // Check if all players have voted
      const votingComplete = gameState.votes.size === gameState.players.length;
      
      let suspectedChameleon = null;
      let actualChameleon = null;

      if (votingComplete) {
        // Find player with most votes
        const maxVotes = Math.max(...Object.values(voteCounts));
        suspectedChameleon = Object.keys(voteCounts).find(id => voteCounts[id] === maxVotes);
        actualChameleon = gameState.players.find(p => p.isChameleon);

        if (suspectedChameleon === actualChameleon.id) {
          // Chameleon was caught
          gameState.gamePhase = 'chameleon-guess';
        } else {
          // Wrong player voted out, chameleon wins
          gameState.gamePhase = 'game-over';
          gameState.winner = 'chameleon';
        }
      }

      return {
        success: true,
        votingResults: gameState.votingResults,
        votingComplete,
        suspectedChameleon,
        actualChameleon,
        gameState: this.getPublicGameState(gameState)
      };
    } catch (error) {
      console.error('Error in vote:', error);
      return { success: false, error: 'Failed to vote' };
    }
  }

  makeChameleonGuess(socketId, roomCode, guess) {
    try {
      const gameState = this.games.get(roomCode);
      if (!gameState) {
        return { success: false, error: 'Room not found' };
      }

      const player = gameState.players.find(p => p.socketId === socketId);
      if (!player || !player.isChameleon) {
        return { success: false, error: 'Only chameleon can guess' };
      }

      if (gameState.gamePhase !== 'chameleon-guess') {
        return { success: false, error: 'Not in guessing phase' };
      }

      gameState.chameleonGuess = guess;
      const correct = guess.toLowerCase().trim() === gameState.secretWord.toLowerCase().trim();
      
      gameState.gamePhase = 'game-over';
      gameState.winner = correct ? 'chameleon' : 'players';

      return {
        success: true,
        correct,
        gameState: this.getPublicGameState(gameState)
      };
    } catch (error) {
      console.error('Error in makeChameleonGuess:', error);
      return { success: false, error: 'Failed to process guess' };
    }
  }

  newGame(roomCode) {
    try {
      const gameState = this.games.get(roomCode);
      if (!gameState) {
        return { success: false, error: 'Room not found' };
      }

      // Reset game state but keep players and words
      gameState.gamePhase = 'lobby';
      gameState.secretWord = '';
      gameState.votingResults = {};
      gameState.votes.clear();
      gameState.winner = null;
      gameState.chameleonGuess = '';
      
      // Reset player chameleon status
      gameState.players.forEach(player => {
        player.isChameleon = false;
      });

      return {
        success: true,
        gameState: this.getPublicGameState(gameState)
      };
    } catch (error) {
      console.error('Error in newGame:', error);
      return { success: false, error: 'Failed to start new game' };
    }
  }

  leaveRoom(socketId, roomCode) {
    try {
      const gameState = this.games.get(roomCode);
      if (!gameState) {
        return { success: false, error: 'Room not found' };
      }

      const playerIndex = gameState.players.findIndex(p => p.socketId === socketId);
      if (playerIndex === -1) {
        return { success: false, error: 'Player not in room' };
      }

      const leavingPlayer = gameState.players[playerIndex];
      gameState.players.splice(playerIndex, 1);
      this.playerRooms.delete(socketId);

      // If host left, make someone else host
      if (leavingPlayer.isHost && gameState.players.length > 0) {
        gameState.players[0].isHost = true;
      }

      // If no players left, delete the game
      if (gameState.players.length === 0) {
        this.games.delete(roomCode);
        return { success: true, gameState: null };
      }

      return {
        success: true,
        gameState: this.getPublicGameState(gameState)
      };
    } catch (error) {
      console.error('Error in leaveRoom:', error);
      return { success: false, error: 'Failed to leave room' };
    }
  }

  handleDisconnect(socketId) {
    const roomCode = this.playerRooms.get(socketId);
    if (roomCode) {
      this.leaveRoom(socketId, roomCode);
    }
  }

  generatePlayerId() {
    return Math.random().toString(36).substr(2, 9);
  }

  getPublicGameState(gameState) {
    // Return game state without sensitive information
    return {
      roomCode: gameState.roomCode,
      players: gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isReady: p.isReady,
        isChameleon: gameState.gamePhase === 'game-over' ? p.isChameleon : undefined
      })),
      words: gameState.words,
      gamePhase: gameState.gamePhase,
      votingResults: gameState.votingResults,
      winner: gameState.winner,
      chameleonGuess: gameState.chameleonGuess,
      secretWord: gameState.gamePhase === 'game-over' ? gameState.secretWord : undefined
    };
  }
}