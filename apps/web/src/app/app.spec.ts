import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { provideTranslationTesting } from './shared/testing/translation-testing.providers';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideTranslationTesting()],
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('should create the app', () => {
    const appFixture = TestBed.createComponent(App);
    const appComponent = appFixture.componentInstance;
    expect(appComponent).toBeTruthy();
  });

  it('should render the application name', async () => {
    const appFixture = TestBed.createComponent(App);
    await appFixture.whenStable();
    const appElement = appFixture.nativeElement as HTMLElement;
    expect(appElement.querySelector('.brand')?.textContent).toContain(
      'BookNest',
    );
  });

  it('switches between Ukrainian and English without reloading', async () => {
    const appFixture = TestBed.createComponent(App);
    appFixture.detectChanges();
    await appFixture.whenStable();
    const appElement = appFixture.nativeElement as HTMLElement;
    const languageButtons = appElement.querySelectorAll(
      'app-language-switcher button',
    );

    languageButtons[1]?.dispatchEvent(new Event('click'));
    appFixture.detectChanges();
    expect(appElement.textContent).toContain('Громадська бібліотека');
    expect(languageButtons[1]?.getAttribute('aria-pressed')).toBe('true');

    languageButtons[0]?.dispatchEvent(new Event('click'));
    appFixture.detectChanges();
    expect(appElement.textContent).toContain('Community library');
  });
});
