import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, X, Play, Clock, AlertTriangle } from 'lucide-react';
import { forbiddenWordsCards } from '../data';

export default function ForbiddenWords({ onBack }: { onBack: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Shuffle deck on start
  const [deck, setDeck] = useState([...forbiddenWordsCards]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      setGameOver(true);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const startGame = () => {
    setDeck([...forbiddenWordsCards].sort(() => Math.random() - 0.5));
    setScore(0);
    setTimeLeft(60);
    setCardIndex(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  const handleNext = (correct: boolean) => {
    if (correct) setScore(s => s + 1);
    
    if (cardIndex + 1 < deck.length) {
      setCardIndex(i => i + 1);
    } else {
      setIsPlaying(false);
      setGameOver(true);
    }
  };

  if (!isPlaying && !gameOver) {
    return (
      <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-6 md:p-10">
        <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white transition-colors mb-8 self-start">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Menu
        </button>
        
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-fuchsia-400 mb-6 tracking-tight">Forbidden Words</h1>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
             <strong>How to play:</strong> You will see a target word. Your goal is to get your friend on the phone to guess it. 
             However, you <strong>cannot</strong> use any of the forbidden words listed below it. You have 60 seconds.
          </p>
          <button 
            onClick={startGame}
            className="flex items-center gap-3 bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-8 py-4 rounded-full font-bold text-xl transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-fuchsia-500/25"
          >
            <Play className="w-6 h-6 fill-current" /> Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-6 md:p-10">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-4xl font-bold text-fuchsia-400 mb-4">Time's Up!</h2>
          <p className="text-6xl font-black text-white mb-2">{score}</p>
          <p className="text-xl text-slate-400 mb-10">Words guessed correctly</p>
          
          <div className="flex gap-4">
            <button 
              onClick={onBack}
              className="px-6 py-3 rounded-full font-medium border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              Menu
            </button>
            <button 
              onClick={startGame}
              className="px-6 py-3 rounded-full font-bold bg-fuchsia-500 hover:bg-fuchsia-600 transition-colors shadow-lg shadow-fuchsia-500/25"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = deck[cardIndex];

  return (
    <div className="flex flex-col items-center h-full bg-slate-950 text-slate-100 p-4 font-sans">
      {/* Header */}
      <div className="w-full max-w-lg flex justify-between items-center py-4 px-2 mb-8 border-b border-white/10">
        <div className="flex items-center gap-2 text-fuchsia-400 font-mono text-xl">
          <Clock className="w-5 h-5" />
          <span className={timeLeft <= 10 ? 'text-red-400 animate-pulse' : ''}>{timeLeft}s</span>
        </div>
        <div className="font-bold text-xl text-slate-300">
          Score: <span className="text-white">{score}</span>
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="popLayout">
        <motion.div 
          key={currentCard.word}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 w-full max-w-lg shadow-2xl flex flex-col items-center"
        >
          <p className="text-slate-500 font-medium uppercase tracking-widest mb-4">Target Word</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-10 text-center">
            {currentCard.word}
          </h2>

          <div className="w-full flex-1 border-t border-red-500/20 pt-8 flex flex-col items-center">
            <div className="flex items-center gap-2 text-red-400 font-bold mb-6">
              <AlertTriangle className="w-5 h-5" />
              <p className="uppercase tracking-widest">Forbidden</p>
            </div>
            <ul className="space-y-4 text-center">
              {currentCard.forbidden.map(word => (
                <li key={word} className="text-2xl text-slate-300 font-medium">{word}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="w-full max-w-lg flex gap-4 mt-8">
        <button 
          onClick={() => handleNext(false)}
          className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 transition-colors active:scale-95 border border-slate-700"
        >
          <X className="w-8 h-8 text-slate-400" />
          <span className="font-bold text-slate-300">Skip</span>
        </button>
        <button 
          onClick={() => handleNext(true)}
          className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl bg-green-500/10 hover:bg-green-500/20 transition-colors active:scale-95 border border-green-500/30"
        >
          <Check className="w-8 h-8 text-green-400" />
          <span className="font-bold text-green-400">Got It!</span>
        </button>
      </div>
    </div>
  );
}
