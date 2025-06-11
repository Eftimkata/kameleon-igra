import React, { useState } from 'react';
import { Users, Plus, Play, Copy, Check, Wifi, WifiOff } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
}

interface GameLobbyProps {
  roomCode: string;
  players: Player[];
  currentPlayer: Player;
  onStartGame: () => void;
  onAddWord: (word: string) => void;
  words: string[];
  onLeaveRoom: () => void;
  connected: boolean;
}

export function GameLobby({ 
  roomCode, 
  players, 
  currentPlayer, 
  onStartGame, 
  onAddWord, 
  words, 
  onLeaveRoom,
  connected 
}: GameLobbyProps) {
  const [newWord, setNewWord] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWord.trim() && connected) {
      onAddWord(newWord.trim());
      setNewWord('');
    }
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code');
    }
  };

  const canStartGame = players.length >= 3 && words.length >= 8 && currentPlayer.isHost && connected;

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
          <h1 className="text-4xl font-bold text-green-800 mb-2">🦎 Chameleon</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-lg text-green-700">Room Code:</span>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md">
              <span className="font-mono text-xl font-bold text-green-800">{roomCode}</span>
              <button
                onClick={copyRoomCode}
                className="p-1 hover:bg-green-50 rounded transition-colors"
                title="Copy room code"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-green-600" />}
              </button>
            </div>
          </div>
          <button
            onClick={onLeaveRoom}
            disabled={!connected}
            className={`text-sm transition-colors ${
              connected 
                ? 'text-green-600 hover:text-green-800' 
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Leave Room
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Players Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">Players ({players.length})</h2>
            </div>
            <div className="space-y-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    player.id === currentPlayer.id
                      ? 'bg-green-100 border-2 border-green-300'
                      : 'bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="font-medium text-gray-800">{player.name}</span>
                    {player.isHost && (
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Host</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {players.length < 3 && (
              <p className="text-sm text-amber-600 mt-4 p-3 bg-amber-50 rounded-lg">
                Need at least 3 players to start the game
              </p>
            )}
          </div>

          {/* Words Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">Word Pool ({words.length})</h2>
            </div>
            
            <form onSubmit={handleAddWord} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Add a word..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={20}
                  disabled={!connected}
                />
                <button
                  type="submit"
                  disabled={!newWord.trim() || !connected}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    newWord.trim() && connected
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Add
                </button>
              </div>
            </form>

            <div className="max-h-48 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {words.map((word, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
            
            {words.length < 8 && (
              <p className="text-sm text-amber-600 mt-4 p-3 bg-amber-50 rounded-lg">
                Add at least 8 words to start the game
              </p>
            )}
          </div>
        </div>

        {/* Start Game Button */}
        {currentPlayer.isHost && (
          <div className="text-center mt-8">
            <button
              onClick={onStartGame}
              disabled={!canStartGame}
              className={`flex items-center gap-2 mx-auto px-8 py-3 rounded-xl font-semibold text-lg transition-all ${
                canStartGame
                  ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5" />
              Start Game
            </button>
            {!connected && (
              <p className="text-sm text-red-600 mt-2">
                Connection required to start game
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}