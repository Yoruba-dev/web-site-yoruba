"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@/lib/account-context";

export default function AuthForms() {
  const { register, login, isLoggedIn, account, logout } = useAccount();
  const router = useRouter();
  // Redirect target after auth (e.g. back to /personalizar). Read from the URL without
  // useSearchParams so the page doesn't need a Suspense boundary.
  const [next] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("next") || "/my-account"
      : "/my-account",
  );

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");

  function onLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail) return;
    login(loginEmail);
    router.push(next);
  }
  function onRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regEmail) return;
    register(`${first} ${last}`.trim(), regEmail);
    router.push(next);
  }

  if (isLoggedIn) {
    return (
      <div className="col-12 text-center" style={{ padding: "30px 0" }}>
        <p style={{ marginBottom: 18 }}>
          Ya tienes sesión iniciada como <strong>{account?.name}</strong>.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="hiraola-login_btn" type="button" onClick={() => router.push(next)}>
            Continuar
          </button>
          <button className="hiraola-register_btn" type="button" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="col-sm-12 col-md-12 col-xs-12 col-lg-6">
        <form onSubmit={onLogin}>
          <div className="login-form">
            <h4 className="login-title">Iniciar sesión</h4>
            <div className="row">
              <div className="col-md-12 col-12">
                <label>Correo electrónico*</label>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="col-12 mb--20">
                <label>Contraseña</label>
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                />
              </div>
              <div className="col-md-8">
                <div className="check-box">
                  <input type="checkbox" id="remember_me" />
                  <label htmlFor="remember_me">Recordarme</label>
                </div>
              </div>
              <div className="col-md-12">
                <button className="hiraola-login_btn" type="submit">
                  Iniciar sesión
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      <div className="col-sm-12 col-md-12 col-lg-6 col-xs-12">
        <form onSubmit={onRegister}>
          <div className="login-form">
            <h4 className="login-title">Crear cuenta</h4>
            <div className="row">
              <div className="col-md-6 col-12 mb--20">
                <label>Nombre</label>
                <input type="text" placeholder="Nombre" value={first} onChange={(e) => setFirst(e.target.value)} />
              </div>
              <div className="col-md-6 col-12 mb--20">
                <label>Apellido</label>
                <input type="text" placeholder="Apellido" value={last} onChange={(e) => setLast(e.target.value)} />
              </div>
              <div className="col-md-12">
                <label>Correo electrónico*</label>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label>Contraseña</label>
                <input type="password" placeholder="Contraseña" value={regPass} onChange={(e) => setRegPass(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label>Confirmar contraseña</label>
                <input type="password" placeholder="Confirmar contraseña" />
              </div>
              <div className="col-12">
                <button className="hiraola-register_btn" type="submit">
                  Crear cuenta
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
