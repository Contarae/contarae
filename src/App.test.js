import { render, screen } from '@testing-library/react';
import App from './App';

beforeAll(() => {
  class IntersectionObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.IntersectionObserver = IntersectionObserverMock;
  window.scrollTo = jest.fn();
});

test('renders CONTARAE landing content', () => {
  render(<App />);
  expect(screen.getAllByText(/CONTARAE/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Servicios contables, tributarios y financieros/i).length).toBeGreaterThan(0);
});
