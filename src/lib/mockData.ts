// Mock data for frontend-only mode
export type ID = string;
export const newId = () => Math.random().toString(36).slice(2);

export interface MockProperty {
  id: ID;
  name: string;
  address: string;
  type: string;
  monthly_rent: number;
  status: 'vacant' | 'occupied';
  image_url: string | null;
  created_at: string;
  tenants?: Array<{ id: ID; full_name: string; email: string; status: string }>;
}

export interface MockTenant {
  id: ID;
  full_name: string;
  email: string;
  phone: string | null;
  monthly_rent: number;
  lease_start: string | null;
  lease_end: string | null;
  status: string;
  deposit: number | null;
  property: { id: ID; name: string; address: string } | null;
  user_id?: string;
}

export interface MockPayment {
  id: ID;
  tenant_id?: ID;
  amount: number;
  month: string;
  due_date: string;
  paid_date: string | null;
  status: 'paid' | 'pending' | 'overdue';
}

export const mockProperties: MockProperty[] = [
  {
    id: newId(),
    name: 'Apartment 101',
    address: '123 Main St, City',
    type: 'apartment',
    monthly_rent: 1200,
    status: 'occupied',
    image_url: null,
    created_at: new Date().toISOString(),
    tenants: [
      { id: 't1', full_name: 'John Doe', email: 'john@example.com', status: 'active' },
    ],
  },
  {
    id: newId(),
    name: 'Office Suite A',
    address: '55 Market Rd, City',
    type: 'commercial',
    monthly_rent: 2500,
    status: 'vacant',
    image_url: null,
    created_at: new Date().toISOString(),
  },
];

export const mockTenants: MockTenant[] = [
  {
    id: 't1',
    full_name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0101',
    monthly_rent: 1200,
    lease_start: '2024-01-01',
    lease_end: '2024-12-31',
    status: 'active',
    deposit: 500,
    property: { id: mockProperties[0].id, name: mockProperties[0].name, address: mockProperties[0].address },
    user_id: 'mock-user',
  },
  {
    id: 't2',
    full_name: 'Mary Smith',
    email: 'mary@example.com',
    phone: '555-0102',
    monthly_rent: 900,
    lease_start: null,
    lease_end: null,
    status: 'inactive',
    deposit: null,
    property: null,
  },
];

export interface MockPolicy {
  id: ID;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const mockPolicies: MockPolicy[] = [
  {
    id: newId(),
    title: 'Payment Terms',
    content: 'Rent is due on the 1st of every month. Late fees may apply after the 5th.',
    category: 'payment',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: newId(),
    title: 'Quiet Hours',
    content: 'Quiet hours are from 10 PM to 7 AM. Please respect your neighbors.',
    category: 'conduct',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockPayments: MockPayment[] = [
  { id: newId(), tenant_id: 't1', amount: 1200, month: '2025-10', due_date: '2025-10-01', paid_date: '2025-10-03', status: 'paid' },
  { id: newId(), tenant_id: 't1', amount: 1200, month: '2025-09', due_date: '2025-09-01', paid_date: '2025-09-02', status: 'paid' },
];
