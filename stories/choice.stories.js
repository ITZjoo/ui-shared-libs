export default {
  title: 'Core/Checkbox, radio, switch',
  parameters: { docs: { description: { component: 'Native inputs with a class. Wrap them in `.ui-choice` to label them.' } } },
  render: ({ type, label, desc, checked, invalid, disabled }, { id: storyId }) => {
    const input = {
      checkbox: 'type="checkbox" class="ui-checkbox"',
      radio: `type="radio" class="ui-radio" name="${storyId}"`,
      switch: 'type="checkbox" role="switch" class="ui-switch"',
    }[type];
    const attrs = [checked && 'checked', invalid && 'aria-invalid="true"', disabled && 'disabled']
      .filter(Boolean).map((a) => ` ${a}`).join('');
    const text = desc
      ? `<span class="ui-choice__text">\n    <span class="ui-choice__label">${label}</span>\n    <span class="ui-choice__desc">${desc}</span>\n  </span>`
      : `<span class="ui-choice__label">${label}</span>`;
    return `<label class="ui-choice">
  <input ${input}${attrs}>
  ${text}
</label>`;
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['checkbox', 'radio', 'switch'] },
    label: { control: 'text' },
    desc: { control: 'text' },
    checked: { control: 'boolean' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { type: 'checkbox', label: 'I agree to the terms', desc: 'You can change this later.', checked: false, invalid: false, disabled: false },
};

export const Playground = {};

export const RadioGroup = {
  render: () => `<div class="sb-col">
  <fieldset class="ui-choice-group ui-choice-group--horizontal">
    <legend class="ui-label">Payment</legend>
    <label class="ui-choice"><input type="radio" class="ui-radio" name="pay" value="cash" checked><span class="ui-choice__label">Cash</span></label>
    <label class="ui-choice"><input type="radio" class="ui-radio" name="pay" value="transfer"><span class="ui-choice__label">Transfer</span></label>
  </fieldset>
  <fieldset class="ui-choice-group">
    <legend class="ui-label">Plan</legend>
    <label class="ui-choice ui-choice--card"><input type="radio" class="ui-radio" name="plan" value="basic" checked><span class="ui-choice__text"><span class="ui-choice__label">Basic</span><span class="ui-choice__desc">Up to 100 members.</span></span></label>
    <label class="ui-choice ui-choice--card"><input type="radio" class="ui-radio" name="plan" value="pro"><span class="ui-choice__text"><span class="ui-choice__label">Pro</span><span class="ui-choice__desc">Unlimited members.</span></span></label>
  </fieldset>
</div>`,
};

export const Switches = {
  render: () => `<div class="sb-col">
  <label class="ui-choice"><input type="checkbox" role="switch" class="ui-switch"><span class="ui-choice__label">Email notifications</span></label>
  <label class="ui-choice"><input type="checkbox" role="switch" class="ui-switch ui-switch--sm" checked><span class="ui-choice__label">Compact</span></label>
</div>`,
};
