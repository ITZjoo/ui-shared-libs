export default {
  title: 'Core/Form controls',
  parameters: { docs: { description: { component: 'Input, textarea, select and the field that labels them. Mark an invalid control with `aria-invalid="true"`.' } } },
  render: ({ label, control, required, optional, hint, error, disabled }, { id: storyId }) => {
    // Docs pages render every story on one page, so ids must be unique per story.
    const id = storyId.replace(/^.*--/, 'field-');
    const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
    const attrs = [
      required && 'required',
      disabled && 'disabled',
      error && 'aria-invalid="true"',
      describedBy && `aria-describedby="${describedBy}"`,
    ].filter(Boolean).map((a) => ` ${a}`).join('');
    const field = {
      input: `<input class="ui-input" id="${id}"${attrs}>`,
      textarea: `<textarea class="ui-textarea" id="${id}" rows="3"${attrs}></textarea>`,
      select: `<select class="ui-select" id="${id}"${attrs}>\n    <option value="">Choose…</option>\n    <option>Bandung</option>\n    <option>Jakarta</option>\n  </select>`,
    }[control];
    const requiredMark = required ? '<span class="ui-label__required" aria-hidden="true">*</span>' : '';
    const labelHtml = `<label class="ui-label" for="${id}">${label}${requiredMark}</label>`;
    const header = optional
      ? `<div class="ui-field__header">\n    ${labelHtml}\n    <span class="ui-label__optional">Optional</span>\n  </div>`
      : labelHtml;
    const hintHtml = hint ? `\n  <p class="ui-hint" id="${id}-hint">${hint}</p>` : '';
    const errorHtml = error ? `\n  <p class="ui-error" id="${id}-error">${error}</p>` : '';
    return `<div class="ui-field">
  ${header}
  ${field}${hintHtml}${errorHtml}
</div>`;
  },
  argTypes: {
    control: { control: 'inline-radio', options: ['input', 'textarea', 'select'] },
    label: { control: 'text' },
    required: { control: 'boolean' },
    optional: { control: 'boolean' },
    hint: { control: 'text' },
    error: { control: 'text', description: 'Non-empty sets `aria-invalid="true"` and shows the message.' },
    disabled: { control: 'boolean' },
  },
  args: { control: 'input', label: 'Full name', required: true, optional: false, hint: 'Used on receipts.', error: '', disabled: false },
};

export const Playground = {};

export const Invalid = {
  args: { label: 'Email', required: false, optional: true, hint: 'We never share it.', error: 'Enter a valid email address.' },
};

export const Disabled = { args: { label: 'Member number', required: false, hint: '', disabled: true } };

export const Textarea = { args: { control: 'textarea', label: 'Notes', required: false, hint: '' } };

export const Select = { args: { control: 'select', label: 'City', required: false, hint: '' } };
