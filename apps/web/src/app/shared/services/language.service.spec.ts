import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { provideTranslationTesting } from '../testing/translation-testing.providers';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideTranslationTesting()],
    });
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('uses English by default', () => {
    const languageService = TestBed.inject(LanguageService);

    expect(languageService.currentLanguage()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('persists Ukrainian and can switch back to English', () => {
    const languageService = TestBed.inject(LanguageService);
    const translateService = TestBed.inject(TranslateService);

    languageService.setLanguage('uk');
    expect(languageService.currentLanguage()).toBe('uk');
    expect(localStorage.getItem('booknest-language')).toBe('uk');
    expect(translateService.instant('catalog.title')).toBe('Каталог книг');

    languageService.setLanguage('en');
    expect(languageService.currentLanguage()).toBe('en');
    expect(localStorage.getItem('booknest-language')).toBe('en');
    expect(translateService.instant('catalog.title')).toBe('Book catalog');
  });

  it('restores a supported saved language', () => {
    localStorage.setItem('booknest-language', 'uk');

    const languageService = TestBed.inject(LanguageService);

    expect(languageService.currentLanguage()).toBe('uk');
  });

  it('falls back safely when a saved language is unsupported', () => {
    localStorage.setItem('booknest-language', 'fr');

    const languageService = TestBed.inject(LanguageService);

    expect(languageService.currentLanguage()).toBe('en');
  });
});
