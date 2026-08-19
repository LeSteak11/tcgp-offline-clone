import { CARDS_BY_ID, getPack } from '../../engine/data';
import { useCollection } from '../../store/collection';
import { useNav, type Screen } from '../../store/nav';
import { CardFace } from '../components/CardFace';
import { RarityGlyphs } from '../components/RarityGlyphs';

export function CardDetail({ cardId, from }: { cardId: string; from: Screen }) {
  const go = useNav((s) => s.go);
  const owned = useCollection((s) => s.owned);
  const history = useCollection((s) => s.history);
  const card = CARDS_BY_ID.get(cardId);
  if (!card) return null;

  const count = owned[card.id] ?? 0;
  const timesPulled = history.reduce(
    (acc, pull) => acc + pull.cardIds.filter((id) => id === card.id).length,
    0,
  );

  return (
    <div className="card-detail">
      <button className="btn" onClick={() => go(from)}>← Back</button>
      <div className="card-detail__layout">
        <div className="card-detail__big">
          <CardFace card={card} />
        </div>
        <dl className="card-detail__stats">
          <dt>Name</dt><dd>{card.name}{card.isEx ? ' (ex)' : ''}</dd>
          <dt>Set</dt><dd>{card.setId} · #{card.number}</dd>
          <dt>Rarity</dt><dd><RarityGlyphs rarity={card.rarity} /> ({card.rarity})</dd>
          <dt>Type</dt><dd>{card.type}</dd>
          {card.stage && (<><dt>Stage</dt><dd>{card.stage}</dd></>)}
          {card.hp != null && (<><dt>HP</dt><dd>{card.hp}</dd></>)}
          <dt>Drops in</dt>
          <dd>{card.packs.map((p) => getPack(p)?.name ?? p).join(', ')}</dd>
          <dt>Owned</dt><dd>{count}</dd>
          <dt>Times pulled</dt><dd>{timesPulled}</dd>
        </dl>
      </div>
    </div>
  );
}
