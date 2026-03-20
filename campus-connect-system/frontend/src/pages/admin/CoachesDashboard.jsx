import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function CoachesDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/clubs-sports')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1>Clubs & Sports Admin</h1>
      <p className="lead">Manage clubs and sports (Coach dashboard).</p>
      {loading ? (
        <p>Loading...</p>
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
    </>
  );
}
