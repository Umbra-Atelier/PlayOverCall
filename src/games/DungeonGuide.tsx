import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight, Key, DoorClosed, Flag } from 'lucide-react';
import { dungeonLevels } from '../data';

export default function DungeonGuide({ onBack }: { onBack: () => void }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [grid, setGrid] = useState<number[][]>([]);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hasKey, setHasKey] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load level
  useEffect(() => {
    if (isPlaying) {
      loadLevel(levelIndex);
    }
  }, [isPlaying, levelIndex]);

  const loadLevel = (idx: number) => {
    const rawGrid = dungeonLevels[idx];
    // Deep clone grid
    const newGrid = rawGrid.map(row => [...row]);
    let startX = 1, startY = 1;
    
    // Find start
    for (let r = 0; r < newGrid.length; r++) {
      for (let c = 0; c < newGrid[r].length; c++) {
        if (newGrid[r][c] === 2) {
          startX = c;
          startY = r;
        }
      }
    }

    setGrid(newGrid);
    setPos({ x: startX, y: startY });
    setHasKey(false);
    setHasWon(false);
  };

  const move = (dx: number, dy: number) => {
    if (hasWon) return;

    const nx = pos.x + dx;
    const ny = pos.y + dy;

    // Bounds check
    if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) return;

    const cell = grid[ny][nx];

    // Wall check
    if (cell === 1) return;

    // Door check
    if (cell === 5 && !hasKey) return;

    // Execute move
    let newGrid = [...grid];
    
    if (cell === 4) { // Key
      setHasKey(true);
      newGrid[ny][nx] = 0; // consume key
      setGrid(newGrid);
    } else if (cell === 5) { // Door
      newGrid[ny][nx] = 0; // open door
      setGrid(newGrid);
    } else if (cell === 3) { // Exit
      setHasWon(true);
    }

    setPos({ x: nx, y: ny });
  };

  const getAvailableDirections = () => {
    if (!grid.length) return "";
    const dirs: string[] = [];
    const check = (dx: number, dy: number, name: string) => {
      const nx = pos.x + dx;
      const ny = pos.y + dy;
      if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
        const c = grid[ny][nx];
        if (c !== 1) {
          if (c === 5) {
            dirs.push(`${name} (Door - ${hasKey ? 'Can Open' : 'Locked!'})`);
          } else if (c === 4) {
             dirs.push(`${name} (Shiny Key)`);
          } else if (c === 3) {
             dirs.push(`${name} (EXIT!)`);
          } else {
            dirs.push(name);
          }
        }
      }
    };

    check(0, -1, "North / Up");
    check(0, 1, "South / Down");
    check(1, 0, "East / Right");
    check(-1, 0, "West / Left");

    return dirs.join(",  ");
  };

  if (!isPlaying) {
    return (
      <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-6 md:p-10">
        <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white transition-colors mb-8 self-start">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Menu
        </button>
        
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-6 tracking-tight">Dungeon Guide</h1>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 text-left">
            <strong>How to play:</strong> You act as the game master. You can see the map, but your friend on the phone cannot.
            <br/><br/>
            Read the script on your screen to describe their surroundings. When they decide which way to walk, tap the corresponding arrow button to move them. Guide them to the exit!
          </p>
          <button 
            onClick={() => setIsPlaying(true)}
            className="flex items-center gap-3 bg-cyan-500 hover:bg-cyan-600 text-slate-950 px-8 py-4 rounded-full font-bold text-xl transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/25"
          >
            Start Campaign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-800 md:rounded-t-2xl">
        <button onClick={() => setIsPlaying(false)} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="font-bold text-lg text-slate-200">Level {levelIndex + 1}</div>
        <div className={`flex items-center gap-2 font-bold px-3 py-1 rounded-full ${hasKey ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
          <Key className="w-4 h-4" /> Key
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Main Grid View */}
        <div className="flex-1 p-4 flex items-center justify-center bg-slate-900 relative">
          
          {hasWon && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <h2 className="text-4xl font-bold text-green-400 mb-6 drop-shadow-lg">Level Cleared!</h2>
              {levelIndex + 1 < dungeonLevels.length ? (
                <button 
                  onClick={() => setLevelIndex(i => i + 1)}
                  className="px-8 py-3 bg-cyan-500 text-slate-950 font-bold rounded-full hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  Next Level
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-xl mb-6 text-slate-300">You completed all dungeons!</p>
                  <button onClick={onBack} className="px-6 py-3 border border-slate-600 rounded-full hover:bg-slate-800 transition">
                    Return to Menu
                  </button>
                </div>
              )}
            </motion.div>
          )}

          <div className="grid gap-1 bg-slate-800 p-2 rounded-xl shadow-2xl relative">
            {grid.map((row, y) => (
              <div key={y} className="flex gap-1">
                {row.map((cell, x) => {
                  const isPlayer = pos.x === x && pos.y === y;
                  let cellBg = "bg-slate-700"; // floor
                  if (cell === 1) cellBg = "bg-slate-950"; // wall
                  if (cell === 3) cellBg = "bg-green-500/30 border border-green-500/50"; // exit
                  if (cell === 5) cellBg = "bg-amber-900/50 border border-amber-600"; // door

                  return (
                    <div 
                      key={`${x}-${y}`} 
                      className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md flex items-center justify-center relative transition-colors ${cellBg}`}
                    >
                      {cell === 4 && !isPlayer && <Key className="w-5 h-5 text-amber-400" />}
                      {cell === 5 && !isPlayer && <DoorClosed className="w-6 h-6 text-amber-500" />}
                      {cell === 3 && !isPlayer && <Flag className="w-5 h-5 text-green-400" />}
                      
                      {isPlayer && (
                        <motion.div 
                          layoutId="player"
                          className="absolute inset-1 bg-cyan-400 rounded-sm shadow-[0_0_15px_rgba(34,211,238,0.7)]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* GM Controls / Script */}
        <div className="h-64 lg:h-auto lg:w-96 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col p-4 md:rounded-br-2xl">
          <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4 overflow-y-auto">
            <h3 className="text-cyan-400 font-bold uppercase text-xs tracking-wider mb-2">🗣️ Read to your friend</h3>
            <p className="text-slate-300 leading-relaxed">
              "You are currently standing in a corridor. From here, you can travel: <br/>
              <span className="font-bold text-white text-lg block mt-2">{getAvailableDirections()}</span>
              <br/>Which way do you want to go?"
            </p>
          </div>

          <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full max-w-[240px] mx-auto opacity-90">
            <div />
            <button 
              onClick={() => move(0, -1)}
              className="bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/50 rounded-xl p-4 flex items-center justify-center transition-colors active:scale-95"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
            <div />
            <button 
               onClick={() => move(-1, 0)}
               className="bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/50 rounded-xl p-4 flex items-center justify-center transition-colors active:scale-95"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div className="flex items-center justify-center ">
              <div className="w-3 h-3 bg-slate-700 rounded-full" />
            </div>
            <button 
               onClick={() => move(1, 0)}
               className="bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/50 rounded-xl p-4 flex items-center justify-center transition-colors active:scale-95"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
            <div />
            <button 
               onClick={() => move(0, 1)}
               className="bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/50 rounded-xl p-4 flex items-center justify-center transition-colors active:scale-95"
            >
              <ArrowDown className="w-6 h-6" />
            </button>
            <div />
          </div>
        </div>
      </div>
    </div>
  );
}
