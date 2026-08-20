import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MapApp } from './map/MapApp';
import { setupEmbed } from './embed';
import './styles.css';

const container = document.getElementById('root')!;
/* 記事に埋め込まれているかは描画前に決める（枠付きの見た目が一瞬出ないように） */
setupEmbed(container);

createRoot(container).render(
  <StrictMode>
    <MapApp />
  </StrictMode>,
);
