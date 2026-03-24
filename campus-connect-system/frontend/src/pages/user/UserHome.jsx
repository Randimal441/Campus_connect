import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SECTIONS } from '../../utils/constants';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { api } from '../../services/api';

const connectImage = 'https://img.freepik.com/free-vector/team-spirit-concept-illustration_114360-1676.jpg';
const empowerImage = 'https://img.freepik.com/free-vector/students-studying-concept-illustration_114360-8438.jpg';
const consultantConnectImage = 'https://img.freepik.com/free-vector/doctors-concept-illustration_114360-1515.jpg';
const eventsDiscoverImage = 'https://img.freepik.com/free-vector/festival-concept-illustration_114360-1107.jpg';

function formatDate(dateValue) {
  if (!dateValue) return 'Recently added';
  return new Date(dateValue).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getCategoryLabel(category) {
  const normalized = String(category || '').toLowerCase();
  if (normalized.startsWith('sport')) return 'Sport';
  if (normalized.startsWith('club')) return 'Club';
  return 'Community';
}

function truncateText(text, max = 110) {
  const value = String(text || '').trim();
  if (!value) return 'No description available yet.';
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

export default function UserHome() {
  const [latestItems, setLatestItems] = useState([]);
  const [latestLoading, setLatestLoading] = useState(true);
  const [latestError, setLatestError] = useState('');
  const [latestResources, setLatestResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState('');
  const [latestConsultants, setLatestConsultants] = useState([]);
  const [consultantsLoading, setConsultantsLoading] = useState(true);
  const [consultantsError, setConsultantsError] = useState('');
  const [latestEvents, setLatestEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');

  const sectionDescriptions = {
    'clubs-sports': 'Join teams, see practice schedules, and connect with student clubs.',
    consulting: 'Book sessions and get guidance from campus consultants.',
    'events-chill': 'Discover events, activities, and fun opportunities around campus.',
    'resource-sharing': 'Access and share study materials and useful resources.',
  };

  useEffect(() => {
    let isMounted = true;

    const fetchLatestItems = async () => {
      try {
        if (isMounted) {
          setLatestError('');
          setResourcesError('');
          setConsultantsError('');
          setEventsError('');
        }

        const [clubsResult, resourcesResult, consultantsResult, eventsResult] = await Promise.allSettled([
          api('/clubs-sports'),
          api('/study-materials'),
          api('/consulting'),
          api('/events/upcoming'),
        ]);

        if (isMounted) {
          if (clubsResult.status === 'fulfilled') {
            const latestFour = Array.isArray(clubsResult.value) ? clubsResult.value.slice(0, 4) : [];
            setLatestItems(latestFour);
          } else {
            setLatestError(clubsResult.reason?.message || 'Failed to load latest clubs and sports.');
          }

          if (resourcesResult.status === 'fulfilled') {
            const latestThreeResources = Array.isArray(resourcesResult.value) ? resourcesResult.value.slice(0, 3) : [];
            setLatestResources(latestThreeResources);
          } else {
            setResourcesError(resourcesResult.reason?.message || 'Failed to load latest resources.');
          }

          if (consultantsResult.status === 'fulfilled') {
            const latestTwoConsultants = Array.isArray(consultantsResult.value) ? consultantsResult.value.slice(0, 2) : [];
            setLatestConsultants(latestTwoConsultants);
          } else {
            setConsultantsError(consultantsResult.reason?.message || 'Failed to load latest consultants.');
          }

          if (eventsResult.status === 'fulfilled') {
            const latestThreeEvents = Array.isArray(eventsResult.value)
              ? [...eventsResult.value]
                  .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                  .slice(0, 3)
              : [];
            setLatestEvents(latestThreeEvents);
          } else {
            setEventsError(eventsResult.reason?.message || 'Failed to load latest events.');
          }
        }
      } finally {
        if (isMounted) {
          setLatestLoading(false);
          setResourcesLoading(false);
          setConsultantsLoading(false);
          setEventsLoading(false);
        }
      }
    };

    fetchLatestItems();

    const intervalId = setInterval(fetchLatestItems, 12000);
    const handleWindowFocus = () => fetchLatestItems();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchLatestItems();
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <section className="rounded-3xl border border-border/70 bg-card/80 backdrop-blur-sm p-6 md:p-10 mb-10 shadow-lg animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-gradient mb-3">Welcome to Campus Connect</h1>
              <p className="lead text-lg">
                This is your new homepage. From here you can quickly jump into each section and we can keep improving this page based on what you want to add next.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-center mb-5">
            <h2 className="text-2xl font-bold">Quick Access</h2>
          </div>

          <div className="section-grid">
          {SECTIONS.map((section, index) => (
            <Link
              key={section.id}
              to={section.path}
              className="section-card animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <h3 className="mb-2">{section.label}</h3>
              <p className="text-muted-foreground">{sectionDescriptions[section.id]}</p>
              <div className="mt-4 flex items-center text-primary font-bold text-sm">
                Explore <span className="ml-2">→</span>
              </div>
            </Link>
          ))}
          </div>
        </section>

        <section className="py-16 px-4 bg-gray-50 mt-10 rounded-3xl">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 flex justify-center">
              <img src={connectImage} alt="Campus community" className="w-full max-w-sm rounded-2xl shadow-lg" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Build your campus circle</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Join communities that push you to grow, collaborate with teammates, and stay active through organized
                practices and events.
              </p>
              <Link
                to="/user/clubs-sports"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Join a Community
              </Link>
            </div>
          </div>

          <div className="max-w-6xl mx-auto mt-12">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-bold text-gray-800">Latest Clubs & Sports</h3>
            </div>

            {latestLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                    <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />
                    <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                    <div className="h-4 w-5/6 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : latestError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {latestError}
              </div>
            ) : latestItems.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600">
                No clubs or sports added yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestItems.map((item) => (
                  <div key={item._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        {getCategoryLabel(item.category)}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{truncateText(item.description)}</p>
                    {item.sportType && <p className="text-xs text-gray-500 mb-3">Sport Type: {item.sportType}</p>}
                    <Link to="/user/clubs-sports" className="text-sm font-semibold text-green-700 hover:text-green-800">
                      View in Clubs & Sports →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 px-4 bg-gray-50 mt-10 rounded-3xl">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Empower your academic circle</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Don't keep your knowledge to yourself! Upload your lecture notes, summaries, and past papers to help
                your fellow students succeed. Build a robust academic community where everyone can thrive through
                shared resources.
              </p>
              <Link
                to="/user/resource-sharing"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                View All
              </Link>
            </div>
            <div className="flex-1 flex justify-center">
              <img
                src={empowerImage}
                alt="Empower your peers"
                className="w-full max-w-sm rounded-2xl shadow-lg"
              />
            </div>
          </div>

          <div className="max-w-6xl mx-auto mt-12">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-bold text-gray-800">Latest Resources</h3>
            </div>

            {resourcesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                    <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />
                    <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                    <div className="h-4 w-5/6 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : resourcesError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {resourcesError}
              </div>
            ) : latestResources.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600">
                No resources added yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {latestResources.map((item) => (
                  <div key={item._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        {item.subject || 'General'}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{truncateText(item.description, 95)}</p>
                    <p className="text-xs text-gray-500 mb-3">
                      By {item.uploadedBy?.fullName || 'Unknown'}
                    </p>
                    <Link to="/user/resource-sharing" className="text-sm font-semibold text-green-700 hover:text-green-800">
                      View in Resource Sharing →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 px-4 bg-gray-50 mt-10 rounded-3xl">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 flex justify-center">
              <img
                src={consultantConnectImage}
                alt="Connect with consultants"
                className="w-full max-w-sm rounded-2xl shadow-lg"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Connect with top consultants</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Our platform brings together the most qualified healthcare professionals who are ready to provide
                personalized care and guidance. Schedule consultations that fit your schedule and receive expert
                advice from licensed healthcare providers.
              </p>
              <Link
                to="/user/consulting"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Find a Consultant
              </Link>
            </div>
          </div>

          <div className="max-w-6xl mx-auto mt-12">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-bold text-gray-800">Latest Available Consultants</h3>
            </div>

            {consultantsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((item) => (
                  <div key={item} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
                    <div className="h-5 w-2/3 bg-gray-200 rounded mb-3" />
                    <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                    <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : consultantsError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {consultantsError}
              </div>
            ) : latestConsultants.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600">
                No consultants available yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestConsultants.map((consultant) => (
                  <div key={consultant._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        Consultant
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(consultant.createdAt)}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-1">{consultant.fullName || 'Consultant'}</h4>
                    <p className="text-sm text-gray-600 mb-3">{consultant.specialty || 'Healthcare Specialist'}</p>
                    <p className="text-xs text-gray-500 mb-3">
                      Rating: {typeof consultant.averageRating === 'number' ? consultant.averageRating.toFixed(1) : '5.0'}
                    </p>
                    <Link
                      to={`/user/consulting/${consultant._id}`}
                      className="text-sm font-semibold text-green-700 hover:text-green-800"
                    >
                      View Consultant →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 px-4 bg-gray-50 mt-10 rounded-3xl">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Discover and Join <span className="text-green-600">Campus Events</span>
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Experience the vibrant campus life! Browse and participate in exciting events, workshops,
                competitions, and social gatherings. Connect with fellow students, develop new skills, and create
                lasting memories.
              </p>
              <Link
                to="/user/events-chill"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Explore Events
              </Link>
            </div>
            <div className="flex-1 flex justify-center">
              <img
                src={eventsDiscoverImage}
                alt="Campus events"
                className="w-full max-w-sm rounded-2xl shadow-lg"
              />
            </div>
          </div>

          <div className="max-w-6xl mx-auto mt-12">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-bold text-gray-800">Latest Events</h3>
            </div>

            {eventsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                    <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />
                    <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                    <div className="h-4 w-5/6 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : eventsError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {eventsError}
              </div>
            ) : latestEvents.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600">
                No events added yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {latestEvents.map((item) => (
                  <div key={item._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        {(item.eventType || 'event').replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{truncateText(item.description, 95)}</p>
                    <p className="text-xs text-gray-500 mb-3">
                      Event Date: {formatDate(item.date)}
                    </p>
                    <Link to="/user/events-chill" className="text-sm font-semibold text-green-700 hover:text-green-800">
                      View in Events →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
