import { Component, computed, signal } from '@angular/core';
import { GravityCluster, GravityItem } from './gravity-cluster/gravity-cluster';

@Component({
  imports: [GravityCluster],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly examples: GravityItem[][] = [1, 2, 3, 5, 9].map((n) =>
    Array.from({ length: n }, (_, i) => ({ id: n * 100 + i, value: 42 })),
  );

  protected readonly count = signal(7);
  protected readonly playground = computed<GravityItem[]>(() =>
    Array.from({ length: this.count() }, (_, i) => ({ id: i + 1, value: (i * 37 + 11) % 100 })),
  );

  private readonly rolls = signal(0);
  /** Same items as the playground, as a fresh array per roll so the random layout recomputes. */
  protected readonly randomItems = computed(() => {
    this.rolls();
    return [...this.playground()];
  });

  protected readonly selectedId = signal<number | null>(null);

  protected reroll(): void {
    this.rolls.update((n) => n + 1);
  }

  protected setCount(event: Event): void {
    this.count.set((event.target as HTMLInputElement).valueAsNumber);
  }
}
