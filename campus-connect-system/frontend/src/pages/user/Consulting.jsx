import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

// Image URLs
const heroImage = 'https://img.freepik.com/free-vector/online-doctor-concept-illustration_114360-1783.jpg';
const connectImage = 'https://img.freepik.com/free-vector/doctors-concept-illustration_114360-1515.jpg';
const transformImage = 'https://img.freepik.com/free-vector/patient-taking-medical-advice-online_23-2148514038.jpg';
const enhanceImage = 'https://img.freepik.com/free-vector/medical-video-call-consultation-illustration_88138-415.jpg';

const DUMMY_CONSULTANTS = [
  {
    _id: '1',
    name: 'Dr. Sarah Mitchell',
    profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    specialty: 'Licensed Clinical Psychologist',
    averageRating: 5.0,
    experience: '15+ Years',
    consultations: '2000+',
  },
  {
    _id: '2',
    name: 'Dr. Michael Chen',
    profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    specialty: 'Family Medicine Specialist',
    averageRating: 4.8,
    experience: '12+ Years',
    consultations: '1500+',
  },
  {
    _id: '3',
    name: 'Dr. Emily Rodriguez',
    profileImage: 'https://randomuser.me/api/portraits/women/68.jpg',
    specialty: 'Nutritionist & Wellness Coach',
    averageRating: 4.9,
    experience: '10+ Years',
    consultations: '1800+',
  },
];

export default function Consulting() {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Backend route is /api/consulting/ (router.get('/') in consultingRoutes)
    api('/consulting')
      .then((data) => {
        // `data` should be an array of consultants
        if (Array.isArray(data)) setConsultants(data);
        else if (data.consultants) setConsultants(data.consultants);
        else setConsultants(DUMMY_CONSULTANTS);
      })
      .catch(() => setConsultants(DUMMY_CONSULTANTS))
      .finally(() => setLoading(false));
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < fullStars ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-white py-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
              How does<br />
              <span className="text-green-600">ConsultantConnect</span><br />
              work?
            </h1>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Getting started with professional healthcare consultants is simple! 
              Connect with licensed healthcare professionals from the comfort of 
              your home. Our platform makes it easy to find, book, and consult with 
              top-rated consultants who can help you achieve your health goals.
            </p>
            <button
              onClick={() => document.getElementById('consultants').scrollIntoView({ behavior: 'smooth' })}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
          </div>
          <div className="flex-1">
            <img
              src={heroImage}
              alt="Consultant Connect"
              className="w-full max-w-md mx-auto rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Available Consultants Section */}
      <section id="consultants" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Available Consultants</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse and connect with top-rated professionals ready to help you on your health journey
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 items-center">
              {consultants.map((consultant) => (
                <div
                  key={consultant._id}
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="relative mb-3">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center overflow-hidden border-2 border-white shadow">
                        <svg className="w-12 h-12 text-amber-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                        </svg>
                      </div>
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">{consultant.fullName || consultant.name}</h3>
                    <p className="text-green-600 text-sm mb-3">{consultant.specialty || 'Healthcare Specialist'}</p>
                    
                    <div className="flex justify-center items-center gap-1 mb-4">
                      {renderStars(consultant.averageRating || 5)}
                      <span className="text-gray-600 text-sm ml-2">
                        ({consultant.averageRating?.toFixed(1) || '5.0'})
                      </span>
                    </div>

                    <div className="flex justify-center gap-6 mb-6 text-sm text-gray-500">
                      <div>
                        <span className="font-semibold text-gray-700">{consultant.experience || '10+ Years'}</span>
                        <p>Experience</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">{consultant.consultations || '1000+'}</span>
                        <p>Consultations</p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/user/consulting/${consultant._id}`)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-300"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Connect with Top Consultants Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 flex justify-center">
            <img
              src={connectImage}
              alt="Connect with consultants"
              className="w-full max-w-sm rounded-2xl shadow-lg"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Connect with top consultants</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Our platform brings together the most qualified healthcare 
              professionals who are ready to provide personalized care and 
              guidance. Schedule consultations that fit your schedule and receive 
              expert advice from licensed healthcare providers.
            </p>
            <button
              onClick={() => document.getElementById('consultants').scrollIntoView({ behavior: 'smooth' })}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Find a Consultant
            </button>
          </div>
        </div>
      </section>


      {/* Enhance Your Consultation Experience Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              View Your Past Consultations<br />
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Easily access and review your previous consultation bookings in one place. This section allows you to check past appointment details, including dates, consultation notes, and doctor information. Stay organized and keep track of your healthcare history for better and more informed future consultations.
            </p>
            <button
              onClick={() => document.getElementById('consultants').scrollIntoView({ behavior: 'smooth' })}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Read More
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src={enhanceImage}
              alt="Enhance your experience"
              className="w-full max-w-sm rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}