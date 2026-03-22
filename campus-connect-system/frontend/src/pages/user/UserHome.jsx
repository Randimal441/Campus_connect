import { Link } from 'react-router-dom';
import { SECTIONS } from '../../utils/constants';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

export default function UserHome() {
  const sectionIcons = {
    'clubs-sports': '',
    'consulting': '💬',
    'events-chill': '🎉',
    'resource-sharing': '📚'
  };

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="flex flex-col items-center text-center mb-12 animate-fade-in-up">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-xl mb-6">
            <span className="text-white font-heading font-black text-4xl">
              CC
            </span>
          </div>
          <h1 className="text-gradient mb-3">Welcome to Campus Connect</h1>
          <p className="lead text-lg max-w-2xl">
            Your all-in-one platform for campus life. Explore clubs, attend events, share resources, and connect with consultants.
          </p>
        </div>
        <div className="section-grid">
          {SECTIONS.map((section, index) => (
            <Link
              key={section.id}
              to={section.path}
              className="section-card animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-5xl mb-4">{sectionIcons[section.id] || '🎯'}</div>
              <h3 className="mb-2">{section.label}</h3>
              <p className="text-muted-foreground">Discover and engage with {section.label.toLowerCase()}</p>
              <div className="mt-4 flex items-center text-primary font-bold text-sm">
                Explore <span className="ml-2">→</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
