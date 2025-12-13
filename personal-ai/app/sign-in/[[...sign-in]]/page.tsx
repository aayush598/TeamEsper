import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Interview Hub
          </h1>
          <p className="mt-2 text-gray-600">
            Sign in to access your tools
          </p>
        </div>

        <SignIn />
      </div>
    </div>
  );
}
