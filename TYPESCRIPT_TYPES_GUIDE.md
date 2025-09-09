# StepAI API - TypeScript 타입 가이드

## 📋 개요

이 문서는 StepAI API와 함께 사용할 수 있는 TypeScript 타입 정의를 제공합니다. 프론트엔드 개발 시 타입 안전성을 보장하고 개발 효율성을 높이기 위해 작성되었습니다.

## 🏗️ 기본 타입 구조

### API 응답 기본 타입

```typescript
// 기본 API 응답 형식
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 페이지네이션 파라미터
interface PaginationParams {
  page: number;
  limit: number;
}

// 페이지네이션 응답
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## 👥 사용자 관리 타입

### 사용자 기본 타입

```typescript
// 사용자 타입 정의
type UserType = 'client' | 'expert' | 'admin';
type UserStatus = 'active' | 'inactive' | 'pending' | 'deleted';

// 사용자 엔티티
interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  user_type: UserType;
  user_status: UserStatus;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// 사용자 생성 요청
interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  user_type?: UserType;
}

// 사용자 수정 요청
interface UserUpdateRequest {
  username?: string;
  email?: string;
  user_type?: UserType;
  user_status?: UserStatus;
}

// 사용자 필터
interface UserFilters {
  user_type?: string;
  user_status?: string;
}
```

### 그룹 관리 타입

```typescript
// 그룹 상태 타입
type GroupStatus = 'active' | 'inactive' | 'pending' | 'deleted';

// 그룹 엔티티
interface Group {
  id: number;
  group_name: string;
  group_description?: string;
  group_logo?: string;
  group_website?: string;
  group_email?: string;
  group_phone?: string;
  group_address?: string;
  group_status: GroupStatus;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// 그룹 생성 요청
interface GroupCreateRequest {
  group_name: string;
  group_description?: string;
  group_logo?: string;
  group_website?: string;
  group_email?: string;
  group_phone?: string;
  group_address?: string;
}

// 그룹 수정 요청
interface GroupUpdateRequest {
  group_name?: string;
  group_description?: string;
  group_logo?: string;
  group_website?: string;
  group_email?: string;
  group_phone?: string;
  group_address?: string;
  group_status?: GroupStatus;
}
```

## 👨💼 전문가 관리 타입

```typescript
// 전문가 상태 타입
type ExpertStatus = 'active' | 'inactive' | 'pending' | 'deleted';

// 전문가 엔티티
interface Expert {
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
  expert_status: ExpertStatus;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// 전문가 생성 요청
interface ExpertCreateRequest {
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

// 전문가 수정 요청
interface ExpertUpdateRequest {
  group_id?: number;
  expert_name?: string;
  expert_title?: string;
  expert_bio?: string;
  expert_avatar?: string;
  expert_website?: string;
  expert_email?: string;
  expert_phone?: string;
  expert_location?: string;
  expert_status?: ExpertStatus;
}

// 전문가 필터
interface ExpertFilters {
  expert_status?: string;
  expert_location?: string;
  group_id?: number;
}

// 전문가 목록 옵션
interface ExpertListOptions {
  include_user?: boolean;
  include_group?: boolean;
  include_contents?: boolean;
  include_ai_services?: boolean;
}

// 관련 데이터가 포함된 전문가
interface ExpertWithRelations extends Expert {
  user?: User;
  group?: Group;
  contents?: Content[];
  ai_services?: AIService[];
}
```

## 🤖 AI 서비스 타입

```typescript
// AI 서비스 타입 정의
type AIServiceType = 'LLM' | 'RAG' | 'GPTs' | 'Prompter' | string;
type AIServiceStatus = 'active' | 'inactive' | 'pending' | 'deleted';

// AI 서비스 엔티티
interface AIService {
  id: number;
  ai_name: string;
  ai_description?: string;
  ai_type: AIServiceType;
  ai_status: AIServiceStatus;
  nationality?: string;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// AI 서비스 생성 요청
interface AIServiceCreateRequest {
  ai_name: string;
  ai_description?: string;
  ai_type: AIServiceType;
  ai_status?: AIServiceStatus;
  nationality?: string;
  category_ids?: number[];
}

// AI 서비스 수정 요청
interface AIServiceUpdateRequest {
  ai_name?: string;
  ai_description?: string;
  ai_type?: AIServiceType;
  ai_status?: AIServiceStatus;
  nationality?: string;
}

// AI 서비스 필터
interface AIServiceFilters {
  ai_status?: string;
  ai_type?: string;
  nationality?: string;
  category_id?: number;
}

// AI 서비스 목록 옵션
interface AIServiceListOptions {
  include_contents?: boolean;
  include_tags?: boolean;
  include_categories?: boolean;
  include_companies?: boolean;
}
```

## 📄 콘텐츠 관리 타입

```typescript
// 콘텐츠 타입 정의
type ContentType = 'link' | 'logo' | 'image' | 'video' | 'text' | 'audio' | 'pdf';
type ContentStatus = 'active' | 'inactive' | 'pending' | 'deleted';

// 콘텐츠 엔티티
interface Content {
  id: number;
  content_title: string;
  content_description?: string;
  content_url?: string;
  content_type: ContentType;
  content_order_index: number;
  content_status: ContentStatus;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// 콘텐츠 생성 요청
interface ContentCreateRequest {
  content_title: string;
  content_description?: string;
  content_url?: string;
  content_type: ContentType;
  content_order_index?: number;
  category_ids?: number[];
  tag_ids?: number[];
  ai_service_ids?: number[];
}

// 콘텐츠 수정 요청
interface ContentUpdateRequest {
  content_title?: string;
  content_description?: string;
  content_url?: string;
  content_type?: ContentType;
  content_order_index?: number;
  content_status?: ContentStatus;
}

// 콘텐츠 필터
interface ContentFilters {
  content_status?: string;
  content_type?: string;
  category_id?: number;
  tag_id?: number;
  ai_service_id?: number;
}

// 콘텐츠 목록 옵션
interface ContentListOptions {
  include_categories?: boolean;
  include_tags?: boolean;
  include_ai_services?: boolean;
  include_experts?: boolean;
}

// 관련 데이터가 포함된 콘텐츠
interface ContentWithRelations extends Content {
  categories?: ContentCategory[];
  tags?: ContentTag[];
  ai_services?: AIService[];
  experts?: Expert[];
}
```

## 🏷️ 카테고리 및 태그 타입

```typescript
// 콘텐츠 카테고리
interface ContentCategory {
  id: number;
  category_name: string;
  category_icon?: string;
  category_description?: string;
  created_at: Date;
  updated_at: Date;
}

// 카테고리 생성 요청
interface ContentCategoryCreateRequest {
  category_name: string;
  category_icon?: string;
  category_description?: string;
}

// 카테고리 수정 요청
interface ContentCategoryUpdateRequest {
  category_name?: string;
  category_icon?: string;
  category_description?: string;
}

// 콘텐츠 태그
interface ContentTag {
  id: number;
  tag_name: string;
  tag_description?: string;
  created_at: Date;
  updated_at: Date;
}

// 태그 생성 요청
interface ContentTagCreateRequest {
  tag_name: string;
  tag_description?: string;
}

// 태그 수정 요청
interface ContentTagUpdateRequest {
  tag_name?: string;
  tag_description?: string;
}
```

## 🤝 매칭 및 리뷰 타입

```typescript
// 매칭 요청 상태
type MatchingRequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

// 매칭 요청 엔티티
interface MatchingRequest {
  id: number;
  client_id: number;
  expert_id: number;
  request_title: string;
  request_description?: string;
  request_status: MatchingRequestStatus;
  request_budget?: number;
  request_deadline?: Date;
  created_at: Date;
  updated_at: Date;
}

// 매칭 요청 생성
interface MatchingRequestCreateRequest {
  client_id: number;
  expert_id: number;
  request_title: string;
  request_description?: string;
  request_budget?: number;
  request_deadline?: Date;
}

// 매칭 요청 수정
interface MatchingRequestUpdateRequest {
  request_title?: string;
  request_description?: string;
  request_status?: MatchingRequestStatus;
  request_budget?: number;
  request_deadline?: Date;
}

// 리뷰 상태
type ReviewStatus = 'active' | 'hidden' | 'deleted';

// 리뷰 엔티티
interface Review {
  id: number;
  client_id: number;
  expert_id: number;
  content_id?: number;
  rating: number; // 1-5
  review_text?: string;
  review_status: ReviewStatus;
  created_at: Date;
  updated_at: Date;
}

// 리뷰 생성 요청
interface ReviewCreateRequest {
  client_id: number;
  expert_id: number;
  content_id?: number;
  rating: number;
  review_text?: string;
}

// 리뷰 수정 요청
interface ReviewUpdateRequest {
  rating?: number;
  review_text?: string;
  review_status?: ReviewStatus;
}
```

## 📊 랭킹 시스템 타입

```typescript
// 랭킹 타입 정의
type RankingType = 'ai_service' | 'content' | 'expert' | 'category';
type EntityType = 'ai_service_id' | 'content_id' | 'expert_id' | 'category_id';

// 콘텐츠 조회 기록
interface ContentView {
  id: number;
  content_id: number;
  user_id?: number;
  view_date: Date;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// 랭킹 가중치
interface RankingWeight {
  id: number;
  ranking_type: RankingType;
  weight_name: string;
  weight_value: number;
  weight_description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// 랭킹 결과
interface Ranking {
  id: number;
  ranking_type: RankingType;
  entity_id: number;
  entity_type: EntityType;
  total_score: number;
  view_count: number;
  request_count: number;
  avg_rating: number;
  ranking_date: Date;
  created_at: Date;
  updated_at: Date;
}

// 랭킹 결과 (API 응답용)
interface RankingResult {
  entity_id: number;
  entity_name: string;
  total_score: number;
  view_count: number;
  request_count: number;
  avg_rating: number;
  rank: number;
}

// 랭킹 필터
interface RankingFilters {
  ranking_type?: RankingType;
  date_from?: Date;
  date_to?: Date;
  limit?: number;
}

// 랭킹 가중치 업데이트
interface RankingWeightUpdate {
  ranking_type: RankingType;
  weight_name: string;
  weight_value: number;
  weight_description?: string;
}

// 랭킹 계산용 데이터
interface RankingData {
  entity_id: number;
  entity_name: string;
  view_count: number;
  request_count: number;
  avg_rating: number;
  content_count?: number;
}
```

## 📁 파일 업로드 타입

```typescript
// 파일 업로드 타입
type UploadType = 'categories' | 'companies' | 'ai-services';

// 파일 정보
interface FileInfo {
  filename: string;
  originalName: string;
  size: number;
  url: string;
  type: UploadType;
}

// 파일 업로드 응답
interface FileUploadResponse {
  success: boolean;
  data?: FileInfo;
  error?: string;
}
```

## 🛠️ 유틸리티 타입

```typescript
// 부분 업데이트를 위한 유틸리티 타입
type PartialUpdate<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

// ID만 포함하는 타입
type WithId<T> = T & { id: number };

// 타임스탬프가 포함된 타입
type WithTimestamps<T> = T & {
  created_at: Date;
  updated_at: Date;
};

// 소프트 삭제가 가능한 타입
type SoftDeletable<T> = T & {
  deleted_at?: Date;
};

// 페이지네이션이 적용된 응답 타입
type PaginatedApiResponse<T> = ApiResponse<PaginatedResponse<T>>;
```

## 🎯 API 클라이언트 타입

```typescript
// API 클라이언트 인터페이스
interface ApiClient {
  // 사용자 관리
  getUsers(params?: PaginationParams, filters?: UserFilters): Promise<PaginatedApiResponse<User>>;
  createUser(data: UserCreateRequest): Promise<ApiResponse<User>>;
  getUserById(id: number): Promise<ApiResponse<User>>;
  updateUser(id: number, data: UserUpdateRequest): Promise<ApiResponse<User>>;
  deleteUser(id: number): Promise<ApiResponse<void>>;

  // AI 서비스 관리
  getAIServices(params?: PaginationParams, filters?: AIServiceFilters): Promise<PaginatedApiResponse<AIService>>;
  createAIService(data: AIServiceCreateRequest): Promise<ApiResponse<AIService>>;
  getAIServiceById(id: number): Promise<ApiResponse<AIService>>;
  getAIServiceDetail(id: number): Promise<ApiResponse<AIService>>;
  updateAIService(id: number, data: AIServiceUpdateRequest): Promise<ApiResponse<AIService>>;
  deleteAIService(id: number): Promise<ApiResponse<void>>;
  searchAIServices(query: string): Promise<ApiResponse<AIService[]>>;

  // 전문가 관리
  getExperts(params?: PaginationParams, filters?: ExpertFilters, options?: ExpertListOptions): Promise<PaginatedApiResponse<ExpertWithRelations>>;
  createExpert(data: ExpertCreateRequest): Promise<ApiResponse<Expert>>;
  getExpertById(id: number): Promise<ApiResponse<Expert>>;
  getExpertDetail(id: number): Promise<ApiResponse<ExpertWithRelations>>;
  updateExpert(id: number, data: ExpertUpdateRequest): Promise<ApiResponse<Expert>>;
  deleteExpert(id: number): Promise<ApiResponse<void>>;
  searchExperts(query: string): Promise<ApiResponse<Expert[]>>;

  // 콘텐츠 관리
  getContents(params?: PaginationParams, filters?: ContentFilters, options?: ContentListOptions): Promise<PaginatedApiResponse<ContentWithRelations>>;
  createContent(data: ContentCreateRequest): Promise<ApiResponse<Content>>;
  getContentById(id: number): Promise<ApiResponse<Content>>;
  getContentDetail(id: number): Promise<ApiResponse<ContentWithRelations>>;
  updateContent(id: number, data: ContentUpdateRequest): Promise<ApiResponse<Content>>;
  deleteContent(id: number): Promise<ApiResponse<void>>;
  searchContents(query: string): Promise<ApiResponse<Content[]>>;

  // 랭킹 시스템
  getRankings(type: RankingType, filters?: RankingFilters): Promise<ApiResponse<RankingResult[]>>;
  recordContentView(contentId: number, userId?: number): Promise<ApiResponse<void>>;
  calculateRankings(dateFrom?: string, dateTo?: string): Promise<ApiResponse<void>>;

  // 파일 업로드
  uploadFile(file: File, type: UploadType): Promise<FileUploadResponse>;
  getFileList(type: UploadType): Promise<ApiResponse<FileInfo[]>>;
  deleteFile(type: UploadType, filename: string): Promise<ApiResponse<void>>;
}
```

## 📱 React Hook 타입 예시

```typescript
// React Hook에서 사용할 수 있는 타입 예시
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiActions<T> {
  fetch: () => Promise<void>;
  create: (data: any) => Promise<T | null>;
  update: (id: number, data: any) => Promise<T | null>;
  delete: (id: number) => Promise<boolean>;
}

type UseApiReturn<T> = UseApiState<T> & UseApiActions<T>;

// 사용 예시
interface UseUsersReturn extends UseApiReturn<User[]> {
  pagination: PaginationParams;
  setPagination: (params: PaginationParams) => void;
  filters: UserFilters;
  setFilters: (filters: UserFilters) => void;
}
```

## 🔧 타입 가드 함수

```typescript
// 타입 가드 함수들
function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'number' && typeof obj.username === 'string';
}

function isExpert(obj: any): obj is Expert {
  return obj && typeof obj.id === 'number' && typeof obj.expert_name === 'string';
}

function isAIService(obj: any): obj is AIService {
  return obj && typeof obj.id === 'number' && typeof obj.ai_name === 'string';
}

function isContent(obj: any): obj is Content {
  return obj && typeof obj.id === 'number' && typeof obj.content_title === 'string';
}

function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return obj && typeof obj.success === 'boolean';
}

function isPaginatedResponse<T>(obj: any): obj is PaginatedResponse<T> {
  return obj && Array.isArray(obj.data) && obj.pagination;
}
```

## 📦 NPM 패키지로 사용하기

이 타입 정의들을 별도의 NPM 패키지로 만들어 사용할 수 있습니다:

```typescript
// @stepai/api-types 패키지 예시
export * from './types/user';
export * from './types/expert';
export * from './types/ai-service';
export * from './types/content';
export * from './types/ranking';
export * from './types/api';
export * from './types/utils';
```

```bash
# 설치
npm install @stepai/api-types

# 사용
import { User, Expert, AIService, ApiResponse } from '@stepai/api-types';
```

---

이 타입 가이드는 StepAI API v1.0.0과 함께 사용하도록 설계되었습니다. API 업데이트 시 타입 정의도 함께 업데이트됩니다.