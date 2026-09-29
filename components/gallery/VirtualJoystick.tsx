'use client';

import { useRef, useState, type PointerEvent } from 'react';
import type { MoveInputRef } from './types';

const RADIUS = 48;

/** On-screen stick for phones and tablets (bottom-left). Writes into a shared ref. */
export function VirtualJoystick({ inputRef }: { inputRef: MoveInputRef }) {
  const base = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function update(e: PointerEvent<HTMLDivElement>) {
    const rect = base.current?.getBoundingClientRect();
    if (!rect) return;
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    inputRef.current = { x: dx / RADIUS, y: -dy / RADIUS };
  }

  function release() {
    pointer.current = null;
    setKnob({ x: 0, y: 0 });
    inputRef.current = { x: 0, y: 0 };
  }

  return (
    <div
      ref={base}
      role="presentation"
      className="pointer-events-auto absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-6 size-32 touch-none rounded-full border border-white/20 bg-black/25 backdrop-blur-sm"
      onPointerDown={(e) => {
        pointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (pointer.current === e.pointerId) update(e);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div
        className="absolute top-1/2 left-1/2 size-14 rounded-full bg-white/70 shadow-lg"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}
