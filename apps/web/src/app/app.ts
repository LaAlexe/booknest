import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from './shared/components/language-switcher/language-switcher';

@Component({
  selector: 'app-root',
  imports: [LanguageSwitcher, RouterLink, RouterOutlet, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
