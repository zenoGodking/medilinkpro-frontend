import { describe, expect, it } from 'vitest';
import { consigne, distance, formatDistance, formatDuree, direction, cap } from './itineraire';

describe('itineraire', () => {
  it('traduit les manoeuvres OSRM en consignes francaises', () => {
    expect(consigne({ name: 'Rue Tsoungui Akoa', maneuver: { type: 'turn', modifier: 'right' } }))
      .toBe('Tournez à droite sur Rue Tsoungui Akoa');
    expect(consigne({ name: '', maneuver: { type: 'roundabout', exit: 2 } })).toBe('Au rond-point, prenez la deuxième sortie');
    expect(consigne({ name: '', maneuver: { type: 'arrive' } })).toBe('Vous êtes arrivé(e) à destination');
  });

  it('calcule distances et durees lisibles', () => {
    const yaounde = [3.848, 11.502];
    const bastos = [3.8879, 11.5115];
    expect(distance(yaounde, bastos)).toBeGreaterThan(4300);
    expect(distance(yaounde, bastos)).toBeLessThan(4700);
    expect(formatDistance(73)).toBe('70 m');
    expect(formatDistance(2450)).toBe('2,5 km');
    expect(formatDuree(30)).toBe('1 min');
    expect(formatDuree(3900)).toBe('1 h 05');
    expect(direction(cap(yaounde, bastos))).toBe('le nord');
  });
});
