import { HashRouter, Route, Routes } from 'react-router-dom';
import { Main } from './routes/Main';

/**
 * HashRouter 사용 — 전시장 로컬 서버·file 실행에서도 새로고침이 깨지지 않게 (plan.md §14).
 * URL이 곧 화면 상태: #/c/:id, ?mode=sim, ?about=1
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/c/:id" element={<Main />} />
        <Route path="*" element={<Main />} />
      </Routes>
    </HashRouter>
  );
}
