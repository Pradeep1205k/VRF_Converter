import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md animate-float-in rounded-3xl bg-white/80 p-10 shadow-xl">
      <h1 className="font-display text-3xl">Welcome back</h1>
      <p className="mt-2 text-sm text-ink/70">Sign in to manage your video conversions.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border border-ink/20 p-3"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-ink/20 p-3"
        />
        {error && <p className="text-sm text-ember">{error}</p>}
        <button type="submit" className="w-full rounded-full bg-ember py-3 text-sm font-semibold text-white">
          Login
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        New here? <Link to="/register" className="font-semibold text-ember">Create an account</Link>
      </p>
    </div>
  );
};

export default Login;
