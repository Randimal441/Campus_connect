import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const DUMMY_CONSULTANTS = [
  {
    _id: '1',
    name: 'Dr. James Anderson',
    profileImage: 'https://via.placeholder.com/150',
    averageRating: 4.5,
  },
  {
    _id: '2',
    name: 'Prof. Maria Garcia',
    profileImage: 'https://via.placeholder.com/150',
    averageRating: 4.2,
  },
];
export default function Consulting() {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api('/consultants')
      .then(setConsultants)
      .catch(() => setConsultants(DUMMY_CONSULTANTS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <h1 className="mb-6">Select a Consultant</h1>

        {loading ? (
          <p>Loading consultants...</p>
        ) : (
          <div className="card-grid">
            {consultants.map((consultant) => (
              <div
                key={consultant._id}
                className="card cursor-pointer hover:shadow-lg transition"
                onClick={() =>
                  navigate(`/user/consulting/${consultant._id}`)
                }
              >
                <img
                  src={consultant.profileImage}
                  alt={consultant.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-center">{consultant.name}</h3>
                <p className="text-center">
                  ⭐ {consultant.averageRating || 'No ratings'}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}