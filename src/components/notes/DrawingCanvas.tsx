import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Download, Pencil, Eraser, Undo2, Redo2 } from 'lucide-react';
import getStroke from 'perfect-freehand';
import { useIsMobile } from '@/hooks/use-mobile';

interface DrawingCanvasProps {
  onDrawingChange: (data: string | null) => void;
  isFullscreen?: boolean;
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

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onDrawingChange, isFullscreen = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(isMobile ? 6 : 8);
  const [eraserSize, setEraserSize] = useState(isMobile ? 24 : 20);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('pen');

  const getStrokeOptions = (size: number, hasPressure: boolean = false) => ({
    size,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t: number) => t,
    simulatePressure: !hasPressure,
    start: {
      cap: true,
      taper: 0,
    },
    end: {
      cap: true,
      taper: 0,
    },
  });

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
    
    const pressure = e.pointerType === 'pen' || e.pointerType === 'touch' 
      ? (e.pressure > 0 ? e.pressure : 0.5)
      : 0.5;
    
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
    (e.target as SVGSVGElement).releasePointerCapture(e.pointerId);
    setCurrentStroke([]);
    setIsDrawing(false);
  }, []);

  const stopDrawing = useCallback((e?: React.PointerEvent<SVGSVGElement>) => {
    if (e) {
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
    setRedoStack([]);
    setCurrentStroke([]);
    setIsDrawing(false);

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
    setRedoStack([]);
    setCurrentStroke([]);
    setIsDrawing(false);
    onDrawingChange(null);
  }, [onDrawingChange]);

  const undo = useCallback(() => {
    if (strokes.length === 0) return;
    
    const lastStroke = strokes[strokes.length - 1];
    setStrokes(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, lastStroke]);
    
    setTimeout(() => {
      exportToDataUrl();
    }, 50);
  }, [strokes, exportToDataUrl]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const strokeToRedo = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setStrokes(prev => [...prev, strokeToRedo]);
    
    setTimeout(() => {
      exportToDataUrl();
    }, 50);
  }, [redoStack, exportToDataUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

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
    '#000000',
    '#1E40AF',
    '#DC2626',
    '#059669',
    '#7C3AED',
    '#EA580C',
  ];

  // Calculate canvas height based on context
  const getCanvasHeight = () => {
    if (isFullscreen) return 'h-[70vh]';
    if (isMobile) return 'h-[50vh]';
    return 'h-80';
  };

  return (
    <div className="space-y-2 overflow-hidden">
      {/* Mobile-optimized toolbar */}
      {isMobile ? (
        <div className="space-y-2 overflow-hidden">
          {/* Top row: Tools and actions */}
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-xl">
            {/* Tool toggle */}
            <div className="flex gap-0.5 p-0.5 bg-background rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTool('pen')}
                className={`p-2 rounded-md transition-colors ${
                  activeTool === 'pen' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground'
                }`}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('eraser')}
                className={`p-2 rounded-md transition-colors ${
                  activeTool === 'eraser' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground'
                }`}
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>

            {/* Undo/Redo */}
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={undo}
                disabled={strokes.length === 0}
                className="p-2 rounded-lg text-muted-foreground disabled:opacity-30"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={redoStack.length === 0}
                className="p-2 rounded-lg text-muted-foreground disabled:opacity-30"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* Clear & Save */}
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={clearCanvas}
                className="p-2 rounded-lg text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={downloadDrawing}
                className="p-2 rounded-lg text-muted-foreground"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom row: Colors and size - wrapped to fit */}
          <div className="flex items-center justify-between gap-2 px-1">
            {/* Color palette - only for pen */}
            {activeTool === 'pen' ? (
              <div className="flex gap-1.5 flex-shrink-0">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-transform active:scale-90 ${
                      currentColor === color 
                        ? 'border-foreground scale-110' 
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentColor(color)}
                  />
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Eraser size</span>
            )}

            {/* Size slider */}
            <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[120px]">
              <input
                type="range"
                min={activeTool === 'eraser' ? '15' : '3'}
                max={activeTool === 'eraser' ? '50' : '20'}
                value={activeTool === 'eraser' ? eraserSize : brushSize}
                onChange={(e) => {
                  if (activeTool === 'eraser') {
                    setEraserSize(parseInt(e.target.value));
                  } else {
                    setBrushSize(parseInt(e.target.value));
                  }
                }}
                className="w-full h-2 accent-primary"
              />
              <div 
                className="rounded-full border border-border flex-shrink-0"
                style={{ 
                  width: `${Math.max((activeTool === 'eraser' ? eraserSize : brushSize) / 2, 4)}px`, 
                  height: `${Math.max((activeTool === 'eraser' ? eraserSize : brushSize) / 2, 4)}px`,
                  backgroundColor: activeTool === 'eraser' ? 'hsl(var(--muted))' : currentColor 
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Desktop toolbar */
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border">
          {/* Tool Selection */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Tool:</label>
            <div className="flex gap-1">
              <Button
                type="button"
                variant={activeTool === 'pen' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('pen')}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Pen
              </Button>
              <Button
                type="button"
                variant={activeTool === 'eraser' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('eraser')}
              >
                <Eraser className="w-4 h-4 mr-1" />
                Eraser
              </Button>
            </div>
          </div>

          {/* Color picker */}
          {activeTool === 'pen' && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground">Color:</label>
              <div className="flex gap-1.5">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                      currentColor === color 
                        ? 'border-foreground ring-2 ring-ring' 
                        : 'border-border hover:border-muted-foreground'
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
            <label className="text-sm font-medium text-muted-foreground">
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
              className="w-24 accent-primary"
            />
            <div className="flex items-center justify-center w-8 h-8">
              <div 
                className="rounded-full border border-border"
                style={{ 
                  width: `${Math.max((activeTool === 'eraser' ? eraserSize : brushSize) / 2, 4)}px`, 
                  height: `${Math.max((activeTool === 'eraser' ? eraserSize : brushSize) / 2, 4)}px`,
                  backgroundColor: activeTool === 'eraser' ? '#e5e7eb' : currentColor 
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              onClick={undo}
              variant="outline"
              size="sm"
              disabled={strokes.length === 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              onClick={redo}
              variant="outline"
              size="sm"
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              onClick={clearCanvas}
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button
              type="button"
              onClick={downloadDrawing}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="border-2 border-border rounded-xl overflow-hidden bg-white"
      >
        <svg
          ref={svgRef}
          className={`block bg-white w-full touch-none ${getCanvasHeight()} ${
            activeTool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'
          }`}
          style={{ touchAction: 'none' }}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onPointerCancel={cancelDrawing}
        >
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
