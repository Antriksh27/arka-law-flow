import React, { useState, useRef, useCallback } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { X, Trash2, Undo2, Redo2, Pencil, Eraser, Check } from 'lucide-react';
import getStroke from 'perfect-freehand';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

interface MobileDrawingSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: string | null) => void;
  initialData?: string | null;
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

export const MobileDrawingSheet: React.FC<MobileDrawingSheetProps> = ({
  open,
  onClose,
  onSave,
  initialData
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { trigger: haptic } = useHapticFeedback();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [eraserSize, setEraserSize] = useState(24);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const hasPressureData = useRef(false);

  const colors = ['#000000', '#1E40AF', '#DC2626', '#059669', '#7C3AED', '#EA580C'];

  const getStrokeOptions = (size: number, hasPressure: boolean = false) => ({
    size,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t: number) => t,
    simulatePressure: !hasPressure,
    start: { cap: true, taper: 0 },
    end: { cap: true, taper: 0 },
  });

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
      ? (e.pressure > 0 ? e.pressure : 0.5) : 0.5;
    if (e.pointerType === 'pen' && e.pressure > 0) hasPressureData.current = true;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure };
  }, []);

  const startDrawing = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as SVGSVGElement).setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setCurrentStroke([getEventPos(e)]);
  }, [getEventPos]);

  const draw = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing) return;
    setCurrentStroke(prev => [...prev, getEventPos(e)]);
  }, [isDrawing, getEventPos]);

  const stopDrawing = useCallback((e?: React.PointerEvent<SVGSVGElement>) => {
    if (e) (e.target as SVGSVGElement).releasePointerCapture(e.pointerId);
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
  }, [isDrawing, currentStroke, currentColor, brushSize, eraserSize, activeTool]);

  const cancelDrawing = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as SVGSVGElement).releasePointerCapture(e.pointerId);
    setCurrentStroke([]);
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    setStrokes([]);
    setRedoStack([]);
    setCurrentStroke([]);
  }, []);

  const undo = useCallback(() => {
    if (strokes.length === 0) return;
    setRedoStack(prev => [...prev, strokes[strokes.length - 1]]);
    setStrokes(prev => prev.slice(0, -1));
  }, [strokes]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    setStrokes(prev => [...prev, redoStack[redoStack.length - 1]]);
    setRedoStack(prev => prev.slice(0, -1));
  }, [redoStack]);

  const handleSave = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || strokes.length === 0) {
      onSave(null);
      onClose();
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = svg.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
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
      onSave(dataUrl);
      URL.revokeObjectURL(url);
      onClose();
    };
    img.src = url;
  }, [strokes, onSave, onClose]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-full p-0 border-0 rounded-none"
        hideCloseButton
      >
        <div className="flex flex-col h-full bg-white safe-area-inset">
          {/* Minimal Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => { haptic('light'); onClose(); }}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-base font-medium text-foreground">Draw</span>
            <button
              type="button"
              onClick={() => { haptic('medium'); handleSave(); }}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
            >
              <Check className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-hidden">
            <svg
              ref={svgRef}
              className="w-full h-full bg-white touch-none"
              style={{ touchAction: 'none' }}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              onPointerCancel={cancelDrawing}
            >
              {strokes.map((stroke, i) => (
                <path
                  key={i}
                  d={getSvgPathFromStroke(getStroke(stroke.points, getStrokeOptions(stroke.size, hasPressureData.current)))}
                  fill={stroke.color}
                  strokeWidth={0}
                />
              ))}
              {currentStroke.length > 0 && (
                <path
                  d={getSvgPathFromStroke(getStroke(currentStroke, getStrokeOptions(activeTool === 'eraser' ? eraserSize : brushSize, hasPressureData.current)))}
                  fill={activeTool === 'eraser' ? '#FFFFFF' : currentColor}
                  strokeWidth={0}
                />
              )}
            </svg>
          </div>

          {/* Minimal Bottom Toolbar */}
          <div className="border-t border-slate-100 bg-white pb-safe">
            <div className="px-4 py-3 space-y-3">
              {/* Tool & Actions Row */}
              <div className="flex items-center justify-between">
                {/* Tool Toggle */}
                <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { haptic('light'); setActiveTool('pen'); }}
                    className={`p-2.5 rounded-lg transition-colors ${
                      activeTool === 'pen' ? 'bg-white shadow-sm' : ''
                    }`}
                  >
                    <Pencil className={`w-5 h-5 ${activeTool === 'pen' ? 'text-primary' : 'text-slate-400'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { haptic('light'); setActiveTool('eraser'); }}
                    className={`p-2.5 rounded-lg transition-colors ${
                      activeTool === 'eraser' ? 'bg-white shadow-sm' : ''
                    }`}
                  >
                    <Eraser className={`w-5 h-5 ${activeTool === 'eraser' ? 'text-primary' : 'text-slate-400'}`} />
                  </button>
                </div>

                {/* Undo/Redo */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => { haptic('light'); undo(); }}
                    disabled={strokes.length === 0}
                    className="p-2.5 rounded-lg disabled:opacity-30"
                  >
                    <Undo2 className="w-5 h-5 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { haptic('light'); redo(); }}
                    disabled={redoStack.length === 0}
                    className="p-2.5 rounded-lg disabled:opacity-30"
                  >
                    <Redo2 className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                {/* Clear */}
                <button
                  type="button"
                  onClick={() => { haptic('medium'); clearCanvas(); }}
                  disabled={strokes.length === 0}
                  className="p-2.5 rounded-lg disabled:opacity-30"
                >
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </button>
              </div>

              {/* Colors Row - Only show for pen */}
              {activeTool === 'pen' && (
                <div className="flex items-center justify-center gap-3">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => { haptic('light'); setCurrentColor(color); }}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        currentColor === color ? 'scale-125 ring-2 ring-offset-2 ring-slate-300' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}

              {/* Size Slider */}
              <div className="flex items-center gap-3 px-2">
                <span className="text-xs text-slate-500 w-12">
                  {activeTool === 'pen' ? 'Size' : 'Eraser'}
                </span>
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
                  className="flex-1 h-2 accent-primary"
                />
                <div
                  className="rounded-full border border-slate-200 flex-shrink-0"
                  style={{
                    width: `${Math.max((activeTool === 'eraser' ? eraserSize : brushSize) / 2, 6)}px`,
                    height: `${Math.max((activeTool === 'eraser' ? eraserSize : brushSize) / 2, 6)}px`,
                    backgroundColor: activeTool === 'eraser' ? '#e2e8f0' : currentColor
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
