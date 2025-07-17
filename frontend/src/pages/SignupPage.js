import dynamic from 'next/dynamic';

const SignupForm = dynamic(
  () => import("../components/SignupForm"),
  { ssr: false }
);

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto mt-10">
      <SignupForm />
    </div>
  );
} 