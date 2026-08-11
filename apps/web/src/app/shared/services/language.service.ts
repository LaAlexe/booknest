import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

export type SupportedLanguage = 'en' | 'uk';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translateService = inject(TranslateService);
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'booknest-language';

  readonly supportedLanguages: readonly SupportedLanguage[] = ['en', 'uk'];
  readonly currentLanguage = signal<SupportedLanguage>(this.getSavedLanguage());
  readonly languageChanges = toObservable(this.currentLanguage);

  constructor() {
    this.applyLanguage(this.currentLanguage());
  }

  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage.set(language);
    this.document.defaultView?.localStorage.setItem(this.storageKey, language);
    this.applyLanguage(language);
  }

  private getSavedLanguage(): SupportedLanguage {
    const savedLanguage = this.document.defaultView?.localStorage.getItem(
      this.storageKey,
    );
    return this.isSupportedLanguage(savedLanguage) ? savedLanguage : 'en';
  }

  private isSupportedLanguage(
    language: string | null | undefined,
  ): language is SupportedLanguage {
    return language === 'en' || language === 'uk';
  }

  private applyLanguage(language: SupportedLanguage): void {
    this.document.documentElement.lang = language;
    this.translateService.use(language);
  }
}
