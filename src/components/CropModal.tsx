import React, { useRef, useState } from 'react';
import type { CropPoint } from '../types/api';

const INITIAL_POINTS: CropPoint[] = [
  { x: 0.04, y: 0.04 },
  { x: 0.96, y: 0.04 },
  { x: 0.96, y: 0.96 },
  { x: 0.04, y: 0.96 },
];

type DragHandle =
  | { type: 'corner'; index: number }
  | { type: 'edge'; edge: 'top' | 'right' | 'bottom' | 'left' }
  | { type: 'center'; start: CropPoint; points: CropPoint[] };

interface CropModalProps {
  imageDataUrl: string;
  title: string;
  subtitle?: string;
  isPending?: boolean;
  applyLabel?: string;
  fullImageLabel?: string;
  onApplyCrop: (points: CropPoint[]) => Promise<void> | void;
  onAcceptFull?: () => Promise<void> | void;
  onClose: () => void;
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function centerOf(points: CropPoint[]): CropPoint {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

export const CropModal: React.FC<CropModalProps> = ({
  imageDataUrl,
  title,
  subtitle,
  isPending = false,
  applyLabel = 'Apply crop',
  fullImageLabel = 'OK',
  onApplyCrop,
  onAcceptFull,
  onClose,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<CropPoint[]>(INITIAL_POINTS);
  const [dragHandle, setDragHandle] = useState<DragHandle | null>(null);

  const pointFromEvent = (event: React.PointerEvent): CropPoint | null => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }
    return {
      x: clamp((event.clientX - rect.left) / rect.width),
      y: clamp((event.clientY - rect.top) / rect.height),
    };
  };

  const updatePoints = (handle: DragHandle, nextPoint: CropPoint) => {
    setPoints((current) => {
      if (handle.type === 'corner') {
        return current.map((point, index) => (index === handle.index ? nextPoint : point));
      }

      if (handle.type === 'edge') {
        if (handle.edge === 'top') {
          return current.map((point, index) => (index === 0 || index === 1 ? { ...point, y: nextPoint.y } : point));
        }
        if (handle.edge === 'right') {
          return current.map((point, index) => (index === 1 || index === 2 ? { ...point, x: nextPoint.x } : point));
        }
        if (handle.edge === 'bottom') {
          return current.map((point, index) => (index === 2 || index === 3 ? { ...point, y: nextPoint.y } : point));
        }
        return current.map((point, index) => (index === 0 || index === 3 ? { ...point, x: nextPoint.x } : point));
      }

      const deltaX = nextPoint.x - handle.start.x;
      const deltaY = nextPoint.y - handle.start.y;
      const minX = Math.min(...handle.points.map((point) => point.x));
      const maxX = Math.max(...handle.points.map((point) => point.x));
      const minY = Math.min(...handle.points.map((point) => point.y));
      const maxY = Math.max(...handle.points.map((point) => point.y));
      const safeDeltaX = Math.max(-minX, Math.min(1 - maxX, deltaX));
      const safeDeltaY = Math.max(-minY, Math.min(1 - maxY, deltaY));
      return handle.points.map((point) => ({
        x: clamp(point.x + safeDeltaX),
        y: clamp(point.y + safeDeltaY),
      }));
    });
  };

  const startDrag = (event: React.PointerEvent<HTMLButtonElement>, handle: DragHandle) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragHandle(handle);
    const nextPoint = pointFromEvent(event);
    if (nextPoint) {
      updatePoints(handle, nextPoint);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragHandle) {
      return;
    }
    const nextPoint = pointFromEvent(event);
    if (nextPoint) {
      updatePoints(dragHandle, nextPoint);
    }
  };

  const center = centerOf(points);
  const edgeHandles = [
    { key: 'top', edge: 'top' as const, x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 },
    { key: 'right', edge: 'right' as const, x: (points[1].x + points[2].x) / 2, y: (points[1].y + points[2].y) / 2 },
    { key: 'bottom', edge: 'bottom' as const, x: (points[2].x + points[3].x) / 2, y: (points[2].y + points[3].y) / 2 },
    { key: 'left', edge: 'left' as const, x: (points[0].x + points[3].x) / 2, y: (points[0].y + points[3].y) / 2 },
  ];
  const polygonPoints = points.map((point) => `${point.x * 100},${point.y * 100}`).join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-900 disabled:opacity-50"
            title="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(100vh-180px)] overflow-auto bg-slate-900 p-4">
          <div
            ref={stageRef}
            className="relative mx-auto w-fit touch-none select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDragHandle(null)}
            onPointerCancel={() => setDragHandle(null)}
          >
            <img
              src={imageDataUrl}
              alt="Original page"
              className="block max-h-[calc(100vh-240px)] max-w-full rounded-lg"
              draggable={false}
            />
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon points={polygonPoints} fill="rgba(34, 211, 238, 0.18)" stroke="rgb(34, 211, 238)" strokeWidth="0.45" />
            </svg>
            {points.map((point, index) => (
              <button
                key={`corner-${index}`}
                type="button"
                className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-cyan-400 shadow-lg shadow-cyan-950/50 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                onPointerDown={(event) => startDrag(event, { type: 'corner', index })}
                title={`Corner ${index + 1}`}
              />
            ))}
            {edgeHandles.map((handle) => (
              <button
                key={handle.key}
                type="button"
                className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-white bg-sky-500 shadow-lg shadow-sky-950/50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                style={{ left: `${handle.x * 100}%`, top: `${handle.y * 100}%` }}
                onPointerDown={(event) => startDrag(event, { type: 'edge', edge: handle.edge })}
                title={`${handle.key} edge`}
              />
            ))}
            <button
              type="button"
              className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-950/80 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-200"
              style={{ left: `${center.x * 100}%`, top: `${center.y * 100}%` }}
              onPointerDown={(event) => startDrag(event, { type: 'center', start: center, points })}
              title="Move crop"
            >
              <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8M8 12h8M8 17h8" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-800 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-900 disabled:opacity-50"
          >
            Cancel
          </button>
          {onAcceptFull && (
            <button
              type="button"
              onClick={onAcceptFull}
              disabled={isPending}
              className="rounded-lg border border-cyan-400 px-4 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-950/40 disabled:opacity-50"
            >
              {fullImageLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => onApplyCrop(points)}
            disabled={isPending}
            className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            {isPending ? 'Applying...' : applyLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
