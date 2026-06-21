import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { triviaQuestions } from '../data';

export default function TriviaHost({ onBack }: { onBack: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Shuffle questions on start
  const [questions, setQuestions] = useState([...triviaQuestions]);

  const startGame = () => {
    setQuestions([...triviaQuestions].sort(() => Math.random() - 0.5));
    setIndex(0);
    setScore(0);
    setGameOver(false);
    setShowAnswer(false);
    setIsPlaying(true);
  };

  const handleNext = (correct: boolean) => {
    if (correct) setScore(s => s + 1);
    
    if (index + 1 < questions.length) {
      setIndex(i => i + 1);
      setShowAnswer(false);
    } else {
      setGameOver(true);
    }
  };

  if (!isPlaying) {
    return (
      <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-6 md:p-10">
        <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white transition-colors mb-8 self-start">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Menu
        </button>
        
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-400 mb-6 tracking-tight">The Hot Seat</h1>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
            <strong>How to play:</strong> You act as the game show host! Read the questions and options aloud to your friend on the phone. Once they answer, reveal the correct response and keep track of their score.
          </p>
          <button 
            onClick={startGame}
            className="flex items-center gap-3 bg-amber-500 hover:bg-amber-600 text-slate-950 px-8 py-4 rounded-full font-bold text-xl transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/25"
          >
            Start the Show
          </button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-6 md:p-10">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
           <p className="text-slate-400 uppercase tracking-widest font-bold mb-4">Final Score</p>
          <p className="text-6xl font-black text-amber-400 mb-2">{score} / {questions.length}</p>
          <p className="text-xl text-slate-300 mb-12">Ask your friend how they think they did!</p>
          
          <div className="flex gap-4">
            <button 
              onClick={onBack}
              className="px-6 py-3 rounded-full font-medium border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              Menu
            </button>
            <button 
              onClick={startGame}
              className="px-6 py-3 rounded-full font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/25"
            >
              New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[index];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto">
       <div className="flex justify-between items-center p-4 md:p-6 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
         <button onClick={() => setIsPlaying(false)} className="text-slate-400 hover:text-white">
           <ArrowLeft className="w-6 h-6" />
         </button>
         <div className="font-mono text-slate-400">
            <span className="text-amber-400 font-bold">{index + 1}</span> / {questions.length}
         </div>
       </div>

       <div className="flex-1 p-6 flex flex-col max-w-2xl mx-auto w-full">
         <div className="mb-8">
            <h3 className="text-amber-400 font-bold flex items-center gap-2 mb-4 uppercase tracking-wider text-sm">
                🗣️ Read aloud
            </h3>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-8">"{q.q}"</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {q.options.map((opt, i) => {
                 const isCorrect = i === q.a;
                 let bgClass = "bg-slate-800 border-slate-700";
                 let textClass = "text-slate-300";
                 
                 if (showAnswer) {
                   if (isCorrect) {
                     bgClass = "bg-green-500/20 border-green-500/50";
                     textClass = "text-green-400 font-bold";
                   } else {
                     bgClass = "bg-slate-900 border-slate-800 opacity-50";
                     textClass = "text-slate-600";
                   }
                 }

                 return (
                   <div key={opt} className={`p-4 rounded-xl border ${bgClass} transition-all`}>
                      <span className="text-slate-500 mr-3 text-sm font-mono">{i + 1}.</span>
                      <span className={textClass}>{opt}</span>
                   </div>
                 );
               })}
            </div>
         </div>

         {!showAnswer ? (
            <div className="mt-auto pb-8 text-center pt-8 border-t border-slate-800">
               <p className="text-slate-400 mb-4">Once your friend gives an answer...</p>
               <button 
                 onClick={() => setShowAnswer(true)}
                 className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold transition-colors border border-slate-600"
               >
                 Reveal Correct Answer to GM
               </button>
            </div>
         ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-auto pb-8 pt-6 border-t border-slate-800"
            >
               <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 mb-6">
                 <h4 className="text-slate-400 text-sm font-bold uppercase mb-2 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-400"/> Context</h4>
                 <p className="text-slate-300 italic">"{q.reason}"</p>
               </div>

               <p className="text-center font-bold text-slate-300 mb-4">Did your friend get it right?</p>
               <div className="flex gap-4">
                 <button 
                   onClick={() => handleNext(false)}
                   className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                 >
                   <XCircle className="w-6 h-6" />
                   <span className="font-bold">Nope</span>
                 </button>
                 <button 
                   onClick={() => handleNext(true)}
                   className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-colors"
                 >
                   <CheckCircle2 className="w-6 h-6" />
                   <span className="font-bold">Correct! (+1)</span>
                 </button>
               </div>
            </motion.div>
         )}
       </div>
    </div>
  );
}
