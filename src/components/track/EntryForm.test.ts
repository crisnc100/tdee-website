import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import EntryForm, { SubmitButton } from './EntryForm';

describe('EntryForm saving state', () => {
  it('says it is saving, and is marked inert, while a save is pending', () => {
    const html = renderToStaticMarkup(createElement(SubmitButton, { saving: true, editing: false }));
    expect(html).toContain('Saving…');
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toContain('Save entry');
  });

  it('offers Save entry or Save changes when idle', () => {
    expect(renderToStaticMarkup(createElement(SubmitButton, { saving: false, editing: false }))).toMatch(
      /aria-disabled="false"[^>]*>Save entry</,
    );
    expect(renderToStaticMarkup(createElement(SubmitButton, { saving: false, editing: true }))).toContain('Save changes');
  });

  it('starts with editable fields and an idle button', () => {
    const html = renderToStaticMarkup(
      createElement(EntryForm, {
        entries: [],
        unit: 'kg',
        today: '2026-11-03',
        editing: null,
        onSave: async () => null,
        onCancelEdit: () => {},
      }),
    );
    expect(html).not.toContain('readonly');
    expect(html).toContain('aria-busy="false"');
    expect(html).toContain('Save entry');
  });
});
