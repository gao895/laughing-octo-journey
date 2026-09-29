import type { ComponentType } from 'react';
import type { TemplateId } from '@/types/gallery';
import { CastleTownDecor } from './CastleTownDecor';
import { ForestDecor } from './ForestDecor';
import { HalloweenDecor } from './HalloweenDecor';
import { JapaneseDecor } from './JapaneseDecor';
import { MuseumDecor } from './MuseumDecor';
import { SeasideDecor } from './SeasideDecor';
import { SimpleDecor } from './SimpleDecor';
import { StarlightDecor } from './StarlightDecor';
import type { DecorProps } from './types';

/** Decorations for each venue. Walls, floor and ceiling are shared (GalleryRoom). */
export const VENUE_DECOR: Record<TemplateId, ComponentType<DecorProps>> = {
  'white-museum': MuseumDecor,
  starlight: StarlightDecor,
  japanese: JapaneseDecor,
  'castle-town': CastleTownDecor,
  forest: ForestDecor,
  seaside: SeasideDecor,
  halloween: HalloweenDecor,
  simple: SimpleDecor,
};

export type { DecorProps } from './types';
