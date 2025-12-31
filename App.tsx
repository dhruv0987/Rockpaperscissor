import React, { useState, useEffect, useCallback, useRef } from 'react';
import HandVisualizer from './components/HandVisualizer';
import { Move, GameState } from './types';
import { Hand, Sword, Scroll, Info, RefreshCw, Zap } from 'lucide-react';

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
  if (move === Move.Rock) return <div className={`flex flex-col items-center ${className}`}><span className="text-4xl mb-2">🪨</span><span className="text-xs uppercase font-bold tracking-wider">Rock</span></div>;
  if (move === Move.Paper) return <div className={`flex flex-col items-center ${className}`}><span className="text-4xl mb-2">📄</span><span className="text-xs uppercase font-bold tracking-wider">Paper</span></div>;
  if (move === Move.Scissors) return <div className={`flex flex-col items-center ${className}`}><span className="text-4xl mb-2">✂️</span><span className="text-xs uppercase font-bold tracking-wider">Scissors</span></div>;
  return <div className={`flex flex-col items-center ${className}`}><span className="text-4xl mb-2">❓</span><span className="text-xs uppercase font-bold tracking-wider">Waiting</span></div>;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Loading);
  const [currentDetectedMove, setCurrentDetectedMove] = useState<Move>(Move.None);
  const [lockedPlayerMove, setLockedPlayerMove] = useState<Move>(Move.None);
  const [aiMove, setAiMove] = useState<Move>(Move.None);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [countdown, setCountdown] = useState<number>(3);
  const [winner, setWinner] = useState<'player' | 'ai' | 'draw' | null>(null);

  // Sound effects refs (simulated visually mostly, but structure is here)
  const timerRef = useRef<number | null>(null);

  const handleModelLoaded = () => {
    setGameState(GameState.Idle);
  };

  const startGame = () => {
    setGameState(GameState.Countdown);
    setCountdown(3);
    setWinner(null);
    setLockedPlayerMove(Move.None);
    setAiMove(Move.None);
  };

  // Countdown Logic
  useEffect(() => {
    if (gameState === GameState.Countdown) {
      if (countdown > 0) {
        timerRef.current = window.setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        // TIME IS UP! CAPTURE THE MOMENT
        const finalAiMove = getRandomMove();
        const capturedMove = currentDetectedMove === Move.None ? getRandomMove() : currentDetectedMove; // Fallback to random if hand not seen
        
        setAiMove(finalAiMove);
        setLockedPlayerMove(capturedMove);
        setWinner(determineWinner(capturedMove, finalAiMove));
        setGameState(GameState.Result);
        
        // Update Score
        const result = determineWinner(capturedMove, finalAiMove);
        if (result === 'player') setScore(s => ({ ...s, player: s.player + 1 }));
        if (result === 'ai') setScore(s => ({ ...s, ai: s.ai + 1 }));
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState, countdown, currentDetectedMove]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Zap className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold pixel-font text-blue-400">ROBO-HAND</h1>
            <p className="text-xs text-slate-400">Battle Arena v1.0</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-full border border-slate-700">
          <div className="flex flex-col items-center px-4 border-r border-slate-700">
            <span className="text-xs text-slate-400 font-bold">YOU</span>
            <span className="text-2xl font-bold text-blue-400 pixel-font">{score.player}</span>
          </div>
          <div className="text-slate-600 font-bold text-xl">VS</div>
          <div className="flex flex-col items-center px-4 border-l border-slate-700">
            <span className="text-xs text-slate-400 font-bold">AI</span>
            <span className="text-2xl font-bold text-red-400 pixel-font">{score.ai}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row p-4 gap-4 max-w-6xl mx-auto w-full items-center justify-center">
        
        {/* Left Side: Game Controls & Info */}
        <div className="flex-1 w-full flex flex-col gap-4 max-w-md">
          
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Info size={20} className="text-blue-400"/>
              <span>Mission Briefing</span>
            </h2>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="bg-slate-700 rounded p-1">1</span>
                <span>Allow camera access to activate the Neural Link.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-slate-700 rounded p-1">2</span>
                <span>Press <strong>START BATTLE</strong> to begin countdown.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-slate-700 rounded p-1">3</span>
                <span>When timer hits <strong>0</strong>, show your move!</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-slate-900 rounded-lg text-xs text-slate-400 font-mono">
              <p>System: Detecting skeletal landmarks...</p>
              <p>Tech: MediaPipe Vision + React</p>
              <p className="text-yellow-500 mt-1">Status: {gameState === GameState.Loading ? 'Initializing...' : 'Online'}</p>
            </div>
          </div>

          {/* Current Live Detection Indicator */}
          <div className="bg-slate-800 p-4 rounded-xl border border-blue-500/20 shadow-inner flex items-center justify-between">
            <span className="text-sm font-bold text-slate-400">LIVE SENSOR:</span>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${currentDetectedMove !== Move.None ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="font-mono font-bold text-lg text-blue-300 uppercase">
                {currentDetectedMove !== Move.None ? currentDetectedMove : "NO HAND"}
              </span>
            </div>
          </div>

        </div>

        {/* Center: The Arena */}
        <div className="flex-1 relative w-full max-w-lg aspect-[4/3]">
          
          <HandVisualizer 
            onMoveDetected={setCurrentDetectedMove} 
            gameState={gameState} 
            onModelLoaded={handleModelLoaded} 
          />

          {/* Overlays */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            
            {/* Countdown Overlay */}
            {gameState === GameState.Countdown && (
              <div className="animate-bounce text-9xl font-bold pixel-font text-yellow-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                {countdown > 0 ? countdown : "SHOOT!"}
              </div>
            )}

            {/* Results Overlay */}
            {gameState === GameState.Result && winner && (
              <div className="bg-black/80 backdrop-blur-md p-8 rounded-2xl border-2 border-white/20 text-center animate-in zoom-in duration-300 shadow-2xl">
                <h2 className="text-4xl font-bold pixel-font mb-6">
                  {winner === 'player' && <span className="text-green-400">YOU WIN!</span>}
                  {winner === 'ai' && <span className="text-red-500">AI WINS!</span>}
                  {winner === 'draw' && <span className="text-yellow-400">DRAW!</span>}
                </h2>
                
                <div className="flex justify-center items-center gap-8 mb-6">
                  <div className="bg-blue-900/50 p-4 rounded-xl border border-blue-500/50">
                    <p className="text-xs text-blue-300 mb-2 font-bold">YOU</p>
                    <MoveIcon move={lockedPlayerMove} size={48} className="text-blue-200" />
                  </div>
                  <div className="text-2xl font-bold text-slate-500">VS</div>
                  <div className="bg-red-900/50 p-4 rounded-xl border border-red-500/50">
                    <p className="text-xs text-red-300 mb-2 font-bold">AI</p>
                    <MoveIcon move={aiMove} size={48} className="text-red-200" />
                  </div>
                </div>

                <button 
                  onClick={startGame}
                  className="pointer-events-auto bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
                >
                  <RefreshCw size={20} />
                  PLAY AGAIN
                </button>
              </div>
            )}

            {/* Start Button Overlay (Idle State) */}
            {gameState === GameState.Idle && (
              <button 
                onClick={startGame}
                className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl py-4 px-12 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.5)] border-4 border-blue-400 transition-all hover:scale-105 active:scale-95 animate-pulse pixel-font"
              >
                START BATTLE
              </button>
            )}

             {/* Loading Overlay */}
             {gameState === GameState.Loading && (
              <div className="bg-black/60 p-6 rounded-lg backdrop-blur">
                 <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="font-bold text-blue-300">Loading AI Vision Model...</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Log or Visual Decor */}
        <div className="hidden lg:flex flex-col gap-4 w-64 h-96">
           <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 h-full overflow-hidden flex flex-col">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest border-b border-slate-800 pb-2">Battle Log</h3>
              <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono">
                {gameState === GameState.Idle && <p className="text-slate-500">System Ready. Awaiting user input.</p>}
                {gameState === GameState.Countdown && <p className="text-yellow-500">Preparing neural sync...</p>}
                {winner && (
                  <div className="border-l-2 border-slate-600 pl-2 py-1 animate-in slide-in-from-right">
                    <span className={winner === 'player' ? 'text-green-400' : winner === 'ai' ? 'text-red-400' : 'text-yellow-400'}>
                      Result: {winner.toUpperCase()}
                    </span>
                    <br/>
                    <span className="text-slate-500">P: {lockedPlayerMove} / AI: {aiMove}</span>
                  </div>
                )}
              </div>
           </div>
        </div>

      </main>
    </div>
  );
};

export default App;
