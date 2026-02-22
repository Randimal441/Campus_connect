import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function ConsultantDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/consulting')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1>Consulting Admin</h1>
      <p className="lead">Manage consulting sessions (Consultant dashboard).</p>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="card-grid">
          {items.map((item) => (
            <div key={item._id} className="card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="badge">{item.status}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
