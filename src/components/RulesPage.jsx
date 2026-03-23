import React, { useState } from 'react';
import { RULES } from '../data/rules.js';

export default function RulesPage({ onClose }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="rules-overlay">
      <div className="rules-container">
        {/* Header */}
        <div className="rules-header">
          <div className="rules-header-line" />
          <div className="rules-subtitle">Scythe</div>
          <h1 className="rules-title">Regles du Jeu</h1>
          <div className="rules-header-line rules-header-line--wide" />
          <button className="rules-close" onClick={onClose}>Fermer</button>
        </div>

        {/* Accordion */}
        <div className="rules-list">
          {RULES.map(rule => {
            const isOpen = expandedId === rule.id;
            return (
              <div key={rule.id} className={`rules-card ${isOpen ? 'rules-card--open' : ''}`}>
                <button className="rules-card-header" onClick={() => toggle(rule.id)}>
                  <span className="rules-card-icon">{rule.icon}</span>
                  <span className="rules-card-title">{rule.title}</span>
                  <span className="rules-card-chevron">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="rules-card-body fade-in">
                    {rule.sections.map((sec, i) => (
                      <div key={i} className="rules-section">
                        <h3 className="rules-section-title">{sec.title}</h3>
                        {sec.content && <p className="rules-section-text">{sec.content}</p>}
                        {sec.list && (
                          <ul className="rules-section-list">
                            {sec.list.map((item, j) => <li key={j}>{item}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
