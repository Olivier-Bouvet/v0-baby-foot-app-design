import { SignInForm } from "@/components/auth/sign-in-form"
import { Trophy } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">MyLegiFoot</h1>
          </div>
          <p className="text-gray-600">Tracker de baby-foot</p>
        </div>

        {/* Sign In Form */}
        <SignInForm />
      </div>
    </div>
  )
}
