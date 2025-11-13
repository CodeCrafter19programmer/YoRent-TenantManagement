import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockApi } from '@/lib/mockApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, Plus, Edit, DollarSign, TrendingUp, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TaxRecord {
  id: string;
  month: string;
  year: number;
  total_revenue: number;
  total_utilities: number;
  electricity: number;
  water: number;
  gas: number;
  maintenance: number;
  other_expenses: number;
  net_income: number;
  tax_rate: number;
  tax_amount: number;
  created_at: string;
  updated_at: string;
}

interface Property {
  id: string;
  name: string;
}

interface UtilityExpense {
  id: string;
  property_id: string;
  month: string;
  electricity: number;
  water: number;
  gas: number;
  maintenance: number;
  other: number;
  property: {
    name: string;
  };
}

const TaxAccountability = () => {
  const { userRole } = useAuth();
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [utilityExpenses, setUtilityExpenses] = useState<UtilityExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TaxRecord | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    month: '',
    year: new Date().getFullYear(),
    tax_rate: '25'
  });

  useEffect(() => {
    if (userRole === 'admin') {
      fetchTaxRecords();
      fetchProperties();
      fetchUtilityExpenses();
    }
  }, [userRole, selectedYear]);

  const fetchTaxRecords = async () => {
    // In frontend-only mode, we don't persist tax records. Leave the list as-is.
    setTaxRecords(prev => prev);
  };

  const createTaxRecordsTable = async () => {
    // No-op in mock mode
    setTaxRecords([]);
  };

  const fetchProperties = async () => {
    try {
      const data = await mockApi.getPropertiesLite();
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchUtilityExpenses = async () => {
    try {
      const data = await mockApi.getExpenses();
      setUtilityExpenses((data as any[]).map(e => ({
        id: e.id,
        property_id: e.property_id,
        month: new Date(e.expense_date).toLocaleString('en-US', { month: 'long' }),
        electricity: e.category === 'utilities' ? e.amount : 0,
        water: 0,
        gas: 0,
        maintenance: e.category === 'maintenance' ? e.amount : 0,
        other: e.category !== 'utilities' && e.category !== 'maintenance' ? e.amount : 0,
        property: { name: (e as any).properties?.name || 'N/A' },
      })) as any);
    } catch (error) {
      console.error('Error fetching utility expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyTaxRecord = async (month: string, year: number) => {
    // Approximate calculation from mock data
    const payments = await mockApi.getPayments();
    const expenses = await mockApi.getExpenses();
    const monthMatches = (d: string) => {
      const date = new Date(d);
      const m = date.toLocaleString('en-US', { month: 'long' });
      const y = date.getFullYear();
      return m === month && y === year;
    };

    const totalRevenue = (payments as any[])
      .filter(p => p.status === 'paid' && (typeof p.month === 'string' ? p.month.includes(month) : monthMatches(p.paid_date || p.due_date)))
      .reduce((sum, p) => sum + p.amount, 0);

    const utilitiesThisMonth = (expenses as any[]).filter(e => monthMatches(e.expense_date));
    const electricity = utilitiesThisMonth.filter(e => e.category === 'utilities').reduce((s, e) => s + e.amount, 0);
    const maintenance = utilitiesThisMonth.filter(e => e.category === 'maintenance').reduce((s, e) => s + e.amount, 0);
    const water = 0;
    const gas = 0;
    const otherExpenses = utilitiesThisMonth.filter(e => !['utilities', 'maintenance'].includes(e.category)).reduce((s, e) => s + e.amount, 0);
    const total_utilities = electricity + maintenance + water + gas + otherExpenses;

    const netIncome = totalRevenue - total_utilities;
    const taxRate = parseFloat(formData.tax_rate) / 100;
    const taxAmount = netIncome * taxRate;

    return {
      month,
      year,
      total_revenue: totalRevenue,
      total_utilities,
      electricity,
      water,
      gas,
      maintenance,
      other_expenses: otherExpenses,
      net_income: netIncome,
      tax_rate: taxRate * 100,
      tax_amount: taxAmount
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const calculatedData = await calculateMonthlyTaxRecord(formData.month, formData.year);
      
      // For demo purposes, we'll store this in a mock way since the table doesn't exist
      // In a real implementation, you would insert into the tax_records table
      
      const newRecord: TaxRecord = {
        id: Date.now().toString(),
        ...calculatedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingRecord) {
        setTaxRecords(prev => prev.map(record => 
          record.id === editingRecord.id ? { ...newRecord, id: editingRecord.id } : record
        ));
        toast.success('Tax record updated successfully');
      } else {
        setTaxRecords(prev => [newRecord, ...prev]);
        toast.success('Tax record created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving tax record:', error);
      toast.error('Failed to save tax record');
    }
  };

  const resetForm = () => {
    setFormData({
      month: '',
      year: new Date().getFullYear(),
      tax_rate: '25'
    });
    setEditingRecord(null);
  };

  const openEditDialog = (record: TaxRecord) => {
    setEditingRecord(record);
    setFormData({
      month: record.month,
      year: record.year,
      tax_rate: record.tax_rate.toString()
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getYearlyTotals = () => {
    const totalRevenue = taxRecords.reduce((sum, record) => sum + record.total_revenue, 0);
    const totalUtilities = taxRecords.reduce((sum, record) => sum + record.total_utilities, 0);
    const totalNetIncome = taxRecords.reduce((sum, record) => sum + record.net_income, 0);
    const totalTaxAmount = taxRecords.reduce((sum, record) => sum + record.tax_amount, 0);
    
    return { totalRevenue, totalUtilities, totalNetIncome, totalTaxAmount };
  };

  if (userRole !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Access denied. Admin privileges required.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const yearlyTotals = getYearlyTotals();

  return (
    <div className="space-y-6">
      {/* Year Selection */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Label htmlFor="year">Year:</Label>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${yearlyTotals.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Utilities</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${yearlyTotals.totalUtilities.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${yearlyTotals.totalNetIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tax Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${yearlyTotals.totalTaxAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Records Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Tax Accountability Records
              </CardTitle>
              <CardDescription>
                Track revenue, utilities, and tax calculations for {selectedYear}
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Calculate Monthly Tax
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingRecord ? 'Edit Tax Record' : 'Calculate Monthly Tax'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRecord ? 'Update tax calculation' : 'Generate tax calculation for a specific month'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="month">Month</Label>
                    <Select value={formData.month} onValueChange={(value) => setFormData({...formData, month: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.1"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({...formData, tax_rate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingRecord ? 'Update' : 'Calculate'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Utilities</TableHead>
                <TableHead>Net Income</TableHead>
                <TableHead>Tax Rate</TableHead>
                <TableHead>Tax Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.month} {record.year}</TableCell>
                  <TableCell>${record.total_revenue.toFixed(2)}</TableCell>
                  <TableCell>${record.total_utilities.toFixed(2)}</TableCell>
                  <TableCell className={record.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${record.net_income.toFixed(2)}
                  </TableCell>
                  <TableCell>{record.tax_rate}%</TableCell>
                  <TableCell>${record.tax_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(record)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {taxRecords.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No tax records found for {selectedYear}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Utilities Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Utilities Breakdown
          </CardTitle>
          <CardDescription>
            Detailed breakdown of utility expenses by property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Electricity</TableHead>
                <TableHead>Water</TableHead>
                <TableHead>Gas</TableHead>
                <TableHead>Maintenance</TableHead>
                <TableHead>Other</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {utilityExpenses.slice(0, 10).map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.property.name}</TableCell>
                  <TableCell>{expense.month}</TableCell>
                  <TableCell>${expense.electricity.toFixed(2)}</TableCell>
                  <TableCell>${expense.water.toFixed(2)}</TableCell>
                  <TableCell>${expense.gas.toFixed(2)}</TableCell>
                  <TableCell>${expense.maintenance.toFixed(2)}</TableCell>
                  <TableCell>${expense.other.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">
                    ${(expense.electricity + expense.water + expense.gas + expense.maintenance + expense.other).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {utilityExpenses.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No utility expenses found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxAccountability;
