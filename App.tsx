import React, { useState, useEffect, useCallback, useRef } from 'react';
import HandVisualizer from './components/HandVisualizer';
import { Move, GameState } from './types';
import { Info, RefreshCw, Zap, Volume2, VolumeX, Shield, Play, ScanEye, User, ArrowRight, Trophy } from 'lucide-react';
import { soundManager } from './utils/sound';
import { TourGuide } from './components/TourGuide';

// Helpers
const getRandomMove = (): Move => {
  const moves = [Move.Rock, Move.Paper, Move.Scissors];
  return moves[Math.floor(Math.random() * moves.length)];
};

const determineWinner = (p1: Move, p2: Move): 'player' | 'ai' | 'draw' => {
  if (p1 === p2) return 'draw';
  if (
    (p1 === Move.Rock && p2 === Move.Scissors) ||
    (p1 === Move.Paper && p2 === Move.Rock) ||
    (p1 === Move.Scissors && p2 === Move.Paper)
  ) {
    return 'player';
  }
  return 'ai';
};

const MoveIcon = ({ move, size = 24, className = "" }: { move: Move, size?: number, className?: string }) => {
  if (move === Move.Rock) return <div className={`flex flex-col items-center gap-1 ${className}`}><span className="text-5xl drop-shadow-lg">🪨</span><span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Rock</span></div>;
  if (move === Move.Paper) return <div className={`flex flex-col items-center gap-1 ${className}`}><span className="text-5xl drop-shadow-lg">📄</span><span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Paper</span></div>;
  if (move === Move.Scissors) return <div className={`flex flex-col items-center gap-1 ${className}`}><span className="text-5xl drop-shadow-lg">✂️</span><span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Scissors</span></div>;
  return <div className={`flex flex-col items-center gap-1 ${className}`}><span className="text-5xl opacity-20">❓</span><span className="text-[10px] uppercase font-bold tracking-widest opacity-30">Waiting</span></div>;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Loading);
  const [currentDetectedMove, setCurrentDetectedMove] = useState<Move>(Move.None);
  const [lockedPlayerMove, setLockedPlayerMove] = useState<Move>(Move.None);
  const [aiMove, setAiMove] = useState<Move>(Move.None);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [countdown, setCountdown] = useState<number>(3);
  const [winner, setWinner] = useState<'player' | 'ai' | 'draw' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showTour, setShowTour] = useState(false);

  // New State for Session Management
  const [playerName, setPlayerName] = useState<string>("");
  const [tempName, setTempName] = useState<string>(""); // For input field
  const [round, setRound] = useState<number>(1);
  const MAX_ROUNDS = 3;

  // Sound effects refs
  const timerRef = useRef<number | null>(null);

  const handleModelLoaded = () => {
    // Once model loads, ask for name
    setGameState(GameState.Registration);
  };

  const addLog = (msg: string) => {
      setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    soundManager.muted = newMuteState;
    if (!newMuteState) {
        soundManager.playClick();
        soundManager.startBGM();
    }
  };

  // --- Session Flow Handlers ---

  const handleRegister = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!tempName.trim()) return;
      setPlayerName(tempName.trim());
      setGameState(GameState.Idle);
      soundManager.playClick();
      addLog(`Pilot ${tempName} registered.`);
  };

  const startRound = () => {
    soundManager.startBGM(); 
    soundManager.playClick();
    
    setGameState(GameState.Countdown);
    setCountdown(3);
    setWinner(null);
    setLockedPlayerMove(Move.None);
    setAiMove(Move.None);
    addLog(`Round ${round} Initiated...`);
  };

  const handleNextRound = () => {
      setRound(r => r + 1);
      startRound();
  };

  const handleNextPlayer = () => {
      // Reset Session
      setPlayerName("");
      setTempName("");
      setRound(1);
      setScore({ player: 0, ai: 0 });
      setLogs([]);
      setGameState(GameState.Registration);
      soundManager.playClick();
  };

  // -----------------------------

  // Countdown Logic
  useEffect(() => {
    if (gameState === GameState.Countdown) {
      if (countdown > 0) {
        soundManager.playCountdown(countdown);
        timerRef.current = window.setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        // TIME IS UP!
        soundManager.playCountdown(0);
        
        // 1. Capture Player Move (Use random if hand not seen)
        const capturedMove = currentDetectedMove === Move.None ? getRandomMove() : currentDetectedMove;
        setLockedPlayerMove(capturedMove);

        // 2. AI Logic (The "Super-Computer" Mode)
        // Probability: 4% chance user wins (1/25), 96% AI wins.
        const chance = Math.random();
        let finalAiMove: Move;

        if (chance < 0.04) {
             // 4% Chance: AI glitches and picks a losing move
             if (capturedMove === Move.Rock) finalAiMove = Move.Scissors;
             else if (capturedMove === Move.Paper) finalAiMove = Move.Rock;
             else finalAiMove = Move.Paper; 
             addLog("AI System Error...");
        } else {
             // 96% Chance: AI computes the perfect counter
             if (capturedMove === Move.Rock) finalAiMove = Move.Paper;
             else if (capturedMove === Move.Paper) finalAiMove = Move.Scissors;
             else finalAiMove = Move.Rock;
        }
        
        setAiMove(finalAiMove);
        
        const result = determineWinner(capturedMove, finalAiMove);
        setWinner(result);
        setGameState(GameState.Result);
        
        // Update Score & Play Sound
        if (result === 'player') {
            setScore(s => ({ ...s, player: s.player + 1 }));
            addLog(`Round ${round}: YOU WIN`);
            setTimeout(() => soundManager.playWin(), 200);
        }
        if (result === 'ai') {
            setScore(s => ({ ...s, ai: s.ai + 1 }));
            addLog(`Round ${round}: AI WINS`);
            setTimeout(() => soundManager.playLose(), 200);
        }
        if (result === 'draw') {
            addLog(`Round ${round}: DRAW`);
            setTimeout(() => soundManager.playDraw(), 200);
        }
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState, countdown, currentDetectedMove, round]);

  const playHover = () => soundManager.playHover();

  // Derived state for UI
  const isFinalRound = round >= MAX_ROUNDS;

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      
      {showTour && <TourGuide onClose={() => setShowTour(false)} />}

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 shadow-lg">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-inner">
            <Zap className="text-white fill-current" size={18} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-widest text-white uppercase">Robo-Hand</h1>
            <span className="text-[10px] text-white/50 tracking-wider">BATTLE ARENA</span>
          </div>
        </div>

        {/* Scoreboard - Only show if registered */}
        {gameState !== GameState.Registration && gameState !== GameState.Loading && (
        <div className="absolute left-1/2 top-6 -translate-x-1/2 pointer-events-auto flex flex-col items-center animate-in fade-in slide-in-from-top duration-500">
           
           {/* Round Badge */}
           <div className="mb-2 px-3 py-1 bg-white/10 rounded-full border border-white/5 backdrop-blur-sm">
                <span className="text-[10px] font-mono text-cyan-400 tracking-widest">ROUND {round} / {MAX_ROUNDS}</span>
           </div>

           <div className="flex items-center gap-6 bg-black/60 backdrop-blur-xl px-10 py-3 rounded-2xl border border-white/10 shadow-2xl">
                <div className="text-center">
                    <span className="block text-[10px] font-bold text-cyan-400 tracking-wider mb-1 uppercase truncate max-w-[100px]">{playerName}</span>
                    <span className="text-3xl font-black pixel-font text-white">{score.player}</span>
                </div>
                <div className="text-white/20 font-light text-2xl px-2">/</div>
                <div className="text-center">
                    <span className="block text-[10px] font-bold text-red-400 tracking-wider mb-1">AI CPU</span>
                    <span className="text-3xl font-black pixel-font text-white">{score.ai}</span>
                </div>
           </div>
        </div>
        )}

        <div className="pointer-events-auto flex items-center gap-3">
             <button 
                onClick={toggleMute} 
                className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
                title={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-24 pb-8 px-4">
        
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-center lg:items-start justify-center">

            {/* Left: Status */}
            <div className="order-2 lg:order-1 w-full lg:w-64 flex flex-col gap-4">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-2 shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white/50 tracking-wider uppercase flex items-center gap-2">
                             <Shield size={12} /> Sensor Status
                        </span>
                        <div className={`w-2 h-2 rounded-full ${currentDetectedMove !== Move.None ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-red-500/50'}`} />
                    </div>
                    <div className="h-10 flex items-center justify-center bg-black/30 rounded-lg border border-white/5 relative overflow-hidden">
                         {currentDetectedMove !== Move.None ? (
                             <span className="text-cyan-400 font-bold tracking-widest uppercase animate-pulse">{currentDetectedMove}</span>
                         ) : (
                             <span className="text-white/20 text-xs italic">Searching...</span>
                         )}
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-lg">
                    <h3 className="text-xs font-bold text-white/50 tracking-wider uppercase flex items-center gap-2">
                        <Info size={12} /> Mission Brief
                    </h3>
                    <ul className="text-sm text-white/70 space-y-2 leading-relaxed">
                        <li className="flex gap-2"><span className="text-cyan-400 font-bold">1.</span> Defeat AI in {MAX_ROUNDS} rounds.</li>
                        <li className="flex gap-2"><span className="text-cyan-400 font-bold">2.</span> Show hand when timer hits 0.</li>
                        <li className="flex gap-2"><span className="text-cyan-400 font-bold">3.</span> Pass to next pilot.</li>
                    </ul>
                    <button 
                      onClick={() => setShowTour(true)}
                      className="mt-2 w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg py-2 text-xs font-bold text-cyan-300 transition-colors"
                    >
                      <ScanEye size={14} /> How it Works
                    </button>
                </div>
            </div>

            {/* Center: Visualizer & Modals */}
            <div className="order-1 lg:order-2 flex-1 w-full max-w-[640px] aspect-[4/3] relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl ring-1 ring-white/5">
                    <HandVisualizer 
                        onMoveDetected={setCurrentDetectedMove} 
                        gameState={gameState} 
                        onModelLoaded={handleModelLoaded} 
                    />

                    {/* OVERLAYS */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                         
                        {/* 1. Registration Modal */}
                        {gameState === GameState.Registration && (
                             <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in">
                                <form onSubmit={handleRegister} className="pointer-events-auto bg-neutral-900 border border-cyan-500/30 p-8 rounded-2xl flex flex-col gap-6 max-w-sm w-full shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                                            <User size={32} className="text-cyan-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white tracking-widest uppercase">Identify Yourself</h2>
                                        <p className="text-xs text-white/50 mt-2">Enter your name to begin the simulation.</p>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        placeholder="COMMANDER NAME..."
                                        className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-center text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-cyan-500 transition-colors"
                                        maxLength={12}
                                        autoFocus
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!tempName.trim()}
                                        className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 group/btn"
                                    >
                                        ENTER ARENA <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform"/>
                                    </button>
                                </form>
                             </div>
                        )}

                        {/* 2. Countdown */}
                        {gameState === GameState.Countdown && (
                        <div className="animate-[bounce_0.5s_infinite] text-[10rem] font-black pixel-font text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                            {countdown > 0 ? countdown : "GO!"}
                        </div>
                        )}

                        {/* 3. Result Modal */}
                        {gameState === GameState.Result && winner && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                            <div className="bg-neutral-900/90 border border-white/10 p-8 rounded-3xl shadow-2xl text-center transform scale-100 max-w-sm w-full mx-4 relative overflow-hidden">
                                {isFinalRound && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-500"></div>}
                                
                                <h3 className="text-xs font-bold text-white/50 tracking-[0.2em] mb-2 uppercase">
                                    {isFinalRound ? "SESSION COMPLETE" : `ROUND ${round} COMPLETE`}
                                </h3>
                                
                                <h2 className="text-4xl font-black pixel-font mb-8 tracking-tighter">
                                {winner === 'player' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">YOU WIN</span>}
                                {winner === 'ai' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-600">AI WINS</span>}
                                {winner === 'draw' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">DRAW</span>}
                                </h2>
                                
                                <div className="flex justify-between items-end mb-8 px-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/30 mb-2">
                                            <MoveIcon move={lockedPlayerMove} size={32} />
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-300 uppercase truncate max-w-[80px]">{playerName}</span>
                                    </div>
                                    <div className="text-white/20 text-xl font-light pb-6">vs</div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/30 mb-2">
                                            <MoveIcon move={aiMove} size={32} />
                                        </div>
                                        <span className="text-[10px] font-bold text-red-300">AI</span>
                                    </div>
                                </div>

                                <button 
                                onClick={isFinalRound ? handleNextPlayer : handleNextRound}
                                onMouseEnter={playHover}
                                className={`pointer-events-auto w-full font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg ${
                                    isFinalRound 
                                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:from-amber-300 hover:to-orange-400" 
                                    : "bg-white text-black hover:bg-cyan-400"
                                }`}
                                >
                                {isFinalRound ? <Trophy size={20} /> : <RefreshCw size={20} />}
                                <span>{isFinalRound ? "NEXT CHALLENGER" : "NEXT ROUND"}</span>
                                </button>
                            </div>
                        </div>
                        )}

                        {/* 4. Idle State (Start Button) */}
                        {gameState === GameState.Idle && (
                        <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                             <div className="px-4 py-2 bg-black/50 backdrop-blur rounded-full border border-white/10 text-xs text-cyan-300 font-mono">
                                READY, {playerName.toUpperCase()}?
                             </div>
                            <button 
                                onClick={startRound}
                                onMouseEnter={playHover}
                                className="pointer-events-auto group relative overflow-hidden bg-cyan-500 text-black font-black text-xl py-5 px-10 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    <Play fill="currentColor" size={24}/> START MATCH
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </button>
                        </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Log */}
            <div className="order-3 w-full lg:w-64 flex flex-col gap-4">
                 <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 h-[300px] flex flex-col shadow-lg">
                    <h3 className="text-xs font-bold text-white/50 tracking-wider uppercase mb-3 pb-3 border-b border-white/5">Battle Logs</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                        {logs.length === 0 && <span className="text-white/20 text-xs text-center block mt-10">Waiting for battle data...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className="text-xs font-mono text-white/80 animate-in slide-in-from-left fade-in duration-300">
                                <span className="text-cyan-500 mr-2">➜</span>{log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
};

export default App;