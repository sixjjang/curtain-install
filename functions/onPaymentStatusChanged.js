const functions = require('firebase-functions');
const { 
  notifyPaymentStatusChange,
  PAYMENT_NOTIFICATION_TYPES 
} = require('./paymentNotificationService');

// 결제 상태 변경 시 알림 발송
exports.onPaymentStatusChanged = functions.firestore
  .document('payments/{paymentId}')
  .onUpdate(async (change, context) => {
    const paymentId = context.params.paymentId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    // 결제 상태가 변경되었는지 확인
    if (beforeData.status === afterData.status) {
      console.log('결제 상태가 변경되지 않았습니다.');
      return null;
    }

    console.log(`결제 상태 변경: ${beforeData.status} -> ${afterData.status}`);

    try {
      // 결제 정보 준비
      const paymentInfo = {
        paymentId: paymentId,
        workOrderId: afterData.workOrderId,
        amount: afterData.amount,
        currency: afterData.currency || 'KRW',
        status: afterData.status,
        sellerId: afterData.sellerId,
        workerId: afterData.workerId,
        paymentMethod: afterData.paymentMethod,
        timestamp: afterData.updatedAt || new Date()
      };

      // 결제 상태 변경 알림 발송
      await notifyPaymentStatusChange(
        afterData.workOrderId,
        afterData.status,
        paymentInfo
      );

      console.log(`결제 상태 변경 알림 발송 완료: ${paymentId}`);
      return { success: true, paymentId, status: afterData.status };

    } catch (error) {
      console.error('결제 상태 변경 알림 발송 실패:', error);
      
      // 오류 로그 저장 (선택사항)
      try {
        const { logFailure, NOTIFICATION_TYPES: LOG_TYPES, NOTIFICATION_CATEGORIES: LOG_CATEGORIES } = require('./notificationLogger');
        await logFailure(
          afterData.sellerId || 'system',
          LOG_TYPES.PUSH,
          LOG_CATEGORIES.PAYMENT,
          `결제 상태 변경 알림 발송 실패: ${paymentId}`,
          error,
          {
            paymentId,
            workOrderId: afterData.workOrderId,
            status: afterData.status,
            previousStatus: beforeData.status
          }
        );
      } catch (logError) {
        console.error('오류 로그 저장 실패:', logError);
      }

      throw error;
    }
  });

// 작업 주문 결제 상태 변경 시 알림 발송
exports.onWorkOrderPaymentStatusChanged = functions.firestore
  .document('workOrders/{workOrderId}')
  .onUpdate(async (change, context) => {
    const workOrderId = context.params.workOrderId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    // 결제 상태가 변경되었는지 확인
    if (beforeData.paymentStatus === afterData.paymentStatus) {
      console.log('작업 주문 결제 상태가 변경되지 않았습니다.');
      return null;
    }

    console.log(`작업 주문 결제 상태 변경: ${beforeData.paymentStatus} -> ${afterData.paymentStatus}`);

    try {
      // 결제 정보 준비
      const paymentInfo = {
        workOrderId: workOrderId,
        amount: afterData.paymentDetails?.totalFee || afterData.baseFee,
        currency: 'KRW',
        status: afterData.paymentStatus,
        sellerId: afterData.sellerId,
        workerId: afterData.workerId,
        urgentFee: afterData.paymentDetails?.urgentFee,
        platformFee: afterData.paymentDetails?.platformFee,
        workerPayment: afterData.paymentDetails?.workerPayment,
        timestamp: afterData.updatedAt || new Date()
      };

      // 결제 상태 변경 알림 발송
      await notifyPaymentStatusChange(
        workOrderId,
        afterData.paymentStatus,
        paymentInfo
      );

      console.log(`작업 주문 결제 상태 변경 알림 발송 완료: ${workOrderId}`);
      return { success: true, workOrderId, status: afterData.paymentStatus };

    } catch (error) {
      console.error('작업 주문 결제 상태 변경 알림 발송 실패:', error);
      throw error;
    }
  });

// 정산 완료 시 알림 발송 (예시)
exports.onSettlementCompleted = functions.firestore
  .document('settlements/{settlementId}')
  .onCreate(async (snap, context) => {
    const settlementId = context.params.settlementId;
    const settlementData = snap.data();

    console.log(`정산 완료: ${settlementId}`);

    try {
      const { sendSettlementNotification } = require('./paymentNotificationService');
      
      // 정산 정보 준비
      const settlementInfo = {
        settlementId: settlementId,
        period: settlementData.period,
        totalAmount: settlementData.totalAmount,
        workerCount: settlementData.workerCount,
        workOrderCount: settlementData.workOrderCount,
        timestamp: settlementData.createdAt || new Date()
      };

      // 관련 사용자들에게 정산 완료 알림 발송
      if (settlementData.userIds && Array.isArray(settlementData.userIds)) {
        const { sendPaymentNotificationToUsers, PAYMENT_NOTIFICATION_TYPES } = require('./paymentNotificationService');
        
        await sendPaymentNotificationToUsers(
          settlementData.userIds,
          settlementInfo,
          PAYMENT_NOTIFICATION_TYPES.SETTLEMENT_COMPLETE
        );
      }

      console.log(`정산 완료 알림 발송 완료: ${settlementId}`);
      return { success: true, settlementId };

    } catch (error) {
      console.error('정산 완료 알림 발송 실패:', error);
      throw error;
    }
  });

// 수동으로 결제 알림 발송하는 HTTP 함수
exports.sendPaymentNotification = functions.https.onCall(async (data, context) => {
  // 인증 확인
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
  }

  const { userId, paymentInfo, notificationType } = data;

  if (!userId || !paymentInfo) {
    throw new functions.https.HttpsError('invalid-argument', '필수 매개변수가 누락되었습니다.');
  }

  try {
    const { sendPaymentNotificationToUser, PAYMENT_NOTIFICATION_TYPES } = require('./paymentNotificationService');
    
    const result = await sendPaymentNotificationToUser(
      userId,
      paymentInfo,
      notificationType || PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE
    );

    return { success: true, messageId: result };
  } catch (error) {
    console.error('수동 결제 알림 발송 실패:', error);
    throw new functions.https.HttpsError('internal', '알림 발송에 실패했습니다.');
  }
}); 