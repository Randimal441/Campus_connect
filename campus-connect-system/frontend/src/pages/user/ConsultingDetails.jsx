import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { getToken } from '../../utils/tokenHelper';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../context/AuthContext';

export default function ConsultantDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 Get token
    const token = getToken();
    console.log("JWT Token:", token);

    // 🔥 Decode token (for debugging only)
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        console.log("Decoded Token Data:", decoded);
        console.log("Student ID:", decoded.id);
        console.log("Student Role:", decoded.role);
        console.log("Student name:",user.fullName)
      } catch (error) {
        console.error("Invalid token format");
      }
    }

    // 🔥 Load consultant data
    Promise.all([
      api(`/consultants/${id}`),
      api(`/consultants/${id}/sessions`),
      api(`/consultants/${id}/reviews`)
    ])
      .then(([consultantData, sessionsData, reviewsData]) => {
        setConsultant(consultantData);
        setSessions(sessionsData);
        setReviews(reviewsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  }, [id]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        {consultant && (
          <div className="mb-8">
            <img
              src={consultant.profileImage}
              alt={consultant.name}
              className="w-28 h-28 rounded-full mb-4"
            />
            <h2>{consultant.name}</h2>
            <p>⭐ {consultant.averageRating}</p>
          </div>
        )}

        <h3 className="mb-4">Available Sessions</h3>
        <div className="card-grid mb-8">
          {sessions.map((session) => (
            <div key={session._id} className="card">
              <p>Date: {session.date}</p>
              <p>Time: {session.startTime} - {session.endTime}</p>
              <button className="btn-primary mt-3">
                Book Now
              </button>
            </div>
          ))}
        </div>

        <h3 className="mb-4">Reviews</h3>
        {reviews.map((review) => (
          <div key={review._id} className="card mb-3">
            <p>⭐ {review.rating}</p>
            <p>{review.comment}</p>
          </div>
        ))}
      </main>
      <Footer />
    </div>
  );
}