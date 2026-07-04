import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Rss, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full rounded-t-[32px] mt-20 bg-surface-container-low">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-12 py-16 max-w-7xl mx-auto text-sm leading-relaxed">
        <div className="md:col-span-1">
          <div className="text-lg font-bold text-on-surface mb-6">EduWatch</div>
          <p className="text-secondary mb-6">
            Curating the intersection of educational insight and system design for the modern academic leader.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-primary hover:text-primary-container transition-colors"><Globe className="w-5 h-5" /></a>
            <a href="#" className="text-primary hover:text-primary-container transition-colors"><Rss className="w-5 h-5" /></a>
            <a href="#" className="text-primary hover:text-primary-container transition-colors"><Mail className="w-5 h-5" /></a>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-on-surface mb-6 uppercase tracking-widest text-xs">Knowledge</h4>
          <ul className="space-y-4">
            <li><a className="text-secondary hover:text-primary transition-colors" href="#">Engineering</a></li>
            <li><a className="text-secondary hover:text-primary transition-colors" href="#">Design Systems</a></li>
            <li><a className="text-secondary hover:text-primary transition-colors" href="#">Cloud Tech</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-on-surface mb-6 uppercase tracking-widest text-xs">Community</h4>
          <ul className="space-y-4">
            <li><a className="text-secondary hover:text-primary transition-colors" href="#">AI in EdTech</a></li>
            <li><a className="text-secondary hover:text-primary transition-colors" href="#">Contributors</a></li>
            <li><a className="text-secondary hover:text-primary transition-colors" href="#">Events</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-on-surface mb-6 uppercase tracking-widest text-xs">Legal</h4>
          <ul className="space-y-4">
            <li><a className="text-secondary hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
            <li><a className="text-secondary hover:text-primary transition-colors" href="#">Terms</a></li>
          </ul>
        </div>
      </div>
      <div className="px-12 py-8 border-t border-outline-variant/10 text-center text-secondary">
        © 2026 EduWatch. Curating Educational Excellence.
      </div>
    </footer>
  );
}
