import React, { useState, useEffect, useRef } from 'react';
import { Mic, BookOpen, Skull, Rocket, AlertCircle, Phone, Loader2, Volume2, Wifi, WifiOff, VolumeX, Sparkles, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';

const SETTINGS = [
  { id: 'haunted', title: 'Haunted Mansion', icon: Skull, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'cyberpunk', title: 'Cyberpunk Heist', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'space', title: 'Space Exploration', icon: Rocket, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { id: 'fantasy', title: 'Fantasy Tavern', icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

const LOADING_PHRASES = [
  "Generating massive story universe...",
  "Writing branching narratives...",
  "Plotting dramatic twists...",
  "Preparing for offline mode...",
  "Almost there..."
];

interface Choice {
  text: string;
  keywords: string[];
  nextNodeId: string;
}

interface StoryNode {
  id: string;
  text: string;
  isEnding: boolean;
  choices?: Choice[];
}

interface StoryTree {
  title: string;
  nodes: StoryNode[];
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showApiInput, setShowApiInput] = useState(!localStorage.getItem('gemini_api_key'));

  type GenerationSize = 1 | 2 | 5;
  const [generationSize, setGenerationSize] = useState<GenerationSize>(2);
  const [decisionCount, setDecisionCount] = useState(0);
  const [storyHistory, setStoryHistory] = useState<string[]>([]);
  const [pendingChoice, setPendingChoice] = useState<{ nextId: string, actionText: string } | null>(null);

  const [gameState, setGameState] = useState<'menu' | 'loading' | 'playing' | 'generate_more'>('menu');
  const [selectedSetting, setSelectedSetting] = useState(SETTINGS[0]);
  const [error, setError] = useState<string | null>(null);
  
  const [storyData, setStoryData] = useState<StoryTree | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);

  const recognitionRef = useRef<any>(null);

  const getMaxDecisions = (size: GenerationSize) => {
    if (size === 1) return 2;
    if (size === 2) return 4;
    return 8;
  };

  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.lang = 'en-US';
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript.toLowerCase();
        setLastHeard(transcript);

        if (gameState !== 'playing') return;

        const node = storyData?.nodes.find(n => n.id === currentNodeId);
        if (node && node.choices) {
          for (let i = 0; i < node.choices.length; i++) {
            const choice = node.choices[i];
            const matchers = [
              ...choice.keywords.map(k => k.toLowerCase()),
              `option ${i + 1}`,
              `option number ${i + 1}`,
              `${i + 1}`,
              choice.text.toLowerCase()
            ];
            if (matchers.some(m => transcript.includes(m))) {
              handleChoiceClick(choice.nextNodeId, choice.text);
              return;
            }
          }
        }
      };
    }
  });

  useEffect(() => {
    if (gameState === 'loading') {
      const interval = setInterval(() => {
        setLoadingPhraseIndex(i => (i + 1) % LOADING_PHRASES.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  const generateStory = async (isContinue: boolean = false) => {
    if (!apiKey) {
      setError("Please enter a Gemini API key to generate the story.");
      setShowApiInput(true);
      return;
    }

    localStorage.setItem('gemini_api_key', apiKey);

    // Unlock speech synthesis eagerly on user interaction
    window.speechSynthesis.cancel();
    const silent = new SpeechSynthesisUtterance('');
    silent.volume = 0;
    window.speechSynthesis.speak(silent);

    setGameState('loading');
    setError(null);
    setLoadingPhraseIndex(0);

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
      });

      const nodeCountStr = generationSize === 1 ? "4-6" : generationSize === 2 ? "8-12" : "15-20";

      let prompt = "";
      if (!isContinue) {
        prompt = `You are an AI storyteller creating a voice-based offline "Choose Your Own Adventure" game.
        Setting: "${selectedSetting.title}".
        Generate exactly ${nodeCountStr} total nodes in the tree.
        The root node MUST have id "start".
        Ensure valid 'nextNodeId' references for all choices.
        Make the narrative text highly atmospheric and engaging (about 30-50 words per node).
        For leaf nodes in this batch, DO NOT set 'isEnding' to true unless the story logically concludes. Instead, provide choices where the 'nextNodeId' points to a unique ID that you DO NOT generate in this batch (these will act as cliffhangers for future generation).
        
        OUTPUT FORMAT:
        You must output valid JSON in this exact structure:
        {
          "title": "Story Title",
          "nodes": [
            {
              "id": "start",
              "text": "Narrative text here...",
              "isEnding": false,
              "choices": [
                {
                  "text": "Go left",
                  "keywords": ["left", "go left"],
                  "nextNodeId": "node_2"
                }
              ]
            }
          ]
        }`;
      } else {
        const historyText = storyHistory.slice(-4).join(' ');
        prompt = `You are an AI storyteller continuing a voice-based offline "Choose Your Own Adventure" game.
        Previous story context: "${historyText}"
        The player chose to: "${pendingChoice?.actionText}"
        
        Generate exactly ${nodeCountStr} new nodes to continue the story from this exact point.
        The root node of this new batch MUST have id "${pendingChoice?.nextId}".
        Ensure valid 'nextNodeId' references for choices.
        Make the narrative text highly atmospheric and engaging (about 30-50 words per node).
        For leaf nodes in this batch, DO NOT set 'isEnding' to true unless the story logically concludes. Instead, provide choices where the 'nextNodeId' points to a unique ID that you DO NOT generate in this batch.
        
        OUTPUT FORMAT:
        You must output valid JSON in this exact structure:
        {
          "title": "Story Title",
          "nodes": [
            {
              "id": "...",
              "text": "Narrative text here...",
              "isEnding": false,
              "choices": [
                {
                  "text": "Go left",
                  "keywords": ["left", "go left"],
                  "nextNodeId": "node_X"
                }
              ]
            }
          ]
        }`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text;
      if (!responseText) {
          throw new Error('The AI returned an empty response (possibly blocked by safety filters).');
      }

      const data = JSON.parse(responseText);
      
      if (!data || !data.nodes || data.nodes.length === 0) {
        console.error("AI returned invalid structure:", data);
        throw new Error('The AI did not return any story nodes. Raw output logged to console.');
      }
      
      setStoryData(prev => {
         if (!isContinue || !prev) return data;
         const existingIds = new Set(data.nodes.map((n: any) => n.id));
         const filteredPrevNodes = prev.nodes.filter(n => !existingIds.has(n.id));
         return {
            ...prev,
            nodes: [...filteredPrevNodes, ...data.nodes]
         };
      });

      if (!isContinue) {
         setCurrentNodeId('start');
         setStoryHistory([]);
      } else if (pendingChoice) {
         setCurrentNodeId(pendingChoice.nextId);
      }
      
      setDecisionCount(0);
      setPendingChoice(null);
      setGameState('playing');
    } catch (err: any) {
      console.error("Generation Error:", err);
      let errorMessage = err.message || "An unknown error occurred.";
      
      if (errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("UNAVAILABLE")) {
         errorMessage = "The AI is currently experiencing high demand. Please try again in a few moments.";
      } else if (errorMessage.includes("API key") || errorMessage.includes("400") || errorMessage.includes("403")) {
         errorMessage = "There was an issue with your API Key. Please check your settings and try again.";
      } else {
         errorMessage = errorMessage + " (Please check your API key or network connection).";
      }
      
      setError(errorMessage);
      setGameState(isContinue ? 'generate_more' : 'menu');
    }
  };

  const handleChoiceClick = (nextId: string, actionText: string) => {
    window.speechSynthesis.cancel();
    if (isListening && recognitionRef.current) recognitionRef.current.abort();
    setIsSpeaking(false);
    setLastHeard('');
    
    if (currentNode) {
      setStoryHistory(prev => [...prev, currentNode.text]);
    }

    const nextNodeExists = storyData?.nodes.some(n => n.id === nextId);
    
    if (decisionCount + 1 >= getMaxDecisions(generationSize) || !nextNodeExists) {
      setPendingChoice({ nextId, actionText });
      setGameState('generate_more');
    } else {
      setDecisionCount(prev => prev + 1);
      setCurrentNodeId(nextId);
    }
  };

  const manuallyStartListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  const stopGame = () => {
    window.speechSynthesis.cancel();
    if (isListening && recognitionRef.current) recognitionRef.current.abort();
    setGameState('menu');
    setStoryData(null);
  };

  const currentNode = storyData?.nodes.find(n => n.id === currentNodeId);

  useEffect(() => {
    if (gameState === 'playing' && currentNode) {
      window.speechSynthesis.cancel();
      setLastHeard('');
      
      let fullText = currentNode.text;
      if (!currentNode.isEnding && currentNode.choices) {
        const choiceText = currentNode.choices.map((c, i) => `Option ${i + 1}... ${c.text}`).join('. ');
        fullText += `. What will you do? ${choiceText}`;
      }
      
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (!currentNode.isEnding) {
          manuallyStartListening();
        }
      };
      utterance.onerror = () => setIsSpeaking(false);
      
      // Delay slightly so UI transition can complete
      const timer = setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 500);

      return () => {
        clearTimeout(timer);
        window.speechSynthesis.cancel();
      };
    }
  }, [currentNodeId, gameState]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans p-4 md:p-8">
      
      {gameState === 'menu' && (
        <div className="max-w-4xl mx-auto w-full pt-10">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-sm flex items-center gap-3 text-white">
              <span className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">
                 <Mic className="w-8 h-8" />
              </span>
              Say The Word
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
              An interactive offline-ready AI story game. Call a friend, generate a giant story tree, and then go completely offline. Guide the narrator entirely with your voice.
            </p>
          </header>

          <h2 className="text-2xl font-bold mb-6 text-slate-300">Choose your setting</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {SETTINGS.map((setting) => (
              <button
                key={setting.id}
                onClick={() => setSelectedSetting(setting)}
                className={`flex flex-col items-start p-6 rounded-3xl border-2 transition-all text-left ${
                  selectedSetting.id === setting.id 
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.15)] ring-2 ring-indigo-500/50' 
                    : 'border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`${setting.bg} ${setting.color} p-3 rounded-2xl mb-4`}>
                  <setting.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{setting.title}</h3>
                <p className="text-slate-400 text-sm">Download an adventure in a {setting.title.toLowerCase()}.</p>
              </button>
            ))}
          </div>

          <div className="mb-10">
            <h3 className="text-xl font-bold text-slate-300 mb-4">Select Offline Generation Buffer</h3>
            <div className="flex flex-wrap gap-4 mb-6">
              {[1, 2, 5].map(size => (
                <button
                  key={size}
                  onClick={() => setGenerationSize(size as GenerationSize)}
                  className={`px-6 py-4 rounded-2xl border-2 font-bold transition-all flex-1 text-center ${
                    generationSize === size
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{size}</div>
                  <div className="text-xs uppercase tracking-wider opacity-80">Minute{size > 1 ? 's' : ''} Playtime</div>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowApiInput(!showApiInput)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <Key className="w-4 h-4" /> 
              {showApiInput ? "Hide API Key Settings" : "Configure API Key"}
            </button>
            
            <AnimatePresence>
              {showApiInput && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-900 border border-slate-800 p-6 rounded-3xl overflow-hidden"
                >
                  <label className="block text-sm font-bold text-slate-300 mb-2">Gemini API Key</label>
                  <p className="text-sm text-slate-500 mb-4">Required to generate the story offline tree. Stored locally in your browser.</p>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-2xl flex items-center gap-3 w-full text-left mb-6">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={() => generateStory(false)}
              className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-full font-bold text-xl transition-all hover:-translate-y-1 active:translate-y-0 shadow-lg shadow-indigo-600/30"
            >
              <Wifi className="w-6 h-6" /> Generate & Download Story
            </button>
          </div>
        </div>
      )}

      {gameState === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
           <div className="relative mb-10">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-ping" />
              <div className="bg-indigo-500/10 p-8 rounded-full border border-indigo-500/30">
                 <Loader2 className="w-16 h-16 text-indigo-400 animate-spin" />
              </div>
           </div>
           <h2 className="text-3xl font-black text-white mb-4 tracking-tight drop-shadow-md">
             {LOADING_PHRASES[loadingPhraseIndex]}
           </h2>
           <p className="text-slate-400 max-w-md mx-auto">
             We are building a massive branching story tree for you. Once this finishes, you can disconnect from the internet and keep playing.
           </p>
        </div>
      )}

      {gameState === 'generate_more' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500 p-8">
           <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 max-w-xl w-full shadow-2xl">
              <h2 className="text-3xl font-black text-white mb-4">Story Buffer Empty</h2>
              <p className="text-slate-400 mb-8">
                You've reached the end of your offline cache, or your time limit was reached. Select how much more story to generate before going offline again.
              </p>

              <div className="flex gap-4 mb-8 justify-center">
                 {[1, 2, 5].map(size => (
                   <button
                     key={size}
                     onClick={() => setGenerationSize(size as GenerationSize)}
                     className={`px-6 py-3 rounded-2xl border-2 font-bold transition-all ${
                       generationSize === size
                         ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                         : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                     }`}
                   >
                     {size} Minute{size > 1 ? 's' : ''}
                   </button>
                 ))}
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center gap-3 w-full text-left mb-6">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                 <button
                   onClick={() => generateStory(true)}
                   className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all w-full sm:w-auto shadow-lg shadow-indigo-600/30"
                 >
                   <Wifi className="w-5 h-5" /> Generate More Story
                 </button>
                 <button
                   onClick={stopGame}
                   className="text-slate-500 hover:text-white transition-colors font-bold px-6 py-4"
                 >
                   End Game
                 </button>
              </div>
           </div>
        </div>
      )}

      {gameState === 'playing' && currentNode && (
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col animate-in slide-in-from-bottom-8 duration-700">
           
           <header className="py-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-green-500/30">
                       <WifiOff className="w-4 h-4" /> Offline Ready
                    </div>
                    <span className="text-slate-500 font-medium">|</span>
                    <span className="text-slate-400 font-bold">{storyData?.title || selectedSetting.title}</span>
                 </div>
                 <button onClick={stopGame} className="text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
                   End Story
                 </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-700 ease-in-out"
                  style={{ width: `${(decisionCount / getMaxDecisions(generationSize)) * 100}%` }}
                />
              </div>
              <div className="text-right mt-2 text-xs text-slate-500 font-medium tracking-wide">
                Buffer: {decisionCount} / {getMaxDecisions(generationSize)} Decisions
              </div>
           </header>

           <div className="flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentNode.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="mb-10"
                >
                  <p className="text-2xl md:text-3xl font-serif leading-relaxed text-slate-200">
                    {currentNode.text}
                  </p>
                </motion.div>
              </AnimatePresence>

              {!currentNode.isEnding && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  {currentNode.choices?.map((choice, i) => (
                    <button 
                      key={i}
                      onClick={() => handleChoiceClick(choice.nextNodeId, choice.text)}
                      className="group relative bg-slate-900 border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 p-6 rounded-3xl text-left transition-all active:scale-[0.98]"
                    >
                       <div className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                          <span className="bg-slate-800 px-2 py-1 rounded-md text-white">Option {i + 1}</span>
                       </div>
                       <p className="text-lg font-medium text-white mb-4 group-hover:text-indigo-200 transition-colors">
                         {choice.text}
                       </p>
                       <div className="flex flex-wrap gap-2">
                          {choice.keywords.slice(0, 3).map(kw => (
                            <span key={kw} className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
                               "{kw}"
                            </span>
                          ))}
                       </div>
                    </button>
                  ))}
                </div>
              )}

              {currentNode.isEnding && (
                <div className="mt-12 text-center">
                   <h3 className="text-2xl font-black text-rose-400 mb-6 uppercase tracking-[0.2em]">The End</h3>
                   <button 
                     onClick={stopGame}
                     className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg"
                   >
                     Read Another Story
                   </button>
                </div>
              )}
           </div>

           {/* Voice Status Bar */}
           <div className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none">
              <div className="max-w-3xl mx-auto flex items-center gap-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl pointer-events-auto">
                 {isSpeaking ? (
                   <div className="flex items-center gap-3 text-indigo-400 font-bold">
                     <Volume2 className="w-6 h-6 animate-pulse" />
                     Reading aloud...
                   </div>
                 ) : isListening ? (
                   <div className="flex items-center gap-3 text-green-400 font-bold bg-green-500/10 px-4 py-2 rounded-xl">
                     <Mic className="w-5 h-5 animate-pulse" />
                     Say your choice...
                   </div>
                 ) : (
                   <button 
                     onClick={manuallyStartListening}
                     className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors"
                   >
                     <Mic className="w-5 h-5" />
                     <span className="font-medium text-sm">Tap mic if it stopped listening</span>
                   </button>
                 )}

                 {lastHeard && (
                   <div className="ml-auto text-sm text-slate-500 font-mono flex items-center">
                      Heard: <span className="text-slate-300 ml-2">"{lastHeard}"</span>
                   </div>
                 )}

                 <button 
                   onClick={() => window.speechSynthesis.cancel()} 
                   className="ml-auto bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                   title="Stop Audio"
                 >
                   <VolumeX className="w-5 h-5" />
                 </button>
              </div>
           </div>

        </div>
      )}

    </div>
  );
}
