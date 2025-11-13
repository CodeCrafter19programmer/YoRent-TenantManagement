// Frontend-only mock of Supabase client. Returns predictable, fast-resolving values.
// This allows all pages to render without a backend. The mock is chainable and
// awaitable from any point in the chain by implementing a `then` method.

type SupabaseResult<T = any> = { data: T; error: null };

// Minimal query builder with chainable helpers used across pages
class MockQueryBuilder {
  private table: string;
  private _data: any[];
  constructor(table: string) {
    this.table = table;
    this._data = [];
  }
  // Chain methods return `this` to allow further chaining
  select() { return this; }
  insert() { return this; }
  update() { return this; }
  delete() { return this; }
  upsert() { return this; }
  order() { return this; }
  limit() { return this; }
  single() { return this; }
  maybeSingle() { return this; }
  eq() { return this; }
  // Make the builder awaitable
  then(resolve: (v: SupabaseResult) => void) {
    resolve({ data: Array.isArray(this._data) ? this._data : null, error: null });
  }
}

export const supabase: any = {
  from: (table: string) => new MockQueryBuilder(table),
  auth: {
    signInWithPassword: async () => ({ data: { user: { id: 'mock-user' }, session: {} }, error: null }),
    signUp: async () => ({ data: { user: { id: 'mock-user' } }, error: null }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
};
