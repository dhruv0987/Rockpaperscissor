import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Camera, Cpu, Activity, Calculator, Swords, ScanEye } from 'lucide-react';

interface TourGuideProps {
  onClose: () => void;
}

const steps = [
  {
    title: "1. The Raw Input",
    icon: <Camera size={40} className="text-cyan-400" />,
    description: "It starts with your webcam. The browser grabs the light hitting the lens. To a human, it's a video. To this computer, it is a massive stream of numbers (pixels) refreshing 30 times every second. We capture this stream using the Navigator API.",
    visual: "scan"
  },
  {
    title: "2. The AI Brain",
    icon: <Cpu size={40} className="text-purple-400" />,
    description: "We feed those pixels into 'MediaPipe', a specialized AI model from Google. Think of it as a tiny brain trained on millions of hand photos. It ignores your face and background, scanning specifically for the shape and texture of human hands.",
    visual: "brain"
  },
  {
    title: "3. Skeletal Mapping",
    icon: <Activity size={40} className="text-green-400" />,
    description: "When the AI finds a hand, it doesn't just 'see' it. It builds a map. It plots 21 specific 'Landmarks' (wrist, knuckles, fingertips) in 3D space (X, Y, Z coordinates). This wireframe updates instantly as you move.",
    visual: "skeleton"
  },
  {
    title: "4. The Geometry Spell",
    icon: <Calculator size={40} className="text-yellow-400" />,
    description: "Now we use Math! The code checks the Y-coordinate of your fingertips vs. your knuckles. \n\nIf Tip < Knuckle (higher on screen) = OPEN.\nIf Tip > Knuckle = CLOSED.\n\n0 Open = Rock. 2 Open = Scissors. 5 Open = Paper.",
    visual: "math"
  },
  {
    title: "5. The Game Loop",
    icon: <Swords size={40} className="text-red-400" />,
    description: "Finally, the React App steps in. When the timer hits zero, it freezes the latest math result. It compares your move to the AI's random choice using standard rules, plays the sound effect, and updates the score. Tech Magic complete!",
    visual: "game"
  }
];

export const TourGuide: React.FC<TourGuideProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
    else onClose();
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <div className="bg-neutral-900 border border-cyan-500/30 w-full max-w-2xl rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-neutral-800/50 p-4 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2 text-cyan-400">
                <ScanEye size={20} />
                <span className="font-bold tracking-widest text-sm uppercase">System Internals Tour</span>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-8 flex flex-col md:flex-row gap-8 items-center">
            
            {/* Visual Representation Area */}
            <div className="w-full md:w-1/2 aspect-square bg-black/50 rounded-xl border border-white/10 relative flex items-center justify-center overflow-hidden group">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                
                {/* Step 1 Visual: Scanning */}
                {steps[currentStep].visual === 'scan' && (
                    <div className="relative w-32 h-32 border-2 border-white/20 rounded-lg flex items-center justify-center overflow-hidden bg-neutral-800">
                        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
                        <Camera size={48} className="text-white/20" />
                        <div className="absolute bottom-2 text-[10px] font-mono text-cyan-400">INPUT: VIDEO_STREAM</div>
                    </div>
                )}

                {/* Step 2 Visual: Brain Processing */}
                {steps[currentStep].visual === 'brain' && (
                    <div className="relative">
                        <Cpu size={80} className="text-purple-500 relative z-10" />
                        <div className="absolute inset-0 bg-purple-500/30 blur-xl animate-pulse"></div>
                        <div className="absolute -top-4 -right-4 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                        <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-100"></div>
                    </div>
                )}

                {/* Step 3 Visual: Skeleton */}
                {steps[currentStep].visual === 'skeleton' && (
                    <div className="relative w-32 h-40">
                         {/* Abstract Hand Nodes */}
                         <div className="absolute bottom-0 left-1/2 w-1 h-10 bg-green-500/50 -translate-x-1/2"></div>
                         <div className="absolute bottom-10 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
                         {/* Fingers */}
                         {[...Array(5)].map((_, i) => (
                             <div key={i} className="absolute bottom-10 left-1/2 w-0.5 h-16 origin-bottom bg-green-500/30" style={{ transform: `translateX(-50%) rotate(${(i-2)*20}deg)` }}>
                                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: `${i*0.1}s` }}></div>
                             </div>
                         ))}
                    </div>
                )}

                 {/* Step 4 Visual: Math */}
                 {steps[currentStep].visual === 'math' && (
                    <div className="flex flex-col gap-2 font-mono text-xs text-yellow-400/80">
                         <div className="p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
                             y_tip: 0.15<br/>
                             y_pip: 0.30<br/>
                             <span className="text-green-400">STATUS: OPEN</span>
                         </div>
                         <div className="p-2 bg-yellow-900/20 border border-yellow-500/30 rounded opacity-50">
                             y_tip: 0.45<br/>
                             y_pip: 0.40<br/>
                             <span className="text-red-400">STATUS: CLOSED</span>
                         </div>
                    </div>
                )}

                {/* Step 5 Visual: Game */}
                {steps[currentStep].visual === 'game' && (
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 border-2 border-blue-500 rounded flex items-center justify-center text-xl">✂️</div>
                        <div className="text-2xl font-bold text-white">VS</div>
                        <div className="w-12 h-12 border-2 border-red-500 rounded flex items-center justify-center text-xl animate-bounce">📄</div>
                    </div>
                )}

            </div>

            {/* Text Area */}
            <div className="w-full md:w-1/2 flex flex-col gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-2 border border-white/10">
                    {steps[currentStep].icon}
                </div>
                <h2 className="text-2xl font-bold text-white">{steps[currentStep].title}</h2>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{steps[currentStep].description}</p>
            </div>
        </div>

        {/* Footer / Controls */}
        <div className="p-6 bg-neutral-900 border-t border-white/5 flex justify-between items-center">
            
            {/* Dots */}
            <div className="flex gap-2">
                {steps.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-cyan-400 w-6' : 'bg-white/20'}`}></div>
                ))}
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="p-3 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <button 
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-full font-bold transition-all hover:scale-105 active:scale-95"
                >
                    {currentStep === steps.length - 1 ? "Close Tour" : "Next Step"}
                    {currentStep !== steps.length - 1 && <ChevronRight size={18} />}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
