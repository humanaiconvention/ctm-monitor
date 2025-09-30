/**
 * TileViewer (placeholder)
 * Responsible for rendering a sequence/grid of interactive "tiles" (data artifact, citation, forkable scenario, etc.).
 * Initial stub keeps API minimal; future evolution may add virtualization, drag-to-remix, and adaptive layout.
 *
 * @typedef {import('../types/tile').Tile} Tile
 *
 * @param {Object} props
 * @param {Tile[]} [props.tiles] Array of tile objects (see tile.ts for shape).
 * @param {string} [props.emptyMessage] Message shown when no tiles provided.
 *
 * Roadmap (not yet implemented):
 *  - layout: 'grid' | 'flow' | 'carousel'
 *  - onSelect(tileId): selection callback
 *  - onFork(tileId): remix lineage creation
 *  - filter predicate
 *  - renderTile override for custom tile component injection
 */

import React from 'react';

export function TileViewer({ tiles = [], emptyMessage = 'No tiles yet.' }) {
  return (
    <div className="tile-viewer" data-count={tiles.length}>
      {tiles.length === 0 && (
        <div className="tile-viewer__empty" role="note">{emptyMessage}</div>
      )}
      {tiles.map(t => (
        <div key={t.id} className="tile-viewer__tile" data-kind={t.kind}>
          <strong className="tile-viewer__title">{t.title || t.id}</strong>
          {t.description && <p className="tile-viewer__desc">{t.description}</p>}
        </div>
      ))}
    </div>
  );
}

export default TileViewer;
