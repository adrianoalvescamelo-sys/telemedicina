import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Stethoscope, Lock, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { CLINICA } from '@/lib/constants'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})
const mfaSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
})

type LoginForm = z.infer<typeof loginSchema>
type MfaForm = z.infer<typeof mfaSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, setMfaPending, mfaPending, tempUserId } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const mfaForm = useForm<MfaForm>({ resolver: zodResolver(mfaSchema) })

  const redirectByRole = (role: string) => {
    const routes: Record<string, string> = {
      admin: '/admin',
      medico: '/medico',
      recepcionista: '/agenda',
      paciente: '/portal',
    }
    navigate(routes[role] ?? '/admin', { replace: true })
  }

  async function onLogin(data: LoginForm) {
    setError('')
    try {
      const res = await api.post('/auth/login', data)
      if (res.data.mfaRequired) {
        setMfaPending(res.data.userId)
      } else {
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
        redirectByRole(res.data.user.role)
      }
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Credenciais inválidas')
    }
  }

  async function onMfa(data: MfaForm) {
    setError('')
    try {
      const res = await api.post('/auth/mfa/verify', { userId: tempUserId, code: data.code })
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      redirectByRole(res.data.user.role)
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Código inválido')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel – branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-primary-700 text-white p-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
          <span className="font-bold text-lg">{CLINICA.nome}</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Saúde de qualidade,<br />gestão inteligente.
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Sistema exclusivo de gestão clínica com prontuário eletrônico,
            agenda integrada e inteligência artificial para apoio ao diagnóstico.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { icon: '🩺', text: 'Prontuário eletrônico completo' },
            { icon: '📅', text: 'Agenda visual com drag & drop' },
            { icon: '🤖', text: 'Agente IA clínico integrado' },
            { icon: '📲', text: 'Confirmações automáticas via WhatsApp' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 text-sm text-white/80">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
          <p className="text-xs text-white/40 pt-4">
            {CLINICA.cnpj} · CRM {CLINICA.crm}
          </p>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Stethoscope className="w-6 h-6 text-primary-500" />
            <span className="font-bold text-primary-700">{CLINICA.nome}</span>
          </div>

          {!mfaPending ? (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-text">Entrar no sistema</h1>
                <p className="text-muted text-sm mt-1">Use suas credenciais de acesso</p>
              </div>

              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register('email')}
                />
                <Input
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={loginForm.formState.errors.senha?.message}
                  {...loginForm.register('senha')}
                />
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                    {error}
                  </div>
                )}
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    loading={loginForm.formState.isSubmitting}
                  >
                    Entrar
                  </Button>
                  
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-surface px-2 text-muted">Ou teste agora</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-primary-200 text-primary-700 hover:bg-primary-50"
                    onClick={() => {
                      setAuth(
                        { id: '1', nome: 'Dra. Ucirlana Martins', email: 'demo@clinicavida.com', role: 'admin', mfaAtivo: false },
                        'mock-token',
                        'mock-refresh'
                      )
                      navigate('/admin')
                    }}
                  >
                    🚀 Acesso Rápido (DEMO)
                  </Button>
                </form>
            </>
          ) : (
            <>
              <div className="mb-7 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-primary-500" />
                </div>
                <h1 className="text-2xl font-bold text-text">Verificação em 2 etapas</h1>
                <p className="text-muted text-sm mt-1">
                  Digite o código do seu aplicativo autenticador
                </p>
              </div>

              <form onSubmit={mfaForm.handleSubmit(onMfa)} className="space-y-4">
                <Input
                  label="Código de 6 dígitos"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  error={mfaForm.formState.errors.code?.message}
                  {...mfaForm.register('code')}
                />
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={mfaForm.formState.isSubmitting}
                >
                  Verificar
                </Button>
                <button
                  type="button"
                  onClick={() => useAuthStore.getState().logout()}
                  className="w-full text-sm text-muted hover:text-text transition-colors"
                >
                  Voltar ao login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
