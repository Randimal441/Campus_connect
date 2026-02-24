import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

// Dummy data for testing
const DUMMY_DATA = [
  {
    _id: '1',
    title: 'Career Guidance Session',
    status: 'Available',
    description: 'One-on-one career counseling to help you choose the right path. Resume review and interview preparation included.',
    consultant: 'Dr. James Anderson'
  },
  {
    _id: '2',
    title: 'Academic Advising',
    status: 'Booked',
    description: 'Get help with course selection, academic planning, and degree requirements.',
    consultant: 'Prof. Maria Garcia'
  },
  {
    _id: '3',
    title: 'Mental Health Support',
    status: 'Available',
    description: 'Confidential counseling sessions for stress management, anxiety, and personal challenges.',
    consultant: 'Dr. Emily Chen'
  },
  {
    _id: '4',
    title: 'Study Skills Workshop',
    status: 'Available',
    description: 'Learn effective study techniques, time management, and exam preparation strategies.',
    consultant: 'Prof. Robert Taylor'
  },
  {
    _id: '5',
    title: 'Research Methodology',
    status: 'Available',
    description: 'Guidance on research design, data analysis, and thesis writing for graduate students.',
    consultant: 'Dr. Patricia Martinez'
  },
  {
    _id: '6',
    title: 'Entrepreneurship Mentoring',
    status: 'Booked',
    description: 'Business idea validation, startup guidance, and networking opportunities.',
    consultant: 'Mr. Kevin Zhang'
  }
];

export default function Consulting() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/consulting')
      .then(setItems)
      .catch(() => setItems(DUMMY_DATA)) // Use dummy data on error
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-5xl">💬</div>
            <div>
              <h1>Consulting</h1>
              <p className="lead !mb-0">Book personalized consulting sessions with campus experts</p>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="loader mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading consulting sessions...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-muted rounded-2xl">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl font-semibold text-muted-foreground mb-2">No consulting sessions available yet</p>
            <p className="text-muted-foreground">New sessions will be added soon!</p>
          </div>
        ) : (
          <div className="card-grid">
            {items.map((item, index) => (
              <div 
                key={item._id} 
                className="card animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="flex-1">{item.title}</h3>
                  <span className="badge">{item.status}</span>
                </div>
                <p className="mb-4">{item.description}</p>
                {item.consultant && (
                  <p className="meta">
                    👤 Consultant: {item.consultant}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
