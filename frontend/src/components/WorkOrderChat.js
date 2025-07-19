import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getChannelByWorkOrder, 
  sendMessage, 
  setAppointmentTime,
  COMMUNICATION_TYPES 
} from '../utils/communicationSystem';

export default function WorkOrderChat({ workOrderId, userType = 'worker' }) {
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentLocation, setAppointmentLocation] = useState('');
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadChannel();
  }, [workOrderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChannel = async () => {
    try {
      setLoading(true);
      const channelData = await getChannelByWorkOrder(workOrderId);
      
      if (channelData) {
        setChannel(channelData);
        setMessages(channelData.messages || []);
      } else {
        // 채널이 없으면 새로 생성
        console.log('채널이 없습니다. 새로 생성해야 합니다.');
      }
    } catch (error) {
      console.error('채널 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !channel) return;

    try {
      setSending(true);
      
      const messageData = {
        senderId: userType === 'worker' ? channel.workerId : channel.customerId,
        senderType: userType,
        message: newMessage.trim(),
        messageType: 'text'
      };

      await sendMessage(channel.id, messageData);
      setNewMessage('');
      
      // 메시지 목록 새로고침
      await loadChannel();
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !channel) return;

    try {
      setSending(true);
      
      // 파일 업로드 로직 (실제 구현에서는 Firebase Storage 사용)
      const messageData = {
        senderId: userType === 'worker' ? channel.workerId : channel.customerId,
        senderType: userType,
        message: `파일: ${file.name}`,
        messageType: 'file',
        attachments: [{ name: file.name, size: file.size, type: file.type }]
      };

      await sendMessage(channel.id, messageData);
      
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      await loadChannel();
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleSetAppointment = async () => {
    if (!appointmentTime || !channel) return;

    try {
      setSending(true);
      
      const scheduledTime = new Date(appointmentTime);
      await setAppointmentTime(channel.id, scheduledTime, appointmentLocation);
      
      setShowAppointmentModal(false);
      setAppointmentTime('');
      setAppointmentLocation('');
      
      await loadChannel();
    } catch (error) {
      console.error('약속 시간 설정 실패:', error);
      alert('약속 시간 설정에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStyle = (message) => {
    const isOwnMessage = message.senderType === userType;
    
    return {
      backgroundColor: isOwnMessage ? '#3B82F6' : '#F3F4F6',
      color: isOwnMessage ? 'white' : '#374151',
      alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
      maxWidth: '70%',
      padding: '8px 12px',
      borderRadius: '12px',
      marginBottom: '8px',
      wordBreak: 'break-word'
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-500 mb-4">💬</div>
        <p className="text-gray-600">채팅 채널이 아직 생성되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white border rounded-lg">
      {/* 채팅 헤더 */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-900">작업 소통방</h3>
          <p className="text-sm text-gray-600">작업 주문: {workOrderId}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAppointmentModal(true)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            📅 약속 설정
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💬</div>
            <p>첫 메시지를 보내보세요!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={message.id || index} className="flex flex-col">
              <div style={getMessageStyle(message)}>
                {message.messageType === 'appointment' ? (
                  <div className="text-center">
                    <div className="font-semibold">📅 {message.message}</div>
                  </div>
                ) : (
                  <div>{message.message}</div>
                )}
                <div className="text-xs opacity-70 mt-1">
                  {formatMessageTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 영역 */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={sending}
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx"
          />
          
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
              disabled={sending}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? '전송 중...' : '전송'}
          </button>
        </div>
      </div>

      {/* 약속 설정 모달 */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">약속 시간 설정</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  약속 시간
                </label>
                <input
                  type="datetime-local"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  약속 장소 (선택사항)
                </label>
                <input
                  type="text"
                  value={appointmentLocation}
                  onChange={(e) => setAppointmentLocation(e.target.value)}
                  placeholder="예: 1층 로비"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSetAppointment}
                disabled={!appointmentTime || sending}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {sending ? '설정 중...' : '설정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 