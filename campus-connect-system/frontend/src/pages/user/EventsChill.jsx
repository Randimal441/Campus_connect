import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

export default function EventsChill() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/events')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <h1>Events & Chill Sessions</h1>
        <p className="lead">Explore events and chill sessions.</p>
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p>No events available yet.</p>
        ) : (
          <div className="card-grid">
            {items.map((item) => (
              <div key={item._id} className="card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="badge">{item.eventType}</span>
                <p className="meta">{new Date(item.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
