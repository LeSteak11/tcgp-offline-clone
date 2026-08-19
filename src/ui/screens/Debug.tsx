import { useRef, useState } from 'react';
import { ODDS, PACKS_FILE, POOLS } from '../../engine/data';
import { openPack } from '../../engine/openPack';
import { randomSeed } from '../../engine/rng';
import { RARITIES } from '../../engine/rarity';
import type { Rarity } from '../../engine/types';
import { useCollection } from '../../store/collection';
import { useSettings } from '../../store/settings';

type Histogram = { rows: Record<Rarity, number>[]; packs: number; godPacks: number };

export function Debug() {
  const settings = useSettings();
  const collection = useCollection();
  const [rollPackId, setRollPackId] = useState(PACKS_FILE.packs[0].id);
  const [rollCount, setRollCount] = useState(100);
  const [histogram, setHistogram] = useState<Histogram | null>(null);
  const [giveId, setGiveId] = useState('');
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  function rollN() {
    const rows = Array.from({ length: 5 }, () =>
      Object.fromEntries(RARITIES.map((r) => [r, 0])) as Record<Rarity, number>,
    );
    let godPacks = 0;
    for (let i = 0; i < rollCount; i++) {
      const result = openPack(rollPackId, POOLS, ODDS, randomSeed(), {
        forceGodPack: settings.forceGodPack,
      });
      if (result.isGodPack) godPacks++;
      result.cards.forEach((c, slot) => rows[slot][c.rarity]++);
      collection.recordPull(result);
    }
    setHistogram({ rows, packs: rollCount, godPacks });
    setMessage(`Rolled ${rollCount} × ${rollPackId} into the collection.`);
  }

  function give() {
    const ok = collection.giveCard(giveId.trim());
    setMessage(ok ? `Added ${giveId.trim()}.` : `Unknown card id "${giveId.trim()}"`);
  }

  function exportJson() {
    const blob = new Blob([collection.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pocket-clone-collection.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File) {
    const result = collection.importJson(await file.text());
    setMessage(result.ok ? 'Import successful.' : `Import failed: ${result.error}`);
  }

  return (
    <div className="debug">
      <h2>Debug</h2>
      {message && <p className="debug__message">{message}</p>}

      <section>
        <h3>Settings</h3>
        <label>
          <input
            type="checkbox"
            checked={settings.unlimitedPacks}
            onChange={(e) => settings.setUnlimitedPacks(e.target.checked)}
          />
          Unlimited packs
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.forceGodPack}
            onChange={(e) => settings.setForceGodPack(e.target.checked)}
          />
          Force god pack
        </label>
      </section>

      <section>
        <h3>Roll N packs</h3>
        <div className="debug__row">
          <select value={rollPackId} onChange={(e) => setRollPackId(e.target.value)}>
            {PACKS_FILE.packs.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={100000}
            value={rollCount}
            onChange={(e) => setRollCount(Number(e.target.value))}
          />
          <button className="btn btn--primary" onClick={rollN}>Roll</button>
        </div>
        {histogram && (
          <table className="debug__histogram">
            <thead>
              <tr><th>slot</th>{RARITIES.map((r) => <th key={r}>{r}</th>)}</tr>
            </thead>
            <tbody>
              {histogram.rows.map((row, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  {RARITIES.map((r) => (
                    <td key={r}>
                      {row[r] > 0
                        ? `${((row[r] / histogram.packs) * 100).toFixed(2)}%`
                        : '—'}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td colSpan={RARITIES.length + 1}>
                  god packs: {histogram.godPacks} / {histogram.packs}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h3>Give card by ID</h3>
        <div className="debug__row">
          <input
            placeholder="A1-004"
            value={giveId}
            onChange={(e) => setGiveId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && give()}
          />
          <button className="btn" onClick={give}>Give</button>
        </div>
      </section>

      <section>
        <h3>Save data</h3>
        <div className="debug__row">
          <button className="btn" onClick={exportJson}>Export JSON</button>
          <button className="btn" onClick={() => fileInput.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importJson(f);
              e.target.value = '';
            }}
          />
          <button
            className="btn btn--danger"
            onClick={() => {
              if (confirm('Reset ALL collection data?')) {
                void collection.resetAll();
                setMessage('Collection reset.');
              }
            }}
          >
            Reset all data
          </button>
        </div>
      </section>
    </div>
  );
}
