import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { TextAreaAuto } from './TextAreaAuto';

function EchoHarness() {
  const [value, setValue] = useState('**Horas extras:** Primera linea\nSegunda linea');

  return <TextAreaAuto value={value} onChange={setValue} />;
}

describe('Condiciones TextAreaAuto', () => {
  it('mantiene la escritura en la posicion actual aunque el padre re-renderice con el mismo valor', async () => {
    const user = userEvent.setup();
    render(<EchoHarness />);

    const preview = screen.getByText('Horas extras:');
    await act(async () => {
      await user.click(preview);
    });

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    const insertAt = textarea.value.indexOf('Primera') + 'Primera'.length;

    textarea.focus();
    textarea.setSelectionRange(insertAt, insertAt);

    await user.keyboard(' AAA');

    expect(textarea.value).toContain('Primera AAA linea');
    expect(textarea.value).not.toMatch(/Segunda linea AAA$/);
  });
});
