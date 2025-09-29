# StepAI Database Schema Guide

## 📋 개요
StepAI 서비스의 데이터베이스 스키마 구조를 설명합니다.
총 40개의 테이블로 구성되어 있습니다.

## 🗂️ 테이블 목록

### access_tokens

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| user_id | int(11) | NO | MUL |  |  |
| token | varchar(255) | NO | UNI |  |  |
| expires_at | timestamp | NO | MUL | current_timestamp() | on update current_timestamp() |
| created_at | timestamp | NO |  | current_timestamp() |  |

**인덱스**: token, idx_token, idx_user_id, idx_expires_at

### ad_partnerships

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| company_name | varchar(100) | NO |  |  |  |
| contact_person | varchar(50) | NO |  |  |  |
| contact_email | varchar(100) | NO |  |  |  |
| contact_phone | varchar(20) | YES |  |  |  |
| partnership_type | varchar(50) | NO | MUL |  |  |
| budget_range | varchar(50) | YES |  |  |  |
| campaign_period | varchar(100) | YES |  |  |  |
| target_audience | text | YES |  |  |  |
| campaign_description | text | YES |  |  |  |
| additional_requirements | text | YES |  |  |  |
| attachment_url | varchar(500) | YES |  |  |  |
| inquiry_status | varchar(20) | YES | MUL | pending |  |
| admin_notes | text | YES |  |  |  |
| response_date | timestamp | YES |  |  |  |
| created_at | timestamp | NO | MUL | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: idx_partnership_type, idx_inquiry_status, idx_created_at

### ai_service_categories

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_service_id | int(11) | NO | MUL |  |  |
| category_id | int(11) | NO | MUL |  |  |
| is_main_category | tinyint(1) | YES |  | 0 |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_ai_service_category, category_id

### ai_service_category_display_order

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| category_id | int(11) | NO | MUL |  |  |
| ai_service_id | int(11) | NO | MUL |  |  |
| display_order | int(11) | NO |  | 0 |  |
| is_featured | tinyint(1) | YES |  | 0 |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_category_service_order, ai_service_id, idx_category_display_order, idx_category_featured

### ai_service_contents

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_service_id | int(11) | NO | MUL |  |  |
| content_type | varchar(50) | NO | MUL |  |  |
| content_title | varchar(200) | YES |  |  |  |
| content_text | text | YES |  |  |  |
| content_order | int(11) | YES |  | 0 |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: idx_ai_service_contents_service, idx_ai_service_contents_type

### ai_service_pricing_models

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_service_id | int(11) | NO | MUL |  |  |
| pricing_model_id | int(11) | NO | MUL |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

**인덱스**: unique_ai_service_pricing, pricing_model_id

### ai_service_similar_services

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_service_id | int(11) | NO | MUL |  |  |
| similar_service_id | int(11) | NO | MUL |  |  |
| similarity_reason | text | YES |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_similar_service, idx_ai_service_similar_service, idx_ai_service_similar_similar

### ai_service_sns

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_service_id | int(11) | NO | MUL |  |  |
| sns_type | varchar(50) | NO | MUL |  |  |
| sns_url | varchar(500) | NO |  |  |  |
| sns_order | int(11) | YES |  | 0 |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: idx_ai_service_sns_service, idx_ai_service_sns_type

### ai_service_tags

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_service_id | int(11) | NO | MUL |  |  |
| tag_id | int(11) | NO | MUL |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

**인덱스**: unique_ai_service_tag, tag_id

### ai_service_target_types

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_service_id | int(11) | NO | MUL |  |  |
| target_type_id | int(11) | NO | MUL |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

**인덱스**: unique_ai_service_target, target_type_id

### ai_service_types

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_service_id | int(11) | NO | MUL |  |  |
| ai_type_id | int(11) | NO | MUL |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

**인덱스**: unique_ai_service_type, ai_type_id

### ai_service_views

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_service_id | int(11) | NO | MUL |  |  |
| user_id | int(11) | YES | MUL |  |  |
| view_date | timestamp | NO | MUL | current_timestamp() |  |
| ip_address | varchar(45) | YES |  |  |  |
| user_agent | text | YES |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

**인덱스**: user_id, idx_ai_service_views_service, idx_ai_service_views_date

### ai_services

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_name | varchar(100) | NO |  |  |  |
| ai_name_en | varchar(100) | YES |  |  |  |
| ai_description | text | YES |  |  |  |
| ai_website | varchar(255) | YES |  |  |  |
| ai_logo | varchar(255) | YES |  |  |  |
| company_name | varchar(100) | YES |  |  |  |
| company_name_en | varchar(100) | YES |  |  |  |
| embedded_video_url | varchar(500) | YES |  |  |  |
| headquarters | varchar(50) | YES |  |  |  |
| main_features | text | YES |  |  |  |
| target_users | text | YES |  |  |  |
| use_cases | text | YES |  |  |  |
| pricing_info | text | YES |  |  |  |
| difficulty_level | varchar(20) | YES |  | beginner |  |
| usage_availability | varchar(10) | YES |  |  |  |
| ai_status | varchar(20) | YES | MUL | active |  |
| is_visible | tinyint(1) | YES |  | 1 |  |
| is_step_pick | tinyint(1) | YES |  | 0 |  |
| is_new | tinyint(1) | YES |  | 0 |  |
| nationality | varchar(20) | YES | MUL |  |  |
| deleted_at | timestamp | YES |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: idx_ai_services_status, idx_ai_services_nationality

### ai_services_backup

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_name | varchar(100) | NO |  |  |  |
| ai_name_en | varchar(100) | YES |  |  |  |
| ai_description | text | YES |  |  |  |
| ai_website | varchar(255) | YES |  |  |  |
| ai_logo | varchar(255) | YES |  |  |  |
| company_name | varchar(100) | YES |  |  |  |
| company_name_en | varchar(100) | YES |  |  |  |
| embedded_video_url | varchar(500) | YES |  |  |  |
| headquarters | varchar(50) | YES |  |  |  |
| main_features | text | YES |  |  |  |
| target_users | text | YES |  |  |  |
| use_cases | text | YES |  |  |  |
| pricing_info | text | YES |  |  |  |
| difficulty_level | varchar(20) | YES |  | beginner |  |
| usage_availability | varchar(10) | YES |  |  |  |
| ai_status | varchar(20) | YES | MUL | active |  |
| is_visible | tinyint(1) | YES |  | 1 |  |
| is_step_pick | tinyint(1) | YES |  | 0 |  |
| is_new | tinyint(1) | YES |  | 0 |  |
| nationality | varchar(20) | YES | MUL |  |  |
| deleted_at | timestamp | YES |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: idx_ai_services_status, idx_ai_services_nationality

### ai_types

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| type_name | varchar(50) | NO | UNI |  |  |
| type_description | varchar(200) | YES |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

**인덱스**: type_name

### ai_video_categories

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_video_id | int(11) | NO | MUL |  |  |
| category_id | int(11) | NO | MUL |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_ai_video_category, category_id

### ai_video_services

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_video_id | int(11) | NO | MUL |  |  |
| ai_service_id | int(11) | NO | MUL |  |  |
| usage_description | text | YES |  |  |  |
| usage_order | int(11) | YES |  | 0 |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_ai_video_service, ai_service_id

### ai_video_tags

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_video_id | int(11) | NO | MUL |  |  |
| tag_id | int(11) | NO | MUL |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

**인덱스**: unique_ai_video_tag, tag_id

### ai_video_views

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_video_id | int(11) | NO | MUL |  |  |
| user_id | int(11) | YES | MUL |  |  |
| view_date | timestamp | NO | MUL | current_timestamp() |  |
| ip_address | varchar(45) | YES |  |  |  |
| user_agent | text | YES |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

**인덱스**: user_id, idx_ai_video_views_video, idx_ai_video_views_date

### ai_videos

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| video_title | varchar(200) | NO |  |  |  |
| video_description | text | YES |  |  |  |
| video_url | varchar(255) | NO |  |  |  |
| thumbnail_url | varchar(255) | YES |  |  |  |
| duration | int(11) | YES |  | 0 |  |
| video_status | varchar(20) | YES | MUL | active |  |
| is_visible | tinyint(1) | YES |  | 1 |  |
| view_count | int(11) | YES | MUL | 0 |  |
| like_count | int(11) | YES |  | 0 |  |
| deleted_at | timestamp | YES |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: idx_ai_videos_status, idx_ai_videos_view_count

### categories

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| category_name | varchar(100) | NO |  |  |  |
| category_description | text | YES |  |  |  |
| category_icon | varchar(255) | YES |  |  |  |
| parent_id | int(11) | YES | MUL |  |  |
| category_order | int(11) | YES |  | 0 |  |
| category_status | varchar(20) | YES | MUL | active |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: idx_categories_parent, idx_categories_status

### curation_ai_services

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| curation_id | int(11) | NO | MUL |  |  |
| ai_service_id | int(11) | NO | MUL |  |  |
| service_order | int(11) | YES |  | 0 |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_curation_ai_service, ai_service_id

### curations

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| curation_title | varchar(200) | NO |  |  |  |
| curation_description | text | YES |  |  |  |
| curation_thumbnail | varchar(255) | YES |  |  |  |
| curation_order | int(11) | YES |  | 0 |  |
| curation_status | varchar(20) | YES |  | active |  |
| deleted_at | timestamp | YES |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

### homepage_curations

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| curation_id | int(11) | NO | UNI |  |  |
| display_order | int(11) | NO | MUL | 0 |  |
| is_active | tinyint(1) | YES |  | 1 |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_homepage_curation, idx_homepage_curation_order

### homepage_step_pick_services

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_service_id | int(11) | NO | UNI |  |  |
| category_id | int(11) | YES | MUL |  |  |
| display_order | int(11) | NO | MUL | 0 |  |
| is_active | tinyint(1) | YES |  | 1 |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_homepage_step_pick, idx_homepage_step_pick_order, idx_homepage_step_pick_category

### homepage_videos

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ai_video_id | int(11) | NO | UNI |  |  |
| display_order | int(11) | NO | MUL | 0 |  |
| is_active | tinyint(1) | YES |  | 1 |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_homepage_video, idx_homepage_video_order

### inquiries

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| name | varchar(100) | NO |  |  |  |
| email | varchar(255) | NO | MUL |  |  |
| phone | varchar(20) | YES |  |  |  |
| inquiry_type | enum('general','technical','partnership','bug_report','feature_request') | YES | MUL | general |  |
| subject | varchar(255) | NO |  |  |  |
| message | text | NO |  |  |  |
| attachment_url | varchar(500) | YES |  |  |  |
| inquiry_status | enum('pending','in_progress','resolved','closed') | YES | MUL | pending |  |
| admin_notes | text | YES |  |  |  |
| response_date | datetime | YES |  |  |  |
| created_at | datetime | YES | MUL | current_timestamp() |  |
| updated_at | datetime | YES |  | current_timestamp() | on update current_timestamp() |

**인덱스**: idx_inquiry_type, idx_inquiry_status, idx_created_at, idx_email

### pricing_models

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| model_name | varchar(50) | NO | UNI |  |  |
| model_description | varchar(200) | YES |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

**인덱스**: model_name

### rankings

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| ranking_type | varchar(50) | NO | MUL |  |  |
| entity_id | int(11) | NO |  |  |  |
| entity_type | varchar(50) | NO | MUL |  |  |
| total_score | decimal(10,3) | NO |  |  |  |
| view_count | int(11) | YES |  | 0 |  |
| favorite_count | int(11) | YES |  | 0 |  |
| avg_rating | decimal(3,2) | YES |  | 0.00 |  |
| ranking_date | date | NO |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_ranking, idx_rankings_type_date, idx_rankings_entity

### reviews

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| user_id | int(11) | NO | MUL |  |  |
| review_type | varchar(20) | NO | MUL |  |  |
| review_target_id | int(11) | NO |  |  |  |
| rating | int(11) | NO | MUL |  |  |
| review_text | text | YES |  |  |  |
| review_status | varchar(20) | YES |  | active |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_user_review, idx_reviews_type_target, idx_reviews_rating

### site_settings

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| site_title | varchar(200) | NO |  | StepAI |  |
| company_name | varchar(100) | NO |  | StepAI |  |
| ceo_name | varchar(50) | YES |  |  |  |
| business_number | varchar(20) | YES |  |  |  |
| phone_number | varchar(20) | YES |  |  |  |
| address | text | YES |  |  |  |
| privacy_officer | varchar(50) | YES |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

### tags

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| tag_name | varchar(50) | NO | UNI |  |  |
| tag_count | int(11) | YES |  | 0 |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: tag_name

### target_types

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| type_code | varchar(10) | NO | UNI |  |  |
| type_name | varchar(50) | NO |  |  |  |
| type_description | varchar(200) | YES |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

**인덱스**: type_code

### trend_section_services

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| trend_section_id | int(11) | NO | MUL |  |  |
| ai_service_id | int(11) | NO | MUL |  |  |
| category_id | int(11) | YES | MUL |  |  |
| display_order | int(11) | NO | MUL | 0 |  |
| is_featured | tinyint(1) | YES |  | 0 |  |
| is_active | tinyint(1) | YES |  | 1 |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_trend_service, ai_service_id, idx_trend_service_order, idx_trend_section_services_display_order, category_id

### trend_sections

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| section_type | varchar(50) | NO | UNI |  |  |
| section_title | varchar(100) | NO |  |  |  |
| section_description | text | YES |  |  |  |
| is_category_based | tinyint(1) | YES |  | 1 |  |
| is_active | tinyint(1) | YES |  | 1 |  |
| display_order | int(11) | NO |  | 0 |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_trend_section

### user_favorite_services

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| user_id | int(11) | NO | MUL |  |  |
| ai_service_id | int(11) | NO | MUL |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

**인덱스**: unique_user_service, ai_service_id, idx_user_favorite_services_user_id

### user_favorite_videos

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| user_id | int(11) | NO | MUL |  |  |
| ai_video_id | int(11) | NO | MUL |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

**인덱스**: unique_user_video, ai_video_id, idx_user_favorite_videos_user_id

### user_favorites

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| user_id | int(11) | NO | MUL |  |  |
| favorite_type | varchar(20) | NO | MUL |  |  |
| favorite_id | int(11) | NO |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_user_favorite, idx_user_favorites_user, idx_user_favorites_type

### user_sns

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| user_id | int(11) | NO | MUL |  |  |
| sns_type | varchar(20) | NO | MUL |  |  |
| sns_user_id | varchar(100) | NO |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: unique_sns_user, idx_user_id, idx_sns_type

### users

| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |
|--------|------|------|-----|--------|----------|
| id | int(11) | NO | PRI |  | auto_increment |
| name | varchar(50) | YES |  |  |  |
| email | varchar(100) | NO | UNI |  |  |
| password | varchar(255) | YES |  |  |  |
| industry | varchar(50) | YES |  |  |  |
| job_role | varchar(50) | YES |  |  |  |
| job_level | varchar(30) | YES |  |  |  |
| experience_years | int(11) | YES |  |  |  |
| user_type | varchar(20) | YES | MUL | member |  |
| user_status | varchar(20) | YES |  | active |  |
| deleted_at | timestamp | YES |  |  |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| updated_at | timestamp | NO |  | current_timestamp() | on update current_timestamp() |

**인덱스**: email, idx_users_email, idx_users_type_status

