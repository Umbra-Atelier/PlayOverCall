import React, { useState, useEffect, useRef } from 'react';
import { Mic, Play, Settings2, Sparkles, BookOpen, Skull, Rocket, AlertCircle, Phone } from 'lucide-react';

const SETTINGS = [
  { id: 'haunted', title: 'Haunted Mansion', icon: Skull, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'cyberpunk', title: 'Cyberpunk Heist', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'space', title: 'Space Exploration', icon: Rocket, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { id: 'fantasy', title: 'Fantasy Tavern', icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [selectedSetting, setSelectedSetting] = useState(SETTINGS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs to avoid stale closures
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);

  const startGame = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone API not available. Ensure you are using HTTPS.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputAudioCtx;
      
      const outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputAudioCtx;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(inputAudioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
        ws.send(JSON.stringify({ type: 'audio', audio: base64 }));
      };

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ type: 'start', setting: selectedSetting.title }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'audio' && msg.audio) {
             playAudioChunk(outputAudioCtx, msg.audio);
          } else if (msg.type === 'interrupted') {
             // If model is interrupted, clear queued playback
             nextStartTimeRef.current = outputAudioCtx.currentTime;
          }
        } catch (e) {
          console.error("Failed parsing WS message", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = (e) => {
        console.error("WebSocket error", e);
        setError("Connection failed. Ensure the backend server is running.");
        stopGame();
      };

      setGameState('playing');
    } catch (err: any) {
      setError("Microphone access denied or error: " + err.message);
    }
  };

  const pcmToBase64 = (float32Array: Float32Array) => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i += 1024) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 1024)));
    }
    return btoa(binary);
  };

  const playAudioChunk = (ctx: AudioContext, base64: string) => {
    const binary = atob(base64);
    const buffer = new Float32Array(binary.length / 2);
    const dataView = new DataView(new ArrayBuffer(binary.length));
    
    for (let i = 0; i < binary.length; i++) {
        dataView.setUint8(i, binary.charCodeAt(i));
    }
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] = dataView.getInt16(i * 2, true) / 32768;
    }

    const audioBuffer = ctx.createBuffer(1, buffer.length, 24000);
    audioBuffer.getChannelData(0).set(buffer);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    if (nextStartTimeRef.current < ctx.currentTime) {
       nextStartTimeRef.current = ctx.currentTime + 0.1;
    }
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
  };

  const stopGame = () => {
    if (wsRef.current) wsRef.current.close();
    if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
    if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    setGameState('menu');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans p-4 md:p-8">
      {gameState === 'menu' ? (
        <div className="max-w-4xl mx-auto w-full pt-10">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-sm flex items-center gap-3 text-white">
              <span className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">
                 <Mic className="w-8 h-8" />
              </span>
              Say The Word
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
              An interactive AI story game. Call your friend on speakerphone, choose a setting, and control the adventure entirely with your voices.
            </p>
          </header>

          <h2 className="text-2xl font-bold mb-6 text-slate-300">Choose your starting setting</h2>
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
                <p className="text-slate-400 text-sm">Start an adventure in a {setting.title.toLowerCase()}.</p>
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-2xl flex items-center gap-3 w-full text-left mb-6">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={startGame}
              className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-full font-bold text-xl transition-all hover:-translate-y-1 active:translate-y-0 shadow-lg shadow-indigo-600/30"
            >
              <Phone className="w-6 h-6" /> Start Voice Session
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-1000">
           <div className={`relative w-48 h-48 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center mb-8 transition-all duration-500 ${isConnected ? 'shadow-[0_0_60px_rgba(99,102,241,0.2)] border-indigo-500/50' : ''}`}>
              <Mic className={`w-16 h-16 transition-colors duration-500 ${isConnected ? 'text-indigo-400' : 'text-slate-600'}`} />
              
              {isConnected && (
                <>
                  <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]" />
                </>
              )}
           </div>

           <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
             {isConnected ? `Exploring: ${selectedSetting.title}` : 'Connecting...'}
           </h2>
           <p className="text-slate-400 mb-12">
             {isConnected 
               ? "Put your friend on speakerphone. Listen to the storyteller and reply with your voice."
               : "Establishing telepathic link to the storyteller..."}
           </p>

           <button 
             onClick={stopGame}
             className="px-8 py-4 rounded-full border-2 border-slate-800 text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/50 transition-colors font-bold tracking-wide"
           >
             End Adventure
           </button>
        </div>
      )}
    </div>
  );
}
