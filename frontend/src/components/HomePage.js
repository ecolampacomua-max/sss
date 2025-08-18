import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  PlusCircle, 
  BookOpen, 
  Users, 
  TrendingUp, 
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  Target
} from 'lucide-react';

const Header = () => (
  <header className="header">
    <div className="header-content">
      <Link to="/" className="logo">
        TestMaker
      </Link>
      <nav>
        <ul className="nav-links">
          <li><Link to="/tests">Каталог тестов</Link></li>
          <li><Link to="/create">Создать тест</Link></li>
          <li><a href="/admin" target="_blank">Админ панель</a></li>
        </ul>
      </nav>
    </div>
  </header>
);

const HomePage = () => {
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesRes = await axios.get('/categories');
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    fetchData();
  }, []);

  const features = [
    {
      icon: <PlusCircle className="w-6 h-6" />,
      title: "Создавайте тесты легко",
      description: "Интуитивный конструктор для создания любых тестов за несколько минут"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Готовые шаблоны",
      description: "Большая библиотека готовых психологических тестов на любой случай"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Делитесь ссылкой",
      description: "Получайте уникальную ссылку и отправляйте друзьям для прохождения"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Получайте результаты",
      description: "Все ответы автоматически приходят на вашу электронную почту"
    }
  ];

  return (
    <div>
      <Header />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Создайте свой тест и узнайте о людях больше</h1>
          <p>
            Платформа для создания персонализированных тестов. 
            Выберите готовый тест или создайте свой уникальный.
          </p>
          <div className="hero-buttons">
            <Link to="/create" className="btn btn-primary">
              <PlusCircle className="w-5 h-5" />
              Создать тест
            </Link>
            <Link to="/tests" className="btn btn-secondary">
              <BookOpen className="w-5 h-5" />
              Каталог тестов
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <h2>Как это работает</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      {categories.length > 0 && (
        <section className="features">
          <div className="features-container">
            <h2>Популярные категории</h2>
            <div className="features-grid">
              {categories.slice(0, 4).map((category) => (
                <div key={category.id} className="feature-card">
                  <div className="feature-icon" style={{ background: category.color }}>
                    <Target className="w-6 h-6" />
                  </div>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <Link 
                    to={`/tests?category=${category.id}`}
                    className="btn btn-outline"
                    style={{ marginTop: '1rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    Смотреть тесты <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="hero" style={{ padding: '4rem 0' }}>
        <div className="hero-content">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
            Почему выбирают нас?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', textAlign: 'left' }}>
            <div>
              <CheckCircle className="w-8 h-8" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Быстро и просто</h3>
              <p>Создание теста займет не более 5 минут</p>
            </div>
            <div>
              <Star className="w-8 h-8" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Качественные тесты</h3>
              <p>Все шаблоны созданы профессиональными психологами</p>
            </div>
            <div>
              <Clock className="w-8 h-8" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Мгновенные результаты</h3>
              <p>Получайте результаты сразу на email</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="features">
        <div className="features-container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Готовы начать?</h2>
          <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
            Создайте свой первый тест прямо сейчас
          </p>
          <Link to="/create" className="btn btn-primary" style={{ fontSize: '1.125rem' }}>
            <PlusCircle className="w-5 h-5" />
            Создать тест бесплатно
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        background: 'rgba(55, 65, 81, 0.95)', 
        color: 'white', 
        padding: '3rem 0 2rem',
        marginTop: '4rem'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#f3f4f6' }}>TestMaker</h3>
            <p style={{ color: '#d1d5db', lineHeight: '1.6' }}>
              Платформа для создания персонализированных тестов. 
              Узнавайте о людях больше через интересные вопросы.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#f3f4f6' }}>Возможности</h4>
            <ul style={{ listStyle: 'none', color: '#d1d5db', lineHeight: '2' }}>
              <li>Создание тестов</li>
              <li>Готовые шаблоны</li>
              <li>Email уведомления</li>
              <li>Аналитика результатов</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#f3f4f6' }}>Поддержка</h4>
            <ul style={{ listStyle: 'none', color: '#d1d5db', lineHeight: '2' }}>
              <li>Помощь</li>
              <li>Обратная связь</li>
              <li>Политика конфиденциальности</li>
            </ul>
          </div>
        </div>
        <div style={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
          paddingTop: '2rem',
          textAlign: 'center',
          color: '#9ca3af'
        }}>
          <p>&copy; 2024 TestMaker. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;