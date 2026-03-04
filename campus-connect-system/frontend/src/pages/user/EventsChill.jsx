import { useEffect, useMemo, useState } from 'react';
import { getUpcomingEvents } from '../../services/eventsService';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const getCountdownData = (eventDate, now) => {
  const diff = new Date(eventDate).getTime() - now.getTime();

  if (diff <= -2 * 60 * 60 * 1000) {
    return {
      status: 'ended',
      label: 'Event Ended',
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  if (diff <= 0) {
    return {
      status: 'started',
      label: 'Event Started',
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return {
    status: 'upcoming',
    label: `Event starts in ${days} days ${hours} hours ${minutes} minutes`,
    days,
    hours,
    minutes,
  };
};

export default function EventsChill() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    getUpcomingEvents()
      .then((events) => {
        setItems(events);
        setError('');
      })
      .catch((err) => {
        setItems([]);
        setError(err.message || 'Unable to load upcoming events right now.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const upcomingItems = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return [...items]
      .filter((item) => new Date(item.date).getTime() >= todayStart.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [items]);

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="mb-8 animate-fade-in-up">
          <div className="rounded-3xl bg-gradient-to-r from-primary to-primary-light p-6 md:p-8 shadow-lg border border-white/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-4xl">🎉</div>
              <h1 className="!mb-0 !text-white">Event Dashboard</h1>
            </div>
            <p className="!mb-0 text-white/90 text-base md:text-lg">
              Discover upcoming campus events including Viramaya (විරාමය), competitions, Leo Club events, and MS Club events.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="loader mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading upcoming events...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-muted rounded-2xl">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-xl font-semibold text-muted-foreground mb-2">Unable to load events</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : upcomingItems.length === 0 ? (
          <div className="text-center py-16 bg-muted rounded-2xl">
            <div className="text-6xl mb-4">🎪</div>
            <p className="text-xl font-semibold text-muted-foreground mb-2">No upcoming events available</p>
            <p className="text-muted-foreground">Stay tuned for the next campus event!</p>
          </div>
        ) : (
          <div className="event-dashboard-grid">
            {upcomingItems.map((item, index) => {
              const countdown = getCountdownData(item.date, now);

              return (
                <div
                  key={item._id}
                  className="event-card animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="event-card-header">
                    <span className="event-card-type capitalize">{(item.eventType || 'event').replace('_', ' ')}</span>
                    <h3 className="event-card-title text-sinhala">{item.title}</h3>
                  </div>

                  <p className="event-card-description text-sinhala">
                    {item.description || 'No description provided for this event.'}
                  </p>

                  <div className="event-card-meta-list">
                    <div className="event-card-meta-item">
                      <span className="event-card-meta-label">Date</span>
                      <span className="event-card-meta-value">
                        {new Date(item.date).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="event-card-meta-item">
                      <span className="event-card-meta-label">Time</span>
                      <span className="event-card-meta-value">
                        {new Date(item.date).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="event-card-meta-item">
                      <span className="event-card-meta-label">Location</span>
                      <span className="event-card-meta-value text-sinhala">{item.location || 'TBA'}</span>
                    </div>
                  </div>

                  <div className="event-countdown-wrap">
                    <p className="event-countdown-label mb-2">{countdown.label}</p>
                    {countdown.status === 'upcoming' ? (
                      <div className="event-countdown-chips">
                        <div className="countdown-chip">
                          <span className="countdown-chip-value">{countdown.days}</span>
                          <span className="countdown-chip-unit">Days</span>
                        </div>
                        <div className="countdown-chip">
                          <span className="countdown-chip-value">{countdown.hours}</span>
                          <span className="countdown-chip-unit">Hours</span>
                        </div>
                        <div className="countdown-chip">
                          <span className="countdown-chip-value">{countdown.minutes}</span>
                          <span className="countdown-chip-unit">Minutes</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
