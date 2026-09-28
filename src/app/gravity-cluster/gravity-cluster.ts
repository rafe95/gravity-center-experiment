import { Component, computed, input, output } from '@angular/core';
import { gravityLayout, rankRadii, valueRadii } from './gravity-layout';

export interface GravityItem {
  id: number;
  value: number;
}

/**
 * Renders each item's value inside a circle and packs the circles around a shared center
 * of gravity. The first item is the heaviest: it sits in the middle and is drawn largest.
 * Clicking (or pressing Enter/Space on) a circle emits that item's id.
 */
@Component({
  selector: 'app-gravity-cluster',
  template: `
    <svg [attr.viewBox]="viewBox()" role="group" [attr.aria-label]="label()">
      @for (circle of circles(); track circle.id) {
        <g
          class="node"
          role="button"
          tabindex="0"
          [attr.aria-label]="'Value ' + circle.value"
          [style.transform]="circle.transform"
          (click)="select(circle.id)"
          (keydown.enter)="select(circle.id)"
          (keydown.space)="$event.preventDefault(); select(circle.id)"
        >
          <circle class="focus-ring" [attr.r]="circle.r + 5" />
          <circle class="body" [attr.r]="circle.r" />
          <text aria-hidden="true" [style.font-size.px]="circle.r * 0.7">{{ circle.value }}</text>
        </g>
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      aspect-ratio: 1;
      color: var(--gravity-cluster-ink, #1a1a1a);
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .node {
      cursor: pointer;
      outline: none;
      transition: transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .body {
      fill: var(--gravity-cluster-fill, #fff);
      stroke: currentColor;
      stroke-width: 1.5;
      transition:
        r 400ms cubic-bezier(0.2, 0.8, 0.2, 1),
        fill 150ms;
    }

    .node:hover .body {
      fill: var(--gravity-cluster-hover-fill, #f0f0f0);
    }

    .focus-ring {
      fill: none;
      stroke: var(--gravity-cluster-focus, #1a56db);
      stroke-width: 3;
      visibility: hidden;
    }

    .node:focus-visible .focus-ring {
      visibility: visible;
    }

    text {
      fill: currentColor;
      font-weight: 600;
      text-anchor: middle;
      dominant-baseline: central;
      pointer-events: none;
      user-select: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .node,
      .body {
        transition: none;
      }
    }
  `,
})
export class GravityCluster {
  readonly items = input.required<readonly GravityItem[]>();
  /** Radius of the central circle, in viewBox units. */
  readonly radius = input(50);
  readonly gap = input(10);
  /** How much each circle shrinks relative to the previous one (fraction of `radius`). */
  readonly decay = input(0.04);
  /** Smallest circle, as a fraction of `radius` (also the size of the lowest value when sorted). */
  readonly minRatio = input(0.6);

  /** Emits the id of the clicked item. */
  readonly itemClick = output<number>();

  /**
   * When enabled, items are ordered from highest to lowest value (the highest sits in the
   * center) and each circle's size reflects its value instead of its position.
   */
  readonly sorted = input(false);

  protected readonly circles = computed(() => {
    const sorted = this.sorted();
    const items = sorted ? [...this.items()].sort((a, b) => b.value - a.value) : this.items();
    const radiusOptions = {
      baseRadius: this.radius(),
      decay: this.decay(),
      minRatio: this.minRatio(),
    };
    const radii = sorted
      ? valueRadii(
          items.map((item) => item.value),
          radiusOptions,
        )
      : rankRadii(items.length, radiusOptions);
    const layout = gravityLayout(radii, this.gap());
    return layout.map((c, i) => ({
      ...c,
      id: items[i].id,
      value: items[i].value,
      transform: `translate(${c.x}px, ${c.y}px)`,
    }));
  });

  /** Square viewBox centered on the cluster; small clusters keep breathing room. */
  protected readonly viewBox = computed(() => {
    const minHalf = this.radius() * 4;
    const extent = this.circles().reduce(
      (max, c) => Math.max(max, Math.abs(c.x) + c.r, Math.abs(c.y) + c.r),
      0,
    );
    const half = Math.max(minHalf, extent + this.radius() * 0.5);
    return `${-half} ${-half} ${half * 2} ${half * 2}`;
  });

  protected readonly label = computed(() => {
    const count = this.items().length;
    return count === 0 ? 'No values' : `${count} value${count === 1 ? '' : 's'}`;
  });

  protected select(id: number): void {
    this.itemClick.emit(id);
  }
}
