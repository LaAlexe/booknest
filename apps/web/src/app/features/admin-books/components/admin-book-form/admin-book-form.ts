import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Genre } from '../../../catalog/models/catalog.models';
import { AdminBook, AdminBookInput } from '../../models/admin-book.models';
import { trimmedRequiredValidator } from '../../../../shared/validators/trimmed-required.validator';

@Component({
  selector: 'app-admin-book-form',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-book-form.html',
  styleUrl: './admin-book-form.scss',
})
export class AdminBookForm {
  private readonly formBuilder = inject(FormBuilder);

  readonly book = input<AdminBook | null>(null);
  readonly genres = input.required<Genre[]>();
  readonly isSaving = input(false);
  readonly saveBook = output<AdminBookInput>();

  protected readonly hasAttemptedSubmission = signal(false);
  protected readonly bookForm = this.formBuilder.nonNullable.group({
    title: ['', [trimmedRequiredValidator, Validators.maxLength(255)]],
    author: ['', [trimmedRequiredValidator, Validators.maxLength(255)]],
    description: [''],
    coverUrl: [
      '',
      [Validators.pattern(/^https?:\/\/\S+$/), Validators.maxLength(2048)],
    ],
    genreId: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const existingBook = this.book();
      if (existingBook) {
        this.bookForm.setValue({
          title: existingBook.title,
          author: existingBook.author,
          description: existingBook.description ?? '',
          coverUrl: existingBook.coverUrl ?? '',
          genreId: existingBook.genreId,
        });
      }
    });
  }

  protected submitBook(): void {
    this.hasAttemptedSubmission.set(true);
    if (this.bookForm.invalid || this.isSaving()) {
      this.bookForm.markAllAsTouched();
      return;
    }
    const formValue = this.bookForm.getRawValue();
    this.saveBook.emit({
      title: formValue.title.trim(),
      author: formValue.author.trim(),
      description: formValue.description.trim() || null,
      coverUrl: formValue.coverUrl.trim() || null,
      genreId: formValue.genreId,
    });
  }

  protected shouldShowError(
    controlName: keyof typeof this.bookForm.controls,
  ): boolean {
    const formControl = this.bookForm.controls[controlName];
    return (
      formControl.invalid &&
      (formControl.dirty ||
        formControl.touched ||
        this.hasAttemptedSubmission())
    );
  }
}
