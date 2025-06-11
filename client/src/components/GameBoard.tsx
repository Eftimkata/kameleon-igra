import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, MessageCircle, Vote, Target, Trophy, RotateCcw, Wifi, WifiOff } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isChameleon?: boolean;
  votes?: number;
}

interface GameBoardProps {
  players: Player[];
  currentPlayer: Player;
  secretWord: string;
  gamePhase: 'reveal' | 'discussion' | 'voting' | 'chameleon-guess' | 'game-over';
  onVote: (playerId: string) => void;
  onChameleonGuess: (guess: string) => void;
  onNewGame: () => void;
  onAdvancePhase: (phase: string) => void;
  winner: string | null;
  votingResults: { [playerId: string]: number };
  chameleonGuess: string;
  isChameleon: boolean;
  connected: boolean;
}

export function GameBoard({
  players,
  currentPlayer,
  secretWord,
  gamePhase,
  onVote,
  onChameleonGuess,
  onNewGame,
  onAdvancePhase,
  winner,
  votingResults,
  chameleonGuess,
  isChameleon,
  connected
}: GameBoardProps) {
  const [selectedVote, setSelectedVote] = useState<string>('');
  const [guess, setGuess] = useState('');
  const [wordRevealed, setWordRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const chameleon = players.find(p => p.isChameleon);

  // Timer for discussion phase
  useEffect(() => {
    if (gamePhase === 'discussion' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, timeLeft]);

  const handleVote = () => {
    if (selectedVote) {
      onVote(selectedVote);
      setSelectedVote('');
    }
  };

  const handleChameleonGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      onChameleonGuess(guess.trim());
      setGuess('');
    }
  };

  const getPhaseTitle = () => {
    switch (gamePhase) {
      case 'reveal':
        return 'Word Revealed';
      case 'discussion':
        return 'Discussion Time';
      case 'voting':
        return 'Vote for the Chameleon';
      case 'chameleon-guess':
        return 'Chameleon\'s Last Chance';
      case 'game-over':
        return 'Game Over';
      default:
        return '';
    }
  };

  const getPhaseDescription = () => {
    switch (gamePhase) {
      case 'reveal':
        return isChameleon 
          ? 'You are the Chameleon! Listen carefully and try to blend in.' 
          : 'You know the secret word. Give subtle clues without being too obvious!';
      case 'discussion':
        return 'Discuss the topic and give clues. Try to identify who doesn\'t know the word!';
      case 'voting':
        return 'Vote for who you think is the Chameleon!';
      case 'chameleon-guess':
        return chameleon?.name + ' was caught! They get one chance to guess the word.';
      case 'game-over':
        return winner === 'chameleon' 
          ? 'The Chameleon wins by guessing the word correctly!' 
          : winner === 'players' 
          ? 'The players win by catching the Chameleon!' 
          : 'The Chameleon wins by not being caught!';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Connection Status */}
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
            connected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">🦎 Chameleon</h1>
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{getPhaseTitle()}</h2>
            <p className="text-gray-600 mb-4">{getPhaseDescription()}</p>
            
            {gamePhase === 'discussion' && (
              <div className="text-2xl font-mono text-green-600">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </div>

        {/* Secret Word Display */}
        {gamePhase === 'reveal' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
            {isChameleon ? (
              <div className="space-y-4">
                <div className="text-6xl">🤫</div>
                <p className="text-lg text-red-600 font-semibold">You are the Chameleon!</p>
                <p className="text-gray-600">You don't know the secret word. Listen carefully and try to blend in!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setWordRevealed(!wordRevealed)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {wordRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {wordRevealed ? 'Hide' : 'Reveal'} Word
                  </button>
                </div>
                {wordRevealed && (
                  <div className="text-4xl font-bold text-green-800 bg-green-100 px-6 py-4 rounded-lg">
                    {secretWord}
                  </div>
                )}
                <p className="text-gray-600">Remember: Give clues without being too obvious!</p>
              </div>
            )}
          </div>
        )}

        {/* Players Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {players.map((player) => (
            <div
              key={player.id}
              className={`bg-white rounded-xl shadow-lg p-4 transition-all ${
                player.id === currentPlayer.id
                  ? 'ring-2 ring-green-500 bg-green-50'
                  : ''
              } ${
                gamePhase === 'voting' && selectedVote === player.id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : ''
              } ${
                gamePhase === 'game-over' && player.isChameleon
                  ? 'ring-2 ring-red-500 bg-red-50'
                  : ''
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {player.isChameleon && gamePhase === 'game-over' ? '🦎' : '👤'}
                </div>
                <h3 className="font-semibold text-gray-800">{player.name}</h3>
                {player.id === currentPlayer.id && (
                  <span className="text-xs text-green-600">(You)</span>
                )}
                {gamePhase === 'voting' && votingResults[player.id] > 0 && (
                  <div className="mt-2 text-sm text-blue-600">
                    {votingResults[player.id]} votes
                  </div>
                )}
                {gamePhase === 'voting' && (
                  <button
                    onClick={() => setSelectedVote(player.id)}
                    disabled={player.id === currentPlayer.id || !connected}
                    className={`mt-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                      selectedVote === player.id
                        ? 'bg-blue-600 text-white'
                        : player.id === currentPlayer.id || !connected
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {selectedVote === player.id ? 'Selected' : 'Vote'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          {gamePhase === 'reveal' && (
            <button
              onClick={() => {
                setTimeLeft(60);
                onAdvancePhase('discussion');
              }}
              disabled={!connected}
              className={`flex items-center gap-2 mx-auto px-6 py-3 rounded-xl transition-colors ${
                connected
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              Start Discussion
            </button>
          )}

          {gamePhase === 'discussion' && timeLeft === 0 && (
            <button
              onClick={() => onAdvancePhase('voting')}
              disabled={!connected}
              className={`flex items-center gap-2 mx-auto px-6 py-3 rounded-xl transition-colors ${
                connected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Vote className="w-5 h-5" />
              Start Voting
            </button>
          )}

          {gamePhase === 'voting' && (
            <button
              onClick={handleVote}
              disabled={!selectedVote || !connected}
              className={`flex items-center gap-2 mx-auto px-6 py-3 rounded-xl transition-colors ${
                selectedVote && connected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Vote className="w-5 h-5" />
              Cast Vote
            </button>
          )}

          {gamePhase === 'chameleon-guess' && isChameleon && (
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Final Guess</h3>
              <form onSubmit={handleChameleonGuess} className="space-y-4">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="What is the secret word?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                  disabled={!connected}
                />
                <button
                  type="submit"
                  disabled={!guess.trim() || !connected}
                  className={`w-full py-2 rounded-lg transition-colors ${
                    guess.trim() && connected
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Target className="w-4 h-4 inline mr-2" />
                  Make Guess
                </button>
              </form>
            </div>
          )}

          {gamePhase === 'chameleon-guess' && chameleonGuess && (
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Chameleon's Guess</h3>
              <div className="text-2xl font-bold text-red-600 mb-2">"{chameleonGuess}"</div>
              <div className="text-lg">
                Secret word was: <span className="font-bold text-green-600">"{secretWord}"</span>
              </div>
            </div>
          )}

          {gamePhase === 'game-over' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {winner === 'chameleon' ? 'Chameleon Wins!' : 'Players Win!'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {winner === 'chameleon' 
                    ? 'The Chameleon successfully guessed the word!' 
                    : 'The players successfully identified the Chameleon!'}
                </p>
                <div className="text-lg">
                  The Chameleon was: <span className="font-bold text-red-600">{chameleon?.name}</span>
                </div>
                <div className="text-lg">
                  Secret word: <span className="font-bold text-green-600">"{secretWord}"</span>
                </div>
              </div>
              
              <button
                onClick={onNewGame}
                disabled={!connected}
                className={`flex items-center gap-2 mx-auto px-6 py-3 rounded-xl transition-colors ${
                  connected
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-5 h-5" />
                New Game
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}