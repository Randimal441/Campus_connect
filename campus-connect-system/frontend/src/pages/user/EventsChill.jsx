import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

// Dummy data for testing
const DUMMY_DATA = [
  {
    _id: '1',
    title: 'Spring Festival 2026',
    eventType: 'Festival',
    description: 'Annual spring celebration with live music, food stalls, games, and cultural performances. Everyone welcome!',
    date: '2026-03-15T10:00:00',
    location: 'Main Campus Ground'
  },
  {
    _id: '2',
    title: 'Coffee & Code Meetup',
    eventType: 'Chill Session',
    description: 'Casual coding session over coffee. Bring your laptop and work on projects together.',
    date: '2026-02-28T15:00:00',
    location: 'Campus Cafeteria'
  },
  {
    _id: '3',
    title: 'Movie Night: Sci-Fi Special',
    eventType: 'Entertainment',
    description: 'Outdoor screening of classic sci-fi movies. Free popcorn and drinks!',
    date: '2026-03-01T19:00:00',
    location: 'Amphitheater'
  },
  {
    _id: '4',
    title: 'Yoga & Meditation Session',
    eventType: 'Chill Session',
    description: 'De-stress with guided yoga and meditation. Suitable for beginners. Bring your own mat.',
    date: '2026-02-26T07:00:00',
    location: 'Sports Complex Lawn'
  },
  {
    _id: '5',
    title: 'Tech Talk: AI & Future',
    eventType: 'Workshop',
    description: 'Industry expert discusses the future of AI and career opportunities in tech.',
    date: '2026-03-05T14:00:00',
    location: 'Auditorium Hall B'
  },
  {
    _id: '6',
    title: 'Game Night Extravaganza',
    eventType: 'Chill Session',
    description: 'Board games, card games, and video games. Meet new people and have fun!',
    date: '2026-03-08T18:00:00',
    location: 'Student Lounge'
  }
];

export default function EventsChill() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/events')
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
            <div className="text-5xl">🎉</div>
            <div>
              <h1>Events & Chill Sessions</h1>
              <p className="lead !mb-0">Discover exciting events and relaxing chill sessions on campus</p>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="loader mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-muted rounded-2xl">
            <div className="text-6xl mb-4">🎪</div>
            <p className="text-xl font-semibold text-muted-foreground mb-2">No events available yet</p>
            <p className="text-muted-foreground">Stay tuned for upcoming events and sessions!</p>
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
                  <span className="badge">{item.eventType}</span>
                </div>
                <p className="mb-4">{item.description}</p>
                <div className="flex items-center justify-between">
                  <p className="meta mb-0">
                    📅 {new Date(item.date).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  {item.location && (
                    <p className="text-sm text-muted-foreground mb-0">
                      📍 {item.location}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
