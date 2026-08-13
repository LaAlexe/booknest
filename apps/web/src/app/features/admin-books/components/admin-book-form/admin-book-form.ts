import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { trimmedRequiredValidator } from '../../../../shared/validators/trimmed-required.validator';
import { Genre } from '../../../catalog/models/catalog.models';
import {
  AdminBook,
  AdminBookInput,
  AdminBookTranslation,
  ExternalBookSearchResult,
} from '../../models/admin-book.models';

const optionalTranslationValidator: ValidatorFn = (
  translationGroup: AbstractControl,
): ValidationErrors | null => {
  const title = String(translationGroup.get('title')?.value ?? '').trim();
  const author = String(translationGroup.get('author')?.value ?? '').trim();
  const description = String(
    translationGroup.get('description')?.value ?? '',
  ).trim();
  const hasAnyContent = Boolean(title || author || description);
  return hasAnyContent && (!title || !author)
    ? { incompleteTranslation: true }
    : null;
};

@Component({
  selector: 'app-admin-book-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './admin-book-form.html',
  styleUrl: './admin-book-form.scss',
})
export class AdminBookForm {
  private readonly formBuilder = inject(FormBuilder);

  readonly book = input<AdminBook | null>(null);
  readonly genres = input.required<Genre[]>();
  readonly isSaving = input(false);
  readonly externalBookPrefill = input<ExternalBookSearchResult | null>(null);
  readonly saveBook = output<AdminBookInput>();

  protected readonly hasAttemptedSubmission = signal(false);
  protected readonly bookForm = this.formBuilder.nonNullable.group({
    translations: this.formBuilder.nonNullable.group({
      en: this.createRequiredTranslationGroup(),
      uk: this.formBuilder.nonNullable.group(
        {
          title: ['', Validators.maxLength(255)],
          author: ['', Validators.maxLength(255)],
          description: [''],
        },
        { validators: optionalTranslationValidator },
      ),
    }),
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
        this.patchExistingBook(existingBook);
        return;
      }
      const externalBookPrefill = this.externalBookPrefill();
      if (externalBookPrefill) {
        this.populateFormFromExternalBook(externalBookPrefill);
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
    const ukrainianTranslation = this.normalizeTranslation(
      formValue.translations.uk,
    );
    this.saveBook.emit({
      translations: {
        en: this.normalizeTranslation(formValue.translations.en),
        ...(ukrainianTranslation.title || ukrainianTranslation.author
          ? { uk: ukrainianTranslation }
          : {}),
      },
      coverUrl: formValue.coverUrl.trim() || null,
      genreId: formValue.genreId,
    });
  }

  protected shouldShowError(control: AbstractControl): boolean {
    return (
      control.invalid &&
      (control.dirty || control.touched || this.hasAttemptedSubmission())
    );
  }

  private createRequiredTranslationGroup() {
    return this.formBuilder.nonNullable.group({
      title: ['', [trimmedRequiredValidator, Validators.maxLength(255)]],
      author: ['', [trimmedRequiredValidator, Validators.maxLength(255)]],
      description: [''],
    });
  }

  private patchExistingBook(book: AdminBook): void {
    this.bookForm.setValue({
      translations: {
        en: {
          title: book.translations.en.title,
          author: book.translations.en.author,
          description: book.translations.en.description ?? '',
        },
        uk: {
          title: book.translations.uk?.title ?? '',
          author: book.translations.uk?.author ?? '',
          description: book.translations.uk?.description ?? '',
        },
      },
      coverUrl: book.coverUrl ?? '',
      genreId: book.genreId,
    });
  }

  private populateFormFromExternalBook(
    externalBook: ExternalBookSearchResult,
  ): void {
    this.bookForm.patchValue({
      translations: {
        en: {
          title: externalBook.title,
          author: externalBook.authors.join(', '),
          description: externalBook.description ?? '',
        },
      },
      coverUrl: externalBook.coverUrl ?? '',
    });
  }

  private normalizeTranslation(translation: {
    title: string;
    author: string;
    description: string;
  }): AdminBookTranslation {
    return {
      title: translation.title.trim(),
      author: translation.author.trim(),
      description: translation.description.trim() || null,
    };
  }
}
