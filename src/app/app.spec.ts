import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('renders one cluster per concept example plus both playground clusters', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('app-gravity-cluster').length).toBe(7);
    expect(compiled.querySelectorAll('.grid .node').length).toBe(1 + 2 + 3 + 5 + 9);
  });
});
