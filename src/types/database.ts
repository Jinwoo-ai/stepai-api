// 데이터베이스 테이블 타입 정의

export interface User {
  id?: number;
  username: string;
  email: string;
  password_hash: string;
  user_status: string; // active, inactive, pending, deleted
  deleted_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface Company {
  id?: number;
  company_name: string;
  company_registration_number: string;
  company_description?: string;
  company_logo?: string;
  company_website?: string;
  company_email: string;
  company_phone?: string;
  company_address?: string;
  company_status: string; // active, inactive, pending, deleted
  deleted_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCompany {
  id?: number;
  user_id: number;
  company_id: number;
  role: string; // ceo, manager, employee
  created_at?: Date;
  updated_at?: Date;
}

export interface CompanyAIService {
  id?: number;
  company_id: number;
  ai_service_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface AIService {
  id?: number;
  ai_name: string;
  ai_description?: string;
  ai_type: string;
  ai_status: string; // active, inactive, pending, deleted
  nationality?: string;
  deleted_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface AIServiceContent {
  id?: number;
  ai_service_id: number;
  content_title: string;
  content_url?: string;
  content_type: string;
  content_description?: string;
  content_order_index: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface AIServiceTag {
  id?: number;
  ai_service_id: number;
  tag_name: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface AICategory {
  id?: number;
  category_name: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface AIServiceCategory {
  id?: number;
  ai_service_id: number;
  category_id: number;
  created_at?: Date;
  updated_at?: Date;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 페이지네이션 타입
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 쿼리 필터 타입
export interface UserFilters {
  user_status?: string;
  email?: string;
}

export interface CompanyFilters {
  company_status?: string;
  company_name?: string;
}

export interface AIServiceFilters {
  ai_status?: string;
  ai_type?: string;
  nationality?: string;
  category_id?: number;
}

export interface AIServiceContentFilters {
  ai_service_id?: number;
  content_type?: string;
}

export interface AIServiceTagFilters {
  ai_service_id?: number;
  tag_name?: string;
}

export interface AICategoryFilters {
  category_name?: string;
}

// AI 서비스 상세 정보 (관련 데이터 포함)
export interface AIServiceDetail extends AIService {
  contents?: AIServiceContent[];
  tags?: AIServiceTag[];
  categories?: AICategory[];
  companies?: Company[];
} 