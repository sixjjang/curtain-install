import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage, handleFirestoreError } from '../../firebase/config';
import { ChatMessage, ChatRoom, Customer } from '../../types';
import { NotificationService } from './notificationService';

export class ChatService {
  // 채팅방 생성 또는 가져오기
  static async getOrCreateChatRoom(jobId: string, participants: {
    id: string;
    type: 'contractor' | 'seller' | 'customer';
    name: string;
  }[]): Promise<string> {
    try {
      // 기존 채팅방 확인
      const chatRoomsRef = collection(db, 'chatRooms');
      const q = query(chatRoomsRef, where('jobId', '==', jobId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
      }
      
      // 새 채팅방 생성
      const newChatRoom = {
        jobId,
        participants,
        unreadCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(chatRoomsRef, newChatRoom);
      return docRef.id;
    } catch (error) {
      console.error('채팅방 생성/가져오기 실패:', error);
      const errorMessage = handleFirestoreError(error);
      throw new Error(`채팅방 생성/가져오기 실패: ${errorMessage}`);
    }
  }

  // 메시지 전송 (jobId 없이 직접 채팅)
  static async sendDirectMessage(
    chatRoomId: string,
    senderId: string,
    senderName: string,
    content: string,
    senderProfileImage?: string
  ): Promise<void> {
    try {
      const messagesRef = collection(db, 'messages');
      const newMessage = {
        chatRoomId,
        senderId,
        senderName,
        ...(senderProfileImage && { senderProfileImage }),
        content,
        timestamp: serverTimestamp(),
        isRead: false
      };
      
      await addDoc(messagesRef, newMessage);
      
      // 채팅방 업데이트 (존재하지 않으면 생성)
      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      try {
        const chatRoomDoc = await getDoc(chatRoomRef);
        if (chatRoomDoc.exists()) {
          // 채팅방이 존재하면 업데이트
          await updateDoc(chatRoomRef, {
            lastMessage: {
              content,
              timestamp: serverTimestamp(),
              senderName
            },
            updatedAt: serverTimestamp()
          });
        } else {
          // 채팅방이 존재하지 않으면 생성
          await setDoc(chatRoomRef, {
            participants: [
              { id: senderId, name: senderName }
            ],
            lastMessage: {
              content,
              timestamp: serverTimestamp(),
              senderName
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (chatRoomError) {
        console.warn('채팅방 업데이트/생성 실패:', chatRoomError);
        // 채팅방 오류는 메시지 전송을 막지 않음
      }
    } catch (error) {
      console.error('직접 메시지 전송 실패:', error);
      throw error;
    }
  }

  // 메시지 전송
  static async sendMessage(
    chatRoomId: string,
    jobId: string,
    senderId: string,
    senderType: 'contractor' | 'seller' | 'customer' | 'admin',
    senderName: string,
    content: string,
    senderProfileImage?: string
  ): Promise<void> {
    try {
      const messagesRef = collection(db, 'messages');
             const newMessage = {
         chatRoomId,
         jobId,
         senderId,
         senderType,
         senderName,
         ...(senderProfileImage && { senderProfileImage }),
         content,
         messageType: 'text',
         timestamp: serverTimestamp(),
         isRead: false
       };
      
      await addDoc(messagesRef, newMessage);
      
      // 채팅방 업데이트 (존재하지 않으면 생성)
      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      try {
        const chatRoomDoc = await getDoc(chatRoomRef);
        if (chatRoomDoc.exists()) {
          // 채팅방이 존재하면 업데이트
          await updateDoc(chatRoomRef, {
            lastMessage: {
              content,
              timestamp: serverTimestamp(),
              senderName
            },
            updatedAt: serverTimestamp()
          });
        } else {
          // 채팅방이 존재하지 않으면 생성
          await setDoc(chatRoomRef, {
            jobId,
            participants: [
              { id: senderId, name: senderName, type: senderType }
            ],
            lastMessage: {
              content,
              timestamp: serverTimestamp(),
              senderName
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (chatRoomError) {
        console.warn('채팅방 업데이트/생성 실패:', chatRoomError);
        // 채팅방 오류는 메시지 전송을 막지 않음
      }

      // 채팅방 참가자들에게 알림 전송 (본인 제외)
      try {
        const chatRoomDoc = await getDoc(chatRoomRef);
        if (chatRoomDoc.exists()) {
          const chatRoomData = chatRoomDoc.data();
          const participants = chatRoomData.participants || [];
          
          for (const participant of participants) {
            if (participant.id !== senderId) {
              await NotificationService.createChatNotification(
                jobId,
                senderId,
                senderName,
                content,
                participant.id
              );
            }
          }
        }
      } catch (notificationError) {
        console.warn('채팅 알림 전송 실패:', notificationError);
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      throw error;
    }
  }

  // 메시지 목록 가져오기
  static async getMessages(chatRoomId: string): Promise<ChatMessage[]> {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('chatRoomId', '==', chatRoomId)
        // orderBy('timestamp', 'asc') // 복합 인덱스 필요 - 임시 제거
      );
      
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          jobId: data.jobId,
          senderId: data.senderId,
          senderType: data.senderType,
          senderName: data.senderName,
          senderProfileImage: data.senderProfileImage,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          isRead: data.isRead,
          imageUrl: data.imageUrl,
          messageType: data.messageType || 'text'
        };
      });
      
      // 클라이언트에서 시간순 정렬
      return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('메시지 목록 가져오기 실패:', error);
      throw error;
    }
  }

  // 실시간 메시지 구독
  static subscribeToMessages(
    chatRoomId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatRoomId', '==', chatRoomId)
      // orderBy('timestamp', 'asc') // 복합 인덱스 필요 - 임시 제거
    );
    
         return onSnapshot(q, (querySnapshot) => {
       const messages = querySnapshot.docs.map(doc => {
         const data = doc.data();
         const message = {
           id: doc.id,
           jobId: data.jobId,
           senderId: data.senderId,
           senderType: data.senderType,
           senderName: data.senderName,
           senderProfileImage: data.senderProfileImage,
           content: data.content,
           timestamp: data.timestamp?.toDate() || new Date(),
           isRead: data.isRead,
           imageUrl: data.imageUrl,
           messageType: data.messageType || 'text'
         };
         
         // 이미지 메시지 디버깅 로그
         if (message.messageType === 'image') {
           console.log('🖼️ 이미지 메시지 수신:', {
             id: message.id,
             content: message.content,
             imageUrl: message.imageUrl,
             messageType: message.messageType
           });
         }
         
         return message;
       });
      
      // 클라이언트에서 시간순 정렬
      const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      callback(sortedMessages);
    });
  }

  // 사용자의 채팅방 목록 가져오기
  static async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const chatRoomsRef = collection(db, 'chatRooms');
      const q = query(
        chatRoomsRef,
        where('participants', 'array-contains', { id: userId })
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          jobId: data.jobId,
          participants: data.participants,
          lastMessage: data.lastMessage ? {
            id: '',
            jobId: data.jobId,
            senderId: '',
            senderType: 'contractor',
            senderName: data.lastMessage.senderName,
            content: data.lastMessage.content,
            timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
            isRead: false
          } : undefined,
          unreadCount: data.unreadCount || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error('채팅방 목록 가져오기 실패:', error);
      throw error;
    }
  }

  // 메시지 읽음 처리
  static async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { isRead: true });
    } catch (error) {
      console.error('메시지 읽음 처리 실패:', error);
      throw error;
    }
  }

  // 고객 정보 생성 (채팅용)
  static async createCustomerForChat(
    name: string,
    phone: string,
    email: string,
    jobId: string
  ): Promise<string> {
    try {
      const customersRef = collection(db, 'customers');
      const newCustomer = {
        name,
        phone,
        email,
        jobId,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(customersRef, newCustomer);
      return docRef.id;
    } catch (error) {
      console.error('고객 정보 생성 실패:', error);
      throw error;
    }
  }

  // 고객 정보 가져오기
  static async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      const customerRef = doc(db, 'customers', customerId);
      const customerDoc = await getDoc(customerRef);
      
      if (customerDoc.exists()) {
        const data = customerDoc.data();
        return {
          id: customerDoc.id,
          name: data?.name,
          phone: data?.phone,
          email: data?.email,
          jobId: data?.jobId
        };
      }
      return null;
    } catch (error) {
      console.error('고객 정보 가져오기 실패:', error);
      throw error;
    }
  }

  // 작업 ID로 고객 정보 가져오기
  static async getCustomerByJobId(jobId: string): Promise<Customer | null> {
    try {
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, where('jobId', '==', jobId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        return {
          id: querySnapshot.docs[0].id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          jobId: data.jobId
        };
      }
      return null;
    } catch (error) {
      console.error('작업 ID로 고객 정보 가져오기 실패:', error);
      throw error;
    }
  }

  // 만족도 조사 링크 생성
  static generateSatisfactionSurveyLink(jobId: string, contractorId: string): string {
    // Firebase 호스팅 URL 사용 (프로덕션 환경)
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    if (isProduction) {
      // Firebase 호스팅 URL (실제 배포된 도메인)
      return `https://curtain-install.web.app/customer/survey?jobId=${jobId}&contractorId=${contractorId}`;
    } else {
      // 개발 환경에서는 현재 도메인 사용
      const baseUrl = window.location.origin;
      return `${baseUrl}/customer/survey?jobId=${jobId}&contractorId=${contractorId}`;
    }
  }

  // 자동 메시지 전송 (시스템 메시지)
  static async sendAutoMessage(
    jobId: string,
    senderId: string,
    senderType: 'contractor' | 'seller' | 'admin',
    senderName: string,
    messageType: 'product_preparing' | 'product_ready' | 'pickup_completed' | 'in_progress' | 'completed' | 'admin_completed',
    senderProfileImage?: string,
    jobData?: any
  ): Promise<void> {
    try {
      // 메시지 템플릿 정의
      let content = '';
      
      switch (messageType) {
        case 'product_preparing':
          content = "안녕하세요! 곧 제품이 준비 될 예정입니다. 준비가 완료되면 다시 안내해드릴게요";
          break;
        case 'product_ready':
          content = "제품 준비가 완료되었습니다. 시공 일정에 맞춰 픽업 부탁드립니다.";
          break;
        case 'pickup_completed':
          content = "제품 픽업을 완료하였습니다. 시공지로 이동하겠습니다.";
          break;
        case 'in_progress':
          content = "시공지에 도착하였고, 깔끔하게 시공을 진행하겠습니다.";
          break;
        case 'completed':
          content = "시공이 완료되었습니다.";
          break;
        case 'admin_completed':
          // 만족도 조사 링크 생성
          const surveyLink = jobData?.contractorId 
            ? this.generateSatisfactionSurveyLink(jobId, jobData.contractorId)
            : `${window.location.origin}/customer/survey?jobId=${jobId}`;
          
          content = `만족도 조사 링크를 고객분께 보내 드려주세요~ 만족도 조사는 시공자의 시공품질 및 서비스를 높이는데 도움이 됩니다.

📋 만족도 조사 링크:
${surveyLink}

위 링크를 복사하여 고객님께 문자나 카카오톡으로 전달해주세요.`;
          break;
        default:
          throw new Error('알 수 없는 메시지 타입입니다.');
      }

      // 메시지 전송
      await this.sendMessage(
        jobId,
        jobId,
        senderId,
        senderType,
        senderName,
        content,
        senderProfileImage
      );

      console.log(`자동 메시지 전송 완료: ${messageType} - ${jobId}`);
    } catch (error) {
      console.error('자동 메시지 전송 실패:', error);
      throw error;
    }
  }

  // 작업 상태 변경에 따른 자동 메시지 전송
  static async sendStatusChangeAutoMessage(
    jobId: string,
    newStatus: string,
    jobData: any
  ): Promise<void> {
    try {
      // 상태별 자동 메시지 설정
      const statusMessages = {
        product_preparing: {
          senderId: jobData.sellerId,
          senderType: 'seller' as const,
          senderName: '판매자',
          messageType: 'product_preparing' as const
        },
        product_ready: {
          senderId: jobData.sellerId,
          senderType: 'seller' as const,
          senderName: '판매자',
          messageType: 'product_ready' as const
        },
        pickup_completed: {
          senderId: jobData.contractorId,
          senderType: 'contractor' as const,
          senderName: '시공자',
          messageType: 'pickup_completed' as const
        },
        in_progress: {
          senderId: jobData.contractorId,
          senderType: 'contractor' as const,
          senderName: '시공자',
          messageType: 'in_progress' as const
        },
        completed: {
          senderId: jobData.contractorId,
          senderType: 'contractor' as const,
          senderName: '시공자',
          messageType: 'completed' as const
        }
      };

      const messageConfig = statusMessages[newStatus as keyof typeof statusMessages];
      if (messageConfig) {
        await this.sendAutoMessage(
          jobId,
          messageConfig.senderId,
          messageConfig.senderType,
          messageConfig.senderName,
          messageConfig.messageType,
          '' // senderProfileImage - 자동 메시지는 프로필 이미지가 없으므로 빈 문자열 전달
        );
      }

      // 시공 완료 시 관리자 메시지도 전송
      if (newStatus === 'completed') {
        // 관리자 ID는 시스템에서 가져오거나 기본값 사용
        const adminId = 'admin-system';
        await this.sendAutoMessage(
          jobId,
          adminId,
          'admin',
          '관리자',
          'admin_completed',
          '', // senderProfileImage
          jobData // jobData 전달하여 만족도 조사 링크 생성
        );
      }
    } catch (error) {
      console.error('상태 변경 자동 메시지 전송 실패:', error);
      // 자동 메시지 실패는 작업 상태 변경을 막지 않도록 에러를 던지지 않음
    }
  }

  // 이미지 업로드 및 메시지 전송
  static async sendImageMessage(
    chatRoomId: string,
    jobId: string,
    senderId: string,
    senderType: 'contractor' | 'seller' | 'customer' | 'admin',
    senderName: string,
    imageFile: File,
    senderProfileImage?: string
  ): Promise<void> {
    try {
      // 이미지 파일 검증
      if (!imageFile.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.');
      }

      // 파일 크기 제한 (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        throw new Error('이미지 파일 크기는 5MB 이하여야 합니다.');
      }

      // Firebase Storage에 이미지 업로드
      const timestamp = Date.now();
      const fileName = `chat-images/${chatRoomId}/${timestamp}_${imageFile.name}`;
      const storageRef = ref(storage, fileName);
      
      console.log('📤 이미지 업로드 시작:', fileName);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      console.log('✅ 이미지 업로드 완료:', uploadResult.ref.fullPath);
      
      const imageUrl = await getDownloadURL(uploadResult.ref);
      console.log('🔗 이미지 URL 생성:', imageUrl);

      // 메시지에 이미지 URL 포함하여 전송
      const messagesRef = collection(db, 'messages');
      const newMessage = {
        chatRoomId,
        jobId,
        senderId,
        senderType,
        senderName,
        ...(senderProfileImage && { senderProfileImage }),
        content: `[이미지] ${imageFile.name}`,
        imageUrl,
        messageType: 'image',
        timestamp: serverTimestamp(),
        isRead: false
      };
      
      console.log('💬 이미지 메시지 생성:', {
        chatRoomId,
        jobId,
        senderId,
        content: newMessage.content,
        imageUrl: newMessage.imageUrl,
        messageType: newMessage.messageType
      });
      
      await addDoc(messagesRef, newMessage);
      
      // 채팅방 업데이트
      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      try {
        const chatRoomDoc = await getDoc(chatRoomRef);
        if (chatRoomDoc.exists()) {
          await updateDoc(chatRoomRef, {
            lastMessage: {
              content: `[이미지] ${imageFile.name}`,
              timestamp: serverTimestamp(),
              senderName
            },
            updatedAt: serverTimestamp()
          });
        }
      } catch (chatRoomError) {
        console.warn('채팅방 업데이트 실패:', chatRoomError);
      }

      // 알림 전송
      try {
        const chatRoomDoc = await getDoc(chatRoomRef);
        if (chatRoomDoc.exists()) {
          const chatRoomData = chatRoomDoc.data();
          const participants = chatRoomData.participants || [];
          
          for (const participant of participants) {
            if (participant.id !== senderId) {
              await NotificationService.createChatNotification(
                jobId,
                senderId,
                senderName,
                `[이미지] ${imageFile.name}`,
                participant.id
              );
            }
          }
        }
      } catch (notificationError) {
        console.warn('채팅 알림 전송 실패:', notificationError);
      }

      console.log('이미지 메시지 전송 완료:', imageUrl);
    } catch (error) {
      console.error('이미지 메시지 전송 실패:', error);
      throw error;
    }
  }

  // 이미지 삭제
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      console.log('이미지 삭제 완료:', imageUrl);
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      throw error;
    }
  }

  // 일정 재조정 메시지 전송
  static async sendRescheduleMessage(
    jobId: string,
    newScheduledDate: Date,
    rescheduleType: 'product_not_ready' | 'customer_absent' | 'unknown'
  ): Promise<void> {
    try {
      // 작업 정보 조회
      const { JobService } = await import('./jobService');
      const job = await JobService.getJobById(jobId);
      if (!job) {
        throw new Error('작업을 찾을 수 없습니다.');
      }

      // 메시지 내용 생성
      const dateStr = newScheduledDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      const timeStr = newScheduledDate.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      let messageContent = '';
      if (rescheduleType === 'product_not_ready') {
        messageContent = `📅 제품 미준비로 인한 일정 재조정이 완료되었습니다.\n\n새로운 시공일시: ${dateStr} ${timeStr}\n\n시공자님께서는 새로운 일정에 맞춰 시공을 진행해주시기 바랍니다.`;
      } else if (rescheduleType === 'customer_absent') {
        messageContent = `📅 소비자 부재로 인한 일정 재조정이 완료되었습니다.\n\n새로운 시공일시: ${dateStr} ${timeStr}\n\n시공자님께서는 새로운 일정에 맞춰 시공을 진행해주시기 바랍니다.`;
      } else {
        messageContent = `📅 일정 재조정이 완료되었습니다.\n\n새로운 시공일시: ${dateStr} ${timeStr}\n\n시공자님께서는 새로운 일정에 맞춰 시공을 진행해주시기 바랍니다.`;
      }

      // 판매자 메시지 전송
      await this.sendMessage(
        jobId,
        jobId,
        job.sellerId,
        'seller',
        job.sellerName || '판매자',
        messageContent,
        ''
      );

      console.log(`✅ 일정 재조정 메시지 전송 완료: ${jobId}`);
    } catch (error) {
      console.error('일정 재조정 메시지 전송 실패:', error);
      throw error;
    }
  }
}
