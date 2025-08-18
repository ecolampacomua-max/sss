import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft,
  ArrowRight,
  Clock,
  HelpCircle,
  Send,
  Mail,
  CheckCircle
} from 'lucide-react';

const TakeTest = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  
  const [testData, setTestData] = useState(null);
  const [currentStep, setCurrentStep] = useState('intro'); // 'intro', 'taking', 'completed'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [respondentEmail, setRespondentEmail] = useState('');
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const response = await axios.get(`/custom-tests/${shareToken}`);
        setTestData(response.data);
      } catch (error) {
        console.error('Ошибка загрузки теста:', error);
      } finally {
        setLoading(false);
      }
    };

    if (shareToken) {
      fetchTest();
    }
  }, [shareToken]);

  const startTest = () => {
    if (!respondentEmail.trim()) {
      alert('Пожалуйста, введите ваш email');
      return;
    }
    
    if (!respondentEmail.includes('@')) {
      alert('Пожалуйста, введите корректный email адрес');
      return;
    }
    
    setCurrentStep('taking');
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    const currentQuestion = testData.questions[currentQuestionIndex];
    
    // Validate required questions
    if (currentQuestion.required && !answers[currentQuestion.id]) {
      alert('Пожалуйста, ответьте на вопрос, чтобы продолжить');
      return;
    }
    
    if (currentQuestionIndex < testData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitTest();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitTest = async () => {
    setSubmitting(true);
    
    try {
      const response = await axios.post('/test-responses', {
        test_id: testData.id,
        test_type: 'custom',
        respondent_email: respondentEmail,
        answers: answers
      });
      
      setCurrentStep('completed');
    } catch (error) {
      console.error('Ошибка отправки ответов:', error);
      alert('Ошибка при отправке ответов. Попробуйте снова.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'single_choice':
        return (
          <div className="answer-options">
            {question.options?.map((option, index) => (
              <label key={index} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                margin: '0.5rem 0',
                background: currentAnswer === option ? '#e0e7ff' : '#f8fafc',
                border: `2px solid ${currentAnswer === option ? '#4338ca' : '#e5e7eb'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  style={{ marginRight: '0.75rem' }}
                />
                <span style={{ fontSize: '1rem', fontWeight: currentAnswer === option ? '600' : '400' }}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case 'multiple_choice':
        const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : [];
        return (
          <div className="answer-options">
            {question.options?.map((option, index) => (
              <label key={index} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                margin: '0.5rem 0',
                background: selectedOptions.includes(option) ? '#e0e7ff' : '#f8fafc',
                border: `2px solid ${selectedOptions.includes(option) ? '#4338ca' : '#e5e7eb'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleAnswer(question.id, [...selectedOptions, option]);
                    } else {
                      handleAnswer(question.id, selectedOptions.filter(o => o !== option));
                    }
                  }}
                  style={{ marginRight: '0.75rem' }}
                />
                <span style={{ fontSize: '1rem', fontWeight: selectedOptions.includes(option) ? '600' : '400' }}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case 'scale':
        const scaleValue = currentAnswer || Math.floor(((question.max_value || 10) + (question.min_value || 1)) / 2);
        return (
          <div style={{ padding: '2rem 1rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              <span>{question.min_label || question.min_value || 1}</span>
              <span>{question.max_label || question.max_value || 10}</span>
            </div>
            <input
              type="range"
              min={question.min_value || 1}
              max={question.max_value || 10}
              value={scaleValue}
              onChange={(e) => handleAnswer(question.id, parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                appearance: 'none',
                background: '#e5e7eb',
                outline: 'none',
              }}
            />
            <div style={{ 
              textAlign: 'center', 
              marginTop: '1rem',
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#4338ca'
            }}>
              {scaleValue}
            </div>
          </div>
        );

      case 'text':
        return (
          <textarea
            placeholder={question.placeholder || 'Введите ваш ответ...'}
            value={currentAnswer || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="loading">
          <div className="spinner"></div>
          Загружаем тест...
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto', 
          padding: '4rem 2rem',
          textAlign: 'center',
          color: 'white'
        }}>
          <HelpCircle className="w-16 h-16 mx-auto mb-4" />
          <h1>Тест не найден</h1>
          <p>Возможно, ссылка неверна или тест недоступен</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* Intro Step */}
        {currentStep === 'intro' && (
          <div className="form-container" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>
                {testData.title}
              </h1>
              <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
                {testData.description}
              </p>
              
              <div style={{ 
                display: 'flex', 
                gap: '2rem', 
                justifyContent: 'center',
                fontSize: '0.875rem',
                color: '#9ca3af',
                marginBottom: '2rem'
              }}>
                <span>
                  <HelpCircle className="w-4 h-4" style={{ display: 'inline', marginRight: '4px' }} />
                  {testData.questions?.length || 0} вопросов
                </span>
                <span>
                  <Clock className="w-4 h-4" style={{ display: 'inline', marginRight: '4px' }} />
                  ~{Math.ceil((testData.questions?.length || 0) * 0.5)} мин
                </span>
              </div>
            </div>

            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label">
                  <Mail className="w-4 h-4" style={{ display: 'inline', marginRight: '4px' }} />
                  Ваш email для получения результатов
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  🔒 Ваш email будет использован только для отправки результатов
                </p>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={startTest}
                style={{ width: '100%', fontSize: '1.125rem', padding: '1rem' }}
              >
                Начать тест
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Taking Test Step */}
        {currentStep === 'taking' && testData.questions && (
          <div className="form-container">
            {/* Progress */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#4338ca' }}>
                  Вопрос {currentQuestionIndex + 1} из {testData.questions.length}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {Math.round(((currentQuestionIndex + 1) / testData.questions.length) * 100)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#e5e7eb',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${((currentQuestionIndex + 1) / testData.questions.length) * 100}%`,
                  height: '100%',
                  backgroundColor: '#4338ca',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Current Question */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1f2937',
                marginBottom: '2rem',
                lineHeight: '1.4'
              }}>
                {testData.questions[currentQuestionIndex].text}
              </h2>

              {renderQuestion(testData.questions[currentQuestionIndex])}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button
                className="btn btn-outline"
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </button>

              <button
                className="btn btn-primary"
                onClick={nextQuestion}
                disabled={submitting}
                style={{
                  backgroundColor: currentQuestionIndex === testData.questions.length - 1 ? '#10b981' : '#4338ca'
                }}
              >
                {submitting ? (
                  <>
                    <div className="spinner"></div>
                    Отправляем...
                  </>
                ) : currentQuestionIndex === testData.questions.length - 1 ? (
                  <>
                    <Send className="w-4 h-4" />
                    Завершить тест
                  </>
                ) : (
                  <>
                    Далее
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Completed Step */}
        {currentStep === 'completed' && (
          <div className="form-container" style={{ textAlign: 'center' }}>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>
              Спасибо за прохождение теста! 🎉
            </h1>
            
            <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
              Ваши ответы успешно отправлены
            </p>

            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                Что дальше?
              </h3>
              <ul style={{ 
                textAlign: 'left', 
                color: '#374151', 
                lineHeight: '1.8',
                listStyleType: 'none',
                padding: 0 
              }}>
                <li>✅ Ваши результаты будут отправлены на: <strong>{respondentEmail}</strong></li>
                <li>📧 Создатель теста также получит ваши ответы</li>
                <li>⚡ Обычно письма приходят в течение нескольких минут</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => window.location.href = '/'}
                className="btn btn-primary"
              >
                Создать свой тест
              </button>
              <button 
                onClick={() => window.location.href = '/tests'}
                className="btn btn-outline"
              >
                Другие тесты
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeTest;