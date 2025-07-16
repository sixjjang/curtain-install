import { useState } from "react";
import { getAdvertiserStatusText, getAdvertiserStatusColor } from "../../utils/advertiserUtils";

const AdvertiserDetailModal = ({ advertiser, isOpen, onClose }) => {
  if (!isOpen || !advertiser) return null;

  const formatDate = (date) => {
    if (!date) return "-";
    const d = date?.toDate?.() || date;
    return new Date(d).toLocaleString('ko-KR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">광고주 상세 정보</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* 기본 정보 */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-600">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자명
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md font-medium">
                    {advertiser.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태
                  </label>
                  <div className="p-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAdvertiserStatusColor(advertiser.status)}`}>
                      {getAdvertiserStatusText(advertiser.status)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처 이메일
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <a href={`mailto:${advertiser.contactEmail}`} className="text-blue-600 hover:underline">
                      {advertiser.contactEmail}
                    </a>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <a href={`tel:${advertiser.phone}`} className="text-blue-600 hover:underline">
                      {advertiser.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 회사 정보 */}
            {(advertiser.companyName || advertiser.businessNumber || advertiser.address) && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-600">회사 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {advertiser.companyName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        회사명
                      </label>
                      <div className="p-3 bg-gray-50 rounded-md font-medium">
                        {advertiser.companyName}
                      </div>
                    </div>
                  )}
                  {advertiser.businessNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        사업자등록번호
                      </label>
                      <div className="p-3 bg-gray-50 rounded-md font-mono">
                        {advertiser.businessNumber}
                      </div>
                    </div>
                  )}
                  {advertiser.address && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        주소
                      </label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        {advertiser.address}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 추가 정보 */}
            {advertiser.description && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-purple-600">추가 정보</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {advertiser.description}
                  </div>
                </div>
              </div>
            )}

            {/* 시스템 정보 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-600">시스템 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    광고주 ID
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                    {advertiser.id}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    등록일
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md text-sm">
                    {formatDate(advertiser.createdAt)}
                  </div>
                </div>
                {advertiser.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      수정일
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md text-sm">
                      {formatDate(advertiser.updatedAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertiserDetailModal; 