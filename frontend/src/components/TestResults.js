import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Download, Share2, ArrowLeft } from 'lucide-react';

const TestResults = () => {
  const { responseId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This would fetch results from API
    // For now, we'll show a placeholder
    setTimeout(() => {
      setResults({
        test_title: "Узнай меня лучше",
        respondent_email: "user@example.com",
        completion_date: new Date().toLocaleDateString('ru-RU'),
        answers: [
          { question: "Какой ваш любимый цвет?", answer: "Синий" },
          { question: "Как вы предпочитаете проводить выходные?", answer: "С друзьями на природе" },
          { question: "Оцените свою общительность по шкале от 1 до 10", answer: "7" }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [responseId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="loading">
          <div className="spinner"></div>
          Загружаем результаты...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        <Link to="/" className="btn btn-secondary" style={{ marginBottom: '2rem' }}>
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <div className="form-container">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <BarChart className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>
              Результаты теста
            </h1>
            <h2 style={{ fontSize: '1.5rem', color: '#4338ca', marginBottom: '0.5rem' }}>
              {results?.test_title}
            </h2>
            <p style={{ color: '#6b7280' }}>
              Пройден {results?.completion_date} • {results?.respondent_email}
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Ваши ответы:
            </h3>
            
            {results?.answers.map((item, index) => (
              <div 
                key={index}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  {index + 1}. {item.question}
                </div>
                <div style={{ 
                  color: '#4338ca', 
                  fontWeight: '500',
                  background: '#e0e7ff',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  display: 'inline-block'
                }}>
                  {item.answer}
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            paddingTop: '2rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button className="btn btn-outline" disabled>
              <Download className="w-4 h-4" />
              Скачать PDF (скоро)
            </button>
            <button className="btn btn-outline" disabled>
              <Share2 className="w-4 h-4" />
              Поделиться (скоро)
            </button>
            <Link to="/create" className="btn btn-primary">
              Создать свой тест
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults;