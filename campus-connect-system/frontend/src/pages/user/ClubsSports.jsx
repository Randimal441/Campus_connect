import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

// Dummy data for testing
const DUMMY_DATA = [
  {
    _id: '1',
    title: 'Campus Football Club',
    category: 'Sports',
    description: 'Join our competitive football team! We practice every Tuesday and Thursday evening. All skill levels welcome.',
    schedule: 'Tue & Thu, 5:00 PM - 7:00 PM'
  },
  {
    _id: '2',
    title: 'Photography Club',
    category: 'Arts',
    description: 'Capture moments and learn photography techniques. Weekly photo walks and monthly exhibitions.',
    schedule: 'Every Saturday, 9:00 AM'
  },
  {
    _id: '3',
    title: 'Chess Society',
    category: 'Games',
    description: 'Strategic minds unite! Join us for chess tournaments, lessons, and casual games.',
    schedule: 'Mon, Wed, Fri - 4:00 PM'
  },
  {
    _id: '4',
    title: 'Drama Club',
    category: 'Arts',
    description: 'Express yourself through theater! We perform two major productions each semester.',
    schedule: 'Daily rehearsals 6:00 PM - 8:00 PM'
  },
  {
    _id: '5',
    title: 'Basketball Team',
    category: 'Sports',
    description: 'Inter-university basketball team looking for talented players. Tryouts every semester.',
    schedule: 'Mon, Wed, Fri - 6:00 PM'
  },
  {
    _id: '6',
    title: 'Coding Club',
    category: 'Technology',
    description: 'Learn programming, participate in hackathons, and build amazing projects together.',
    schedule: 'Every Wednesday, 7:00 PM'
  }
];

export default function ClubsSports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/clubs-sports')
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
            <div className="text-5xl">🏆</div>
            <div>
              <h1>Clubs & Sports</h1>
              <p className="lead !mb-0">Discover and join exciting clubs and sports activities on campus</p>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="loader mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading clubs and sports...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-muted rounded-2xl">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-xl font-semibold text-muted-foreground mb-2">No clubs or sports available yet</p>
            <p className="text-muted-foreground">Check back soon for exciting opportunities!</p>
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
                  <span className="badge">{item.category}</span>
                </div>
                <p className="mb-4">{item.description}</p>
                {item.schedule && (
                  <p className="meta">
                    📅 {item.schedule}
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
