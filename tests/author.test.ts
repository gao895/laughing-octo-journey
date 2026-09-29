import { describe, expect, it } from 'vitest';
import { artworkAuthorName, cleanArtistName, galleryAuthorName } from '@/lib/gallery/author';

describe('作者名', () => {
  it('uses the exhibition name, else the account display name', () => {
    expect(galleryAuthorName({ artist_name: '星野みずき' }, 'moco')).toBe('星野みずき');
    expect(galleryAuthorName({ artist_name: null }, 'moco')).toBe('moco');
    expect(galleryAuthorName({ artist_name: '   ' }, 'moco')).toBe('moco');
  });

  it('lets one artwork override the exhibition name (group shows)', () => {
    expect(artworkAuthorName({ artist_name: 'ゲスト作家' }, '星野みずき')).toBe('ゲスト作家');
    expect(artworkAuthorName({ artist_name: null }, '星野みずき')).toBe('星野みずき');
  });

  it('cleans typed names and turns blanks into "use the default"', () => {
    expect(cleanArtistName('  星野\u0000みずき  ')).toBe('星野みずき');
    expect(cleanArtistName('')).toBeNull();
    expect(cleanArtistName(null)).toBeNull();
    expect(Array.from(cleanArtistName('あ'.repeat(80))!).length).toBe(50);
  });
});
