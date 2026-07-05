import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import ReceiptPage from './pages/ReceiptPage';
import ReportPage from './pages/ReportPage';

const ProtectedRoute = ({ children, role }: {
  children: JSX.Element, role?: string
}) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/products" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/products" element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          } />
          <Route path="/receipt/:id" element={
            <ProtectedRoute>
              <ReceiptPage />
            </ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute role="ADMIN">
              <ReportPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;