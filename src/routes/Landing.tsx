import { VitrineScene } from '../components/landing/VitrineScene';
import { useSiteRoute } from '../state/useSiteRoute';

/** 랜딩 — 전시 진열장(비트린) 렌더. 상자를 클릭하면 유리 안으로 줌인 → 필드 진입. */
export function Landing() {
  const { navigate } = useSiteRoute();

  return (
    <main className="landing-page landing-page--vitrine">
      <VitrineScene onEnter={() => navigate('/field')} />

      <section className="vitrine-caption" aria-hidden>
        <span>INTERACTIVE ELECTRONIC ECOLOGY / SEOUL 2026</span>
        <p>상자를 클릭하면 내부 생태계로 들어갑니다</p>
      </section>

      <nav className="vitrine-links" aria-label="Enter ENSIL">
        <a href="#/field">01 / ENTER FIELD →</a>
        <a href="#/archive">02 / OPEN ARCHIVE →</a>
      </nav>
    </main>
  );
}
