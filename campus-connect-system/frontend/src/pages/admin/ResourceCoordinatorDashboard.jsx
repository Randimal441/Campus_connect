import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function ResourceCoordinatorDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/resources')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1>Resource Sharing Admin</h1>
      <p className="lead">Manage resources (Resource Coordinator dashboard).</p>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="card-grid">
          {items.map((item) => (
            <div key={item._id} className="card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
