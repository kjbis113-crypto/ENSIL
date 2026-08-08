import { Main } from './routes/Main';

/**
 * 라우팅은 useHashRoute가 담당 (자체 해시 라우팅 — debug.md #1).
 * URL이 곧 화면 상태: #/c/:id, ?mode=sim, ?about=1
 */
export default function App() {
  return <Main />;
}
