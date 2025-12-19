import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { GameSettings, GameResult } from '../App';
import './GameScreen.css';

interface GameScreenProps {
  items: string[];
  settings: GameSettings;
  onComplete: (results: GameResult[]) => void;
  onExit: () => void;
}

interface Point {
  x: number;
  y: number;
}

export const GameScreen: React.FC<GameScreenProps> = ({ items, settings, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [message, setMessage] = useState<string>('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const currentPath = useRef<Point[]>([]);
  const completedPaths = useRef<Point[][]>([]); 
  
  // We need a separate offscreen canvas for validation to keep the main canvas clean
  const validationCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentItem = items[currentIndex];

  useEffect(() => {
    // Reset for new item
    setAttempts(0);
    setStartTime(Date.now());
    completedPaths.current = [];
    currentPath.current = [];
    setMessage('');
    
    drawCanvas();
  }, [currentIndex]);

  useEffect(() => {
      const handleResize = () => drawCanvas();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays and resizing
    const rect = containerRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const text = settings.uppercaseOnly ? currentItem.toUpperCase() : currentItem;
    
    // 1. Draw Template (The Font)
    if (settings.mode !== 'blind') {
        ctx.save();
        // Center text
        const fontSize = Math.min(canvas.width / (text.length * 0.8), canvas.height * 0.6);
        ctx.font = `400 ${fontSize}px "Andika", "Comenia Script", "Lexend", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#d0d0d0'; // Light gray for template
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }

    // 2. Draw User Strokes (Standard Pen)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 12; // Natural pen width
    ctx.strokeStyle = '#222';

    // Completed paths
    completedPaths.current.forEach(path => {
        if (path.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for(let i=1; i<path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
    });

    // Current path
    if (currentPath.current.length > 0) {
        ctx.beginPath();
        const path = currentPath.current;
        ctx.moveTo(path[0].x, path[0].y);
        for(let i=1; i<path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
    }
  };

  const getPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      return {
          x: clientX - rect.left,
          y: clientY - rect.top
      };
  };

  const handleStartDraw = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const p = getPoint(e);
      currentPath.current = [p];
      drawCanvas();
  };

  const handleMoveDraw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const p = getPoint(e);
      currentPath.current.push(p);
      drawCanvas();
  };

  const handleEndDraw = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      if (currentPath.current.length > 5) {
          completedPaths.current.push(currentPath.current);
      }
      currentPath.current = [];
      drawCanvas();
      
      checkSimilarity();
  };

  const getPixelBounds = (data: Uint8ClampedArray, width: number, height: number) => {
      let minX = width, maxX = 0, minY = height, maxY = 0;
      let found = false;
      for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
              if (data[(y * width + x) * 4 + 3] > 50) {
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                  found = true;
              }
          }
      }
      return found ? { 
          minX, maxX, minY, maxY, 
          width: maxX - minX, 
          height: maxY - minY, 
          centerX: (minX + maxX) / 2, 
          centerY: (minY + maxY) / 2 
      } : null;
  };

  const getPathBounds = (paths: Point[][]) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasPoints = false;
      paths.forEach(path => path.forEach(p => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
          hasPoints = true;
      }));
      
      return hasPoints ? { 
          minX, minY, maxX, maxY, 
          width: maxX - minX, 
          height: maxY - minY, 
          centerX: (minX + maxX) / 2, 
          centerY: (minY + maxY) / 2 
      } : null;
  };

  const checkSimilarity = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (!validationCanvasRef.current) {
          validationCanvasRef.current = document.createElement('canvas');
      }
      const vCanvas = validationCanvasRef.current;
      vCanvas.width = canvas.width;
      vCanvas.height = canvas.height;
      const vCtx = vCanvas.getContext('2d', { willReadFrequently: true });
      if (!vCtx) return;

      const text = settings.uppercaseOnly ? currentItem.toUpperCase() : currentItem;
      const fontSize = Math.min(canvas.width / (text.length * 0.8), canvas.height * 0.6);

      // --- PASS 1: Accuracy (Thin vs Template) ---
      // Check if user stayed inside the lines (mostly)
      
      // Draw Target Mask (Filled)
      vCtx.clearRect(0, 0, vCanvas.width, vCanvas.height);
      vCtx.fillStyle = '#000';
      vCtx.font = `400 ${fontSize}px "Andika", "Comenia Script", "Lexend", sans-serif`;
      vCtx.textAlign = 'center';
      vCtx.textBaseline = 'middle';
      vCtx.fillText(text, vCanvas.width / 2, vCanvas.height / 2);
      
      const templateData = vCtx.getImageData(0, 0, vCanvas.width, vCanvas.height).data;
      
      // Calculate blind mode transformation
      let offsetX = 0;
      let offsetY = 0;
      let scale = 1;

      if (settings.mode === 'blind') {
          const templateBounds = getPixelBounds(templateData, vCanvas.width, vCanvas.height);
          const userBounds = getPathBounds(completedPaths.current);

          if (templateBounds && userBounds && userBounds.width > 10 && userBounds.height > 10) {
              // Align centers
              // We want: userCenter * scale + offset = templateCenter
              // So: offset = templateCenter - userCenter * scale
              
              // Determine scale based on the LARGER dimension to preserve aspect ratio 
              // and avoid blowing up small dimensions (like width of 'I' or height of '-')
              const templateMaxDim = Math.max(templateBounds.width, templateBounds.height);
              const userMaxDim = Math.max(userBounds.width, userBounds.height);
              
              scale = templateMaxDim / userMaxDim;
              
              // Clamp scale to reasonable values (e.g. 0.2x to 5x)
              scale = Math.max(0.2, Math.min(scale, 5.0));

              offsetX = templateBounds.centerX - userBounds.centerX * scale;
              offsetY = templateBounds.centerY - userBounds.centerY * scale;
              
              // console.log('Blind Mode Transformation:', { scale, offsetX, offsetY, templateBounds, userBounds });
          }
      }
      
      // Draw User Normal Strokes
      vCtx.clearRect(0, 0, vCanvas.width, vCanvas.height);
      vCtx.lineCap = 'round';
      vCtx.lineJoin = 'round';
      vCtx.lineWidth = 12; // Same as display
      vCtx.strokeStyle = '#fff'; // White on transparent

      completedPaths.current.forEach(path => {
          if (path.length < 2) return;
          vCtx.beginPath();
          // Apply transformation
          vCtx.moveTo(path[0].x * scale + offsetX, path[0].y * scale + offsetY);
          for(let i=1; i<path.length; i++) {
              vCtx.lineTo(path[i].x * scale + offsetX, path[i].y * scale + offsetY);
          }
          vCtx.stroke();
      });
      
      const userData = vCtx.getImageData(0, 0, vCanvas.width, vCanvas.height).data;
      
      let userPixels = 0;
      let outsidePixels = 0;
      
      for (let i = 0; i < userData.length; i += 4) {
          // Check if user drew here (alpha > 0)
          if (userData[i + 3] > 50) {
              userPixels++;
              // Check if this pixel is NOT in template
              if (templateData[i + 3] < 50) {
                  outsidePixels++;
              }
          }
      }
      
      const errorRate = userPixels > 0 ? outsidePixels / userPixels : 0;

      // --- PASS 2: Completeness (Thick User vs Template) ---
      // Simulate a thick brush to see if the whole letter form was traced
      
      vCtx.clearRect(0, 0, vCanvas.width, vCanvas.height);
      // Determine stem width roughly (e.g. 1/5 of font size)
      // We want the brush to be slightly wider than the stem to ensure coverage
      // Made slightly stricter (smaller brush) to require better centering
      const validationWidth = Math.max(15, fontSize / 5); 
      
      vCtx.lineWidth = validationWidth;
      vCtx.strokeStyle = '#fff';
      
      completedPaths.current.forEach(path => {
          if (path.length < 2) return;
          vCtx.beginPath();
          // Apply transformation
          vCtx.moveTo(path[0].x * scale + offsetX, path[0].y * scale + offsetY);
          for(let i=1; i<path.length; i++) {
              vCtx.lineTo(path[i].x * scale + offsetX, path[i].y * scale + offsetY);
          }
          vCtx.stroke();
      });
      
      const userThickData = vCtx.getImageData(0, 0, vCanvas.width, vCanvas.height).data;
      
      let templatePixels = 0;
      let coveredTemplatePixels = 0;
      
      for (let i = 0; i < templateData.length; i += 4) {
          // If this is part of the template letter
          if (templateData[i + 3] > 50) {
              templatePixels++;
              // Check if the THICK user stroke covers it
              if (userThickData[i + 3] > 50) {
                  coveredTemplatePixels++;
              }
          }
      }
      
      const completeness = templatePixels > 0 ? coveredTemplatePixels / templatePixels : 0;

      console.log(`[Validation] Mode: ${settings.mode}, Error: ${(errorRate*100).toFixed(1)}%, Completeness: ${(completeness*100).toFixed(1)}%`);

      // Criteria:
      // Blind mode needs to be much more lenient because exact shape matching is hard without a guide
      const isBlind = settings.mode === 'blind';
      const minCompleteness = isBlind ? 0.60 : 0.90;
      const maxError = isBlind ? 0.45 : 0.20;

      if (completeness > minCompleteness && errorRate < maxError) {
      handleSuccess();
    }
  };

  const handleSuccess = () => {
      if (message === 'Výborně!') return;

      setMessage('Výborně!');
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

      const duration = (Date.now() - startTime) / 1000;
      const result: GameResult = {
          target: currentItem,
          success: attempts <= 2,
          attempts: attempts + 1, 
          duration
      };

    setTimeout(() => {
          const newResults = [...results, result];
    setResults(newResults);

          if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(newResults);
    }
      }, 1500);
  };

  const handleClear = () => {
      completedPaths.current = [];
      setAttempts(prev => prev + 1); 
      setMessage('');
      drawCanvas();
  };

  return (
    <div className="game-container">
      <div className="header">
        <button className="exit-btn mc-button" onClick={onExit}><ArrowLeft /> Zpět</button>
        <div className="progress">
            {currentIndex + 1} / {items.length}
        </div>
      </div>

      <div className="canvas-wrapper" ref={containerRef}>
        {settings.mode === 'blind' && (
            <div className="blind-model-text">
                {settings.uppercaseOnly ? currentItem.toUpperCase() : currentItem}
            </div>
        )}
        <canvas
            ref={canvasRef}
            onMouseDown={handleStartDraw}
            onMouseMove={handleMoveDraw}
            onMouseUp={handleEndDraw}
            onMouseLeave={handleEndDraw}
            onTouchStart={handleStartDraw}
            onTouchMove={handleMoveDraw}
            onTouchEnd={handleEndDraw}
            className="writing-canvas"
        />
      </div>

      <div className="controls">
          <div className="feedback-message" style={{ color: message ? '#4a8f29' : 'transparent' }}>
            {message || '...'}
          </div>
          <button className="icon-btn" onClick={handleClear} title="Smazat a zkusit znovu">
            <RefreshCw />
        </button>
      </div>
    </div>
  );
};
