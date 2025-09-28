-- AI 서비스 테이블에 is_new 컬럼 추가
ALTER TABLE ai_services ADD COLUMN is_new BOOLEAN DEFAULT FALSE AFTER is_step_pick;