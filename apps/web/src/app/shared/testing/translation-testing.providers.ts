import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import {
  provideTranslateService,
  provideTranslateLoader,
  TranslateLoader,
  TranslationObject,
} from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import englishTranslations from '../../../../public/assets/i18n/en.json';
import ukrainianTranslations from '../../../../public/assets/i18n/uk.json';

class TranslationTestingLoader implements TranslateLoader {
  getTranslation(language: string): Observable<TranslationObject> {
    return of(
      language === 'uk'
        ? (ukrainianTranslations as TranslationObject)
        : (englishTranslations as TranslationObject),
    );
  }
}

export function provideTranslationTesting(): EnvironmentProviders {
  return makeEnvironmentProviders(
    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en',
      loader: provideTranslateLoader(TranslationTestingLoader),
    }),
  );
}
