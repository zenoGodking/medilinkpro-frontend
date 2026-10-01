import { describe, expect, it } from 'vitest';
import { compresserImage } from './compressionImage';

describe('compresserImage', () => {
  it('laisse intacts les PDF et les petites images', async () => {
    const pdf = new File([new Uint8Array(900 * 1024)], 'bilan.pdf', { type: 'application/pdf' });
    const petite = new File([new Uint8Array(10 * 1024)], 'page.jpg', { type: 'image/jpeg' });
    expect(await compresserImage(pdf)).toBe(pdf);
    expect(await compresserImage(petite)).toBe(petite);
  });

  it("garde le fichier d'origine si le navigateur ne sait pas le décoder", async () => {
    const illisible = new File([new Uint8Array(900 * 1024)], 'scan.png', { type: 'image/png' });
    expect(await compresserImage(illisible)).toBe(illisible);
  });
});
