'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithEmail, signInWithGoogle } from '@/lib/supabase/auth'
import { Mail, Lock, Brain, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // Sign up
        const { error } = await signInWithEmail(email, password, true)
        if (error) throw error
        toast.success('Compte créé avec succès!')
      } else {
        // Sign in
        const { error } = await signInWithEmail(email, password, false)
        if (error) throw error
        toast.success('Connexion réussie!')
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast.error('Erreur lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign in error:', error)
      toast.error('Erreur lors de la connexion Google')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background/95 to-background">
      <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[480px] w-[480px] rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-25%] right-[-15%] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-amber-400/20 via-primary/5 to-transparent blur-3xl" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">


          {/* Auth Card */}
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 md:p-8 p-6 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-80" />
            <div className="relative space-y-6">
              <div className="space-y-2 text-left">
                <h2 className="text-xl font-semibold text-foreground">
                  {isSignUp ? 'Créer un compte' : 'Se connecter'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isSignUp
                    ? 'Inscrivez-vous pour sauvegarder votre progression.'
                    : 'Reprenez là ou vous étiez la dernière fois.'}
                </p>
              </div>
{/* 
              <div className="grid grid-cols-2 rounded-full border border-border/60 bg-background/50 p-1 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    !isSignUp
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  disabled={loading}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    isSignUp
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  disabled={loading}
                >
                  Inscription
                </button>
              </div> */}

              <form onSubmit={handleEmailAuth} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 rounded-xl border-border/60 bg-background/70 pl-10 focus:border-primary focus:bg-background transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 rounded-xl border-border/60 bg-background/70 pl-10 focus:border-primary focus:bg-background transition-all"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isSignUp ? 'Création...' : 'Connexion...'}
                    </>
                  ) : (
                    isSignUp ? 'Créer mon compte' : 'Se connecter'
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card/80 px-3 text-muted-foreground">Ou</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full h-12 rounded-xl gap-3 border-border/60 bg-background/70 hover:bg-background transition-all"
                disabled={loading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuer avec Google
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                {isSignUp ? (
                  <p>
                    Déjà un compte ?{' '}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="font-semibold text-primary transition hover:text-primary/80"
                      disabled={loading}
                    >
                      Se connecter
                    </button>
                  </p>
                ) : (
                  <p>
                    Pas encore de compte ?{' '}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="font-semibold text-primary transition hover:text-primary/80"
                      disabled={loading}
                    >
                      Créer un compte
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
