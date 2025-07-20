// StepAI API Database Types - AI 전문가 매칭 서비스

// 기본 타입들
export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  user_type: 'client' | 'expert' | 'admin';
  user_status: 'active' | 'inactive' | 'pending' | 'deleted';
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Group {
  id: number;
  group_name: string;
  group_description?: string;
  group_logo?: string;
  group_website?: string;
  group_email?: string;
  group_phone?: string;
  group_address?: string;
  group_status: 'active' | 'inactive' | 'pending' | 'deleted';
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Expert {
  id: number;
  user_id: number;
  group_id?: number;
  expert_name: string;
  expert_title?: string;
  expert_bio?: string;
  expert_avatar?: string;
  expert_website?: string;
  expert_email?: string;
  expert_phone?: string;
  expert_location?: string;
  expert_status: 'active' | 'inactive' | 'pending' | 'deleted';
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AIService {
  id: number;
  ai_name: string;
  ai_description?: string;
  ai_type: string;
  ai_status: 'active' | 'inactive' | 'pending' | 'deleted';
  nationality?: string;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Content {
  id: number;
  content_title: string;
  content_description?: string;
  content_url?: string;
  content_type: string;
  content_order_index: number;
  content_status: 'active' | 'inactive' | 'pending' | 'deleted';
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ContentCategory {
  id: number;
  category_name: string;
  category_icon?: string;
  category_description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ContentTag {
  id: number;
  tag_name: string;
  tag_description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ExpertContent {
  id: number;
  expert_id: number;
  content_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface ContentCategoryRelation {
  id: number;
  content_id: number;
  category_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface ContentTagRelation {
  id: number;
  content_id: number;
  tag_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface ExpertAIService {
  id: number;
  expert_id: number;
  ai_service_id: number;
  usage_description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ContentAIService {
  id: number;
  content_id: number;
  ai_service_id: number;
  usage_description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MatchingRequest {
  id: number;
  client_id: number;
  expert_id: number;
  request_title: string;
  request_description?: string;
  request_status: 'pending' | 'accepted' | 'rejected' | 'completed';
  request_budget?: number;
  request_deadline?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Review {
  id: number;
  client_id: number;
  expert_id: number;
  content_id?: number;
  rating: number;
  review_text?: string;
  review_status: 'active' | 'hidden' | 'deleted';
  created_at: Date;
  updated_at: Date;
}

// API 요청/응답 타입들
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

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

// Users 관련 타입들
export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  user_type?: 'client' | 'expert' | 'admin';
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  user_type?: 'client' | 'expert' | 'admin';
  user_status?: 'active' | 'inactive' | 'pending' | 'deleted';
}

export interface UserFilters {
  user_type?: string;
  user_status?: string;
}

// Groups 관련 타입들
export interface GroupCreateRequest {
  group_name: string;
  group_description?: string;
  group_logo?: string;
  group_website?: string;
  group_email?: string;
  group_phone?: string;
  group_address?: string;
}

export interface GroupUpdateRequest {
  group_name?: string;
  group_description?: string;
  group_logo?: string;
  group_website?: string;
  group_email?: string;
  group_phone?: string;
  group_address?: string;
  group_status?: 'active' | 'inactive' | 'pending' | 'deleted';
}

export interface GroupFilters {
  group_status?: string;
}

// Experts 관련 타입들
export interface ExpertCreateRequest {
  user_id: number;
  group_id?: number;
  expert_name: string;
  expert_title?: string;
  expert_bio?: string;
  expert_avatar?: string;
  expert_website?: string;
  expert_email?: string;
  expert_phone?: string;
  expert_location?: string;
}

export interface ExpertUpdateRequest {
  group_id?: number;
  expert_name?: string;
  expert_title?: string;
  expert_bio?: string;
  expert_avatar?: string;
  expert_website?: string;
  expert_email?: string;
  expert_phone?: string;
  expert_location?: string;
  expert_status?: 'active' | 'inactive' | 'pending' | 'deleted';
}

export interface ExpertFilters {
  expert_status?: string;
  expert_location?: string;
  group_id?: number;
}

export interface ExpertListOptions {
  include_user?: boolean;
  include_group?: boolean;
  include_contents?: boolean;
  include_ai_services?: boolean;
}

export interface ExpertWithRelations extends Expert {
  user?: User;
  group?: Group;
  contents?: Content[];
  ai_services?: AIService[];
}

// AIServices 관련 타입들
export interface AIServiceCreateRequest {
  ai_name: string;
  ai_description?: string;
  ai_type: string;
  nationality?: string;
}

export interface AIServiceUpdateRequest {
  ai_name?: string;
  ai_description?: string;
  ai_type?: string;
  ai_status?: 'active' | 'inactive' | 'pending' | 'deleted';
  nationality?: string;
}

export interface AIServiceFilters {
  ai_status?: string;
  ai_type?: string;
  nationality?: string;
}

// Contents 관련 타입들
export interface ContentCreateRequest {
  content_title: string;
  content_description?: string;
  content_url?: string;
  content_type: string;
  content_order_index?: number;
  category_ids?: number[];
  tag_ids?: number[];
  ai_service_ids?: number[];
}

export interface ContentUpdateRequest {
  content_title?: string;
  content_description?: string;
  content_url?: string;
  content_type?: string;
  content_order_index?: number;
  content_status?: 'active' | 'inactive' | 'pending' | 'deleted';
}

export interface ContentFilters {
  content_status?: string;
  content_type?: string;
  category_id?: number;
  tag_id?: number;
  ai_service_id?: number;
}

export interface ContentListOptions {
  include_categories?: boolean;
  include_tags?: boolean;
  include_ai_services?: boolean;
  include_experts?: boolean;
}

export interface ContentWithRelations extends Content {
  categories?: ContentCategory[];
  tags?: ContentTag[];
  ai_services?: AIService[];
  experts?: Expert[];
}

// ContentCategories 관련 타입들
export interface ContentCategoryCreateRequest {
  category_name: string;
  category_icon?: string;
  category_description?: string;
}

export interface ContentCategoryUpdateRequest {
  category_name?: string;
  category_icon?: string;
  category_description?: string;
}

// ContentTags 관련 타입들
export interface ContentTagCreateRequest {
  tag_name: string;
  tag_description?: string;
}

export interface ContentTagUpdateRequest {
  tag_name?: string;
  tag_description?: string;
}

// MatchingRequests 관련 타입들
export interface MatchingRequestCreateRequest {
  client_id: number;
  expert_id: number;
  request_title: string;
  request_description?: string;
  request_budget?: number;
  request_deadline?: Date;
}

export interface MatchingRequestUpdateRequest {
  request_title?: string;
  request_description?: string;
  request_status?: 'pending' | 'accepted' | 'rejected' | 'completed';
  request_budget?: number;
  request_deadline?: Date;
}

export interface MatchingRequestFilters {
  request_status?: string;
  client_id?: number;
  expert_id?: number;
}

// Reviews 관련 타입들
export interface ReviewCreateRequest {
  client_id: number;
  expert_id: number;
  content_id?: number;
  rating: number;
  review_text?: string;
}

export interface ReviewUpdateRequest {
  rating?: number;
  review_text?: string;
  review_status?: 'active' | 'hidden' | 'deleted';
}

export interface ReviewFilters {
  review_status?: string;
  client_id?: number;
  expert_id?: number;
  content_id?: number;
  rating?: number;
} 