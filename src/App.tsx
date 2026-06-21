/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { PhoneCall, MessageSquare, Map, HelpCircle } from 'lucide-react';
import { GameType } from './types';
import ForbiddenWords from './games/ForbiddenWords';
import DungeonGuide from './games/DungeonGuide';
import TriviaHost from './games/TriviaHost';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameType>('menu');

  if (activeGame === 'forbidden-words') {
    return <ForbiddenWords onBack={() => setActiveGame('menu')} />;
  }

  if (activeGame === 'dungeon-guide') {
    return <DungeonGuide onBack={() => setActiveGame('menu')} />;
  }

  if (activeGame === 'trivia-host') {
    return <TriviaHost onBack={() => setActiveGame('menu')} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="p-6 md:p-10 max-w-4xl w-full mx-auto flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">TelePlay</h1>
          </div>
          <p className="text-slate-400">One screen. Two players. Call a friend to play.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <button 
             onClick={() => setActiveGame('forbidden-words')}
             className="group relative flex flex-col bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left hover:border-fuchsia-500/50 hover:bg-slate-800/80 transition-all active:scale-[0.98]"
          >
            <div className="bg-fuchsia-500/10 text-fuchsia-400 w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br from-fuchsia-500/20 to-transparent">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Forbidden Words</h2>
            <p className="text-slate-400 text-sm leading-relaxed flex-1">
              Describe a word to your friend on the phone, but be careful not to trigger any forbidden words!
            </p>
          </button>

          <button 
             onClick={() => setActiveGame('dungeon-guide')}
             className="group relative flex flex-col bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all active:scale-[0.98]"
          >
            <div className="bg-cyan-500/10 text-cyan-400 w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br from-cyan-500/20 to-transparent">
              <Map className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Dungeon Guide</h2>
            <p className="text-slate-400 text-sm leading-relaxed flex-1">
              Act as the game master. Describe the map you see, and move your friend's character based on their vocal commands.
            </p>
          </button>

          <button 
             onClick={() => setActiveGame('trivia-host')}
             className="group relative flex flex-col bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left hover:border-amber-500/50 hover:bg-slate-800/80 transition-all active:scale-[0.98]"
          >
            <div className="bg-amber-500/10 text-amber-400 w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br from-amber-500/20 to-transparent">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">The Hot Seat</h2>
            <p className="text-slate-400 text-sm leading-relaxed flex-1">
              Test your friend's knowledge. Read the prompt, provide the options, and verify their answers.
            </p>
          </button>

        </div>
      </main>
    </div>
  );
}
