import { redirect } from 'next/navigation'
import { getMedicoLogado } from '@/app/lib/auth'

export default async function Home() {
  const medico = await getMedicoLogado()
  if (medico) redirect('/dashboard')
  redirect('/login')
}
