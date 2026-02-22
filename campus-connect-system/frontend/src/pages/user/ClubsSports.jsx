import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

export default function ClubsSports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/clubs-sports')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <h1>Clubs & Sports</h1>
        <p className="lead">Browse clubs and sports activities.</p>
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p>No clubs or sports available yet.</p>
        ) : (
          <div className="card-grid">
            {items.map((item) => (
              <div key={item._id} className="card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="badge">{item.category}</span>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
