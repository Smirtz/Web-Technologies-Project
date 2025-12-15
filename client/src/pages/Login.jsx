import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../api";

export default function Login({ setMe }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    try {
      const r = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", r.data.token);
      setToken(r.data.token);
      setMe(r.data.user);
      nav("/");
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "login failed");
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Login</h2>
      <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
      <br />
      <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <br />
      <button>Login</button>
      <p>{msg}</p>
    </form>
  );
}