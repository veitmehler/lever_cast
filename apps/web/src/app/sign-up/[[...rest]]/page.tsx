import { SignUp } from '@clerk/nextjs'

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp initialValues={email ? { emailAddress: email } : undefined} />
    </div>
  )
}
