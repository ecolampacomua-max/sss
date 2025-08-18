import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Play,
  Eye,
  Target
} from 'lucide-react';

const TestCatalog = () => {
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [testsRes, categoriesRes] = await Promise.all([
          axios.get('/test-templates', { params: selectedCategory ? { category_id: selectedCategory } : {} }),
          axios.get('/categories')
        ]);
        
        setTests(testsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  const filteredTests = tests.filter(test =>
    test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryById = (id) => {
    return categories.find(cat => cat.id === id);
  };

  const handleUseTemplate = async (templateId) => {
    try {
      // Get template details
      const response = await axios.get(`/test-templates/${templateId}`);
      const template = response.data;
      
      // Redirect to create test page with template data
      const templateData = encodeURIComponent(JSON.stringify(template));
      window.location.href = `/create?template=${templateData}`;
    } catch (error) {
      console.error('Ошибка загрузки шаблона:', error);
      alert('Ошибка загрузки шаблона');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
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
        <div className="loading">
          <div className="spinner"></div>
          Загружаем тесты...
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

      {/* Page Header */}
      <section style={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '2rem 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Link to="/" className="btn btn-outline" style={{ marginRight: '1rem' }}>
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Link>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
                Каталог тестов
              </h1>
              <p style={{ color: '#6b7280' }}>
                Выберите готовый тест или используйте как основу для своего
              </p>
            </div>
          </div>

          {/* Filters */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto 1fr auto',
            gap: '1rem',
            alignItems: 'center'
          }}>
            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ minWidth: '180px' }}
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Поиск тестов..."
                className="form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Results count */}
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Найдено: {filteredTests.length} тестов
            </div>
          </div>
        </div>
      </section>

      {/* Tests Grid */}
      <section style={{ padding: '2rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          {filteredTests.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem 2rem',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              color: '#6b7280'
            }}>
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Тесты не найдены</h2>
              <p>Попробуйте изменить критерии поиска или создайте свой тест</p>
              <Link to="/create" className="btn btn-primary" style={{ marginTop: '2rem' }}>
                Создать свой тест
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '2rem'
            }}>
              {filteredTests.map((test) => {
                const category = getCategoryById(test.category_id);
                return (
                  <div key={test.id} className="test-card">
                    <div className="test-card-header">
                      <div 
                        className="category-badge"
                        style={{ backgroundColor: category?.color || '#4338ca' }}
                      >
                        {category?.name || 'Общие'}
                      </div>
                      <div className="test-duration">
                        <Clock className="w-4 h-4" style={{ display: 'inline', marginRight: '4px' }} />
                        ~{test.estimated_duration} мин
                      </div>
                    </div>
                    
                    <div className="test-card-body">
                      <h3 className="test-title">{test.title}</h3>
                      <p className="test-description">{test.description}</p>
                      
                      <div className="test-stats">
                        <span>
                          📝 {test.questions?.length || 0} вопросов
                        </span>
                        <span>
                          <Users className="w-3 h-3" style={{ display: 'inline', marginRight: '2px' }} />
                          {test.completions_count || 0} прохождений
                        </span>
                      </div>
                    </div>
                    
                    <div className="test-card-footer">
                      <button 
                        className="btn-use-template"
                        onClick={() => handleUseTemplate(test.id)}
                      >
                        <Play className="w-4 h-4" style={{ marginRight: '4px' }} />
                        Использовать
                      </button>
                      <button className="btn-preview">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '4rem 0',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
            Не нашли подходящий тест?
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1.125rem' }}>
            Создайте свой уникальный тест с помощью нашего конструктора
          </p>
          <Link to="/create" className="btn btn-primary" style={{ fontSize: '1.125rem' }}>
            Создать свой тест
          </Link>
        </div>
      </section>
    </div>
  );
};

export default TestCatalog;