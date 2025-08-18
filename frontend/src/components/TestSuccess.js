import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircle,
  Copy,
  Share,
  BarChart,
  Edit,
  ExternalLink
} from 'lucide-react';

const TestSuccess = () => {
  const { shareToken } = useParams();
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const shareUrl = `${window.location.origin}/test/${shareToken}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareVK = () => {
    const url = `https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`Пройди мой тест: ${testData?.title || 'Тест'}`)}`;
    window.open(url, '_blank');
  };

  const shareTelegram = () => {
    const text = `Пройди мой тест: ${testData?.title || 'Тест'}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareWhatsApp = () => {
    const text = `Пройди мой тест: ${testData?.title || 'Тест'} ${shareUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="loading">
          <div className="spinner"></div>
          Загружаем данные теста...
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
          <h1>Тест не найден</h1>
          <p>Возможно, ссылка неверна или тест был удален</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '2rem' }}>
            На главную
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="success-container">
          <div className="success-icon">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </div>
          
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', color: '#1f2937' }}>
            Тест успешно создан! 🎉
          </h1>
          
          <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
            Теперь вы можете поделиться ссылкой с теми, кого хотите протестировать
          </p>

          {/* Test Info */}
          <div style={{
            background: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              {testData.title}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              {testData.description}
            </p>
            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#9ca3af' }}>
              <span>📝 {testData.questions?.length || 0} вопросов</span>
              <span>📧 {testData.creator_email}</span>
              <span>📅 {new Date(testData.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>

          {/* Share Section */}
          <div className="share-section">
            <label style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem', display: 'block' }}>
              Ссылка на ваш тест:
            </label>
            <div className="share-input-group">
              <input 
                type="text" 
                value={shareUrl} 
                readOnly 
                onClick={(e) => e.target.select()}
              />
              <button onClick={copyToClipboard}>
                <Copy className="w-4 h-4" />
                {copied ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Отправьте эту ссылку друзьям, чтобы они смогли пройти ваш тест
            </p>
          </div>

          {/* Social Share */}
          <div className="social-share">
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              <Share className="w-5 h-5" style={{ display: 'inline', marginRight: '0.5rem' }} />
              Поделиться в социальных сетях:
            </h3>
            <div className="social-buttons">
              <button className="btn-social vk" onClick={shareVK}>
                ВКонтакте
              </button>
              <button className="btn-social telegram" onClick={shareTelegram}>
                Telegram
              </button>
              <button className="btn-social whatsapp" onClick={shareWhatsApp}>
                WhatsApp
              </button>
            </div>
          </div>

          {/* Management Section */}
          <div style={{ 
            background: '#f0f9ff', 
            padding: '1.5rem', 
            borderRadius: '12px',
            border: '1px solid #bae6fd'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              Управление тестом:
            </h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                <ExternalLink className="w-4 h-4" />
                Открыть тест
              </a>
              <button className="btn btn-outline" disabled>
                <BarChart className="w-4 h-4" />
                Статистика (скоро)
              </button>
              <button className="btn btn-outline" disabled>
                <Edit className="w-4 h-4" />
                Редактировать (скоро)
              </button>
            </div>
          </div>

          {/* Next Steps */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              Что дальше?
            </h3>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/create" className="btn btn-primary">
                <CheckCircle className="w-4 h-4" />
                Создать еще один тест
              </Link>
              <Link to="/tests" className="btn btn-secondary">
                <ExternalLink className="w-4 h-4" />
                Посмотреть другие тесты
              </Link>
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            padding: '1rem',
            marginTop: '2rem',
            fontSize: '0.875rem'
          }}>
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#92400e' }}>
              💡 Как это работает:
            </h4>
            <ul style={{ color: '#92400e', lineHeight: '1.6', paddingLeft: '1rem' }}>
              <li>Отправьте ссылку друзьям через любой мессенджер или социальную сеть</li>
              <li>Они пройдут тест и введут свой email</li>
              <li>Все ответы автоматически придут на ваш email: <strong>{testData.creator_email}</strong></li>
              <li>Респонденты также получат свои результаты на email</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSuccess;