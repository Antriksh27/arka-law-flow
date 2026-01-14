import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Download, Pencil, Eraser } from 'lucide-react';
import getStroke from 'perfect-freehand';

interface DrawingCanvasProps {
  onDrawingChange: (data: string | null) => void;
}

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
  isEraser?: boolean;
}

type Tool = 'pen' | 'eraser';

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onDrawingChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(8);
  const [eraserSize, setEraserSize] = useState(20);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('pen');

  const getStrokeOptions = (size: number, hasPressure: boolean = false) => ({
    size,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t: number) => t,
    simulatePressure: !hasPressure, // Only simulate if no real pressure data
    start: {
      cap: true,
      taper: 0,
    },
    end: {
      cap: true,
      taper: 0,
    },
  });

  // Track if we have real pressure data from stylus
  const hasPressureData = useRef(false);

  const getSvgPathFromStroke = useCallback((stroke: number[][]): string => {
    if (!stroke.length) return '';

    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length];
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        return acc;
      },
      ['M', ...stroke[0], 'Q']
    );

    d.push('Z');
    return d.join(' ');
  }, []);

  const getEventPos = useCallback((e: React.PointerEvent<SVGSVGElement>): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0, pressure: 0.5 };

    const rect = svg.getBoundingClientRect();
    
    // Detect real pressure from stylus (pen) or touch
    const pressure = e.pointerType === 'pen' || e.pointerType === 'touch' 
      ? (e.pressure > 0 ? e.pressure : 0.5)
      : 0.5;
    
    // Track if we have real pressure data
    if (e.pointerType === 'pen' && e.pressure > 0) {
      hasPressureData.current = true;
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure,
    };
  }, []);

  const startDrawing = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Capture pointer for reliable tracking
    (e.target as SVGSVGElement).setPointerCapture(e.pointerId);
    
    setIsDrawing(true);
    const point = getEventPos(e);
    setCurrentStroke([point]);
  }, [getEventPos]);

  const draw = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing) return;

    const point = getEventPos(e);
    setCurrentStroke(prev => [...prev, point]);
  }, [isDrawing, getEventPos]);

  const cancelDrawing = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    // Release pointer capture
    (e.target as SVGSVGElement).releasePointerCapture(e.pointerId);
    setCurrentStroke([]);
    setIsDrawing(false);
  }, []);

  const stopDrawing = useCallback((e?: React.PointerEvent<SVGSVGElement>) => {
    if (e) {
      // Release pointer capture
      (e.target as SVGSVGElement).releasePointerCapture(e.pointerId);
    }
    
    if (!isDrawing || currentStroke.length === 0) {
      setIsDrawing(false);
      return;
    }

    const newStroke: Stroke = {
      points: currentStroke,
      color: activeTool === 'eraser' ? '#FFFFFF' : currentColor,
      size: activeTool === 'eraser' ? eraserSize : brushSize,
      isEraser: activeTool === 'eraser',
    };

    setStrokes(prev => [...prev, newStroke]);
    setCurrentStroke([]);
    setIsDrawing(false);

    // Export to data URL after a short delay to allow state to update
    setTimeout(() => {
      exportToDataUrl();
    }, 50);
  }, [isDrawing, currentStroke, currentColor, brushSize, eraserSize, activeTool]);

  const exportToDataUrl = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = svg.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    ctx.scale(dpr, dpr);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      onDrawingChange(dataUrl);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [onDrawingChange]);

  const clearCanvas = useCallback(() => {
    setStrokes([]);
    setCurrentStroke([]);
    setIsDrawing(false);
    onDrawingChange(null);
  }, [onDrawingChange]);

  const downloadDrawing = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = svg.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    
    ctx.scale(2, 2);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = 'note-drawing.png';
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
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
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        {/* Tool Selection */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Tool:</label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant={activeTool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTool('pen')}
              className={activeTool === 'pen' ? 'bg-primary' : ''}
            >
              <Pencil className="w-4 h-4 mr-1" />
              Pen
            </Button>
            <Button
              type="button"
              variant={activeTool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTool('eraser')}
              className={activeTool === 'eraser' ? 'bg-primary' : ''}
            >
              <Eraser className="w-4 h-4 mr-1" />
              Eraser
            </Button>
          </div>
        </div>

        {/* Color picker - only show for pen tool */}
        {activeTool === 'pen' && (
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
        )}
        
        {/* Size slider */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            {activeTool === 'eraser' ? 'Eraser:' : 'Brush:'}
          </label>
          <input
            type="range"
            min={activeTool === 'eraser' ? '10' : '4'}
            max={activeTool === 'eraser' ? '50' : '24'}
            value={activeTool === 'eraser' ? eraserSize : brushSize}
            onChange={(e) => {
              if (activeTool === 'eraser') {
                setEraserSize(parseInt(e.target.value));
              } else {
                setBrushSize(parseInt(e.target.value));
              }
            }}
            className="w-24 accent-slate-800"
          />
          <div className="flex items-center justify-center w-8 h-8">
            <div 
              className={`rounded-full border ${activeTool === 'eraser' ? 'border-gray-400 bg-white' : 'border-gray-300'}`}
              style={{ 
                width: `${Math.max((activeTool === 'eraser' ? eraserSize : brushSize) / 2, 4)}px`, 
                height: `${Math.max((activeTool === 'eraser' ? eraserSize : brushSize) / 2, 4)}px`,
                backgroundColor: activeTool === 'eraser' ? '#ffffff' : currentColor 
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

      <div 
        ref={containerRef}
        className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white"
      >
        <svg
          ref={svgRef}
          className={`block bg-white w-full h-96 touch-none ${
            activeTool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'
          }`}
          style={{ touchAction: 'none' }}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onPointerCancel={cancelDrawing}
        >
          {/* Render completed strokes */}
          {strokes.map((stroke, i) => {
            const pathData = getSvgPathFromStroke(
              getStroke(stroke.points, getStrokeOptions(stroke.size, hasPressureData.current))
            );
            return (
              <path
                key={i}
                d={pathData}
                fill={stroke.color}
                strokeWidth={0}
              />
            );
          })}
          
          {/* Render current stroke being drawn */}
          {currentStroke.length > 0 && (
            <path
              d={getSvgPathFromStroke(
                getStroke(currentStroke, getStrokeOptions(activeTool === 'eraser' ? eraserSize : brushSize, hasPressureData.current))
              )}
              fill={activeTool === 'eraser' ? '#FFFFFF' : currentColor}
              strokeWidth={0}
            />
          )}
        </svg>
      </div>
    </div>
  );
};