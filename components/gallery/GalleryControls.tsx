'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { canStandAt, EYE_HEIGHT, type GalleryLayout } from '@/lib/gallery/layout';
import type { CameraFocus, MoveInputRef } from './types';

interface GalleryControlsProps {
  layout: GalleryLayout;
  moveInputRef?: MoveInputRef;
  focus?: CameraFocus | null;
  enabled?: boolean;
}

const WALK_SPEED = 2.6;
const RUN_SPEED = 4.5;
const TURN_SPEED = 1.8;
const LOOK_SENSITIVITY = 0.0042;
const MAX_PITCH = 1.1;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * First-person movement:
 *  - PC: WASD to walk, ←/→ (or Q/E) to turn, ↑/↓ to walk, drag to look around, Shift to run
 *  - Phone: virtual stick (moveInputRef) to walk, swipe on the scene to look around
 * Collision keeps the visitor inside the rooms and out of partition walls.
 */
export function GalleryControls({
  layout,
  moveInputRef,
  focus,
  enabled = true,
}: GalleryControlsProps) {
  const { camera, gl } = useThree();
  const yaw = useRef(layout.spawn.yaw);
  const pitch = useRef(0);
  const keys = useRef(new Set<string>());
  const layoutRef = useRef(layout);
  const focusTarget = useRef<CameraFocus | null>(null);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  // Place the camera at the entrance once.
  useEffect(() => {
    camera.rotation.order = 'YXZ';
    camera.position.set(layoutRef.current.spawn.x, EYE_HEIGHT, layoutRef.current.spawn.z);
  }, [camera]);

  useEffect(() => {
    if (focus) focusTarget.current = focus;
  }, [focus]);

  // Keyboard
  useEffect(() => {
    if (!enabled) return;
    const down = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      keys.current.add(e.code);
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
      focusTarget.current = null;
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const clear = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, [enabled]);

  // Drag / swipe to look around
  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;
    el.style.touchAction = 'none';
    let active: number | null = null;
    let lastX = 0;
    let lastY = 0;
    const onDown = (e: PointerEvent) => {
      if (active !== null) return;
      active = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== active) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const sensitivity = e.pointerType === 'touch' ? LOOK_SENSITIVITY * 1.4 : LOOK_SENSITIVITY;
      yaw.current += dx * sensitivity;
      pitch.current = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch.current + dy * sensitivity));
      if (Math.abs(dx) + Math.abs(dy) > 0) focusTarget.current = null;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId === active) active = null;
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [gl, enabled]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const k = keys.current;
    const pressed = (...codes: string[]) => codes.some((c) => k.has(c));

    let forward = 0;
    let strafe = 0;
    if (pressed('KeyW', 'ArrowUp')) forward += 1;
    if (pressed('KeyS', 'ArrowDown')) forward -= 1;
    if (pressed('KeyA')) strafe -= 1;
    if (pressed('KeyD')) strafe += 1;
    if (pressed('ArrowLeft', 'KeyQ')) yaw.current += TURN_SPEED * dt;
    if (pressed('ArrowRight', 'KeyE')) yaw.current -= TURN_SPEED * dt;
    if (moveInputRef) {
      forward += moveInputRef.current.y;
      strafe += moveInputRef.current.x;
    }

    const pos = camera.position;
    const moving = Math.abs(forward) > 0.01 || Math.abs(strafe) > 0.01;
    if (moving) focusTarget.current = null;

    const target = focusTarget.current;
    if (target) {
      // Glide towards the requested viewpoint (editor: face the selected artwork).
      const f = Math.min(1, dt * 4);
      pos.x += (target.x - pos.x) * f;
      pos.z += (target.z - pos.z) * f;
      let dy = target.yaw - yaw.current;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      yaw.current += dy * f;
      pitch.current += (0 - pitch.current) * f;
      if (Math.abs(target.x - pos.x) + Math.abs(target.z - pos.z) + Math.abs(dy) < 0.01) {
        focusTarget.current = null;
      }
    } else if (moving) {
      const len = Math.hypot(forward, strafe);
      const scale = len > 1 ? 1 / len : 1;
      const speed = (pressed('ShiftLeft', 'ShiftRight') ? RUN_SPEED : WALK_SPEED) * dt * scale;
      const sin = Math.sin(yaw.current);
      const cos = Math.cos(yaw.current);
      // Camera looks down -Z at yaw 0.
      const dx = (-sin * forward + cos * strafe) * speed;
      const dz = (-cos * forward - sin * strafe) * speed;
      const current = layoutRef.current;
      if (canStandAt(pos.x + dx, pos.z, current)) pos.x += dx;
      if (canStandAt(pos.x, pos.z + dz, current)) pos.z += dz;
    }

    pos.y = EYE_HEIGHT;
    camera.rotation.set(pitch.current, yaw.current, 0);
  });

  return null;
}
