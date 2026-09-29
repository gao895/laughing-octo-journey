/**
 * AI extension point.
 *
 * Future features (title / description / exhibition-theme / layout suggestions and the
 * fully automatic exhibition "夏の思い出をテーマにした個展を作りたい") will implement this
 * interface with a server-side route (API keys must never reach the browser).
 * The MVP ships a disabled provider so the UI can already show the buttons.
 */
import type { LayoutMode, LightingPreset, TemplateId } from '@/types/gallery';

export interface ExhibitionProposal {
  title: string;
  description: string;
  template: TemplateId;
  lighting: LightingPreset;
  layout_mode: LayoutMode;
  wallColor?: string;
  bgmMood?: string;
}

export interface AiProvider {
  readonly available: boolean;
  suggestArtworkTitle(imageUrl: string): Promise<string>;
  suggestArtworkDescription(imageUrl: string, title: string): Promise<string>;
  proposeExhibition(prompt: string, imageUrls: string[]): Promise<ExhibitionProposal>;
}

class DisabledAiProvider implements AiProvider {
  readonly available = false;
  async suggestArtworkTitle(): Promise<string> {
    throw new Error('AI is not available yet');
  }
  async suggestArtworkDescription(): Promise<string> {
    throw new Error('AI is not available yet');
  }
  async proposeExhibition(): Promise<ExhibitionProposal> {
    throw new Error('AI is not available yet');
  }
}

export const ai: AiProvider = new DisabledAiProvider();
