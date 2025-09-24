// StepAI API Database Types - AI 서비스 소개 및 이용방법 추천 서비스

// 기본 타입들
export interface User {
  id: number;
  name: string;
  email: string;
  industry?: string;
  job_role?: string;
  job_level?: string;
  experience_years?: number;
  user_type: 'member' | 'admin';
  user_status: 'active' | 'inactive' | 'pending' | 'deleted';
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserSns {
  id: number;
  user_id: number;
  sns_type: 'naver' | 'kakao' | 'google';
  sns_user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithSns extends User {
  sns_accounts?: UserSns[];
}

export interface AIService {
  id: number;
  ai_name: string;
  ai_description?: string;
  ai_type: string; // LLM, RAG, GPTs, Image_Generation, Video_Generation, etc.
  ai_website?: string;
  ai_logo?: string;
  pricing_model?: 'free' | 'freemium' | 'paid' | 'subscription';
  pricing_info?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  ai_status: 'active' | 'inactive' | 'pending' | 'deleted';
  is_visible: boolean; // 사이트 노출여부
  is_step_pick: boolean; // Step Pick 여부
  nationality?: string;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AIVideo {
  id: number;
  video_title: string;
  video_description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number; // 초 단위
  video_status: 'active' | 'inactive' | 'pending' | 'deleted';
  view_count: number;
  like_count: number;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  category_name: string;
  category_description?: string;
  category_icon?: string;
  parent_id?: number; // NULL이면 메인 카테고리
  category_order: number;
  category_status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface Curation {
  id: number;
  curation_title: string;
  curation_description?: string;
  curation_thumbnail?: string;
  curation_order: number;
  curation_status: 'active' | 'inactive' | 'pending' | 'deleted';
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// 관계 테이블 타입들
export interface AIServiceCategory {
  id: number;
  ai_service_id: number;
  category_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface AIVideoCategory {
  id: number;
  ai_video_id: number;
  category_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface AIVideoService {
  id: number;
  ai_video_id: number;
  ai_service_id: number;
  usage_description?: string;
  usage_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CurationAIService {
  id: number;
  curation_id: number;
  ai_service_id: number;
  service_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserFavorite {
  id: number;
  user_id: number;
  favorite_type: 'ai_service' | 'ai_video' | 'curation';
  favorite_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface AIServiceView {
  id: number;
  ai_service_id: number;
  user_id?: number;
  view_date: Date;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface AIVideoView {
  id: number;
  ai_video_id: number;
  user_id?: number;
  view_date: Date;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface Review {
  id: number;
  user_id: number;
  review_type: 'ai_service' | 'ai_video';
  review_target_id: number;
  rating: number; // 1-5
  review_text?: string;
  review_status: 'active' | 'hidden' | 'deleted';
  created_at: Date;
  updated_at: Date;
}

export interface Ranking {
  id: number;
  ranking_type: 'ai_service' | 'ai_video' | 'category' | 'curation';
  entity_id: number;
  entity_type: 'ai_service_id' | 'ai_video_id' | 'category_id' | 'curation_id';
  total_score: number;
  view_count: number;
  favorite_count: number;
  avg_rating: number;
  ranking_date: Date;
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
  name: string;
  email: string;
  industry?: string;
  job_role?: string;
  job_level?: string;
  experience_years?: number;
  sns_type: 'naver' | 'kakao' | 'google';
  sns_user_id: string;
  user_type?: 'member' | 'admin';
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  industry?: string;
  job_role?: string;
  job_level?: string;
  experience_years?: number;
  user_type?: 'member' | 'admin';
  user_status?: 'active' | 'inactive' | 'pending' | 'deleted';
}

export interface UserFilters {
  user_type?: string;
  user_status?: string;
  sns_type?: string;
  industry?: string;
  job_role?: string;
}

// AI Services 관련 타입들
export interface AIServiceCreateRequest {
  ai_name: string;
  ai_description?: string;
  ai_type: string;
  ai_website?: string;
  ai_logo?: string;
  pricing_model?: 'free' | 'freemium' | 'paid' | 'subscription';
  pricing_info?: string;
  ai_status?: 'active' | 'inactive' | 'pending' | 'deleted';
  is_visible?: boolean;
  nationality?: string;
  category_ids?: number[];
}

export interface AIServiceUpdateRequest {
  ai_name?: string;
  ai_description?: string;
  ai_type?: string;
  ai_website?: string;
  ai_logo?: string;
  pricing_model?: 'free' | 'freemium' | 'paid' | 'subscription';
  pricing_info?: string;
  ai_status?: 'active' | 'inactive' | 'pending' | 'deleted';
  is_visible?: boolean;
  nationality?: string;
}

export interface AIServiceFilters {
  ai_status?: string;
  ai_type?: string;
  nationality?: string;
  category_id?: number;
  pricing_model?: string;
  is_visible?: boolean;
}

export interface AIServiceListOptions {
  include_categories?: boolean;
  include_videos?: boolean;
  include_curations?: boolean;
}

export interface AIServiceWithRelations extends AIService {
  categories?: Category[];
  videos?: AIVideo[];
  curations?: Curation[];
}

// AI Videos 관련 타입들
export interface AIVideoCreateRequest {
  video_title: string;
  video_description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  video_status?: 'active' | 'inactive' | 'pending' | 'deleted';
  category_ids?: number[];
  ai_service_ids?: number[];
}

export interface AIVideoUpdateRequest {
  video_title?: string;
  video_description?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  video_status?: 'active' | 'inactive' | 'pending' | 'deleted';
}

export interface AIVideoFilters {
  video_status?: string;
  category_id?: number;
  ai_service_id?: number;
}

export interface AIVideoListOptions {
  include_categories?: boolean;
  include_ai_services?: boolean;
}

export interface AIVideoWithRelations extends AIVideo {
  categories?: Category[];
  ai_services?: AIService[];
}

// Categories 관련 타입들
export interface CategoryCreateRequest {
  category_name: string;
  category_description?: string;
  category_icon?: string;
  parent_id?: number;
  category_order?: number;
}

export interface CategoryUpdateRequest {
  category_name?: string;
  category_description?: string;
  category_icon?: string;
  parent_id?: number;
  category_order?: number;
  category_status?: 'active' | 'inactive';
}

export interface CategoryFilters {
  category_status?: string;
  parent_id?: number;
}

export interface CategoryWithChildren extends Category {
  children?: Category[];
}

// Curations 관련 타입들
export interface CurationCreateRequest {
  curation_title: string;
  curation_description?: string;
  curation_thumbnail?: string;
  curation_order?: number;
  ai_service_ids?: number[];
}

export interface CurationUpdateRequest {
  curation_title?: string;
  curation_description?: string;
  curation_thumbnail?: string;
  curation_order?: number;
  curation_status?: 'active' | 'inactive' | 'pending' | 'deleted';
}

export interface CurationFilters {
  curation_status?: string;
}

export interface CurationListOptions {
  include_ai_services?: boolean;
}

export interface CurationWithRelations extends Curation {
  ai_services?: AIService[];
}

// Reviews 관련 타입들
export interface ReviewCreateRequest {
  user_id: number;
  review_type: 'ai_service' | 'ai_video';
  review_target_id: number;
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
  review_type?: string;
  review_target_id?: number;
  user_id?: number;
  rating?: number;
}

// User Favorites 관련 타입들
export interface UserFavoriteCreateRequest {
  user_id: number;
  favorite_type: 'ai_service' | 'ai_video' | 'curation';
  favorite_id: number;
}

export interface UserFavoriteFilters {
  user_id?: number;
  favorite_type?: string;
}

// 랭킹 관련 타입들
export interface RankingResult {
  entity_id: number;
  entity_name: string;
  total_score: number;
  view_count: number;
  favorite_count: number;
  avg_rating: number;
  rank: number;
}

export interface RankingFilters {
  ranking_type?: 'ai_service' | 'ai_video' | 'category' | 'curation';
  date_from?: Date;
  date_to?: Date;
  limit?: number;
}

// 조회 기록 관련 타입들
export interface ViewRecordRequest {
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
}

// 통계 관련 타입들
export interface ServiceStats {
  total_ai_services: number;
  total_ai_videos: number;
  total_curations: number;
  total_categories: number;
  total_users: number;
  total_reviews: number;
  avg_rating: number;
}

// 검색 관련 타입들
export interface SearchFilters {
  query?: string;
  category_id?: number;
  ai_type?: string;
  pricing_model?: string;
}

export interface SearchResult {
  ai_services: AIService[];
  ai_videos: AIVideo[];
  curations: Curation[];
}

// AI 서비스 관련 추가 타입들
export interface AIServiceContent {
  id: number;
  ai_service_id: number;
  content_type: 'target_users' | 'main_features' | 'use_cases';
  content_title?: string;
  content_text?: string;
  content_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface AIServiceSNS {
  id: number;
  ai_service_id: number;
  sns_type: string;
  sns_url: string;
  sns_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface AIServiceSimilarService {
  id: number;
  ai_service_id: number;
  similar_service_id: number;
  similarity_reason?: string;
  created_at: Date;
  updated_at: Date;
}

// 파일 업로드 관련 타입들
export interface FileUploadResponse {
  success: boolean;
  data?: {
    filename: string;
    originalName: string;
    size: number;
    url: string;
    type: string;
  };
  error?: string;
}

// 광고제휴 관련 타입들
export interface AdPartnership {
  id: number;
  company_name: string;
  contact_person: string;
  contact_email: string;
  contact_phone?: string;
  partnership_type: string;
  budget_range?: string;
  campaign_period?: string;
  target_audience?: string;
  campaign_description?: string;
  additional_requirements?: string;
  attachment_url?: string;
  inquiry_status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed';
  admin_notes?: string;
  response_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AdPartnershipCreateRequest {
  company_name: string;
  contact_person: string;
  contact_email: string;
  contact_phone?: string;
  partnership_type: string;
  budget_range?: string;
  campaign_period?: string;
  target_audience?: string;
  campaign_description?: string;
  additional_requirements?: string;
  attachment_url?: string;
}

export interface AdPartnershipUpdateRequest {
  company_name?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  partnership_type?: string;
  budget_range?: string;
  campaign_period?: string;
  target_audience?: string;
  campaign_description?: string;
  additional_requirements?: string;
  attachment_url?: string;
  inquiry_status?: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed';
  admin_notes?: string;
  response_date?: Date;
}

export interface AdPartnershipFilters {
  partnership_type?: string;
  inquiry_status?: string;
  date_from?: Date;
  date_to?: Date;
}

// SNS 로그인 관련 타입들
export interface SnsLoginRequest {
  sns_type: 'naver' | 'kakao' | 'google';
  sns_user_id: string;
  name: string;
  email: string;
  industry?: string;
  job_role?: string;
  job_level?: string;
  experience_years?: number;
}