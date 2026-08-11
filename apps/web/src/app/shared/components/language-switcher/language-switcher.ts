import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  LanguageService,
  SupportedLanguage,
} from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
})
export class LanguageSwitcher {
  private readonly languageService = inject(LanguageService);

  protected readonly currentLanguage = this.languageService.currentLanguage;

  protected setLanguage(language: SupportedLanguage): void {
    this.languageService.setLanguage(language);
  }
}
