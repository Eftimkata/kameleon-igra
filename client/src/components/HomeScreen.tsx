import React, { useState } from 'react';
import { Play, Users, Plus, Gamepad2, Wifi, WifiOff } from 'lucide-react';

interface HomeScreenProps {
  onCreateGame: (playerName: string) => void;
  onJoinGame: (playerName: string, roomCode: string) => void;
  connected: boolean;
  error: string | null;
  onClearError: () => void;
}

export function HomeScreen({ onCreateGame, onJoinGame, connected, error, onClearError }: HomeScreenProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && connected) {
      onCreateGame(playerName.trim());
    }
  };

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && roomCode.trim() && connected) {
      onJoinGame(playerName.trim(), roomCode.trim().toUpperCase());
    }
  };

  // Clear error when switching modes
  React.useEffect(() => {
    if (error) {
      onClearError();
    }
  }, [mode, onClearError]);

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
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

        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🦎</div>
            <h1 className="text-3xl font-bold text-green-800 mb-2">Create Game</h1>
            <p className="text-gray-600">Start a new Chameleon game</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleCreateGame} className="space-y-6">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                maxLength={20}
                required
                disabled={!connected}
              />
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={!playerName.trim() || !connected}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  playerName.trim() && connected
                    ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Create Game
              </button>

              {!connected && (
                <p className="text-sm text-red-600 text-center">
                  Connection required to create game
                </p>
              )}

              <button
                type="button"
                onClick={() => setMode('menu')}
                className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back to Menu
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
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

        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🦎</div>
            <h1 className="text-3xl font-bold text-green-800 mb-2">Join Game</h1>
            <p className="text-gray-600">Enter room code to join</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleJoinGame} className="space-y-6">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                maxLength={20}
                required
                disabled={!connected}
              />
            </div>

            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
                Room Code
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-center text-lg"
                maxLength={6}
                required
                disabled={!connected}
              />
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={!playerName.trim() || !roomCode.trim() || !connected}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  playerName.trim() && roomCode.trim() && connected
                    ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                Join Game
              </button>

              {!connected && (
                <p className="text-sm text-red-600 text-center">
                  Connection required to join game
                </p>
              )}

              <button
                type="button"
                onClick={() => setMode('menu')}
                className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back to Menu
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
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

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">🦎</div>
          <h1 className="text-4xl font-bold text-green-800 mb-2">Chameleon</h1>
          <p className="text-gray-600">The ultimate social deduction game</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => setMode('create')}
            disabled={!connected}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all shadow-lg ${
              connected
                ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-6 h-6 inline mr-2" />
            Create Game
          </button>

          <button
            onClick={() => setMode('join')}
            disabled={!connected}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all shadow-lg ${
              connected
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Users className="w-6 h-6 inline mr-2" />
            Join Game
          </button>
        </div>

        {!connected && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-sm text-center">
              Connecting to server...
            </p>
          </div>
        )}

        <div className="mt-8 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            How to Play
          </h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Everyone adds words to the pool</li>
            <li>• One player is secretly the Chameleon</li>
            <li>• Everyone except the Chameleon sees the secret word</li>
            <li>• Give clues and find the Chameleon!</li>
            <li>• If caught, the Chameleon can guess the word to win</li>
          </ul>
        </div>
      </div>
    </div>
  );
}