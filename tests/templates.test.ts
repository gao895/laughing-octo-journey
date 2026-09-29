import { describe, expect, it } from 'vitest';
import { TEMPLATE_ORDER, TEMPLATES, getTemplate, isTemplateId } from '@/lib/gallery/templates';
import { t } from '@/lib/i18n';

describe('venue templates', () => {
  it('lists every venue once and all eight are selectable', () => {
    expect(new Set(TEMPLATE_ORDER).size).toBe(8);
    expect(Object.keys(TEMPLATES).sort()).toEqual([...TEMPLATE_ORDER].sort());
    for (const id of TEMPLATE_ORDER) {
      expect(TEMPLATES[id].available).toBe(true);
      expect(TEMPLATES[id].id).toBe(id);
      expect(t.templates[id].name.length).toBeGreaterThan(0);
    }
  });

  it('uses valid colours and sensible lighting', () => {
    const hex = /^#[0-9a-f]{6}$/i;
    for (const tpl of Object.values(TEMPLATES)) {
      for (const c of [
        tpl.background,
        tpl.wall,
        tpl.floor,
        tpl.ceiling,
        tpl.frame,
        tpl.accent,
        tpl.text,
      ]) {
        expect(c).toMatch(hex);
      }
      expect(tpl.ambient).toBeGreaterThan(0);
      expect(tpl.keyIntensity).toBeGreaterThan(0);
      if (tpl.fog) expect(tpl.fog.far).toBeGreaterThan(tpl.fog.near);
    }
  });

  it('falls back to the White Museum for unknown ids', () => {
    expect(getTemplate('nope').id).toBe('white-museum');
    expect(isTemplateId('forest')).toBe(true);
    expect(isTemplateId('nope')).toBe(false);
  });
});
