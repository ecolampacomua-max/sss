import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  BarChart3, 
  TestTube, 
  FolderOpen, 
  Users, 
  Settings, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter
} from 'lucide-react';

// Set up basic auth for all admin requests
const setupAdminAuth = () => {
  axios.defaults.auth = {
    username: 'admin',
    password: '1234'
  };
};

const AdminLayout = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    setupAdminAuth();
  }, []);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/" className="logo" style={{ fontSize: '1.5rem' }}>
            TestMaker
          </Link>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Панель администратора
          </p>
        </div>
        
        <nav className="admin-nav">
          <Link 
            to="/admin" 
            className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            <BarChart3 className="w-4 h-4" style={{ marginRight: '0.5rem' }} />
            Дашборд
          </Link>
          <Link 
            to="/admin/tests" 
            className={`nav-item ${location.pathname === '/admin/tests' ? 'active' : ''}`}
          >
            <TestTube className="w-4 h-4" style={{ marginRight: '0.5rem' }} />
            Тесты
          </Link>
          <Link 
            to="/admin/categories" 
            className={`nav-item ${location.pathname === '/admin/categories' ? 'active' : ''}`}
          >
            <FolderOpen className="w-4 h-4" style={{ marginRight: '0.5rem' }} />
            Категории
          </Link>
          <Link 
            to="/admin/users" 
            className={`nav-item ${location.pathname === '/admin/users' ? 'active' : ''}`}
          >
            <Users className="w-4 h-4" style={{ marginRight: '0.5rem' }} />
            Пользователи
          </Link>
          <Link 
            to="/admin/settings" 
            className={`nav-item ${location.pathname === '/admin/settings' ? 'active' : ''}`}
          >
            <Settings className="w-4 h-4" style={{ marginRight: '0.5rem' }} />
            Настройки
          </Link>
        </nav>
      </aside>
      
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/admin/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const initializeData = async () => {
    try {
      const response = await axios.post('/admin/init-data');
      alert(response.data.message);
      // Refresh stats
      window.location.reload();
    } catch (error) {
      console.error('Ошибка инициализации данных:', error);
      alert('Ошибка при инициализации данных');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Загрузка статистики...
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
          Дашборд
        </h1>
        {stats && (stats.total_categories === 0) && (
          <button onClick={initializeData} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Инициализировать данные
          </button>
        )}
      </div>

      {stats ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.total_templates}</div>
              <div className="stat-label">Шаблоны тестов</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.total_custom_tests}</div>
              <div className="stat-label">Пользовательские тесты</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.total_responses}</div>
              <div className="stat-label">Ответы на тесты</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.total_categories}</div>
              <div className="stat-label">Категории</div>
            </div>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '2rem', 
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            marginTop: '2rem'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
              Быстрые действия
            </h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/admin/tests" className="btn btn-outline">
                <TestTube className="w-4 h-4" />
                Управление тестами
              </Link>
              <Link to="/admin/categories" className="btn btn-outline">
                <FolderOpen className="w-4 h-4" />
                Категории
              </Link>
              <Link to="/create" className="btn btn-primary">
                <Plus className="w-4 h-4" />
                Создать тест
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>Не удалось загрузить статистику</p>
        </div>
      )}
    </div>
  );
};

const TestsManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [customTests, setCustomTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, categoriesRes] = await Promise.all([
          axios.get('/test-templates'),
          axios.get('/categories')
        ]);
        
        setTemplates(templatesRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Без категории';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Загрузка тестов...
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
          Управление тестами
        </h1>
        <Link to="/create" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Создать тест
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ borderBottom: '1px solid #e5e7eb' }}>
          <nav style={{ display: 'flex', gap: '2rem' }}>
            <button
              onClick={() => setActiveTab('templates')}
              style={{
                padding: '0.75rem 0',
                borderBottom: activeTab === 'templates' ? '2px solid #4338ca' : 'none',
                background: 'none',
                border: 'none',
                color: activeTab === 'templates' ? '#4338ca' : '#6b7280',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Шаблоны тестов ({templates.length})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              style={{
                padding: '0.75rem 0',
                borderBottom: activeTab === 'custom' ? '2px solid #4338ca' : 'none',
                background: 'none',
                border: 'none',
                color: activeTab === 'custom' ? '#4338ca' : '#6b7280',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Пользовательские тесты ({customTests.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Templates Table */}
      {activeTab === 'templates' && (
        <div style={{ 
          background: 'white', 
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          {templates.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                Нет шаблонов тестов
              </h3>
              <p style={{ color: '#6b7280' }}>
                Создайте первый шаблон теста для каталога
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Название</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Категория</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Вопросов</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Прохождений</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Создан</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template, index) => (
                    <tr key={template.id} style={{ borderTop: index > 0 ? '1px solid #f3f4f6' : 'none' }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                            {template.title}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {template.description}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          background: '#e0e7ff',
                          color: '#4338ca',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {getCategoryName(template.category_id)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>
                        {template.questions?.length || 0}
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>
                        {template.completions_count || 0}
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        {new Date(template.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button style={{
                            background: 'none',
                            border: '1px solid #e5e7eb',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            <Eye className="w-4 h-4" />
                          </button>
                          <button style={{
                            background: 'none',
                            border: '1px solid #e5e7eb',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button style={{
                            background: 'none',
                            border: '1px solid #fca5a5',
                            color: '#ef4444',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminPanel = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tests" element={<TestsManagement />} />
        <Route path="/categories" element={<div>Категории (в разработке)</div>} />
        <Route path="/users" element={<div>Пользователи (в разработке)</div>} />
        <Route path="/settings" element={<div>Настройки (в разработке)</div>} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminPanel;