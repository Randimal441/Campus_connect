import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function EventCoordinatorDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/events')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1>Events & Chill Sessions Admin</h1>
      <p className="lead">Manage events (Event Coordinator dashboard).</p>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="card-grid">
          {items.map((item) => (
            <div key={item._id} className="card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="badge">{item.eventType}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
