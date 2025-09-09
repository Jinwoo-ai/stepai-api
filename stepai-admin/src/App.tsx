import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './App.css';

interface Category {
  id: number;
  category_name: string;
  category_description?: string;
  category_icon?: string;
  parent_id?: number;
  category_order: number;
  category_status: string;
  children?: Category[];
  created_at?: string;
  updated_at?: string;
}

interface AIService {
  id?: number;
  ai_name: string;
  ai_description: string;
  ai_type: string;
  ai_website: string;
  ai_logo?: string;
  pricing_model: string;
  pricing_info?: string;
  difficulty_level: string;
  ai_status: string;
  is_visible: boolean;
  is_step_pick: boolean;
  nationality: string;
  categories?: Array<{
    id: number;
    category_name: string;
    is_main_category: boolean;
  }>;
}

interface AIServiceContent {
  id?: number;
  ai_service_id: number;
  content_type: string;
  content_title: string;
  content_text: string;
  content_order: number;
}

interface DashboardStats {
  totalUsers: number;
  newUsers: number;
  totalAIServices: number;
  totalVideos: number;
  totalCategories: number;
  stepPickServices: number;
  activeServices: number;
  totalViews: number;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'categories' | 'services' | 'videos'>('dashboard');
  const [categories, setCategories] = useState<Category[]>([]);
  const [aiServices, setAiServices] = useState<AIService[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingService, setEditingService] = useState<AIService | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Array<{id: number, category_name: string, is_main_category: boolean}>>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<Category | null>(null);
  const [showSubCategorySelection, setShowSubCategorySelection] = useState(false);

  const [formData, setFormData] = useState<AIService>({
    ai_name: '',
    ai_description: '',
    ai_type: 'LLM',
    ai_website: '',
    pricing_model: 'free',
    difficulty_level: 'beginner',
    ai_status: 'active',
    is_visible: true,
    is_step_pick: false,
    nationality: 'US'
  });

  const [contents, setContents] = useState<AIServiceContent[]>([
    { ai_service_id: 0, content_type: 'target_users', content_title: '대상 사용자', content_text: '', content_order: 1 },
    { ai_service_id: 0, content_type: 'main_features', content_title: '주요 기능', content_text: '', content_order: 2 },
    { ai_service_id: 0, content_type: 'use_cases', content_title: '활용 사례', content_text: '', content_order: 3 }
  ]);

  useEffect(() => {
    fetchCategories();
    fetchAIServices();
    fetchDashboardStats();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/categories');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Categories response:', data);
      setCategories(data.data || data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAIServices = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/ai-services?include_categories=true');
      const data = await response.json();
      console.log('AI Services response:', data);
      setAiServices(data.data?.data || data.data || data);
    } catch (error) {
      console.error('Error fetching AI services:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/dashboard/stats');
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const addCategory = (category: Category) => {
    const isAlreadySelected = selectedCategories.some(cat => cat.id === category.id);
    if (isAlreadySelected) return;

    const newCategory = {
      id: category.id,
      category_name: category.category_name,
      is_main_category: selectedCategories.length === 0
    };

    setSelectedCategories([...selectedCategories, newCategory]);
    setShowCategoryModal(false);
    setSelectedMainCategory(null);
    setShowSubCategorySelection(false);
  };

  const removeCategory = (categoryId: number) => {
    const updatedCategories = selectedCategories.filter(cat => cat.id !== categoryId);
    
    if (updatedCategories.length > 0) {
      const hasMainCategory = updatedCategories.some(cat => cat.is_main_category);
      if (!hasMainCategory) {
        updatedCategories[0].is_main_category = true;
      }
    }
    
    setSelectedCategories(updatedCategories);
  };

  const setMainCategory = (categoryId: number) => {
    const updatedCategories = selectedCategories.map(cat => ({
      ...cat,
      is_main_category: cat.id === categoryId
    }));
    setSelectedCategories(updatedCategories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const serviceData = {
        ...formData,
        categories: selectedCategories
      };

      const url = editingService 
        ? `http://localhost:3004/api/ai-services/${editingService.id}`
        : 'http://localhost:3004/api/ai-services';
      
      const method = editingService ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });

      if (response.ok) {
        const savedService = await response.json();
        
        if (contents.some(content => content.content_text.trim())) {
          await saveContents(savedService.id || editingService?.id);
        }
        
        fetchAIServices();
        fetchDashboardStats();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving AI service:', error);
    }
  };

  const saveContents = async (serviceId: number) => {
    try {
      for (const content of contents) {
        if (content.content_text.trim()) {
          await fetch(`http://localhost:3004/api/ai-services/${serviceId}/contents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...content,
              ai_service_id: serviceId
            })
          });
        }
      }
    } catch (error) {
      console.error('Error saving contents:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      ai_name: '',
      ai_description: '',
      ai_type: 'LLM',
      ai_website: '',
      pricing_model: 'free',
      difficulty_level: 'beginner',
      ai_status: 'active',
      is_visible: true,
      is_step_pick: false,
      nationality: 'US'
    });
    setSelectedCategories([]);
    setContents([
      { ai_service_id: 0, content_type: 'target_users', content_title: '대상 사용자', content_text: '', content_order: 1 },
      { ai_service_id: 0, content_type: 'main_features', content_title: '주요 기능', content_text: '', content_order: 2 },
      { ai_service_id: 0, content_type: 'use_cases', content_title: '활용 사례', content_text: '', content_order: 3 }
    ]);
    setEditingService(null);
    setShowModal(false);
  };

  const editService = async (service: AIService) => {
    setFormData(service);
    setSelectedCategories(service.categories || []);
    setEditingService(service);
    
    // 기존 콘텐츠 불러오기
    try {
      const response = await fetch(`http://localhost:3004/api/ai-services/${service.id}/contents`);
      if (response.ok) {
        const existingContents = await response.json();
        const updatedContents = contents.map(content => {
          const existing = existingContents.find((ec: any) => ec.content_type === content.content_type);
          return existing ? { ...content, content_text: existing.content_text } : content;
        });
        setContents(updatedContents);
      }
    } catch (error) {
      console.error('Error fetching existing contents:', error);
    }
    
    setShowModal(true);
  };

  const deleteService = async (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await fetch(`http://localhost:3004/api/ai-services/${id}`, { method: 'DELETE' });
        fetchAIServices();
        fetchDashboardStats();
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const renderDashboard = () => (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>전체 회원 수</h3>
          <div className="stat-number">{dashboardStats?.totalUsers || 0}</div>
        </div>
        <div className="stat-card">
          <h3>신규 회원 수</h3>
          <div className="stat-number">{dashboardStats?.newUsers || 0}</div>
          <div className="stat-subtitle">최근 30일</div>
        </div>
        <div className="stat-card">
          <h3>등록된 AI 서비스</h3>
          <div className="stat-number">{dashboardStats?.totalAIServices || 0}</div>
        </div>
        <div className="stat-card">
          <h3>등록된 영상 수</h3>
          <div className="stat-number">{dashboardStats?.totalVideos || 0}</div>
        </div>
        <div className="stat-card">
          <h3>카테고리 수</h3>
          <div className="stat-number">{dashboardStats?.totalCategories || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Step Pick 서비스</h3>
          <div className="stat-number">{dashboardStats?.stepPickServices || 0}</div>
        </div>
        <div className="stat-card">
          <h3>활성 서비스</h3>
          <div className="stat-number">{dashboardStats?.activeServices || 0}</div>
        </div>
        <div className="stat-card">
          <h3>총 조회수</h3>
          <div className="stat-number">{dashboardStats?.totalViews || 0}</div>
        </div>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="categories-section">
      <div className="section-header">
        <h2>카테고리 관리</h2>
        <button className="add-button">카테고리 추가</button>
      </div>
      <div className="categories-tree">
        {categories.filter(cat => !cat.parent_id).map(mainCat => (
          <div key={mainCat.id} className="category-item main">
            <div className="category-info">
              <span className="category-icon">{mainCat.category_icon}</span>
              <span className="category-name">{mainCat.category_name}</span>
              <span className="category-status">{mainCat.category_status}</span>
            </div>
            {mainCat.children && mainCat.children.length > 0 && (
              <div className="sub-categories">
                {mainCat.children.map(subCat => (
                  <div key={subCat.id} className="category-item sub">
                    <div className="category-info">
                      <span className="category-icon">{subCat.category_icon}</span>
                      <span className="category-name">{subCat.category_name}</span>
                      <span className="category-status">{subCat.category_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="services-section">
      <div className="section-header">
        <h2>AI 서비스 관리</h2>
        <button onClick={() => setShowModal(true)} className="add-button">
          AI 서비스 추가
        </button>
      </div>
      <div className="services-grid">
        {aiServices.map(service => (
          <div key={service.id} className="service-card">
            <h3>{service.ai_name}</h3>
            <p>{service.ai_description}</p>
            <div className="service-meta">
              <span className={`status ${service.ai_status}`}>{service.ai_status}</span>
              <span className="type">{service.ai_type}</span>
              {service.is_step_pick && <span className="step-pick">Step Pick</span>}
            </div>
            <div className="service-categories">
              {service.categories?.map(cat => (
                <span key={cat.id} className={`category-tag ${cat.is_main_category ? 'main' : ''}`}>
                  {cat.category_name}
                  {cat.is_main_category && <span className="main-badge">메인</span>}
                </span>
              ))}
            </div>
            <div className="service-actions">
              <button onClick={() => editService(service)}>수정</button>
              <button onClick={() => deleteService(service.id!)} className="delete">삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>StepAI Admin</h1>
        <nav className="nav-tabs">
          <button 
            className={currentView === 'dashboard' ? 'active' : ''}
            onClick={() => setCurrentView('dashboard')}
          >
            대시보드
          </button>
          <button 
            className={currentView === 'categories' ? 'active' : ''}
            onClick={() => setCurrentView('categories')}
          >
            카테고리
          </button>
          <button 
            className={currentView === 'services' ? 'active' : ''}
            onClick={() => setCurrentView('services')}
          >
            AI 서비스
          </button>
          <button 
            className={currentView === 'videos' ? 'active' : ''}
            onClick={() => setCurrentView('videos')}
          >
            영상 관리
          </button>
        </nav>
      </header>

      <main className="main-content">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'categories' && renderCategories()}
        {currentView === 'services' && renderServices()}
        {currentView === 'videos' && (
          <div className="videos-section">
            <div className="section-header">
              <h2>영상 관리</h2>
              <button className="add-button">영상 추가</button>
            </div>
            <p>영상 관리 기능은 추후 구현 예정입니다.</p>
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingService ? 'AI 서비스 수정' : 'AI 서비스 추가'}</h2>
              <button onClick={resetForm} className="close-button">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>AI 서비스명</label>
                <input
                  type="text"
                  value={formData.ai_name}
                  onChange={(e) => setFormData({...formData, ai_name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>설명</label>
                <textarea
                  value={formData.ai_description}
                  onChange={(e) => setFormData({...formData, ai_description: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>AI 타입</label>
                  <select
                    value={formData.ai_type}
                    onChange={(e) => setFormData({...formData, ai_type: e.target.value})}
                  >
                    <option value="LLM">LLM</option>
                    <option value="RAG">RAG</option>
                    <option value="GPTs">GPTs</option>
                    <option value="Image_Generation">Image Generation</option>
                    <option value="Video_Generation">Video Generation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>난이도</label>
                  <select
                    value={formData.difficulty_level}
                    onChange={(e) => setFormData({...formData, difficulty_level: e.target.value})}
                  >
                    <option value="beginner">초급</option>
                    <option value="intermediate">중급</option>
                    <option value="advanced">고급</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>웹사이트</label>
                <input
                  type="url"
                  value={formData.ai_website}
                  onChange={(e) => setFormData({...formData, ai_website: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>가격 모델</label>
                  <select
                    value={formData.pricing_model}
                    onChange={(e) => setFormData({...formData, pricing_model: e.target.value})}
                  >
                    <option value="free">무료</option>
                    <option value="freemium">프리미엄</option>
                    <option value="paid">유료</option>
                    <option value="subscription">구독</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>국가</label>
                  <select
                    value={formData.nationality}
                    onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                  >
                    <option value="US">미국</option>
                    <option value="KR">한국</option>
                    <option value="CN">중국</option>
                    <option value="UK">영국</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>카테고리</label>
                <div className="selected-categories">
                  {selectedCategories.map(cat => (
                    <span key={cat.id} className={`category-tag ${cat.is_main_category ? 'main' : ''}`}>
                      {cat.category_name}
                      {cat.is_main_category && <span className="main-badge">메인</span>}
                      {!cat.is_main_category && (
                        <button type="button" onClick={() => setMainCategory(cat.id)} className="set-main-btn">
                          메인으로
                        </button>
                      )}
                      <button type="button" onClick={() => removeCategory(cat.id)} className="remove-btn">×</button>
                    </span>
                  ))}
                  <button type="button" onClick={() => setShowCategoryModal(true)} className="add-category-btn">
                    + 카테고리 추가
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_step_pick}
                    onChange={(e) => setFormData({...formData, is_step_pick: e.target.checked})}
                  />
                  Step Pick
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_visible}
                    onChange={(e) => setFormData({...formData, is_visible: e.target.checked})}
                  />
                  사이트 노출
                </label>
              </div>

              {contents.map((content, index) => (
                <div key={content.content_type} className="form-group">
                  <label>{content.content_title}</label>
                  <ReactQuill
                    value={content.content_text}
                    onChange={(value) => {
                      const updatedContents = [...contents];
                      updatedContents[index].content_text = value;
                      setContents(updatedContents);
                    }}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link']
                      ]
                    }}
                  />
                </div>
              ))}

              <div className="form-actions">
                <button type="button" onClick={resetForm}>취소</button>
                <button type="submit">{editingService ? '수정' : '추가'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal category-modal">
            <div className="modal-header">
              <h3>카테고리 선택</h3>
              <button onClick={() => {
                setShowCategoryModal(false);
                setSelectedMainCategory(null);
                setShowSubCategorySelection(false);
              }} className="close-button">×</button>
            </div>
            
            {!showSubCategorySelection ? (
              <div className="category-selection">
                <h4>메인 카테고리 선택</h4>
                <div className="category-list">
                  {categories.filter(cat => !cat.parent_id).map(mainCat => (
                    <div key={mainCat.id} className="category-option">
                      <button 
                        onClick={() => {
                          if (mainCat.children && mainCat.children.length > 0) {
                            setSelectedMainCategory(mainCat);
                            setShowSubCategorySelection(true);
                          } else {
                            addCategory(mainCat);
                          }
                        }}
                        className="category-button"
                      >
                        {mainCat.category_icon && <span>{mainCat.category_icon}</span>}
                        <span>{mainCat.category_name}</span>
                        {mainCat.children && mainCat.children.length > 0 && <span>›</span>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="category-selection">
                <div className="breadcrumb">
                  <button onClick={() => setShowSubCategorySelection(false)} className="back-button">
                    {selectedMainCategory?.category_name}
                  </button>
                  <span>&gt; 서브 카테고리 선택</span>
                </div>
                <div className="category-list">
                  <div className="category-option">
                    <button 
                      onClick={() => addCategory(selectedMainCategory!)}
                      className="category-button main-only"
                    >
                      {selectedMainCategory?.category_icon && <span>{selectedMainCategory.category_icon}</span>}
                      <span>{selectedMainCategory?.category_name} (메인만)</span>
                    </button>
                  </div>
                  {selectedMainCategory?.children?.map(subCat => (
                    <div key={subCat.id} className="category-option">
                      <button 
                        onClick={() => addCategory(subCat)}
                        className="category-button sub-category"
                      >
                        {subCat.category_icon && <span>{subCat.category_icon}</span>}
                        <span>{subCat.category_name}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;