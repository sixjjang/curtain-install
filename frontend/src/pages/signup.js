import dynamic from 'next/dynamic';
const SignupPage = dynamic(() => import('./SignupPage'), { ssr: false });
export default SignupPage; 