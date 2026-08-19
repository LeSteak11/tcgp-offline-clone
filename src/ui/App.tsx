import { useEffect } from 'react';
import { useNav } from '../store/nav';
import { useCollection } from '../store/collection';
import { Home } from './screens/Home';
import { OpenPack } from './screens/OpenPack';
import { Binder } from './screens/Binder';
import { CardDetail } from './screens/CardDetail';
import { Debug } from './screens/Debug';

export function App() {
  const screen = useNav((s) => s.screen);
  const go = useNav((s) => s.go);
  const loaded = useCollection((s) => s.loaded);
  const load = useCollection((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  if (!loaded) return <div className="app-loading">Loading…</div>;

  return (
    <div className="app">
      <nav className="topbar">
        <button
          className={`topbar__link ${screen.name === 'home' ? 'topbar__link--active' : ''}`}
          onClick={() => go({ name: 'home' })}
        >
          Packs
        </button>
        <button
          className={`topbar__link ${screen.name === 'binder' ? 'topbar__link--active' : ''}`}
          onClick={() => go({ name: 'binder', setId: 'A1' })}
        >
          Binder
        </button>
        <button
          className={`topbar__link ${screen.name === 'debug' ? 'topbar__link--active' : ''}`}
          onClick={() => go({ name: 'debug' })}
        >
          Debug
        </button>
      </nav>
      <main className="screen">
        {screen.name === 'home' && <Home />}
        {screen.name === 'open' && <OpenPack key={screen.packId} packId={screen.packId} />}
        {screen.name === 'binder' && <Binder setId={screen.setId} />}
        {screen.name === 'card' && <CardDetail cardId={screen.cardId} from={screen.from} />}
        {screen.name === 'debug' && <Debug />}
      </main>
    </div>
  );
}
