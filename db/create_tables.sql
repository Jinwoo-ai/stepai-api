-- StepAI API Database Schema - AI 서비스 소개 및 이용방법 추천 서비스
-- MySQL 8.0 이상 버전용
-- 실제 STEPAI 데이터베이스 기준으로 생성됨

CREATE TABLE `access_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `access_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ad_partnerships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_name` varchar(100) NOT NULL COMMENT '회사명',
  `contact_person` varchar(50) NOT NULL COMMENT '담당자명',
  `contact_email` varchar(100) NOT NULL COMMENT '담당자 이메일',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '연락처',
  `partnership_type` varchar(50) NOT NULL COMMENT '제휴 유형',
  `budget_range` varchar(50) DEFAULT NULL COMMENT '예산 범위',
  `campaign_period` varchar(100) DEFAULT NULL COMMENT '캠페인 기간',
  `target_audience` text DEFAULT NULL COMMENT '타겟 고객층',
  `campaign_description` text DEFAULT NULL COMMENT '캠페인 설명',
  `additional_requirements` text DEFAULT NULL COMMENT '추가 요구사항',
  `attachment_url` varchar(500) DEFAULT NULL COMMENT '첨부파일 URL',
  `inquiry_status` varchar(20) DEFAULT 'pending' COMMENT '문의 상태',
  `admin_notes` text DEFAULT NULL COMMENT '관리자 메모',
  `response_date` timestamp NULL DEFAULT NULL COMMENT '응답일',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_partnership_type` (`partnership_type`),
  KEY `idx_inquiry_status` (`inquiry_status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_service_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_service_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `is_main_category` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ai_service_category` (`ai_service_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `ai_service_categories_ibfk_1` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_service_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4588 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_service_category_display_order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `ai_service_id` int(11) NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_featured` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_service_order` (`category_id`,`ai_service_id`),
  KEY `ai_service_id` (`ai_service_id`),
  KEY `idx_category_display_order` (`category_id`,`display_order`),
  KEY `idx_category_featured` (`category_id`,`is_featured`,`display_order`),
  CONSTRAINT `ai_service_category_display_order_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_service_category_display_order_ibfk_2` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=513 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_service_contents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_service_id` int(11) NOT NULL,
  `content_type` varchar(50) NOT NULL,
  `content_title` varchar(200) DEFAULT NULL,
  `content_text` text DEFAULT NULL,
  `content_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ai_service_contents_service` (`ai_service_id`),
  KEY `idx_ai_service_contents_type` (`content_type`),
  CONSTRAINT `ai_service_contents_ibfk_1` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6064 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_service_pricing_models` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_service_id` int(11) NOT NULL,
  `pricing_model_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ai_service_pricing` (`ai_service_id`,`pricing_model_id`),
  KEY `pricing_model_id` (`pricing_model_id`),
  CONSTRAINT `ai_service_pricing_models_ibfk_1` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_service_pricing_models_ibfk_2` FOREIGN KEY (`pricing_model_id`) REFERENCES `pricing_models` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5325 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_service_similar_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_service_id` int(11) NOT NULL,
  `similar_service_id` int(11) NOT NULL,
  `similarity_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_similar_service` (`ai_service_id`,`similar_service_id`),
  KEY `idx_ai_service_similar_service` (`ai_service_id`),
  KEY `idx_ai_service_similar_similar` (`similar_service_id`),
  CONSTRAINT `ai_service_similar_services_ibfk_1` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_service_similar_services_ibfk_2` FOREIGN KEY (`similar_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_service_sns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_service_id` int(11) NOT NULL,
  `sns_type` varchar(50) NOT NULL,
  `sns_url` varchar(500) NOT NULL,
  `sns_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ai_service_sns_service` (`ai_service_id`),
  KEY `idx_ai_service_sns_type` (`sns_type`),
  CONSTRAINT `ai_service_sns_ibfk_1` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_service_tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_service_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ai_service_tag` (`ai_service_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `ai_service_tags_ibfk_1` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_service_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19615 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_service_target_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_service_id` int(11) NOT NULL,
  `target_type_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ai_service_target` (`ai_service_id`,`target_type_id`),
  KEY `target_type_id` (`target_type_id`),
  CONSTRAINT `ai_service_target_types_ibfk_1` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_service_target_types_ibfk_2` FOREIGN KEY (`target_type_id`) REFERENCES `target_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5091 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_service_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_service_id` int(11) NOT NULL,
  `ai_type_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ai_service_type` (`ai_service_id`,`ai_type_id`),
  KEY `ai_type_id` (`ai_type_id`),
  CONSTRAINT `ai_service_types_ibfk_1` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_service_types_ibfk_2` FOREIGN KEY (`ai_type_id`) REFERENCES `ai_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6602 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_service_views` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_service_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `view_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_ai_service_views_service` (`ai_service_id`),
  KEY `idx_ai_service_views_date` (`view_date`),
  CONSTRAINT `ai_service_views_ibfk_1` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_service_views_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_name` varchar(100) NOT NULL,
  `ai_name_en` varchar(100) DEFAULT NULL,
  `ai_description` text DEFAULT NULL,
  `ai_website` varchar(255) DEFAULT NULL,
  `ai_logo` varchar(255) DEFAULT NULL,
  `company_name` varchar(100) DEFAULT NULL,
  `company_name_en` varchar(100) DEFAULT NULL,
  `embedded_video_url` varchar(500) DEFAULT NULL,
  `headquarters` varchar(50) DEFAULT NULL,
  `main_features` text DEFAULT NULL,
  `target_users` text DEFAULT NULL,
  `use_cases` text DEFAULT NULL,
  `pricing_info` text DEFAULT NULL,
  `difficulty_level` varchar(20) DEFAULT 'beginner',
  `usage_availability` varchar(10) DEFAULT NULL,
  `ai_status` varchar(20) DEFAULT 'active',
  `is_visible` tinyint(1) DEFAULT 1,
  `is_step_pick` tinyint(1) DEFAULT 0,
  `is_new` tinyint(1) DEFAULT 0,
  `nationality` varchar(20) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ai_services_status` (`ai_status`),
  KEY `idx_ai_services_nationality` (`nationality`)
) ENGINE=InnoDB AUTO_INCREMENT=540 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) NOT NULL,
  `type_description` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_name` (`type_name`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_video_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_video_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ai_video_category` (`ai_video_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `ai_video_categories_ibfk_1` FOREIGN KEY (`ai_video_id`) REFERENCES `ai_videos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_video_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_video_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_video_id` int(11) NOT NULL,
  `ai_service_id` int(11) NOT NULL,
  `usage_description` text DEFAULT NULL,
  `usage_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ai_video_service` (`ai_video_id`,`ai_service_id`),
  KEY `ai_service_id` (`ai_service_id`),
  CONSTRAINT `ai_video_services_ibfk_1` FOREIGN KEY (`ai_video_id`) REFERENCES `ai_videos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_video_services_ibfk_2` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_video_tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_video_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ai_video_tag` (`ai_video_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `ai_video_tags_ibfk_1` FOREIGN KEY (`ai_video_id`) REFERENCES `ai_videos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_video_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_video_views` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_video_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `view_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_ai_video_views_video` (`ai_video_id`),
  KEY `idx_ai_video_views_date` (`view_date`),
  CONSTRAINT `ai_video_views_ibfk_1` FOREIGN KEY (`ai_video_id`) REFERENCES `ai_videos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_video_views_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ai_videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `video_title` varchar(200) NOT NULL,
  `video_description` text DEFAULT NULL,
  `video_url` varchar(255) NOT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `duration` int(11) DEFAULT 0,
  `video_status` varchar(20) DEFAULT 'active',
  `is_visible` tinyint(1) DEFAULT 1,
  `view_count` int(11) DEFAULT 0,
  `like_count` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ai_videos_status` (`video_status`),
  KEY `idx_ai_videos_view_count` (`view_count`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `category_description` text DEFAULT NULL,
  `category_icon` varchar(255) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `category_order` int(11) DEFAULT 0,
  `category_status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_categories_parent` (`parent_id`),
  KEY `idx_categories_status` (`category_status`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `curation_ai_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curation_id` int(11) NOT NULL,
  `ai_service_id` int(11) NOT NULL,
  `service_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_curation_ai_service` (`curation_id`,`ai_service_id`),
  KEY `ai_service_id` (`ai_service_id`),
  CONSTRAINT `curation_ai_services_ibfk_1` FOREIGN KEY (`curation_id`) REFERENCES `curations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `curation_ai_services_ibfk_2` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `curations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curation_title` varchar(200) NOT NULL,
  `curation_description` text DEFAULT NULL,
  `curation_thumbnail` varchar(255) DEFAULT NULL,
  `curation_order` int(11) DEFAULT 0,
  `curation_status` varchar(20) DEFAULT 'active',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `homepage_curations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curation_id` int(11) NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_homepage_curation` (`curation_id`),
  KEY `idx_homepage_curation_order` (`display_order`,`is_active`),
  CONSTRAINT `homepage_curations_ibfk_1` FOREIGN KEY (`curation_id`) REFERENCES `curations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `homepage_step_pick_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_service_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_homepage_step_pick` (`ai_service_id`),
  KEY `idx_homepage_step_pick_order` (`display_order`,`is_active`),
  KEY `idx_homepage_step_pick_category` (`category_id`),
  CONSTRAINT `homepage_step_pick_services_ibfk_1` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `homepage_step_pick_services_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `homepage_videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ai_video_id` int(11) NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_homepage_video` (`ai_video_id`),
  KEY `idx_homepage_video_order` (`display_order`,`is_active`),
  CONSTRAINT `homepage_videos_ibfk_1` FOREIGN KEY (`ai_video_id`) REFERENCES `ai_videos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `inquiries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '문의자 이름',
  `email` varchar(255) NOT NULL COMMENT '문의자 이메일',
  `phone` varchar(20) DEFAULT NULL COMMENT '문의자 전화번호',
  `inquiry_type` enum('general','technical','partnership','bug_report','feature_request') DEFAULT 'general' COMMENT '문의 유형',
  `subject` varchar(255) NOT NULL COMMENT '문의 제목',
  `message` text NOT NULL COMMENT '문의 내용',
  `attachment_url` varchar(500) DEFAULT NULL COMMENT '첨부파일 URL',
  `inquiry_status` enum('pending','in_progress','resolved','closed') DEFAULT 'pending' COMMENT '문의 상태',
  `admin_notes` text DEFAULT NULL COMMENT '관리자 메모',
  `response_date` datetime DEFAULT NULL COMMENT '답변 일시',
  `created_at` datetime DEFAULT current_timestamp() COMMENT '생성일시',
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`id`),
  KEY `idx_inquiry_type` (`inquiry_type`),
  KEY `idx_inquiry_status` (`inquiry_status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='고객문의 테이블';

CREATE TABLE `pricing_models` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `model_name` varchar(50) NOT NULL,
  `model_description` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `model_name` (`model_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `rankings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ranking_type` varchar(50) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `total_score` decimal(10,3) NOT NULL,
  `view_count` int(11) DEFAULT 0,
  `favorite_count` int(11) DEFAULT 0,
  `avg_rating` decimal(3,2) DEFAULT 0.00,
  `ranking_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ranking` (`ranking_type`,`entity_id`,`ranking_date`),
  KEY `idx_rankings_type_date` (`ranking_type`,`ranking_date`),
  KEY `idx_rankings_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `review_type` varchar(20) NOT NULL,
  `review_target_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `review_text` text DEFAULT NULL,
  `review_status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_review` (`user_id`,`review_type`,`review_target_id`),
  KEY `idx_reviews_type_target` (`review_type`,`review_target_id`),
  KEY `idx_reviews_rating` (`rating`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `site_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `site_title` varchar(200) NOT NULL DEFAULT 'StepAI',
  `company_name` varchar(100) NOT NULL DEFAULT 'StepAI',
  `ceo_name` varchar(50) DEFAULT NULL,
  `business_number` varchar(20) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `privacy_officer` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tag_name` varchar(50) NOT NULL,
  `tag_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `tag_name` (`tag_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3502 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `target_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type_code` varchar(10) NOT NULL,
  `type_name` varchar(50) NOT NULL,
  `type_description` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_code` (`type_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `trend_section_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trend_section_id` int(11) NOT NULL,
  `ai_service_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_trend_service` (`trend_section_id`,`ai_service_id`),
  KEY `ai_service_id` (`ai_service_id`),
  KEY `idx_trend_service_order` (`trend_section_id`,`display_order`,`is_featured`),
  KEY `idx_trend_section_services_display_order` (`display_order`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `trend_section_services_ibfk_1` FOREIGN KEY (`trend_section_id`) REFERENCES `trend_sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `trend_section_services_ibfk_2` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `trend_section_services_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `trend_sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `section_type` varchar(50) NOT NULL,
  `section_title` varchar(100) NOT NULL,
  `section_description` text DEFAULT NULL,
  `is_category_based` tinyint(1) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_trend_section` (`section_type`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `user_favorite_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `ai_service_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_service` (`user_id`,`ai_service_id`),
  KEY `ai_service_id` (`ai_service_id`),
  KEY `idx_user_favorite_services_user_id` (`user_id`),
  CONSTRAINT `user_favorite_services_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_favorite_services_ibfk_2` FOREIGN KEY (`ai_service_id`) REFERENCES `ai_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `user_favorite_videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `ai_video_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_video` (`user_id`,`ai_video_id`),
  KEY `ai_video_id` (`ai_video_id`),
  KEY `idx_user_favorite_videos_user_id` (`user_id`),
  CONSTRAINT `user_favorite_videos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_favorite_videos_ibfk_2` FOREIGN KEY (`ai_video_id`) REFERENCES `ai_videos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `user_favorites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `favorite_type` varchar(20) NOT NULL,
  `favorite_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_favorite` (`user_id`,`favorite_type`,`favorite_id`),
  KEY `idx_user_favorites_user` (`user_id`),
  KEY `idx_user_favorites_type` (`favorite_type`,`favorite_id`),
  CONSTRAINT `user_favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `user_sns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sns_type` varchar(20) NOT NULL COMMENT 'SNS 종류',
  `sns_user_id` varchar(100) NOT NULL COMMENT 'SNS 사용자 ID',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_sns_user` (`sns_type`,`sns_user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_sns_type` (`sns_type`),
  CONSTRAINT `fk_user_sns_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `industry` varchar(50) DEFAULT NULL,
  `job_role` varchar(50) DEFAULT NULL,
  `job_level` varchar(30) DEFAULT NULL,
  `experience_years` int(11) DEFAULT NULL,
  `user_type` varchar(20) DEFAULT 'member',
  `user_status` varchar(20) DEFAULT 'active',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_type_status` (`user_type`,`user_status`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

