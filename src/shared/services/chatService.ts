import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ChatMessage, ChatRoom, Customer } from '../../types';

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
      throw error;
    }
  }

  // 메시지 전송
  static async sendMessage(
    chatRoomId: string,
    jobId: string,
    senderId: string,
    senderType: 'contractor' | 'seller' | 'customer',
    senderName: string,
    content: string
  ): Promise<void> {
    try {
      const messagesRef = collection(db, 'messages');
      const newMessage = {
        chatRoomId,
        jobId,
        senderId,
        senderType,
        senderName,
        content,
        timestamp: serverTimestamp(),
        isRead: false
      };
      
      await addDoc(messagesRef, newMessage);
      
      // 채팅방 업데이트
      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      await updateDoc(chatRoomRef, {
        lastMessage: {
          content,
          timestamp: serverTimestamp(),
          senderName
        },
        updatedAt: serverTimestamp()
      });
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
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          isRead: data.isRead
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
        return {
          id: doc.id,
          jobId: data.jobId,
          senderId: data.senderId,
          senderType: data.senderType,
          senderName: data.senderName,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          isRead: data.isRead
        };
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
}
