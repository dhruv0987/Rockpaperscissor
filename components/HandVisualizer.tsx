import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { Move, GameState } from '../types';

interface HandVisualizerProps {
  onMoveDetected: (move: Move) => void;
  gameState: GameState;
  onModelLoaded: () => void;
}

const HandVisualizer: React.FC<HandVisualizerProps> = ({ onMoveDetected, gameState, onModelLoaded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    const initHandLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        onModelLoaded();
        setWebcamRunning(true);
      } catch (error) {
        console.error("Error initializing hand landmarker:", error);
      }
    };

    initHandLandmarker();

    return () => {
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize Webcam
  useEffect(() => {
    const enableCam = async () => {
      if (!handLandmarkerRef.current || !videoRef.current) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    if (webcamRunning) {
      enableCam();
    }
    
    // Cleanup function to stop tracks
    return () => {
       // eslint-disable-next-line react-hooks/exhaustive-deps
       const stream = videoRef.current?.srcObject as MediaStream;
       stream?.getTracks().forEach(track => track.stop());
       if (requestRef.current !== null) {
         cancelAnimationFrame(requestRef.current);
       }
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webcamRunning]);


  // Gesture Recognition Logic
  const recognizeGesture = (landmarks: any[]): Move => {
    if (!landmarks || landmarks.length === 0) return Move.None;

    const lm = landmarks[0]; // First hand detected
    
    // Tips
    const indexTip = lm[8];
    const middleTip = lm[12];
    const ringTip = lm[16];
    const pinkyTip = lm[20];
    
    // PIP joints (knuckles roughly)
    const indexPip = lm[6];
    const middlePip = lm[10];
    const ringPip = lm[14];
    const pinkyPip = lm[18];

    // Check if fingers are extended (Tip higher than PIP in y-axis - Note: Y is inverted in screen coords, 0 is top)
    const isIndexOpen = indexTip.y < indexPip.y;
    const isMiddleOpen = middleTip.y < middlePip.y;
    const isRingOpen = ringTip.y < ringPip.y;
    const isPinkyOpen = pinkyTip.y < pinkyPip.y;

    let extendedCount = 0;
    if (isIndexOpen) extendedCount++;
    if (isMiddleOpen) extendedCount++;
    if (isRingOpen) extendedCount++;
    if (isPinkyOpen) extendedCount++;

    // Logic for gestures
    if (extendedCount === 0 || extendedCount === 1) {
      // Rock: 0 or 1 finger (sometimes thumb looks open)
      return Move.Rock;
    } else if (extendedCount >= 4) {
      // Paper: 4 or 5 fingers
      return Move.Paper;
    } else if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) {
      // Scissors: Index and Middle open, others closed
      return Move.Scissors;
    }
    
    return Move.None;
  };

  const predictWebcam = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !handLandmarkerRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;

    // Match canvas size to video
    if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    let startTimeMs = performance.now();
    
    // Detect
    const results = handLandmarkerRef.current.detectForVideo(video, startTimeMs);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw
    if (results.landmarks) {
      for (const landmarks of results.landmarks) {
        // Draw Connectors (Lines)
        const drawingUtils = new DrawingUtils(ctx);
        
        drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
          color: "#3b82f6", // Blue-500 line
          lineWidth: 4
        });

        // Draw Landmarks (Dots)
        drawingUtils.drawLandmarks(landmarks, {
          color: "#60a5fa", // Blue-400 fill
          lineWidth: 2,
          radius: (data) => {
            // Make fingertips larger
            return DrawingUtils.lerp(data.from!.z, -0.15, .1, 6, 2);
          }
        });
        
        // Recognize and bubble up state
        const move = recognizeGesture([landmarks]);
        onMoveDetected(move);
      }
      
      if (results.landmarks.length === 0) {
          onMoveDetected(Move.None);
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  }, [onMoveDetected]);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-blue-500/30 bg-black">
      {/* The Webcam Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="block w-full h-full object-cover transform -scale-x-100" // Mirror effect
        style={{ minHeight: '400px' }}
      />
      
      {/* The Skeleton Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none transform -scale-x-100" // Mirror effect matches video
      />

      {/* Status Overlay */}
      {!webcamRunning && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <p>Initializing Neural Hand Vision...</p>
        </div>
      )}
    </div>
  );
};

export default HandVisualizer;