import ProtectedRoute from '../Admin/ProtectedRoute';

const AdminLayout = ({ children }) => {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
};

export default AdminLayout;
