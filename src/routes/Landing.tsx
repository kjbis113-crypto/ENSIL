import { ScreenWall } from '../components/landing/ScreenWall';

/** 인덱스 — 미디어 설치 벽. 스크린들이 곧 내비게이션이다 (ScreenWall 참조). */
export function Landing() {
  return (
    <main className="landing-page landing-page--wall">
      <ScreenWall />

      <section className="wall-manifesto">
        <span>04 AUTONOMOUS BODIES</span>
        <p>
          Four creatures sense, respond and remember.
          Each screen is a window — enter it.
        </p>
      </section>

      <nav className="wall-portals" aria-label="Enter ENSIL">
        <a href="#/field">01 / ENTER FIELD →</a>
        <a href="#/archive">02 / OPEN ARCHIVE →</a>
      </nav>
    </main>
  );
}
