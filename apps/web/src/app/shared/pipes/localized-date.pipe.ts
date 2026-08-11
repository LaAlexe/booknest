import { formatDate } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 'localizedDate',
  pure: false,
})
export class LocalizedDatePipe implements PipeTransform {
  private readonly languageService = inject(LanguageService);

  transform(dateValue: string | Date | null): string {
    if (!dateValue) {
      return '';
    }
    const locale =
      this.languageService.currentLanguage() === 'uk' ? 'uk' : 'en';
    return formatDate(dateValue, 'medium', locale);
  }
}
