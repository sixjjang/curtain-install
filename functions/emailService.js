const admin = require('firebase-admin');
const db = admin.firestore();
const { 
  logSuccess, 
  logFailure, 
  logRetry, 
  logPending,
  NOTIFICATION_TYPES: LOG_TYPES,
  NOTIFICATION_CATEGORIES: LOG_CATEGORIES
} = require('./notificationLogger');

// SendGrid 설정 (선택사항)
let sgMail = null;
try {
  sgMail = require('@sendgrid/mail');
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
} catch (error) {
  console.log('SendGrid not configured, using console logging for emails');
}

// 이메일 템플릿
const EMAIL_TEMPLATES = {
  SETTLEMENT_COMPLETE: {
    subject: '월간 정산 완료 안내',
    template: (data) => ({
      subject: '월간 정산 완료 안내',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">정산 완료 안내</h2>
          <p>안녕하세요, ${data.advertiserName || '고객'}님</p>
          <p>${data.period} 월간 정산이 완료되었습니다.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>정산 내역</h3>
            <p><strong>정산 금액:</strong> ${data.amount?.toLocaleString()}원</p>
            <p><strong>정산 기간:</strong> ${data.period}</p>
            <p><strong>정산 ID:</strong> ${data.settlementId}</p>
          </div>
          <p>자세한 내역은 관리자 페이지에서 확인하실 수 있습니다.</p>
          <p>감사합니다.</p>
        </div>
      `
    })
  },
  
  AD_STATUS_CHANGE: {
    subject: '광고 상태 변경 안내',
    template: (data) => ({
      subject: '광고 상태 변경 안내',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">광고 상태 변경 안내</h2>
          <p>안녕하세요, ${data.advertiserName || '고객'}님</p>
          <p>등록하신 광고의 상태가 변경되었습니다.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>변경 내역</h3>
            <p><strong>광고 제목:</strong> ${data.adTitle}</p>
            <p><strong>이전 상태:</strong> ${data.oldStatus}</p>
            <p><strong>현재 상태:</strong> ${data.newStatus}</p>
            <p><strong>변경 일시:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>자세한 내용은 관리자 페이지에서 확인하실 수 있습니다.</p>
          <p>감사합니다.</p>
        </div>
      `
    })
  },
  
  PAYMENT_RECEIVED: {
    subject: '결제 완료 안내',
    template: (data) => ({
      subject: '결제 완료 안내',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">결제 완료 안내</h2>
          <p>안녕하세요, ${data.advertiserName || '고객'}님</p>
          <p>결제가 성공적으로 완료되었습니다.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>결제 내역</h3>
            <p><strong>결제 금액:</strong> ${data.amount?.toLocaleString()}원</p>
            <p><strong>결제 ID:</strong> ${data.paymentId}</p>
            <p><strong>결제 일시:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>감사합니다.</p>
        </div>
      `
    })
  },
  
  SYSTEM_ANNOUNCEMENT: {
    subject: '시스템 공지사항',
    template: (data) => ({
      subject: data.title || '시스템 공지사항',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">${data.title || '시스템 공지사항'}</h2>
          <p>안녕하세요, ${data.advertiserName || '고객'}님</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${data.content || data.body}
          </div>
          <p>감사합니다.</p>
        </div>
      `
    })
  }
};

// 이메일 발송 함수
const sendEmail = async (to, templateName, data = {}) => {
  try {
    // 대기 중 로그 저장
    await logPending(
      data.advertiserId || 'system',
      LOG_TYPES.EMAIL,
      data.category || LOG_CATEGORIES.SYSTEM,
      `이메일 발송 대기: ${templateName}`,
      { to, templateName, ...data }
    );

    const template = EMAIL_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`알 수 없는 이메일 템플릿: ${templateName}`);
    }

    const emailData = template.template(data);
    const emailContent = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@curtain-install.com',
      subject: emailData.subject,
      html: emailData.html
    };

    let result;

    if (sgMail && process.env.SENDGRID_API_KEY) {
      // SendGrid를 사용한 실제 이메일 발송
      result = await sgMail.send(emailContent);
      console.log('SendGrid 이메일 발송 성공:', result);
    } else {
      // 개발 환경에서는 콘솔에 출력
      console.log('=== 이메일 발송 (개발 모드) ===');
      console.log('To:', to);
      console.log('Subject:', emailContent.subject);
      console.log('Content:', emailContent.html);
      console.log('================================');
      result = { statusCode: 200, message: 'Development mode - email logged to console' };
    }

    // 성공 로그 저장
    await logSuccess(
      data.advertiserId || 'system',
      LOG_TYPES.EMAIL,
      data.category || LOG_CATEGORIES.SYSTEM,
      `이메일 발송 완료: ${templateName}`,
      {
        to,
        templateName,
        statusCode: result.statusCode,
        ...data
      }
    );

    return result;
  } catch (error) {
    console.error('이메일 발송 오류:', error);
    
    // 실패 로그 저장
    await logFailure(
      data.advertiserId || 'system',
      LOG_TYPES.EMAIL,
      data.category || LOG_CATEGORIES.SYSTEM,
      `이메일 발송 실패: ${templateName}`,
      error,
      { to, templateName, ...data }
    );

    throw error;
  }
};

// 사용자별 이메일 발송
const sendEmailToUser = async (advertiserId, templateName, data = {}) => {
  try {
    // 사용자 정보 조회
    const userDoc = await db.collection('advertisers').doc(advertiserId).get();
    
    if (!userDoc.exists) {
      throw new Error(`사용자를 찾을 수 없습니다: ${advertiserId}`);
    }
    
    const userData = userDoc.data();
    const email = userData.email;
    
    if (!email) {
      throw new Error(`사용자 이메일이 없습니다: ${advertiserId}`);
    }

    // 이메일 발송
    const result = await sendEmail(email, templateName, {
      ...data,
      advertiserId,
      advertiserName: userData.name || userData.companyName
    });

    return result;
  } catch (error) {
    console.error(`사용자 이메일 발송 실패 (${advertiserId}):`, error);
    throw error;
  }
};

// 배치 이메일 발송
const sendBatchEmails = async (emails) => {
  const results = {
    success: [],
    failed: []
  };

  for (const emailData of emails) {
    try {
      const { to, templateName, data } = emailData;
      const result = await sendEmail(to, templateName, data);
      results.success.push({ to, templateName, result });
    } catch (error) {
      results.failed.push({ 
        to: emailData.to, 
        templateName: emailData.templateName, 
        error: error.message 
      });
    }
  }

  return results;
};

// 모든 광고주에게 이메일 발송
const sendEmailToAllAdvertisers = async (templateName, data = {}) => {
  try {
    const advertisersSnapshot = await db.collection('advertisers').get();
    const emails = [];

    for (const doc of advertisersSnapshot.docs) {
      const advertiserData = doc.data();
      if (advertiserData.email) {
        emails.push({
          to: advertiserData.email,
          templateName,
          data: {
            ...data,
            advertiserId: doc.id,
            advertiserName: advertiserData.name || advertiserData.companyName
          }
        });
      }
    }

    return await sendBatchEmails(emails);
  } catch (error) {
    console.error('전체 광고주 이메일 발송 실패:', error);
    throw error;
  }
};

// 이메일 템플릿 추가
const addEmailTemplate = (name, template) => {
  EMAIL_TEMPLATES[name] = template;
};

// 이메일 발송 테스트
const testEmail = async (to, templateName = 'SYSTEM_ANNOUNCEMENT') => {
  const testData = {
    advertiserId: 'test_user',
    advertiserName: '테스트 사용자',
    title: '테스트 이메일',
    content: '<p>이것은 테스트 이메일입니다.</p>',
    category: LOG_CATEGORIES.SYSTEM
  };

  return await sendEmail(to, templateName, testData);
};

module.exports = {
  sendEmail,
  sendEmailToUser,
  sendBatchEmails,
  sendEmailToAllAdvertisers,
  addEmailTemplate,
  testEmail,
  EMAIL_TEMPLATES
}; 