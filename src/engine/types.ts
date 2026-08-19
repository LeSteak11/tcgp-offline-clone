export type Rarity =
  | 'D1' | 'D2' | 'D3' | 'D4' // ◇ ◇◇ ◇◇◇ ◇◇◇◇
  | 'S1' | 'S2' | 'S3'        // ★ ★★ ★★★
  | 'CROWN';                  // ♛

export type CardType =
  | 'Grass' | 'Fire' | 'Water' | 'Lightning' | 'Psychic' | 'Fighting'
  | 'Darkness' | 'Metal' | 'Dragon' | 'Colorless' | 'Trainer';

export interface Card {
  id: string;        // "A1-004"
  setId: string;     // "A1" | "A1a"
  number: number;
  name: string;
  hp?: number;
  type: CardType;
  stage?: 'Basic' | 'Stage 1' | 'Stage 2' | 'Supporter' | 'Item';
  rarity: Rarity;
  packs: string[];   // pack ids this card can drop in
  isEx?: boolean;
  isFullArt?: boolean;
}

export interface SetFile {
  setId: string;
  name: string;
  officialCount: number;
  cards: Card[];
}

export interface Pack {
  id: string;        // "A1-charizard"
  setId: string;
  name: string;
  color: string;
}

export interface SetInfo {
  id: string;
  name: string;
}

export interface PacksFile {
  packs: Pack[];
  sets: SetInfo[];
}

export type SlotTable = Record<Rarity, number>; // percentages, sums to 100

export interface OddsTable {
  godPackChance: number;     // 0.0005 = 0.05%
  slots: SlotTable[];        // length 5
  godPackSlots: SlotTable[]; // length 5
}

export interface PullResult {
  packId: string;
  cards: Card[];             // length 5
  isGodPack: boolean;
  timestamp: number;
  seed: number;
}
