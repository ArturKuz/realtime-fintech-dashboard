import {
  Component,
  computed,
  type ElementRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import {
  type FormValueControl,
  transformedValue,
  type ValidationError,
} from '@angular/forms/signals';
import { formatNumberInput, parseNumberInput } from '@shared/forms/number-input.utils';
import { validationMessage } from '@shared/forms/validation-message.utils';

let nextId = 0;

/**
 * A labelled number input for Signal Forms: bind it with [formField] like a native input. The field
 * passes in errors, touched, disabled, required and the min/max rules; text that is not a number is
 * reported back as a parse error.
 */
@Component({
  selector: 'app-number-field',
  templateUrl: './number-field.html',
  styleUrl: './number-field.scss',
})
export class NumberField implements FormValueControl<number | null> {
  readonly value = model<number | null>(null);
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly errors = input<readonly ValidationError[]>([]);
  readonly touched = input(false);
  readonly disabled = input(false);
  readonly required = input(false);
  readonly min = input<number>();
  readonly max = input<number>();
  readonly touch = output();

  protected readonly inputId = `number-field-${nextId++}`;
  protected readonly hintId = `${this.inputId}-hint`;
  protected readonly errorsId = `${this.inputId}-errors`;

  /** The text in the input, kept in sync with `value` through parse / format. */
  protected readonly text = transformedValue(this.value, {
    parse: parseNumberInput,
    format: formatNumberInput,
  });

  protected readonly hintText = computed(() => {
    const min = this.min();
    const max = this.max();
    const range = min !== undefined && max !== undefined ? `From ${min} to ${max}.` : undefined;
    return [this.hint(), range].filter((part) => part !== undefined).join(' ');
  });

  // Inside a form the field already includes parse errors in `errors`; on its own it does not.
  // The same text is shown once either way.
  protected readonly messages = computed(() => [
    ...new Set([...this.errors(), ...this.text.parseErrors()].map(validationMessage)),
  ]);

  protected readonly showErrors = computed(() => this.touched() && this.messages().length > 0);

  protected readonly describedBy = computed(
    () =>
      [this.hintText() ? this.hintId : '', this.showErrors() ? this.errorsId : '']
        .filter((id) => id !== '')
        .join(' ') || null,
  );

  private readonly inputElement = viewChild.required<ElementRef<HTMLInputElement>>('field');

  /** Lets the form move focus here, e.g. to the first invalid field. */
  focus(options?: FocusOptions): void {
    this.inputElement().nativeElement.focus(options);
  }
}
