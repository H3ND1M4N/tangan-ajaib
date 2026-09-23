import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandGestureState } from '../types/game';

// MediaPipe 21 hand connection pairs for skeleton drawing
export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base cross connections
  [5, 9], [9, 13], [13, 17]
];

export function useMediaPipeHands() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(true);

  // Filtered/smoothed gesture state
  const [gestureState, setGestureState] = useState<HandGestureState>({
    isDetected: false,
    x: 0.5,
    y: 0.5,
    isPinching: false,
    pinchDistance: 1,
    isOpenPalm: false,
  });

  // Smoothing position buffer
  const smoothPosRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  // Initialize MediaPipe Vision Task
  useEffect(() => {
    let isCancelled = false;

    async function initMediaPipe() {
      try {
        setIsLoading(true);
        setError(null);

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (isCancelled) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (isCancelled) return;

        handLandmarkerRef.current = landmarker;
        setIsLoading(false);
      } catch (err: unknown) {
        if (isCancelled) return;
        console.error('Failed to initialize MediaPipe Hand Landmarker:', err);
        setError('Gagal memuat sensor MediaPipe AI. Pastikan koneksi internet stabil.');
        setIsLoading(false);
      }
    }

    initMediaPipe();

    return () => {
      isCancelled = true;
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, []);

  // WebCam Stream Initialization
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    async function setupCamera() {
      if (!cameraActive) {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
          };
        }
      } catch (err) {
        if (isMounted) {
          setError('Kamera tidak diizinkan atau tidak ditemukan.');
        }
      }
    }

    setupCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive]);

  // Main Detection & Render Loop
  const runDetection = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = handLandmarkerRef.current;

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      animFrameIdRef.current = requestAnimationFrame(runDetection);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameIdRef.current = requestAnimationFrame(runDetection);
      return;
    }

    // Match canvas dimensions to video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Only process new video frames
    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;

      try {
        const results: HandLandmarkerResult = landmarker.detectForVideo(
          video,
          performance.now()
        );

        if (results.landmarks && results.landmarks.length > 0) {
          const firstHand = results.landmarks[0];

          // Key landmarks
          const thumbTip = firstHand[4];
          const indexTip = firstHand[8];
          const middleTip = firstHand[12];
          const wrist = firstHand[0];

          // Compute pinch distance in normalized 3D space
          const dx = thumbTip.x - indexTip.x;
          const dy = thumbTip.y - indexTip.y;
          const dz = (thumbTip.z || 0) - (indexTip.z || 0);
          const pinchDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const isPinching = pinchDist < 0.08;

          // Open palm check (fingers extended away from wrist)
          const isOpenPalm =
            indexTip.y < firstHand[6].y &&
            middleTip.y < firstHand[10].y &&
            firstHand[16].y < firstHand[14].y;

          // Mirrored coordinates for intuitive mirror effect
          const rawTargetX = 1 - indexTip.x;
          const rawTargetY = indexTip.y;

          // Exponential smoothing to eliminate jitter
          const alpha = 0.45;
          smoothPosRef.current.x =
            smoothPosRef.current.x * (1 - alpha) + rawTargetX * alpha;
          smoothPosRef.current.y =
            smoothPosRef.current.y * (1 - alpha) + rawTargetY * alpha;

          setGestureState({
            isDetected: true,
            x: Math.max(0.02, Math.min(0.98, smoothPosRef.current.x)),
            y: Math.max(0.02, Math.min(0.98, smoothPosRef.current.y)),
            isPinching,
            pinchDistance: pinchDist,
            isOpenPalm,
            rawLandmarks: firstHand,
          });

          // Draw Glowing MediaPipe Hand Skeleton Overlay
          const width = canvas.width;
          const height = canvas.height;

          // Draw connections
          ctx.save();
          // Horizontal mirror so canvas drawing aligns with the mirrored CSS video
          ctx.translate(width, 0);
          ctx.scale(-1, 1);

          HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
            const p1 = firstHand[startIdx];
            const p2 = firstHand[endIdx];

            ctx.beginPath();
            ctx.moveTo(p1.x * width, p1.y * height);
            ctx.lineTo(p2.x * width, p2.y * height);

            ctx.strokeStyle = isPinching
              ? 'rgba(245, 158, 11, 0.85)' // Amber when pinching
              : 'rgba(16, 185, 129, 0.75)'; // Emerald when open
            ctx.lineWidth = isPinching ? 4 : 3;
            ctx.lineCap = 'round';
            ctx.stroke();
          });

          // Draw landmark joints
          firstHand.forEach((landmark, idx) => {
            const lx = landmark.x * width;
            const ly = landmark.y * height;

            ctx.beginPath();
            const radius = idx === 4 || idx === 8 ? 8 : 4;
            ctx.arc(lx, ly, radius, 0, 2 * Math.PI);

            if (idx === 8) {
              // Index tip (Pointer)
              ctx.fillStyle = isPinching ? '#f59e0b' : '#38bdf8';
              ctx.shadowColor = isPinching ? '#f59e0b' : '#38bdf8';
              ctx.shadowBlur = 15;
            } else if (idx === 4) {
              // Thumb tip
              ctx.fillStyle = isPinching ? '#f59e0b' : '#10b981';
              ctx.shadowColor = '#10b981';
              ctx.shadowBlur = 10;
            } else {
              ctx.fillStyle = '#ffffff';
              ctx.shadowBlur = 0;
            }
            ctx.fill();
          });

          // Draw Pinch indicator ring between thumb and index
          if (isPinching) {
            const midX = ((thumbTip.x + indexTip.x) / 2) * width;
            const midY = ((thumbTip.y + indexTip.y) / 2) * height;

            ctx.beginPath();
            ctx.arc(midX, midY, 18, 0, 2 * Math.PI);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
            ctx.stroke();
          }

          ctx.restore();
        } else {
          setGestureState((prev) =>
            prev.isDetected ? { ...prev, isDetected: false } : prev
          );
        }
      } catch (err) {
        // Ignored frame error
      }
    }

    animFrameIdRef.current = requestAnimationFrame(runDetection);
  }, []);

  // Start loop when component is mounted
  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(runDetection);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [runDetection]);

  return {
    videoRef,
    canvasRef,
    gestureState,
    isLoading,
    error,
    cameraActive,
    setCameraActive,
  };
}
