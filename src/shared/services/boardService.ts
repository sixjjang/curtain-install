import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy, limit, Timestamp, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { BoardPost, BoardReply, BoardType, UserRole } from '../../types';

export class BoardService {
  // 게시글 목록 조회
  static async getPosts(boardType: BoardType, userId?: string): Promise<BoardPost[]> {
    try {
      console.log('🔍 BoardService - 게시글 목록 조회 시작:', boardType);
      const postsRef = collection(db, 'boardPosts');
      const q = query(
        postsRef,
        where('boardType', '==', boardType)
      );
      
      const querySnapshot = await getDocs(q);
      const posts: BoardPost[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          adminReplyAt: data.adminReplyAt?.toDate(),
          lastMessageAt: data.lastMessageAt?.toDate(),
        } as BoardPost);
      });
      
      // 클라이언트 측에서 정렬 (고정글 우선, 날짜순)
      posts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      console.log('🔍 BoardService - 게시글 목록 조회 완료:', posts.length, '개');
      return posts;
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error);
      // 에러가 발생해도 빈 배열 반환하여 UI가 깨지지 않도록 함
      return [];
    }
  }

  // 게시글 상세 조회
  static async getPost(postId: string): Promise<BoardPost | null> {
    try {
      const postRef = doc(db, 'boardPosts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const data = postDoc.data();
        return {
          id: postDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          adminReplyAt: data.adminReplyAt?.toDate(),
          lastMessageAt: data.lastMessageAt?.toDate(),
        } as BoardPost;
      }
      
      return null;
    } catch (error) {
      console.error('게시글 상세 조회 실패:', error);
      throw error;
    }
  }

  // 게시글 작성
  static async createPost(post: Omit<BoardPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'replyCount'>): Promise<string> {
    try {
      const postsRef = collection(db, 'boardPosts');
      const newPost = {
        ...post,
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
        replyCount: 0,
      };
      
      const docRef = await addDoc(postsRef, newPost);
      return docRef.id;
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      throw error;
    }
  }

  // 게시글 수정
  static async updatePost(postId: string, updates: Partial<BoardPost>): Promise<void> {
    try {
      const postRef = doc(db, 'boardPosts', postId);
      await updateDoc(postRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('게시글 수정 실패:', error);
      throw error;
    }
  }

  // 게시글 삭제
  static async deletePost(postId: string): Promise<void> {
    try {
      // 먼저 관련된 댓글들을 모두 삭제
      const repliesRef = collection(db, 'boardReplies');
      const q = query(repliesRef, where('postId', '==', postId));
      const repliesSnapshot = await getDocs(q);
      
      // 댓글들을 일괄 삭제
      const deletePromises = repliesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // 그 다음 게시글 삭제
      const postRef = doc(db, 'boardPosts', postId);
      await deleteDoc(postRef);
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      throw error;
    }
  }

  // 조회수 증가
  static async incrementViewCount(postId: string): Promise<void> {
    try {
      const postRef = doc(db, 'boardPosts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const currentViewCount = postDoc.data().viewCount || 0;
        await updateDoc(postRef, {
          viewCount: currentViewCount + 1,
        });
      }
    } catch (error) {
      console.error('조회수 증가 실패:', error);
      throw error;
    }
  }

  // 댓글 목록 조회
  static async getReplies(postId: string): Promise<BoardReply[]> {
    try {
      console.log('🔍 BoardService - 댓글 목록 조회 시작:', postId);
      const repliesRef = collection(db, 'boardReplies');
      const q = query(
        repliesRef,
        where('postId', '==', postId)
      );
      
      const querySnapshot = await getDocs(q);
      const replies: BoardReply[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        replies.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as BoardReply);
      });
      
      // 클라이언트 측에서 날짜순 정렬
      replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      console.log('🔍 BoardService - 댓글 목록 조회 완료:', replies.length, '개');
      return replies;
    } catch (error) {
      console.error('댓글 목록 조회 실패:', error);
      // 에러가 발생해도 빈 배열 반환
      return [];
    }
  }

  // 댓글 작성
  static async createReply(reply: Omit<BoardReply, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('🔍 BoardService - 댓글 작성 시작:', reply.postId, reply.content);
      const repliesRef = collection(db, 'boardReplies');
      const newReply = {
        ...reply,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(repliesRef, newReply);
      
      // 게시글의 댓글 수 증가 및 마지막 메시지 정보 업데이트
      const postRef = doc(db, 'boardPosts', reply.postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const currentReplyCount = postDoc.data().replyCount || 0;
        await updateDoc(postRef, {
          replyCount: currentReplyCount + 1,
          lastMessage: reply.content,
          lastMessageAt: new Date(),
          lastMessageBy: reply.authorId,
          updatedAt: new Date(),
        });
      }
      
      console.log('🔍 BoardService - 댓글 작성 완료:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      throw error;
    }
  }

  // 댓글 수정
  static async updateReply(replyId: string, content: string): Promise<void> {
    try {
      const replyRef = doc(db, 'boardReplies', replyId);
      await updateDoc(replyRef, {
        content,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      throw error;
    }
  }

  // 댓글 삭제
  static async deleteReply(replyId: string, postId: string): Promise<void> {
    try {
      const replyRef = doc(db, 'boardReplies', replyId);
      await deleteDoc(replyRef);
      
      // 게시글의 댓글 수 감소
      const postRef = doc(db, 'boardPosts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const currentReplyCount = postDoc.data().replyCount || 0;
        await updateDoc(postRef, {
          replyCount: Math.max(0, currentReplyCount - 1),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      throw error;
    }
  }

  // 관리자 답변 작성 (건의하기)
  static async createAdminReply(postId: string, reply: string, adminId: string, adminName: string): Promise<void> {
    try {
      const postRef = doc(db, 'boardPosts', postId);
      await updateDoc(postRef, {
        adminReply: reply,
        adminReplyAt: new Date(),
        adminReplyBy: adminId,
        status: 'completed',
        updatedAt: new Date(),
      });
      
      // 댓글로도 추가
      await this.createReply({
        postId,
        content: reply,
        authorId: adminId,
        authorName: adminName,
        authorRole: 'admin',
        isAdminReply: true,
      });
    } catch (error) {
      console.error('관리자 답변 작성 실패:', error);
      throw error;
    }
  }

  // 채팅방 생성 (관리자와 채팅)
  static async createChatRoom(userId: string, userName: string, userRole: UserRole): Promise<string> {
    try {
      const chatRoomId = `admin-chat-${userId}`;
      const postRef = doc(db, 'boardPosts', chatRoomId);
      
      // 채팅방이 이미 존재하는지 확인
      const existingDoc = await getDoc(postRef);
      
      if (!existingDoc.exists()) {
        // 직접 문서 생성 (createPost 대신)
        const newChatRoom = {
          title: '관리자와 채팅',
          content: '관리자와의 채팅방이 생성되었습니다.',
          authorId: userId,
          authorName: userName,
          authorRole: userRole,
          boardType: 'admin-chat' as const,
          category: 'admin-chat' as const,
          chatRoomId,
          lastMessage: '채팅방이 생성되었습니다.',
          lastMessageAt: new Date(),
          lastMessageBy: userId,
          unreadCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          viewCount: 0,
          replyCount: 0,
        };
        
        await setDoc(postRef, newChatRoom);
      }
      
      return chatRoomId;
    } catch (error) {
      console.error('채팅방 생성 실패:', error);
      throw error;
    }
  }

  // 실시간 게시글 업데이트 구독
  static subscribeToPosts(boardType: BoardType, callback: (posts: BoardPost[]) => void): () => void {
    const postsRef = collection(db, 'boardPosts');
    const q = query(
      postsRef,
      where('boardType', '==', boardType)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const posts: BoardPost[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          adminReplyAt: data.adminReplyAt?.toDate(),
          lastMessageAt: data.lastMessageAt?.toDate(),
        } as BoardPost);
      });
      
      // 클라이언트 측에서 정렬 (고정글 우선, 날짜순)
      posts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      callback(posts);
    }, (error) => {
      console.error('실시간 게시글 구독 오류:', error);
      // 에러가 발생해도 빈 배열로 콜백 호출
      callback([]);
    });
    
    return unsubscribe;
  }

  // 실시간 댓글 업데이트 구독
  static subscribeToReplies(postId: string, callback: (replies: BoardReply[]) => void): () => void {
    const repliesRef = collection(db, 'boardReplies');
    const q = query(
      repliesRef,
      where('postId', '==', postId)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const replies: BoardReply[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        replies.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as BoardReply);
      });
      
      // 클라이언트 측에서 날짜순 정렬
      replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      callback(replies);
    }, (error) => {
      console.error('실시간 댓글 구독 오류:', error);
      // 에러가 발생해도 빈 배열로 콜백 호출
      callback([]);
    });
    
    return unsubscribe;
  }
}
