// 역할별 페이지 접근 권한 정의
export const PAGE_PERMISSIONS = {
  // 공통 페이지 (모든 역할 접근 가능)
  common: [
    '/',
    '/login',
    '/signup',
    '/profile-setup',
    '/dashboard',
    '/profile',
    '/profile-edit',
    '/notification/list',
    '/logout'
  ],
  
  // 판매자 전용 페이지
  seller: [
    '/workorder/new',
    '/workorder/list',
    '/workorder/[id]',
    '/estimate/list',
    '/estimate/[id]',
    '/payment/list',
    '/review/list',
    '/review/[id]'
  ],
  
  // 시공자 전용 페이지
  contractor: [
    '/workorder/list',
    '/workorder/worker-list',
    '/workorder/[id]',
    '/contractor/scheduler',
    '/payment/list',
    '/review/list',
    '/review/[id]'
  ],
  
  // 관리자 전용 페이지
  admin: [
    '/admin',
    '/admin/approvals',
    '/admin/users',
    '/admin/orders',
    '/admin/settings',
    '/admin/logs'
  ]
};

// 역할별 접근 가능한 페이지 목록 가져오기
export const getAccessiblePages = (role) => {
  const pages = [...PAGE_PERMISSIONS.common];
  
  if (role === 'seller') {
    pages.push(...PAGE_PERMISSIONS.seller);
  } else if (role === 'contractor') {
    pages.push(...PAGE_PERMISSIONS.contractor);
  } else if (role === 'admin') {
    pages.push(...PAGE_PERMISSIONS.admin);
  }
  
  return pages;
};

// 특정 페이지에 대한 접근 권한 확인
export const hasPageAccess = (pathname, role) => {
  if (!role) return false;
  
  const accessiblePages = getAccessiblePages(role);
  
  // 정확한 경로 매칭
  if (accessiblePages.includes(pathname)) {
    return true;
  }
  
  // 동적 라우트 매칭 (예: /workorder/[id])
  for (const page of accessiblePages) {
    if (page.includes('[') && page.includes(']')) {
      const pattern = page.replace(/\[.*?\]/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(pathname)) {
        return true;
      }
    }
  }
  
  return false;
};

// 역할별 기본 리다이렉트 페이지
export const getDefaultRedirectPage = (role) => {
  switch (role) {
    case 'seller':
      return '/dashboard';
    case 'contractor':
      return '/dashboard';
    case 'admin':
      return '/admin';
    default:
      return '/dashboard';
  }
};

// 역할별 금지된 페이지 (접근 시 리다이렉트)
export const getForbiddenPages = (role) => {
  const allPages = [
    ...PAGE_PERMISSIONS.seller,
    ...PAGE_PERMISSIONS.contractor,
    ...PAGE_PERMISSIONS.admin
  ];
  
  const accessiblePages = getAccessiblePages(role);
  
  return allPages.filter(page => !accessiblePages.includes(page));
};

// 페이지 접근 권한 검증 및 리다이렉트 처리
export const validatePageAccess = (pathname, role, router) => {
  if (!role) {
    router.push('/login');
    return false;
  }
  
  if (!hasPageAccess(pathname, role)) {
    const defaultPage = getDefaultRedirectPage(role);
    router.push(defaultPage);
    return false;
  }
  
  return true;
}; 