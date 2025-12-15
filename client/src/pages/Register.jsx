import React, { useState } from "react";
import { api } from "../api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/auth/register", { name, email, password });
      setMsg("Registered! Now login.");
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "register failed");
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Register (Student)</h2>
      <input placeholder="name" value={name} onChange={e => setName(e.target.value)} />
      <br />
      <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
      <br />
      <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <br />
      <button>Register</button>
      <p>{msg}</p>
    </form>
  );
}