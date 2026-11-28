// React adapter for the Insert Agentic motion engine (UI_Motion_Bible.md, "Integrate with the existing frontend").
// One controller per mounted motion: the engine builds paused Web Animations tracks, and this hook drives time with a
// single requestAnimationFrame loop, clamps to the duration, stops at the end (only A09 may loop), and destroys the
// tracks on unmount or preset change. Strict Mode safe: the effect's cleanup fully undoes its setup.
//
// Reduced motion (OS setting or `reduced: true`): no autoplay and no movement; the motion is placed at its final,
// meaningful state. Pass `reducedPose: 'start'` if the start pose is the meaningful one for your screen.
//
// Website copy (lib/motion): identical to theme/04-motion/useInsertMotion.ts except that it builds through the motion
// registry, so it accepts all 33 IDs (A, B and C) and optional measured `params`. Without params, A/B presets still
// come straight from the canonical engine.
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPreset, type MotionHandle, type MotionParams, type MotionTargets, type PresetId } from './registry'

type MotionId = PresetId

export interface UseInsertMotionOptions {
  /** Start playing as soon as the targets are bound. Default false: product UI should play on a real event. */
  autoplay?: boolean
  /** Loop. Only honoured for A09 (the bible allows looping for A09 alone). */
  loop?: boolean
  /** Playback rate. 1 = the catalogue duration. */
  speed?: number
  /** Change this when the bound elements change (e.g. a new list item), so the motion is rebuilt on them. */
  targetsKey?: string | number
  /** Force the reduced-motion behaviour (e.g. from an in-app accessibility setting). */
  reduced?: boolean
  reducedPose?: 'start' | 'end'
  /** Called every frame with the current time in ms. Use it to move a scrubber without re-rendering the host. */
  onTime?: (ms: number) => void
  /** Called once when a non-looping run reaches its end. */
  onEnd?: () => void
  /** Measured numbers for the preset (see param-presets.ts / c-series.ts). Read when the motion is (re)built. */
  params?: MotionParams
}

export interface InsertMotionControls {
  play(): void
  pause(): void
  /** Back to the start pose, then play. */
  replay(): void
  seek(ms: number): void
  playing: boolean
  duration: number
  reducedMotion: boolean
  /** False when the browser has no Web Animations API: the static UI is shown as-is. */
  supported: boolean
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

/**
 * @param id       Preset ID, e.g. 'B02'. Changing it destroys the old motion and builds the new one.
 * @param getTargets Returns the elements to bind (read from your refs). Called when the motion is (re)built.
 */
export function useInsertMotion(
  id: MotionId,
  getTargets: () => MotionTargets | null,
  options: UseInsertMotionOptions = {},
): InsertMotionControls {
  const { autoplay = false, loop = false, speed = 1, reduced, reducedPose = 'end', targetsKey } = options
  const opts = useRef(options)
  opts.current = options
  const getTargetsRef = useRef(getTargets)
  getTargetsRef.current = getTargets

  const motion = useRef<MotionHandle | null>(null)
  const time = useRef(0)
  const raf = useRef(0)
  const last = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [osReduced, setOsReduced] = useState(prefersReducedMotion)
  const reducedMotion = reduced ?? osReduced
  const supported = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function'
  const speedRef = useRef(speed)
  speedRef.current = speed

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const on = () => setOsReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const stop = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = 0
    setPlaying(false)
  }, [])

  const seek = useCallback((ms: number) => {
    const m = motion.current
    if (!m) return
    time.current = Math.max(0, Math.min(m.duration, ms))
    m.seek(time.current)
    opts.current.onTime?.(time.current)
  }, [])

  const frame = useCallback(
    (now: number) => {
      const m = motion.current
      if (!m) return
      const dt = now - last.current
      last.current = now
      let t = time.current + dt * speedRef.current
      if (t >= m.duration) {
        if (loop && id === 'A09') {
          t = t % m.duration
        } else {
          seek(m.duration)
          stop()
          opts.current.onEnd?.()
          return
        }
      }
      seek(t)
      raf.current = requestAnimationFrame(frame)
    },
    [id, loop, seek, stop],
  )

  const play = useCallback(() => {
    const m = motion.current
    if (!m || reducedMotion || raf.current) return
    if (time.current >= m.duration) seek(0)
    last.current = performance.now()
    setPlaying(true)
    raf.current = requestAnimationFrame(frame)
  }, [frame, reducedMotion, seek])

  const pause = useCallback(() => stop(), [stop])

  const replay = useCallback(() => {
    stop()
    seek(0)
    play()
  }, [play, seek, stop])

  // Build / rebuild the motion. One timer at most: the cleanup cancels the frame and destroys the tracks.
  useEffect(() => {
    if (!supported) return
    const targets = getTargetsRef.current()
    if (!targets) return
    const m = createPreset(id, targets, opts.current.params)
    motion.current = m
    setDuration(m.duration)
    time.current = 0
    if (reducedMotion) {
      seek(reducedPose === 'end' ? m.duration : 0)
    } else {
      seek(0)
      if (autoplay) {
        last.current = performance.now()
        setPlaying(true)
        raf.current = requestAnimationFrame(frame)
      }
    }
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      raf.current = 0
      m.destroy()
      if (motion.current === m) motion.current = null
      setPlaying(false)
    }
    // `frame` changes with id/loop, which already rebuild; autoplay/reduced/targetsKey changes rebuild on purpose.
    // (react-hooks lint plugin is not installed in this repo; deps are intentional, see above.)
  }, [id, autoplay, reducedMotion, reducedPose, supported, targetsKey])

  return { play, pause, replay, seek, playing, duration, reducedMotion, supported }
}
