import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Save,
  Eye,
  Mail,
  Settings,
  HelpCircle
} from 'lucide-react';

const CreateTest = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Form state
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    creator_email: '',
    questions: []
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Load template if provided
  useEffect(() => {
    const templateParam = searchParams.get('template');
    if (templateParam) {
      try {
        const template = JSON.parse(decodeURIComponent(templateParam));
        setTestData({
          title: `${template.title} (копия)`,
          description: template.description,
          creator_email: '',
          questions: template.questions || []
        });
      } catch (error) {
        console.error('Ошибка загрузки шаблона:', error);
      }
    }
  }, [searchParams]);

  const addQuestion = () => {
    const newQuestion = {
      id: `question_${Date.now()}`,
      text: '',
      type: 'single_choice',
      options: ['Вариант 1', 'Вариант 2'],
      required: true,
      order: testData.questions.length
    };
    
    setTestData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId, updates) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const removeQuestion = (questionId) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const moveQuestion = (questionId, direction) => {
    const questions = [...testData.questions];
    const currentIndex = questions.findIndex(q => q.id === questionId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < questions.length) {
      [questions[currentIndex], questions[newIndex]] = [questions[newIndex], questions[currentIndex]];
      // Update order
      questions.forEach((q, index) => {
        q.order = index;
      });
      
      setTestData(prev => ({ ...prev, questions }));
    }
  };

  const addOption = (questionId) => {
    const question = testData.questions.find(q => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, `Вариант ${question.options.length + 1}`]
      });
    }
  };

  const updateOption = (questionId, optionIndex, value) => {
    const question = testData.questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId, optionIndex) => {
    const question = testData.questions.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 2) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const handleSubmit = async () => {
    if (!testData.title.trim()) {
      alert('Пожалуйста, введите название теста');
      return;
    }
    
    if (!testData.creator_email.trim()) {
      alert('Пожалуйста, введите ваш email');
      return;
    }
    
    if (testData.questions.length === 0) {
      alert('Пожалуйста, добавьте хотя бы один вопрос');
      return;
    }

    // Validate questions
    for (const question of testData.questions) {
      if (!question.text.trim()) {
        alert('Пожалуйста, заполните все вопросы');
        return;
      }
      
      if ((question.type === 'single_choice' || question.type === 'multiple_choice')) {
        if (!question.options || question.options.length < 2) {
          alert('Каждый вопрос с выбором должен иметь минимум 2 варианта ответа');
          return;
        }
        
        if (question.options.some(option => !option.trim())) {
          alert('Пожалуйста, заполните все варианты ответов');
          return;
        }
      }
    }

    setLoading(true);
    
    try {
      const response = await axios.post('/custom-tests', testData);
      navigate(`/test-created/${response.data.share_token}`);
    } catch (error) {
      console.error('Ошибка создания теста:', error);
      alert('Ошибка при создании теста. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionType = (question) => {
    switch (question.type) {
      case 'single_choice':
      case 'multiple_choice':
        return (
          <div className="options-container">
            <label className="form-label">Варианты ответов</label>
            <div className="options-list">
              {question.options?.map((option, index) => (
                <div key={index} className="option-item">
                  <span style={{ minWidth: '20px', color: '#6b7280', fontSize: '0.875rem' }}>
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(question.id, index, e.target.value)}
                    placeholder={`Вариант ${index + 1}`}
                  />
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      className="option-remove"
                      onClick={() => removeOption(question.id, index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-add-option"
              onClick={() => addOption(question.id)}
            >
              <Plus className="w-4 h-4" style={{ marginRight: '4px' }} />
              Добавить вариант
            </button>
          </div>
        );
      
      case 'scale':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Минимальное значение</label>
              <input
                type="number"
                className="form-input"
                value={question.min_value || 1}
                onChange={(e) => updateQuestion(question.id, { min_value: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Максимальное значение</label>
              <input
                type="number"
                className="form-input"
                value={question.max_value || 10}
                onChange={(e) => updateQuestion(question.id, { max_value: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Подпись минимума</label>
              <input
                type="text"
                className="form-input"
                value={question.min_label || ''}
                onChange={(e) => updateQuestion(question.id, { min_label: e.target.value })}
                placeholder="Например: Совсем не согласен"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Подпись максимума</label>
              <input
                type="text"
                className="form-input"
                value={question.max_label || ''}
                onChange={(e) => updateQuestion(question.id, { max_label: e.target.value })}
                placeholder="Например: Полностью согласен"
              />
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div className="form-group">
            <label className="form-label">Placeholder текста</label>
            <input
              type="text"
              className="form-input"
              value={question.placeholder || ''}
              onChange={(e) => updateQuestion(question.id, { placeholder: e.target.value })}
              placeholder="Введите ваш ответ..."
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  const steps = [
    { number: 1, title: 'Основная информация', icon: <Settings className="w-4 h-4" /> },
    { number: 2, title: 'Вопросы', icon: <HelpCircle className="w-4 h-4" /> },
    { number: 3, title: 'Предпросмотр', icon: <Eye className="w-4 h-4" /> }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">TestMaker</Link>
          <nav>
            <ul className="nav-links">
              <li><Link to="/tests">Каталог тестов</Link></li>
              <li><Link to="/create">Создать тест</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <div style={{ padding: '2rem 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
          
          {/* Back button */}
          <Link to="/tests" className="btn btn-secondary" style={{ marginBottom: '2rem' }}>
            <ArrowLeft className="w-4 h-4" />
            Назад к каталогу
          </Link>

          {/* Progress Steps */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '16px', 
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', color: '#1f2937' }}>
              Создание теста
            </h1>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              marginBottom: '2rem',
              gap: '1rem'
            }}>
              {steps.map((step) => (
                <div
                  key={step.number}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: currentStep >= step.number ? '#4338ca' : '#f3f4f6',
                    color: currentStep >= step.number ? 'white' : '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
                  {step.icon}
                  <span>{step.number}. {step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="form-container">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                Основная информация
              </h2>
              
              <div className="form-group">
                <label className="form-label">Название теста *</label>
                <input
                  type="text"
                  className="form-input"
                  value={testData.title}
                  onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Например: Узнай меня лучше"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Описание теста</label>
                <textarea
                  className="form-textarea"
                  value={testData.description}
                  onChange={(e) => setTestData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Краткое описание того, что выявляет тест"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail className="w-4 h-4" style={{ display: 'inline', marginRight: '4px' }} />
                  Ваш email для получения результатов *
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={testData.creator_email}
                  onChange={(e) => setTestData(prev => ({ ...prev, creator_email: e.target.value }))}
                  placeholder="your@email.com"
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  На этот email будут приходить ответы всех, кто пройдет ваш тест
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentStep(2)}
                  disabled={!testData.title.trim() || !testData.creator_email.trim()}
                >
                  Далее: Добавить вопросы
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {currentStep === 2 && (
            <div className="form-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                  Вопросы ({testData.questions.length})
                </h2>
                <button className="btn btn-primary" onClick={addQuestion}>
                  <Plus className="w-4 h-4" />
                  Добавить вопрос
                </button>
              </div>

              {testData.questions.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '2px dashed #d1d5db'
                }}>
                  <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#374151' }}>
                    Добавьте первый вопрос
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                    Начните создавать свой тест с добавления вопросов
                  </p>
                  <button className="btn btn-primary" onClick={addQuestion}>
                    <Plus className="w-4 h-4" />
                    Добавить вопрос
                  </button>
                </div>
              ) : (
                <>
                  {testData.questions.map((question, index) => (
                    <div key={question.id} className="question-item">
                      <div className="question-header">
                        <div className="question-number">
                          Вопрос {index + 1}
                        </div>
                        <div className="question-controls">
                          <button
                            type="button"
                            onClick={() => moveQuestion(question.id, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveQuestion(question.id, 'down')}
                            disabled={index === testData.questions.length - 1}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQuestion(question.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="question-content">
                        <div className="form-group">
                          <label className="form-label">Текст вопроса</label>
                          <input
                            type="text"
                            className="form-input"
                            value={question.text}
                            onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                            placeholder="Введите ваш вопрос"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Тип ответа</label>
                          <select
                            className="form-select"
                            value={question.type}
                            onChange={(e) => updateQuestion(question.id, { 
                              type: e.target.value,
                              options: e.target.value === 'single_choice' || e.target.value === 'multiple_choice' 
                                ? ['Вариант 1', 'Вариант 2'] 
                                : undefined
                            })}
                          >
                            <option value="single_choice">Одиночный выбор</option>
                            <option value="multiple_choice">Множественный выбор</option>
                            <option value="scale">Шкала оценки</option>
                            <option value="text">Открытый ответ</option>
                          </select>
                        </div>

                        {renderQuestionType(question)}
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  className="btn btn-outline"
                  onClick={() => setCurrentStep(1)}
                >
                  Назад
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentStep(3)}
                  disabled={testData.questions.length === 0}
                >
                  Предпросмотр
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 3 && (
            <div className="form-container">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                Предпросмотр теста
              </h2>

              <div style={{ 
                background: '#f8fafc', 
                padding: '2rem', 
                borderRadius: '12px',
                marginBottom: '2rem'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {testData.title}
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  {testData.description}
                </p>
                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                  📧 Результаты будут отправлены на: {testData.creator_email}
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                  Вопросы ({testData.questions.length}):
                </h4>
                
                {testData.questions.map((question, index) => (
                  <div 
                    key={question.id}
                    style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '1rem' }}>
                      {index + 1}. {question.text}
                    </div>
                    
                    {question.type === 'single_choice' && (
                      <div>
                        {question.options?.map((option, optionIndex) => (
                          <label key={optionIndex} style={{ display: 'block', marginBottom: '0.5rem' }}>
                            <input type="radio" name={`preview_${question.id}`} disabled style={{ marginRight: '0.5rem' }} />
                            {option}
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'multiple_choice' && (
                      <div>
                        {question.options?.map((option, optionIndex) => (
                          <label key={optionIndex} style={{ display: 'block', marginBottom: '0.5rem' }}>
                            <input type="checkbox" disabled style={{ marginRight: '0.5rem' }} />
                            {option}
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'scale' && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>{question.min_label || question.min_value}</span>
                          <span>{question.max_label || question.max_value}</span>
                        </div>
                        <input 
                          type="range" 
                          min={question.min_value || 1} 
                          max={question.max_value || 10} 
                          disabled 
                          style={{ width: '100%', margin: '0.5rem 0' }}
                        />
                      </div>
                    )}
                    
                    {question.type === 'text' && (
                      <textarea 
                        placeholder={question.placeholder || 'Введите ваш ответ...'}
                        disabled
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          resize: 'vertical',
                          minHeight: '80px'
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <button 
                  className="btn btn-outline"
                  onClick={() => setCurrentStep(2)}
                >
                  Назад к редактированию
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ fontSize: '1.125rem' }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ marginRight: '0.5rem' }}></div>
                      Создаем тест...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Создать тест
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTest;