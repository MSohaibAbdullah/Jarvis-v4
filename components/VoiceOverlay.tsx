import React, { useEffect, useState, useRef } from 'react';

interface VoiceOverlayProps {
  isActive: boolean;
  onCancel: () => void;
  onSendAudio: (blob: Blob) => void;
}

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({ isActive, onCancel, onSendAudio }) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (isActive) {
      startRecording();
    } else {
      stopRecording();
    }
    return () => stopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        onSendAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);

      // Visualizer Setup
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      drawVisualizer();

    } catch (err) {
      console.error("Mic Access Denied", err);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      // White background for the visualizer
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * 1.5; // Scale up
        
        // Gradient for black aesthetic
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(1, '#333333');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight);

        x += barWidth + 1;
      }
    };
    draw();
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center animate-fade-in">
      <div className="absolute top-10 left-10 flex items-center gap-2">
         <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
         <span className="text-red-500 font-mono text-sm tracking-widest font-bold">RECORDING IN PROGRESS</span>
      </div>

      <canvas ref={canvasRef} width={800} height={400} className="w-full max-w-4xl h-96 opacity-90" />

      <div className="mt-12 flex gap-6">
        <button 
          onClick={stopRecording}
          className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-full font-medium tracking-wide transition-all transform hover:scale-105 shadow-xl"
        >
          Stop & Transmit
        </button>
        <button 
          onClick={onCancel}
          className="border border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-500 px-8 py-4 rounded-full transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};