import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StatsPage } from './pages/StatsPage';
import { setActiveSkin, skinFromLocation } from './config/skins';
import { setupEmbed } from './embed';
import './styles.css';

const container = document.getElementById('root')!;
/* 見た目のプリセットと埋め込みの扱いは描画前に決める（切り替わる様子を見せない） */
setActiveSkin(skinFromLocation());
setupEmbed(container);

createRoot(container).render(
  <StrictMode>
    <StatsPage />
  </StrictMode>,
);
