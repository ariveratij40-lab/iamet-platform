import { useState } from 'react';
import { Link } from 'wouter';
export default function AdminPasswordReset() {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [done,setDone]=useState(false);
  async function submit(e:React.FormEvent) {
    e.preventDefault(); if(busy) return; setError('');setMessage('');
    if(token && password!==confirmation){setError('Las contraseñas no coinciden.');return;}
    setBusy(true);
    try {
      const response=await fetch(`/api/auth/admin-password/${token?'complete':'request'}`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(token?{token,password}:{email}),signal:AbortSignal.timeout(30000)
      });
      const result=await response.json();
      if(!response.ok) throw new Error(result.error || 'No se pudo procesar la solicitud.');
      if(token){setPassword('');setConfirmation('');setDone(true);window.history.replaceState(null,'',window.location.pathname);setMessage('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');}
      else setMessage(result.message);
    } catch(e){setError(e instanceof Error?e.message:'No se pudo procesar la solicitud.');}
    finally {setBusy(false);}
  }
  return <main className="min-h-screen bg-slate-950 px-5 py-24 text-white">
    <section className="mx-auto max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8">
      <h1 className="mb-3 text-2xl font-semibold">{token?'Nueva contraseña de administrador':'Recuperar acceso al CRM'}</h1>
      <p className="mb-6 text-slate-300">{token?'El enlace caduca en 20 minutos.':'Ingresa el correo de tu cuenta administradora.'}</p>
      {!done && <form onSubmit={submit} className="space-y-5">
        {token?<>
          <label className="block">Nueva contraseña<input className="mt-2 w-full rounded border border-slate-600 bg-slate-950 p-3" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)} /></label>
          <label className="block">Confirmar contraseña<input className="mt-2 w-full rounded border border-slate-600 bg-slate-950 p-3" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={confirmation} onChange={e=>setConfirmation(e.target.value)} /></label>
          <p className="text-sm text-slate-400">Al menos 12 caracteres. No compartas el enlace ni tu contraseña.</p>
        </>:<label className="block">Correo del administrador<input className="mt-2 w-full rounded border border-slate-600 bg-slate-950 p-3" type="email" autoComplete="email" required maxLength={320} value={email} onChange={e=>setEmail(e.target.value)} /></label>}
        <button disabled={busy} className="w-full rounded bg-blue-600 p-3 font-semibold disabled:opacity-50">{busy?'Procesando…':token?'Guardar contraseña':'Enviar enlace'}</button>
      </form>}
      {message && <p role="status" className="mt-5 text-green-300">{message}</p>}
      {error && <p role="alert" className="mt-5 text-red-300">{error}</p>}
      <Link href="/admin/login" className="mt-6 block underline">Volver al acceso</Link>
      {token && !done && <Link href="/admin/recuperar" className="mt-3 block underline" onClick={()=>window.location.assign('/admin/recuperar')}>Solicitar otro enlace</Link>}
    </section>
  </main>;
}
