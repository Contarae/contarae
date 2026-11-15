import { act, fireEvent, render, screen } from '@testing-library/react';
import HomeHero from './HomeHero';

let intersect;
let motionChange;
let motion;
beforeEach(() => {
  jest.useFakeTimers();
  motion = false;
  window.matchMedia = jest.fn(() => ({ matches: motion, addEventListener: (_, cb) => { motionChange = cb; }, removeEventListener: jest.fn() }));
  window.IntersectionObserver = class {
    constructor(callback) { intersect = callback; }
    observe() { intersect([{ isIntersecting: true }]); }
    disconnect() {}
  };
});
afterEach(() => { jest.useRealTimers(); });

test('rotates without hiding permanent certification and digital service links', () => {
  render(<HomeHero />);
  expect(screen.getByRole('heading', { name: 'Automatización de procesos' })).toBeVisible();
  act(() => jest.advanceTimersByTime(6500));
  expect(screen.getByRole('heading', { name: 'Desarrollo web con IA aplicada' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Solicitar certificación de ingresos' })).toHaveAttribute('href', '#certificacion');
  expect(screen.getByRole('link', { name: /Automatización de procesos/ })).toHaveAttribute('href', '/servicios-contables#automatizacion-procesos');
});

test('pause remains paused after focus and click; manual choice also stops rotation', () => {
  render(<HomeHero />);
  const pause = screen.getByRole('button', { name: 'Pausar presentación' });
  fireEvent.focus(pause);
  fireEvent.click(pause);
  act(() => jest.advanceTimersByTime(13000));
  expect(screen.getByRole('heading', { name: 'Automatización de procesos' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Reanudar presentación' }));
  act(() => jest.advanceTimersByTime(6500));
  expect(screen.getByRole('heading', { name: 'Desarrollo web con IA aplicada' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Certificaciones' }));
  act(() => jest.advanceTimersByTime(13000));
  expect(screen.getByRole('heading', { name: 'Certificación de ingresos' })).toBeVisible();
});

test('hover, offscreen visibility and keyboard interaction suspend automatic changes', () => {
  render(<HomeHero />);
  const carousel = screen.getByRole('region', { name: 'Servicios destacados' });
  fireEvent.mouseEnter(carousel);
  act(() => jest.advanceTimersByTime(6500));
  expect(screen.getByRole('heading', { name: 'Automatización de procesos' })).toBeVisible();
  fireEvent.mouseLeave(carousel);
  act(() => intersect([{ isIntersecting: false }]));
  act(() => jest.advanceTimersByTime(6500));
  expect(screen.getByRole('heading', { name: 'Automatización de procesos' })).toBeVisible();
  act(() => intersect([{ isIntersecting: true }]));
  fireEvent.focus(screen.getByRole('link', { name: 'Conocer el servicio' }));
  act(() => jest.advanceTimersByTime(6500));
  expect(screen.getByRole('heading', { name: 'Automatización de procesos' })).toBeVisible();
});

test('respects reduced motion and still allows manual service selection', () => {
  motion = true;
  render(<HomeHero />);
  expect(screen.queryByRole('button', { name: 'Pausar presentación' })).not.toBeInTheDocument();
  act(() => jest.advanceTimersByTime(13000));
  expect(screen.getByRole('heading', { name: 'Automatización de procesos' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Servicio siguiente' }));
  expect(screen.getByRole('heading', { name: 'Desarrollo web con IA aplicada' })).toBeVisible();
  act(() => motionChange());
});
