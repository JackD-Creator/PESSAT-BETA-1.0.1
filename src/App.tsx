import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LivestockListPage } from './pages/livestock/LivestockListPage';
import { LivestockDetailPage } from './pages/livestock/LivestockDetailPage';
import { LivestockFormPage } from './pages/livestock/LivestockFormPage';
import { HerdGroupsPage } from './pages/livestock/HerdGroupsPage';
import { LocationsPage } from './pages/livestock/LocationsPage';
import { HealthPage } from './pages/health/HealthPage';
import { VaccinationPage } from './pages/health/VaccinationPage';
import { BreedingPage } from './pages/health/BreedingPage';
import { FeedInventoryPage } from './pages/feed/FeedInventoryPage';
import { NutritionRequirementsPage } from './pages/feed/NutritionRequirementsPage';
import { ProductionPage } from './pages/production/ProductionPage';
import { ProductSalesPage } from './pages/production/ProductSalesPage';
import { AnimalTransactionsPage } from './pages/production/AnimalTransactionsPage';
import { FinancePage } from './pages/finance/FinancePage';
import { FinanceReportsPage } from './pages/finance/FinanceReportsPage';
import { FinanceExpensesPage } from './pages/finance/FinanceExpensesPage';
import { StockAdjustmentsPage } from './pages/finance/StockAdjustmentsPage';
import { TasksPage } from './pages/tasks/TasksPage';
import { AlertsPage } from './pages/alerts/AlertsPage';
import { UsersPage } from './pages/users/UsersPage';
import { ProfilePage } from './pages/ProfilePage';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><span className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><span className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="livestock" element={<LivestockListPage />} />
        <Route path="livestock/new" element={<LivestockFormPage />} />
        <Route path="livestock/:id" element={<LivestockDetailPage />} />
        <Route path="livestock/:id/edit" element={<LivestockFormPage />} />
        <Route path="herd-groups" element={<HerdGroupsPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="health" element={<HealthPage />} />
        <Route path="vaccinations" element={<VaccinationPage />} />
        <Route path="breeding" element={<BreedingPage />} />
        <Route path="feed-inventory" element={<FeedInventoryPage />} />
        <Route path="feed-purchases" element={<FeedInventoryPage />} />
        <Route path="feed-formulas" element={<FeedInventoryPage />} />
        <Route path="medicine-inventory" element={<FeedInventoryPage />} />
        <Route path="production" element={<ProductionPage />} />
        <Route path="product-sales" element={<ProductSalesPage />} />
        <Route path="animal-transactions" element={<AnimalTransactionsPage />} />
        <Route path="finance/transactions" element={<ProtectedRoute roles={['owner', 'manager']}><FinancePage /></ProtectedRoute>} />
        <Route path="finance/reports" element={<ProtectedRoute roles={['owner', 'manager']}><FinanceReportsPage /></ProtectedRoute>} />
        <Route path="finance/expenses" element={<ProtectedRoute roles={['owner', 'manager']}><FinanceExpensesPage /></ProtectedRoute>} />
        <Route path="finance/adjustments" element={<ProtectedRoute roles={['owner', 'manager']}><StockAdjustmentsPage /></ProtectedRoute>} />
        <Route path="nutrition-requirements" element={<ProtectedRoute roles={['owner', 'manager']}><NutritionRequirementsPage /></ProtectedRoute>} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="users" element={<ProtectedRoute roles={['owner']}><UsersPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
