
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';

interface DrawingCanvasProps {
  onDrawingChange: (data: string | null) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onDrawingChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pathRef = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size to match display size with high DPI support
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale the context to match the device pixel ratio
    context.scale(dpr, dpr);
    
    // Set canvas CSS size back to original
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Set high-quality rendering settings
    context.strokeStyle = currentColor;
    context.lineWidth = lineWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    // Fill with white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  }, []);

  // Update canvas context when color or line width changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.strokeStyle = currentColor;
    context.lineWidth = lineWidth;
  }, [currentColor, lineWidth]);

  const getEventPos = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    // Handle touch events
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }

    // Handle mouse events
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const drawSmoothLine = useCallback((points: { x: number; y: number }[]) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || points.length < 2) return;

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    // Use quadratic curves for smoother lines
    for (let i = 1; i < points.length - 1; i++) {
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      const controlPointX = (currentPoint.x + nextPoint.x) / 2;
      const controlPointY = (currentPoint.y + nextPoint.y) / 2;
      
      context.quadraticCurveTo(currentPoint.x, currentPoint.y, controlPointX, controlPointY);
    }

    // Draw to the last point
    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      context.lineTo(lastPoint.x, lastPoint.y);
    }

    context.stroke();
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const pos = getEventPos(e);
    setIsDrawing(true);
    lastPointRef.current = pos;
    pathRef.current = [pos];

    // Start a new path and draw a dot for single clicks
    context.beginPath();
    context.moveTo(pos.x, pos.y);
    context.lineTo(pos.x, pos.y);
    context.stroke();
  }, [getEventPos]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !lastPointRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const currentPos = getEventPos(e);
    
    // Add current position to path
    pathRef.current.push(currentPos);
    
    // Always draw a line from last point to current point for continuous strokes
    context.beginPath();
    context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    context.lineTo(currentPos.x, currentPos.y);
    context.stroke();

    lastPointRef.current = currentPos;
  }, [isDrawing, getEventPos]);

  const stopDrawing = useCallback((e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e) e.preventDefault();
    
    if (isDrawing) {
      setIsDrawing(false);
      lastPointRef.current = null;
      pathRef.current = [];
      
      // Update the drawing data
      const canvas = canvasRef.current;
      if (canvas) {
        onDrawingChange(canvas.toDataURL());
      }
    }
  }, [isDrawing, onDrawingChange]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const dpr = window.devicePixelRatio || 1;
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    onDrawingChange(null);
  }, [onDrawingChange]);

  const downloadDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'note-drawing.png';
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  }, []);

  const colors = [
    '#000000', // Black
    '#1E40AF', // Blue
    '#DC2626', // Red
    '#059669', // Green
    '#7C3AED', // Purple
    '#EA580C', // Orange
    '#0891B2', // Cyan
    '#6B7280'  // Gray
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Color:</label>
          <div className="flex gap-1.5">
            {colors.map(color => (
              <button
                key={color}
                type="button"
                className={`w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                  currentColor === color 
                    ? 'border-gray-800 ring-2 ring-gray-300' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Brush:</label>
          <input
            type="range"
            min="1"
            max="12"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-24 accent-slate-800"
          />
          <div className="flex items-center justify-center w-8 h-8">
            <div 
              className="rounded-full border border-gray-300"
              style={{ 
                width: `${Math.max(lineWidth, 4)}px`, 
                height: `${Math.max(lineWidth, 4)}px`,
                backgroundColor: currentColor 
              }}
            />
          </div>
        </div>

        <div className="flex gap-2 ml-auto">
          <Button
            type="button"
            onClick={clearCanvas}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
          <Button
            type="button"
            onClick={downloadDrawing}
            variant="outline"
            size="sm"
            className="hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <canvas
          ref={canvasRef}
          className="block cursor-crosshair bg-white w-full h-96 touch-none"
          style={{ 
            touchAction: 'none'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
    </div>
  );
};
