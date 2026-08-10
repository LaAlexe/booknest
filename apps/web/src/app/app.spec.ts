import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

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
});
