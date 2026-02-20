import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/auth/PrivateRoute";
import OrganizationDashboard from "./pages/OrganizationDashboard";
import DashboardHome from "./pages/DashboardHome";
import Login from "./pages/Login";
import JoinOrganization from "./pages/JoinOrganization";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardHome />
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard/org/:orgId"
          element={
            <PrivateRoute>
              <OrganizationDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/join"
          element={
            <PrivateRoute>
              <JoinOrganization />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
