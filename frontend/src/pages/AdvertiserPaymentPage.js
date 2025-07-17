import dynamic from 'next/dynamic';

const AdvertiserPayment = dynamic(
  () => import('../components/AdvertiserPayment'),
  { ssr: false }
);

export default function AdvertiserPaymentPage() {
  // 클라이언트에서만 AdvertiserPayment가 렌더링됨
  return <AdvertiserPayment />;
} 