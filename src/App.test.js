import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

test('keeps certification records visible after closing a certification detail', async () => {
  window.history.pushState({}, '', '/admin/certificaciones');
  const certificationRecord = {
    reference: 'CONTARAE-TEST-CERT',
    consecutive: '1013',
    customerName: 'olga lucia vera castro',
    customerEmail: 'olga@example.com',
    destination: 'Bancolombia',
    certificationStatus: 'en_revision',
    paymentStatus: 'approved',
    supportFilesCount: 1,
    createdAt: '2026-05-01T08:00:00-05:00',
    updatedAt: '2026-05-01T09:00:00-05:00'
  };
  const certificationDetail = {
    summary: {
      reference: certificationRecord.reference,
      consecutive: certificationRecord.consecutive,
      certificationStatus: certificationRecord.certificationStatus,
      paymentStatus: certificationRecord.paymentStatus,
      customerName: certificationRecord.customerName,
      destination: certificationRecord.destination,
      period: '3 meses',
      totalIncome: '$ 1.400.000',
      fee: '$ 180.000',
      createdAt: certificationRecord.createdAt,
      approvedAt: certificationRecord.updatedAt
    },
    contact: {
      email: certificationRecord.customerEmail,
      rawPhone: '3138265050'
    },
    totals: {
      periodMonths: 3,
      monthlyRecurring: '$ 1.400.000',
      recurringPeriod: '$ 4.200.000'
    },
    formData: {},
    record: {},
    certificateData: {},
    incomes: [],
    supportFiles: []
  };

  global.fetch = jest.fn((input) => {
    const url = String(input);

    if (url.startsWith('/api/admin-get-certification')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          detail: certificationDetail,
          professionalConfig: null
        })
      });
    }

    const payloadByRoute = {
      '/api/admin-session': { configured: true, authenticated: true, username: 'Admincontarae' },
      '/api/admin-list-certifications': { records: [certificationRecord] },
      '/api/admin-list-service-requests': { records: [] },
      '/api/admin-list-service-payments': { payments: [] },
      '/api/admin-list-client-leads': { leads: [] }
    };

    return Promise.resolve({
      ok: true,
      json: async () => payloadByRoute[url] || {}
    });
  });

  render(<App />);

  const moduleSelect = await screen.findByLabelText(/Seleccionar módulo del panel/i);
  fireEvent.change(moduleSelect, { target: { value: 'certificaciones' } });

  const recordTitle = await screen.findByText(/Olga Lucia Vera Castro/i);
  fireEvent.click(recordTitle.closest('button'));

  expect(await screen.findByText(/DETALLE DE CERTIFICACIÓN/i)).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText(/Cerrar certificación/i));

  await waitFor(() => {
    expect(screen.queryByText(/DETALLE DE CERTIFICACIÓN/i)).not.toBeInTheDocument();
  });
  expect(await screen.findByText(/Olga Lucia Vera Castro/i)).toBeInTheDocument();
});
