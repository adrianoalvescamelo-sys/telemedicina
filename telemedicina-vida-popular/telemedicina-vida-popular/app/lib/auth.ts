// app/lib/auth.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET!

export interface JWTPayload {
  id: string
  nome: string
  crm: string
  email: string
  especialidade: string
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 12)
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash)
}

export function gerarToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' })
}

export function verificarToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getMedicoLogado(): Promise<JWTPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verificarToken(token)
}

// Middleware helper para API routes
export function autenticarRequisicao(req: Request): JWTPayload | null {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') ||
    req.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1]
  if (!token) return null
  return verificarToken(token)
}
