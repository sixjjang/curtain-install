import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Firestore } from "firebase/firestore";

interface PaymentDetails {
  urgentFee: number;
  totalFee: number;
  platformFee: number;
  workerPayment: number;
  paidAt: Timestamp | null;
}

interface PaymentInfo {
  workOrderId: string;
  baseFee: number;
  urgentFeePercent: number;
  platformFeePercent: number;
  paymentStatus: string;
  paymentDetails: PaymentDetails;
}

export default function SellerPaymentList() {
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribeAuth = auth.onAuthStateChanged((user: any) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setPayments([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!db || !userId) return;

    try {
      // 판매자 ID가 userId인 시공건만 조회
      const q = query(
        collection(db as Firestore, "workOrders"),
        where("sellerId", "==", userId),
        orderBy("paymentDetails.paidAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data: PaymentInfo[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data() as any;
          data.push({
            workOrderId: doc.id,
            baseFee: d.baseFee || 0,
            urgentFeePercent: d.urgentFeePercent || 0,
            platformFeePercent: d.platformFeePercent || 0,
            paymentStatus: d.paymentStatus || "pending",
            paymentDetails: {
              urgentFee: d.paymentDetails?.urgentFee || 0,
              totalFee: d.paymentDetails?.totalFee || 0,
              platformFee: d.paymentDetails?.platformFee || 0,
              workerPayment: d.paymentDetails?.workerPayment || 0,
              paidAt: d.paymentDetails?.paidAt || null,
            },
          });
        });
        setPayments(data);
        setLoading(false);
        setError(null);
      }, (error: any) => {
        console.error("Error fetching payments:", error);
        setError("결제 내역을 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error: any) {
      console.error("Error setting up payment listener:", error);
      setError("결제 내역을 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }, [db, userId]);

  const formatDate = (timestamp: Timestamp | null): string => {
    if (!timestamp) return "-";
    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('ko-KR');
      }
      return new Date(timestamp.toDate()).toLocaleDateString('ko-KR');
    } catch (error) {
      return "-";
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "paid":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "paid":
        return "결제완료";
      case "pending":
        return "결제대기";
      case "failed":
        return "결제실패";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-4">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          로그인이 필요합니다.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4">
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">판매자 결제 내역</h1>
          <p className="text-gray-600 mt-1">총 {payments.length}건의 결제 내역</p>
        </div>
        
        {payments.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-500 text-lg">결제 내역이 없습니다.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업 ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기본 시공비
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    긴급 수수료
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    플랫폼 수수료
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 결제금액
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기사 지급액
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    결제 상태
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    결제일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((pay, index) => (
                  <tr key={pay.workOrderId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pay.workOrderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {pay.baseFee.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {pay.urgentFeePercent}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {pay.platformFeePercent}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                      {pay.paymentDetails.totalFee.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {pay.paymentDetails.workerPayment.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pay.paymentStatus)}`}>
                        {getStatusText(pay.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {formatDate(pay.paymentDetails.paidAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 