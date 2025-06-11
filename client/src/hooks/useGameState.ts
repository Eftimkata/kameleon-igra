import { useState, useCallback, useEffect } from 'react';
import { useSocket } from './useSocket';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isChameleon?: boolean;
}

interface GameState {
  screen: 'home' | 'lobby' | 'game';
  roomCode: string;
  players: Player[];
  currentPlayer: Player | null;
  words: string[];
  secretWord: string;
  gamePhase: 'lobby' | 'reveal' | 'discussion' | 'voting' | 'chameleon-guess' | 'game-over';
  votingResults: { [playerId: string]: number };
  winner: string | null;
  chameleonGuess: string;
  isChameleon: boolean;
  error: string | null;
}

export function useGameState() {
  const { socket, connected } = useSocket();
  const [gameState, setGameState] = useState<GameState>({
    screen: 'home',
    roomCode: '',
    players: [],
    currentPlayer: null,
    words: [],
    secretWord: '',
    gamePhase: 'lobby',
    votingResults: {},
    winner: null,
    chameleonGuess: '',
    isChameleon: false,
    error: null
  });

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('game-created', (data) => {
      setGameState(prev => ({
        ...prev,
        screen: 'lobby',
        roomCode: data.roomCode,
        currentPlayer: data.player,
        players: data.gameState.players,
        words: data.gameState.words,
        gamePhase: 'lobby',
        error: null
      }));
    });

    socket.on('game-joined', (data) => {
      setGameState(prev => ({
        ...prev,
        screen: 'lobby',
        currentPlayer: data.player,
        players: data.gameState.players,
        words: data.gameState.words,
        roomCode: data.gameState.roomCode,
        gamePhase: 'lobby',
        error: null
      }));
    });

    socket.on('player-joined', (data) => {
      setGameState(prev => ({
        ...prev,
        players: data.players
      }));
    });

    socket.on('word-added', (data) => {
      setGameState(prev => ({
        ...prev,
        words: data.words
      }));
    });

    socket.on('game-started', (data) => {
      setGameState(prev => ({
        ...prev,
        screen: 'game',
        gamePhase: 'reveal',
        players: data.gameState.players,
        secretWord: data.gameState.secretWord || '',
        isChameleon: data.isChameleon,
        votingResults: {},
        winner: null,
        chameleonGuess: ''
      }));
    });

    socket.on('phase-changed', (data) => {
      setGameState(prev => ({
        ...prev,
        gamePhase: data.gamePhase
      }));
    });

    socket.on('vote-cast', (data) => {
      setGameState(prev => ({
        ...prev,
        votingResults: data.votingResults
      }));
    });

    socket.on('voting-complete', (data) => {
      setGameState(prev => ({
        ...prev,
        gamePhase: data.gameState.gamePhase,
        winner: data.gameState.winner,
        players: data.gameState.players.map(p => ({
          ...p,
          isChameleon: data.gameState.gamePhase === 'game-over' ? 
            data.actualChameleon?.id === p.id : p.isChameleon
        }))
      }));
    });

    socket.on('chameleon-guessed', (data) => {
      setGameState(prev => ({
        ...prev,
        chameleonGuess: data.guess,
        gamePhase: 'game-over',
        winner: data.gameState.winner,
        secretWord: data.gameState.secretWord || prev.secretWord,
        players: prev.players.map(p => ({
          ...p,
          isChameleon: data.gameState.players?.find(gp => gp.id === p.id)?.isChameleon || p.isChameleon
        }))
      }));
    });

    socket.on('new-game-started', (data) => {
      setGameState(prev => ({
        ...prev,
        screen: 'lobby',
        gamePhase: 'lobby',
        secretWord: '',
        votingResults: {},
        winner: null,
        chameleonGuess: '',
        isChameleon: false,
        players: data.gameState.players
      }));
    });

    socket.on('player-left', (data) => {
      setGameState(prev => ({
        ...prev,
        players: data.players
      }));
    });

    socket.on('left-room', () => {
      setGameState({
        screen: 'home',
        roomCode: '',
        players: [],
        currentPlayer: null,
        words: [],
        secretWord: '',
        gamePhase: 'lobby',
        votingResults: {},
        winner: null,
        chameleonGuess: '',
        isChameleon: false,
        error: null
      });
    });

    socket.on('error', (data) => {
      setGameState(prev => ({
        ...prev,
        error: data.message
      }));
    });

    return () => {
      socket.off('game-created');
      socket.off('game-joined');
      socket.off('player-joined');
      socket.off('word-added');
      socket.off('game-started');
      socket.off('phase-changed');
      socket.off('vote-cast');
      socket.off('voting-complete');
      socket.off('chameleon-guessed');
      socket.off('new-game-started');
      socket.off('player-left');
      socket.off('left-room');
      socket.off('error');
    };
  }, [socket]);

  const createGame = useCallback((playerName: string) => {
    if (socket && connected) {
      socket.emit('create-game', { playerName });
    }
  }, [socket, connected]);

  const joinGame = useCallback((playerName: string, roomCode: string) => {
    if (socket && connected) {
      socket.emit('join-game', { playerName, roomCode });
    }
  }, [socket, connected]);

  const addWord = useCallback((word: string) => {
    if (socket && connected) {
      socket.emit('add-word', { roomCode: gameState.roomCode, word });
    }
  }, [socket, connected, gameState.roomCode]);

  const startGame = useCallback(() => {
    if (socket && connected) {
      socket.emit('start-game', { roomCode: gameState.roomCode });
    }
  }, [socket, connected, gameState.roomCode]);

  const advancePhase = useCallback((phase: string) => {
    if (socket && connected) {
      socket.emit('advance-phase', { roomCode: gameState.roomCode, phase });
    }
  }, [socket, connected, gameState.roomCode]);

  const vote = useCallback((playerId: string) => {
    if (socket && connected) {
      socket.emit('vote', { roomCode: gameState.roomCode, targetPlayerId: playerId });
    }
  }, [socket, connected, gameState.roomCode]);

  const makeChameleonGuess = useCallback((guess: string) => {
    if (socket && connected) {
      socket.emit('chameleon-guess', { roomCode: gameState.roomCode, guess });
    }
  }, [socket, connected, gameState.roomCode]);

  const newGame = useCallback(() => {
    if (socket && connected) {
      socket.emit('new-game', { roomCode: gameState.roomCode });
    }
  }, [socket, connected, gameState.roomCode]);

  const leaveRoom = useCallback(() => {
    if (socket && connected) {
      socket.emit('leave-room', { roomCode: gameState.roomCode });
    }
  }, [socket, connected, gameState.roomCode]);

  const clearError = useCallback(() => {
    setGameState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    gameState,
    connected,
    createGame,
    joinGame,
    addWord,
    startGame,
    advancePhase,
    vote,
    makeChameleonGuess,
    newGame,
    leaveRoom,
    clearError
  };
}