import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, addDoc, Timestamp } from "firebase/firestore";
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FlagIcon,
  DocumentTextIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";

const firestore = getFirestore();

const QualityReview = ({ 
  requestId, 
  reviewerId, 
  onIssueSubmitted,
  showBeforeAfter = true,
  enableComparison = true
}) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [issueData, setIssueData] = useState({
    category: "",
    severity: "medium",
    comment: "",
    suggestedAction: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [qualityScores, setQualityScores] = useState({});

  useEffect(() => {
    if (requestId) {
      fetchPhotos();
    }
  }, [requestId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(firestore, "photos"), 
        where("requestId", "==", requestId),
        where("status", "==", "uploaded")
      );
      const querySnapshot = await getDocs(q);
      const photoList = [];
      querySnapshot.forEach((doc) => {
        photoList.push({ id: doc.id, ...doc.data() });
      });
      
      // 사진을 업로드 시간순으로 정렬
      photoList.sort((a, b) => b.uploadedAt?.toDate?.() - a.uploadedAt?.toDate?.());
      
      setPhotos(photoList);
      
      // 품질 점수 초기화
      const initialScores = {};
      photoList.forEach(photo => {
        initialScores[photo.id] = photo.qualityScore || 0;
      });
      setQualityScores(initialScores);
      
    } catch (error) {
      console.error("사진 로드 오류:", error);
      setErrors(prev => ({ ...prev, fetch: "사진을 불러오는 중 오류가 발생했습니다." }));
    } finally {
      setLoading(false);
    }
  };

  const validateIssueData = () => {
    const newErrors = {};
    
    if (!selectedPhotoId) {
      newErrors.photo = "사진을 선택해주세요.";
    }
    
    if (!issueData.category) {
      newErrors.category = "문제 유형을 선택해주세요.";
    }
    
    if (issueData.comment.trim().length < 10) {
      newErrors.comment = "문제 내용을 10자 이상 입력해주세요.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitIssue = async () => {
    if (!validateIssueData()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const issueData = {
        requestId,
        photoId: selectedPhotoId,
        reviewerId,
        category: issueData.category,
        severity: issueData.severity,
        comment: issueData.comment.trim(),
        suggestedAction: issueData.suggestedAction.trim(),
        status: "pending",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        reviewedAt: Timestamp.now()
      };

      const issueRef = await addDoc(collection(firestore, "qualityIssues"), issueData);

      // 사진 상태 업데이트
      try {
        const photoRef = doc(firestore, "photos", selectedPhotoId);
        await updateDoc(photoRef, {
          hasQualityIssue: true,
          lastReviewedAt: Timestamp.now(),
          issueCount: increment(1)
        });
      } catch (updateError) {
        console.warn("사진 상태 업데이트 실패:", updateError);
      }

      // 성공 처리
      if (onIssueSubmitted) {
        onIssueSubmitted({
          issueId: issueRef.id,
          photoId: selectedPhotoId,
          category: issueData.category,
          severity: issueData.severity
        });
      }

      // 폼 초기화
      setIssueData({
        category: "",
        severity: "medium",
        comment: "",
        suggestedAction: ""
      });
      setSelectedPhotoId(null);
      setSelectedPhoto(null);
      setErrors({});

      // 성공 메시지
      alert("품질 이의신청이 성공적으로 접수되었습니다.");

    } catch (error) {
      console.error("이의신청 제출 오류:", error);
      setErrors(prev => ({ ...prev, submit: "이의신청 제출 중 오류가 발생했습니다." }));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoSelect = (photo) => {
    setSelectedPhotoId(photo.id);
    setSelectedPhoto(photo);
    setErrors(prev => ({ ...prev, photo: "" }));
  };

  const handleQualityScoreChange = async (photoId, score) => {
    try {
      setQualityScores(prev => ({ ...prev, [photoId]: score }));
      
      // Firestore에 품질 점수 저장
      const photoRef = doc(firestore, "photos", photoId);
      await updateDoc(photoRef, {
        qualityScore: score,
        lastReviewedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("품질 점수 업데이트 오류:", error);
    }
  };

  const getCategoryOptions = () => [
    { value: "blur", label: "흐림/초점 문제" },
    { value: "exposure", label: "노출/밝기 문제" },
    { value: "composition", label: "구도/각도 문제" },
    { value: "lighting", label: "조명 문제" },
    { value: "resolution", label: "해상도 문제" },
    { value: "color", label: "색상/화질 문제" },
    { value: "content", label: "내용/구성 문제" },
    { value: "technical", label: "기술적 문제" },
    { value: "other", label: "기타" }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "low": return "bg-blue-100 text-blue-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getQualityScoreColor = (score) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    if (score >= 4) return "text-orange-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">사진을 불러오는 중...</span>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">검수할 사진이 없습니다</h3>
        <p className="text-gray-500">이 요청에 대한 업로드된 사진이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <EyeIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">사진 품질 검수 및 이의신청</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          업로드된 사진의 품질을 검토하고 문제가 있는 경우 이의신청을 제출하세요.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* 에러 메시지 */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-red-900">오류 발생</h4>
            </div>
            <ul className="text-red-700 text-sm space-y-1">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 사진 목록 */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">업로드된 사진 ({photos.length}개)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPhotoId === photo.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handlePhotoSelect(photo)}
              >
                {/* 사진 미리보기 */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <img
                    src={photo.url}
                    alt={photo.originalName || "검수용 사진"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 사진 정보 */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {photo.originalName || "사진"}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>업로드: {photo.uploadedAt?.toDate?.().toLocaleDateString()}</span>
                    <span>{photo.fileSize ? `${(photo.fileSize / 1024 / 1024).toFixed(1)}MB` : ""}</span>
                  </div>

                  {/* 품질 점수 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">품질 점수:</span>
                    <select
                      value={qualityScores[photo.id] || 0}
                      onChange={(e) => handleQualityScoreChange(photo.id, parseInt(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-xs font-medium px-2 py-1 rounded border ${getQualityScoreColor(qualityScores[photo.id] || 0)}`}
                    >
                      <option value={0}>미평가</option>
                      <option value={1}>1점</option>
                      <option value={2}>2점</option>
                      <option value={3}>3점</option>
                      <option value={4}>4점</option>
                      <option value={5}>5점</option>
                      <option value={6}>6점</option>
                      <option value={7}>7점</option>
                      <option value={8}>8점</option>
                      <option value={9}>9점</option>
                      <option value={10}>10점</option>
                    </select>
                  </div>

                  {/* 확대 보기 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhoto(photo);
                      setShowPhotoModal(true);
                    }}
                    className="w-full mt-2 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <MagnifyingGlassIcon className="h-3 w-3" />
                    확대 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 이의신청 폼 */}
        {selectedPhotoId && (
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FlagIcon className="h-5 w-5 text-red-600" />
              이의신청 작성
            </h4>
            
            <div className="space-y-4">
              {/* 문제 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문제 유형 *
                </label>
                <select
                  value={issueData.category}
                  onChange={(e) => setIssueData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">문제 유형을 선택하세요</option>
                  {getCategoryOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 심각도 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  심각도
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["low", "medium", "high", "critical"].map(severity => (
                    <label key={severity} className="flex items-center">
                      <input
                        type="radio"
                        name="severity"
                        value={severity}
                        checked={issueData.severity === severity}
                        onChange={(e) => setIssueData(prev => ({ ...prev, severity: e.target.value }))}
                        className="sr-only"
                      />
                      <span className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                        issueData.severity === severity
                          ? getSeverityColor(severity)
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                        {severity === "low" && "낮음"}
                        {severity === "medium" && "보통"}
                        {severity === "high" && "높음"}
                        {severity === "critical" && "심각"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 문제 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문제 내용 *
                </label>
                <textarea
                  value={issueData.comment}
                  onChange={(e) => setIssueData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="구체적인 문제 내용을 10자 이상 입력해주세요."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {issueData.comment.length}/500자
                </p>
              </div>

              {/* 제안 사항 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제안 사항 (선택사항)
                </label>
                <textarea
                  value={issueData.suggestedAction}
                  onChange={(e) => setIssueData(prev => ({ ...prev, suggestedAction: e.target.value }))}
                  placeholder="개선 방안이나 재촬영 요청사항을 입력해주세요."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 제출 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={submitIssue}
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      제출 중...
                    </div>
                  ) : (
                    "이의신청 제출"
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setSelectedPhotoId(null);
                    setSelectedPhoto(null);
                    setIssueData({
                      category: "",
                      severity: "medium",
                      comment: "",
                      suggestedAction: ""
                    });
                  }}
                  disabled={submitting}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 사진 확대 모달 */}
      {showPhotoModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedPhoto.originalName}</h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.originalName}
              className="w-full h-auto rounded-lg mb-4"
            />
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>파일명:</strong> {selectedPhoto.originalName}</p>
                <p><strong>파일 크기:</strong> {selectedPhoto.fileSize ? `${(selectedPhoto.fileSize / 1024 / 1024).toFixed(1)}MB` : "알 수 없음"}</p>
              </div>
              <div>
                <p><strong>업로드 시간:</strong> {selectedPhoto.uploadedAt?.toDate?.().toLocaleString()}</p>
                <p><strong>품질 점수:</strong> {qualityScores[selectedPhoto.id] || 0}점</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityReview; 