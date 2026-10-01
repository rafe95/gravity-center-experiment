import { TestBed } from '@angular/core/testing';
import { GravityCluster, GravityItem } from './gravity-cluster';

describe('GravityCluster', () => {
  const items: GravityItem[] = [
    { id: 7, value: 42 },
    { id: 8, value: 13 },
    { id: 9, value: 99 },
  ];

  async function setup(sorted = false, randomize = false) {
    const fixture = TestBed.createComponent(GravityCluster);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('sorted', sorted);
    fixture.componentRef.setInput('randomize', randomize);
    const emitted: number[] = [];
    fixture.componentInstance.itemClick.subscribe((id) => emitted.push(id));
    await fixture.whenStable();
    const nodes = (fixture.nativeElement as HTMLElement).querySelectorAll<SVGGElement>('.node');
    return { nodes, emitted };
  }

  it('renders one labelled button per item', async () => {
    const { nodes } = await setup();
    expect(nodes.length).toBe(3);
    expect(nodes[1].getAttribute('role')).toBe('button');
    expect(nodes[1].getAttribute('aria-label')).toBe('Value 13');
    expect(nodes[1].textContent?.trim()).toBe('13');
  });

  it('emits the id when a circle is clicked', async () => {
    const { nodes, emitted } = await setup();
    nodes[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(emitted).toEqual([9]);
  });

  it('emits the id on Enter and Space', async () => {
    const { nodes, emitted } = await setup();
    nodes[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    nodes[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(emitted).toEqual([7, 8]);
  });

  it('orders by value and sizes circles by value when sorted', async () => {
    const { nodes } = await setup(true);
    const values = [...nodes].map((n) => n.textContent?.trim());
    const radii = [...nodes].map((n) => Number(n.querySelector('.body')?.getAttribute('r')));
    expect(values).toEqual(['99', '42', '13']);
    expect(radii[0]).toBeGreaterThan(radii[1]);
    expect(radii[1]).toBeGreaterThan(radii[2]);
  });

  it('still emits the original id when sorted', async () => {
    const { nodes, emitted } = await setup(true);
    nodes[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(emitted).toEqual([9]);
  });

  it('keeps sorted order and ids when randomized', async () => {
    const { nodes, emitted } = await setup(true, true);
    expect([...nodes].map((n) => n.textContent?.trim())).toEqual(['99', '42', '13']);
    nodes[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(emitted).toEqual([9]);
  });
});
