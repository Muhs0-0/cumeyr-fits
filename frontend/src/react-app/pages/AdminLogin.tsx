import { useState } from "react";
import { useNavigate } from "react-router";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log("🔷 Login attempt with username:", username);

    const API_BASE = import.meta.env.VITE_API_BASE || "";

    try {
      console.log("🔷 Sending login request to:", `${API_BASE}/api/admin/login`);
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      console.log("🔷 Login response status:", res.status);
      const data = await res.json();
      console.log("🔷 Login response data:", data);

      if (data.success) {
        console.log("✅ Login successful!");
        // Use localStorage for persistence across page refresh
        localStorage.setItem("adminAuth", "true");
        localStorage.setItem("adminId", data.admin_id);
        localStorage.setItem("adminName", data.admin_name);
        console.log("✅ Auth saved to localStorage:", { admin_id: data.admin_id, admin_name: data.admin_name });
        navigate("/admin/dashboard");
      } else {
        console.log("❌ Login failed - invalid credentials");
        setError("Invalid credentials");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <Lock size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-gray-400">Qaf fits Administration</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">password</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">passkey</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>

            {error && (
              <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-white text-sm"
            >
              ← Back to Store
            </button>
          </div>
        </div>

        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <p className="text-gray-300 text-sm text-center">
            if you are not an admin, please do not attempt to log in. Unauthorized access is prohibited and may be subject to legal action.
          </p>
        </div>
      </div>
    </div>
  );
}
