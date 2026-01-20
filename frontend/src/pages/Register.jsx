import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password.length > 72) {
      setError("Password must be 72 characters or fewer.");
      return;
    }
    try {
      await register(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed"));
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md animate-float-in rounded-3xl bg-white/80 p-10 shadow-xl">
      <h1 className="font-display text-3xl">Create your workspace</h1>
      <p className="mt-2 text-sm text-ink/70">Start converting videos in minutes.</p>
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
        <p className="text-xs text-ink/60">Password must be 8–72 characters.</p>
        {error && <p className="text-sm text-ember">{error}</p>}
        <button type="submit" className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-sand">
          Register
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        Already have an account? <Link to="/login" className="font-semibold text-ember">Login</Link>
      </p>
    </div>
  );
};

export default Register;
