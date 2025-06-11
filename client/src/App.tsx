import React from 'react';
import { HomeScreen } from './components/HomeScreen';
import { GameLobby } from './components/GameLobby';
import { GameBoard } from './components/GameBoard';
import { useGameState } from './hooks/useGameState';

function App() {
  const {
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
  } = useGameState();

  if (gameState.screen === 'home') {
    return (
      <HomeScreen 
        onCreateGame={createGame} 
        onJoinGame={joinGame}
        connected={connected}
        error={gameState.error}
        onClearError={clearError}
      />
    );
  }

  if (gameState.screen === 'lobby') {
    return (
      <GameLobby
        roomCode={gameState.roomCode}
        players={gameState.players}
        currentPlayer={gameState.currentPlayer!}
        onStartGame={startGame}
        onAddWord={addWord}
        words={gameState.words}
        onLeaveRoom={leaveRoom}
        connected={connected}
      />
    );
  }

  if (gameState.screen === 'game') {
    return (
      <GameBoard
        players={gameState.players}
        currentPlayer={gameState.currentPlayer!}
        secretWord={gameState.secretWord}
        gamePhase={gameState.gamePhase}
        onVote={vote}
        onChameleonGuess={makeChameleonGuess}
        onNewGame={newGame}
        onAdvancePhase={advancePhase}
        winner={gameState.winner}
        votingResults={gameState.votingResults}
        chameleonGuess={gameState.chameleonGuess}
        isChameleon={gameState.isChameleon}
        connected={connected}
      />
    );
  }

  return null;
}

export default App;