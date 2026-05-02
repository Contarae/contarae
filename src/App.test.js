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

afterEach(() => {
  window.history.pushState({}, '', '/');
  jest.restoreAllMocks();
  delete global.fetch;
});

test('renders CONTARAE landing content', () => {
  render(<App />);
  expect(screen.getAllByText(/CONTARAE/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Servicios contables, tributarios y financieros/i).length).toBeGreaterThan(0);
});

test('renders admin login without crashing', async () => {
  window.history.pushState({}, '', '/admin/certificaciones');
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: async () => ({
      configured: true,
      authenticated: false,
      username: ''
    })
  }));

  render(<App />);

  expect(await screen.findByText(/Panel operativo CONTARAE/i)).toBeInTheDocument();
});

test('renders authenticated admin dashboard without crashing', async () => {
  window.history.pushState({}, '', '/admin/certificaciones');
  global.fetch = jest.fn((input) => {
    const url = String(input);
    const payloadByRoute = {
      '/api/admin-session': { configured: true, authenticated: true, username: 'Admincontarae' },
      '/api/admin-list-certifications': { records: [] },
      '/api/admin-list-service-requests': {
        records: [{
          reference: 'CONTARAE-SOL-TEST',
          title: 'Declaración de renta persona natural',
          serviceType: 'declaracion_renta',
          status: 'pendiente_pago',
          paymentStatus: 'parcial',
          agreedPrice: '$ 180.000',
          amountPaid: '$ 50.000',
          dueDate: '2026-05-10',
          createdAt: '2026-05-01T10:00:00-05:00',
          updatedAt: '2026-05-01T10:00:00-05:00',
          clientName: 'diego andres ramirez vera',
          clientDocumentNumber: '1007856220',
          pendingTasksCount: 1,
          overdueTasksCount: 0
        }]
      },
      '/api/admin-list-service-payments': {
        payments: [{
          kind: 'payment',
          reference: 'PAY-TEST',
          serviceReference: 'CONTARAE-SOL-TEST',
          status: 'manual',
          amount: '$ 50.000',
          method: 'Nequi',
          paidAt: '2026-05-01T11:00:00-05:00'
        }]
      },
      '/api/admin-list-client-leads': {
        leads: [{
          id: 'lead-test',
          name: 'diego andres ramirez vera',
          serviceInterest: 'Declaración de renta',
          createdAt: '2026-05-01T09:00:00-05:00'
        }]
      }
    };
    return Promise.resolve({
      ok: true,
      json: async () => payloadByRoute[url] || {}
    });
  });

  render(<App />);

  expect(await screen.findByText(/Centro operativo/i)).toBeInTheDocument();
  expect(await screen.findByText(/Embudo de servicios/i)).toBeInTheDocument();
});
