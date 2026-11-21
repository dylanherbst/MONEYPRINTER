'use client';
// Full-screen animated background for the owner workspace (React Bits Grainient, components/Grainient.jsx).
import Grainient from '../../../components/Grainient';

const COLORS = ['#9529fa', '#c990ff', '#f8f6fa', '#ffffff', '#ffffff'];

export function AppBackdrop() {
  return (
    <div className="aimp-backdrop" aria-hidden="true">
      <Grainient colors={COLORS} angle={55} flow={0.8} silk={0.35} grainAmount={0.08} speed={1.45} />
    </div>
  );
}
