import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

// Dummy data for testing
const DUMMY_DATA = [
  {
    _id: '1',
    title: 'Data Structures Textbook',
    resourceType: 'Book',
    description: 'Complete guide to data structures and algorithms. Includes practice problems and solutions.',
    isAvailable: true,
    owner: 'John Doe'
  },
  {
    _id: '2',
    title: 'Scientific Calculator',
    resourceType: 'Equipment',
    description: 'Casio FX-991EX scientific calculator. Perfect for engineering students.',
    isAvailable: false,
    owner: 'Sarah Smith'
  },
  {
    _id: '3',
    title: 'Physics Lab Notes',
    resourceType: 'Notes',
    description: 'Comprehensive notes from Physics 101. All experiments documented with diagrams.',
    isAvailable: true,
    owner: 'Mike Johnson'
  },
  {
    _id: '4',
    title: 'Digital Drawing Tablet',
    resourceType: 'Equipment',
    description: 'Wacom drawing tablet for digital art and design work. Includes stylus.',
    isAvailable: true,
    owner: 'Emma Wilson'
  },
  {
    _id: '5',
    title: 'Chemistry Study Guide',
    resourceType: 'Book',
    description: 'Organic Chemistry study guide with solved examples and practice tests.',
    isAvailable: false,
    owner: 'David Lee'
  },
  {
    _id: '6',
    title: 'Project Presentation Template',
    resourceType: 'Digital',
    description: 'Professional PowerPoint template for academic presentations.',
    isAvailable: true,
    owner: 'Lisa Brown'
  }
];

export default function ResourceSharing() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/resources')
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
            <div className="text-5xl">📚</div>
            <div>
              <h1>Resource Sharing</h1>
              <p className="lead !mb-0">Browse and share valuable academic and campus resources</p>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="loader mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading resources...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-muted rounded-2xl">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl font-semibold text-muted-foreground mb-2">No resources available yet</p>
            <p className="text-muted-foreground">Be the first to share a resource!</p>
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
                  <span className="badge">{item.resourceType}</span>
                </div>
                <p className="mb-4">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 font-bold text-sm ${
                    item.isAvailable ? 'available' : 'unavailable'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${
                      item.isAvailable ? 'bg-success' : 'bg-destructive'
                    }`}></span>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  {item.owner && (
                    <p className="text-sm text-muted-foreground mb-0">
                      👤 {item.owner}
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
