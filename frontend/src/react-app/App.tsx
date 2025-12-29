import { BrowserRouter, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import AdminLoginPage from "@/react-app/pages/AdminLogin";
import AdminDashboardPage from "@/react-app/pages/AdminDashboard";

console.log("🔷 App.tsx loaded - Initializing routes");

export default function App() {
  console.log("🔷 App component rendering");
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
