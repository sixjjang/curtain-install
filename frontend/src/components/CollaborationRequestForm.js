import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createCollaborationRequest } from '../utils/collaborationManager';

export default function CollaborationRequestForm({ workOrder, onSuccess, onCancel }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workOrder) {
      // 기본 업무 분배 (전체 금액을 1개 업무로 설정)
      setTasks([{
        id: 'task-1',
        title: '전체 시공',
        description: '커튼 설치 전체 작업',
        amount: workOrder.totalAmount,
        requiredSkills: ['커튼 설치', '전동 시스템'],
        estimatedHours: 4
      }]);
    }
  }, [workOrder]);

  const addTask = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: '',
      description: '',
      amount: 0,
      requiredSkills: [],
      estimatedHours: 2
    };
    setTasks([...tasks, newTask]);
  };

  const removeTask = (taskId) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const updateTask = (taskId, field, value) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ));
  };

  const addSkill = (taskId, skill) => {
    if (skill.trim()) {
      updateTask(taskId, 'requiredSkills', [
        ...tasks.find(t => t.id === taskId).requiredSkills,
        skill.trim()
      ]);
    }
  };

  const removeSkill = (taskId, skillIndex) => {
    const task = tasks.find(t => t.id === taskId);
    const updatedSkills = task.requiredSkills.filter((_, index) => index !== skillIndex);
    updateTask(taskId, 'requiredSkills', updatedSkills);
  };

  const getTotalAmount = () => {
    return tasks.reduce((sum, task) => sum + (parseInt(task.amount) || 0), 0);
  };

  const getRemainingAmount = () => {
    const total = workOrder?.totalAmount || 0;
    const assigned = getTotalAmount();
    return total - assigned;
  };

  const validateForm = () => {
    if (tasks.length === 0) {
      setError('최소 1개의 업무를 등록해야 합니다.');
      return false;
    }

    for (const task of tasks) {
      if (!task.title.trim()) {
        setError('모든 업무의 제목을 입력해주세요.');
        return false;
      }
      if (!task.description.trim()) {
        setError('모든 업무의 설명을 입력해주세요.');
        return false;
      }
      if (!task.amount || task.amount <= 0) {
        setError('모든 업무의 금액을 입력해주세요.');
        return false;
      }
    }

    const remaining = getRemainingAmount();
    if (remaining !== 0) {
      setError(`배정된 금액의 합계가 원본 금액과 일치하지 않습니다. (차이: ${remaining.toLocaleString()}원)`);
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createCollaborationRequest(workOrder.id, user.uid, tasks);
      onSuccess();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!workOrder) {
    return <div className="text-center py-8">시공요청 정보를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🤝 협업요청 생성</h2>
        <p className="text-gray-600">
          시공요청을 다른 시공자들과 협업하여 완료하세요.
        </p>
      </div>

      {/* 원본 시공요청 정보 */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">📋 원본 시공요청</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">제목:</span> {workOrder.title}
          </div>
          <div>
            <span className="font-medium">총 금액:</span> {workOrder.totalAmount?.toLocaleString()}원
          </div>
          <div>
            <span className="font-medium">주소:</span> {workOrder.address}
          </div>
          <div>
            <span className="font-medium">마감일:</span> {workOrder.deadline}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 업무 분배 섹션 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📦 업무 분배</h3>
            <button
              type="button"
              onClick={addTask}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              + 업무 추가
            </button>
          </div>

          {tasks.map((task, index) => (
            <div key={task.id} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-900">업무 {index + 1}</h4>
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    삭제
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무 제목 *
                  </label>
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 커튼 설치, 전동 시스템 연결"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    금액 (원) *
                  </label>
                  <input
                    type="number"
                    value={task.amount}
                    onChange={(e) => updateTask(task.id, 'amount', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    예상 소요시간 (시간)
                  </label>
                  <input
                    type="number"
                    value={task.estimatedHours}
                    onChange={(e) => updateTask(task.id, 'estimatedHours', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    필요 기술
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {task.requiredSkills.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(task.id, skillIndex)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="기술 추가"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill(task.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.target.previousElementSibling;
                        addSkill(task.id, input.value);
                        input.value = '';
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  업무 설명 *
                </label>
                <textarea
                  value={task.description}
                  onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="업무에 대한 상세한 설명을 입력하세요."
                  required
                />
              </div>
            </div>
          ))}
        </div>

        {/* 금액 요약 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">💰 금액 요약</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">원본 금액:</span> {workOrder.totalAmount?.toLocaleString()}원
            </div>
            <div>
              <span className="font-medium">배정 금액:</span> {getTotalAmount().toLocaleString()}원
            </div>
            <div className={`font-medium ${getRemainingAmount() === 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>차이:</span> {getRemainingAmount().toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 협업요청 메모 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📝 협업요청 메모
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="협업자들에게 전달할 메모를 입력하세요. (선택사항)"
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '생성 중...' : '협업요청 생성'}
          </button>
        </div>
      </form>
    </div>
  );
} 