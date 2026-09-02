import { IndexVideoCarousel } from '../components/landing/IndexVideoCarousel';
import { LiquidCursor } from '../components/landing/LiquidCursor';

export function Landing() {
  return (
    <main className="landing-page landing-page--liquid-cursor">
      <IndexVideoCarousel />
      <LiquidCursor />
    </main>
  );
}
