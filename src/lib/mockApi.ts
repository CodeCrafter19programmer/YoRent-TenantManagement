import { mockProperties, mockTenants, mockPayments, mockPolicies, newId, type MockProperty, type MockTenant, type MockPayment, type MockPolicy } from './mockData';

let properties: MockProperty[] = [...mockProperties];
let tenants: MockTenant[] = [...mockTenants];
const payments: MockPayment[] = [...mockPayments];
let policies: MockPolicy[] = [...mockPolicies];
type MockExpense = { id: string; property_id: string; category: string; description: string; amount: number; expense_date: string };
let expenses: MockExpense[] = [
  { id: newId(), property_id: properties[0]?.id || 'p1', category: 'utilities', description: 'Water bill', amount: 45, expense_date: new Date().toISOString().slice(0,10) },
];

const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

export const mockApi = {
  // Tenants
  async getTenants(): Promise<MockTenant[]> {
    await delay();
    return tenants.map(t => ({ ...t }));
  },
  async getPaymentsByTenantId(tenantId: string): Promise<MockPayment[]> {
    await delay();
    return payments.filter(p => p.tenant_id === tenantId).map(p => ({ ...p }));
  },
  async getPropertiesLite(): Promise<Array<{ id: string; name: string }>> {
    await delay();
    return properties.map(p => ({ id: p.id, name: p.name }));
  },
  async getActiveTenants(): Promise<MockTenant[]> {
    await delay();
    return tenants.filter(t => t.status === 'active').map(t => ({ ...t }));
  },
  async updateTenant(id: string, data: Partial<MockTenant>) {
    await delay();
    const idx = tenants.findIndex(t => t.id === id);
    if (idx >= 0) tenants[idx] = { ...tenants[idx], ...data };
    return { error: null };
  },
  async getTenantPayments(tenantId: string): Promise<MockPayment[]> {
    await delay();
    return payments.filter(p => p.tenant_id === tenantId && p.status === 'paid').map(p => ({ ...p }));
  },

  // Policies
  async getActivePolicies(): Promise<MockPolicy[]> {
    await delay();
    return policies.filter(p => p.is_active).map(p => ({ ...p }));
  },
  async getPolicies(): Promise<MockPolicy[]> {
    await delay();
    return policies.map(p => ({ ...p }));
  },
  async addPolicy(data: Omit<MockPolicy, 'id' | 'created_at' | 'updated_at'>) {
    await delay();
    const policy: MockPolicy = { id: newId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...data } as any;
    policies.unshift(policy);
    return { error: null };
  },
  async updatePolicy(id: string, data: Partial<MockPolicy>) {
    await delay();
    const idx = policies.findIndex(p => p.id === id);
    if (idx >= 0) policies[idx] = { ...policies[idx], ...data, updated_at: new Date().toISOString() };
    return { error: null };
  },
  async deletePolicy(id: string) {
    await delay();
    policies = policies.filter(p => p.id !== id);
    return { error: null };
  },

  // Tenants helper
  async getTenantByUserId(userId: string): Promise<MockTenant | null> {
    await delay();
    return tenants.find(t => t.user_id === userId) || null;
  },

  // Notifications - return empty for frontend-only
  async getNotifications(_userId: string): Promise<Array<{ id: string; title: string; message: string; type: string; read: boolean; created_at: string }>> {
    await delay();
    return [];
  },
  // Properties
  async getProperties(): Promise<(MockProperty & { tenants?: Array<{ id: string; full_name: string; email: string; status: string }> })[]> {
    await delay();
    return properties.map(p => ({
      ...p,
      tenants: tenants.filter(t => t.property?.id === p.id).map(t => ({ id: t.id, full_name: t.full_name, email: t.email, status: t.status }))
    }));
  },
  async addProperty(data: Omit<MockProperty, 'id' | 'created_at'>) {
    await delay();
    const prop: MockProperty = { id: newId(), created_at: new Date().toISOString(), tenants: [], ...data } as any;
    properties.unshift(prop);
    return { error: null };
  },
  async updateProperty(id: string, data: Partial<MockProperty>) {
    await delay();
    const idx = properties.findIndex(p => p.id === id);
    if (idx >= 0) properties[idx] = { ...properties[idx], ...data };
    return { error: null };
  },
  async deleteProperty(id: string) {
    await delay();
    properties = properties.filter(p => p.id !== id);
    tenants = tenants.map(t => (t.property?.id === id ? { ...t, property: null } : t));
    return { error: null };
  },
  async assignTenant(propertyId: string, tenantId: string) {
    await delay();
    const prop = properties.find(p => p.id === propertyId);
    const idx = tenants.findIndex(t => t.id === tenantId);
    if (prop && idx >= 0) {
      tenants[idx] = { ...tenants[idx], property: { id: prop.id, name: prop.name, address: prop.address } };
      // mark occupied
      const pIdx = properties.findIndex(p => p.id === propertyId);
      properties[pIdx] = { ...properties[pIdx], status: 'occupied' } as MockProperty;
    }
    return { error: null };
  },

  // Payments
  async getPayments(): Promise<Array<MockPayment & { tenant: { full_name: string; email: string }, property: { name: string } }>> {
    await delay();
    return payments.map(p => {
      const t = tenants.find(tt => tt.id === p.tenant_id);
      const propName = t?.property?.name || 'N/A';
      return { ...p, tenant: { full_name: t?.full_name || 'Unknown', email: t?.email || '' }, property: { name: propName } } as any;
    });
  },
  async createPayment(data: Omit<MockPayment, 'id'> & { property_id?: string }) {
    await delay();
    payments.unshift({ id: newId(), ...data });
    return { error: null };
  },
  async updatePayment(id: string, data: Partial<MockPayment>) {
    await delay();
    const idx = payments.findIndex(p => p.id === id);
    if (idx >= 0) payments[idx] = { ...payments[idx], ...data };
    return { error: null };
  },

  // Expenses
  async getExpenses(): Promise<Array<MockExpense & { properties: { name: string } }>> {
    await delay();
    return expenses.map(e => ({ ...e, properties: { name: properties.find(p => p.id === e.property_id)?.name || 'N/A' } }));
  },
  async addExpense(data: Omit<MockExpense, 'id'>) {
    await delay();
    expenses.unshift({ id: newId(), ...data });
    return { error: null };
  },
  async updateExpense(id: string, data: Partial<MockExpense>) {
    await delay();
    const idx = expenses.findIndex(e => e.id === id);
    if (idx >= 0) expenses[idx] = { ...expenses[idx], ...data };
    return { error: null };
  },
  async deleteExpense(id: string) {
    await delay();
    expenses = expenses.filter(e => e.id !== id);
    return { error: null };
  },

  // Notifications - no-op
  async createNotification(_userId: string, _title: string, _message: string, _type: string) {
    await delay();
    return { error: null };
  }
};
