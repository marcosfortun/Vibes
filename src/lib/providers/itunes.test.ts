import { describe, it, expect, vi, afterEach } from 'vitest';
import { itunesProvider } from './itunes';

function mockItunes(results: unknown[]) {
  const urls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      urls.push(url);
      return Promise.resolve({ ok: true, json: async () => ({ results }) });
    }),
  );
  return urls;
}

afterEach(() => vi.restoreAllMocks());

describe('itunesProvider (podcasts y música)', () => {
  it('busca podcasts con carátula y enlace a la ficha', async () => {
    const urls = mockItunes([
      {
        collectionName: 'Radiolab',
        artistName: 'WNYC Studios',
        artworkUrl100: 'https://cdn/art/100x100bb.jpg',
        collectionViewUrl: 'https://podcasts.apple.com/radiolab',
      },
    ]);

    const [hit] = await itunesProvider.search!('radiolab', {
      canonicalCategory: 'Podcast',
    });

    expect(urls[0]).toContain('media=podcast');
    expect(hit).toMatchObject({
      title: 'Radiolab',
      url: 'https://podcasts.apple.com/radiolab',
      provider: 'itunes',
    });
    // El artwork se pide en grande.
    expect(hit.image).toBe('https://cdn/art/600x600bb.jpg');
  });

  it('para grupos de música busca artistas (sin imagen en la búsqueda)', async () => {
    const urls = mockItunes([
      { artistName: 'Radiohead', artistLinkUrl: 'https://music.apple.com/radiohead' },
    ]);

    const [hit] = await itunesProvider.search!('radiohead', {
      canonicalCategory: 'Grupo de música',
    });

    expect(urls[0]).toContain('entity=musicArtist');
    expect(hit).toMatchObject({
      title: 'Radiohead',
      url: 'https://music.apple.com/radiohead',
      image: null,
    });
  });

  it('resuelve la imagen de un grupo con la portada de un álbum', async () => {
    const urls = mockItunes([
      {
        collectionName: 'OK Computer',
        artworkUrl100: 'https://cdn/ok/100x100bb.jpg',
        artistViewUrl: 'https://music.apple.com/radiohead',
      },
    ]);

    const img = await itunesProvider.resolveImage!('Radiohead', {
      canonicalCategory: 'Grupo de música',
    });

    expect(urls[0]).toContain('entity=album');
    expect(img).toEqual({
      image: 'https://cdn/ok/600x600bb.jpg',
      sourceUrl: 'https://music.apple.com/radiohead',
    });
  });

  it('sin resultados devuelve [] y null', async () => {
    mockItunes([]);
    expect(await itunesProvider.search!('zzz', { canonicalCategory: 'Podcast' })).toEqual(
      [],
    );
    expect(
      await itunesProvider.resolveImage!('zzz', { canonicalCategory: 'Podcast' }),
    ).toBeNull();
  });

  it('no necesita API key', () => {
    expect(itunesProvider.isConfigured()).toBe(true);
    expect(itunesProvider.requiresKey).toBeUndefined();
  });
});
