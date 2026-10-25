import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  form,
  FormField,
  max,
  min,
  required,
  requiredError,
  type ValidationError,
} from '@angular/forms/signals';
import { NumberField } from './number-field';

interface Rendered<T> {
  host: T;
  root: HTMLElement;
  input: HTMLInputElement;
  update: () => Promise<void>;
}

async function render<T>(component: new () => T): Promise<Rendered<T>> {
  const fixture = TestBed.createComponent(component);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const input = root.querySelector('input');
  if (input === null) {
    throw new Error('No input rendered');
  }
  return { host: fixture.componentInstance, root, input, update: () => fixture.whenStable() };
}

function type(input: HTMLInputElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new Event('input'));
}

const errorTexts = (root: HTMLElement): string[] =>
  Array.from(root.querySelectorAll('.number-field__errors li'), (li) => li.textContent.trim());

describe('NumberField', () => {
  describe('on its own', () => {
    @Component({
      imports: [NumberField],
      template: `<app-number-field
        label="Instruments"
        hint="How many symbols to simulate."
        [min]="1"
        [max]="50"
        [errors]="errors()"
        [touched]="touched()"
        [disabled]="disabled()"
        [required]="true"
        [(value)]="value"
        (touch)="touches = touches + 1"
      />`,
    })
    class Host {
      readonly value = signal<number | null>(5);
      readonly errors = signal<readonly ValidationError[]>([]);
      readonly touched = signal(false);
      readonly disabled = signal(false);
      touches = 0;
    }

    it('labels a numeric text input', async () => {
      const { root, input } = await render(Host);

      expect(root.querySelector('label')?.textContent.trim()).toBe('Instruments');
      expect(root.querySelector('label')?.htmlFor).toBe(input.id);
      expect(input.type).toBe('text');
      expect(input.inputMode).toBe('numeric');
      expect(input.getAttribute('aria-required')).toBe('true');
    });

    it('describes the input with the hint and the allowed range', async () => {
      const { root, input } = await render(Host);
      const hint = root.querySelector('.number-field__hint');

      expect(hint?.textContent.trim()).toBe('How many symbols to simulate. From 1 to 50.');
      expect(input.getAttribute('aria-describedby')).toBe(hint?.id);
    });

    it('shows the current value', async () => {
      const { host, input, update } = await render(Host);
      expect(input.value).toBe('5');

      host.value.set(42);
      await update();

      expect(input.value).toBe('42');
    });

    it('sets the value as the user types and null when the input is cleared', async () => {
      const { host, input } = await render(Host);

      type(input, '12');
      expect(host.value()).toBe(12);

      type(input, '');
      expect(host.value()).toBeNull();
    });

    it('keeps the last number while the text is not a number', async () => {
      const { host, input } = await render(Host);

      type(input, '12a');

      expect(host.value()).toBe(5);
      expect(input.value).toBe('12a');
    });

    it('shows errors only once the field has been touched', async () => {
      const { host, root, input, update } = await render(Host);
      host.errors.set([requiredError()]);
      await update();
      expect(errorTexts(root)).toEqual([]);
      expect(input.hasAttribute('aria-invalid')).toBe(false);

      host.touched.set(true);
      await update();

      expect(errorTexts(root)).toEqual(['Enter a value.']);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      const errorsId = root.querySelector('.number-field__errors')?.id ?? '';
      expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(errorsId);
    });

    it('reports touch when focus leaves the input', async () => {
      const { host, input } = await render(Host);

      input.dispatchEvent(new Event('blur'));

      expect(host.touches).toBe(1);
    });

    it('can be disabled', async () => {
      const { host, input, update } = await render(Host);

      host.disabled.set(true);
      await update();

      expect(input.disabled).toBe(true);
    });

    it('gives every field its own id', async () => {
      const first = await render(Host);
      const second = await render(Host);

      expect(first.input.id).not.toBe(second.input.id);
    });
  });

  describe('bound to a Signal Form field with [formField]', () => {
    @Component({
      imports: [NumberField, FormField],
      template: `<app-number-field label="Instruments" [formField]="settings.count" />`,
    })
    class FormHost {
      readonly model = signal<{ count: number | null }>({ count: 5 });
      readonly settings = form(this.model, (path) => {
        required(path.count);
        min(path.count, 1);
        max(path.count, 50);
      });
    }

    it('takes the range from the field rules, so pages do not repeat the limits', async () => {
      const { root } = await render(FormHost);

      expect(root.querySelector('.number-field__hint')?.textContent.trim()).toBe('From 1 to 50.');
    });

    it('writes typed numbers into the form model', async () => {
      const { host, input } = await render(FormHost);

      type(input, '12');

      expect(host.model()).toEqual({ count: 12 });
    });

    it('shows the field errors after blur', async () => {
      const { root, input, update } = await render(FormHost);

      type(input, '51');
      input.dispatchEvent(new Event('blur'));
      await update();

      expect(errorTexts(root)).toEqual(['Enter 50 or less.']);
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('reports text that is not a number once, as a field error that makes the form invalid', async () => {
      const { host, root, input, update } = await render(FormHost);

      type(input, 'abc');
      input.dispatchEvent(new Event('blur'));
      await update();

      expect(errorTexts(root)).toEqual(['Enter a number, for example 100.']);
      expect(host.settings().valid()).toBe(false);
      expect(host.model()).toEqual({ count: 5 });
    });
  });
});
