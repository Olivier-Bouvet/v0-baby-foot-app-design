"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import { resetPassword } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!email) {
      setError("Veuillez saisir votre adresse email")
      setLoading(false)
      return
    }

    try {
      const { error } = await resetPassword(email)

      if (error) {
        setError("Erreur lors de l'envoi de l'email de réinitialisation")
        return
      }

      setSuccess(true)
      toast({
        title: "Email envoyé",
        description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe",
        duration: 5000,
      })
    } catch (err) {
      console.error("Erreur de réinitialisation:", err)
      setError("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Email envoyé</CardTitle>
          <CardDescription className="text-center">
            Vérifiez votre boîte mail pour réinitialiser votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/auth/sign-in" className="w-full">
            <Button variant="outline" className="w-full bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Mot de passe oublié</CardTitle>
        <CardDescription className="text-center">
          Saisissez votre email pour recevoir un lien de réinitialisation
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              "Envoyer le lien"
            )}
          </Button>
          <Link href="/auth/sign-in" className="w-full">
            <Button variant="outline" className="w-full bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </Button>
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
