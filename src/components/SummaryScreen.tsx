import React from 'react';
import { Star, Home, Zap } from 'lucide-react';
import './SummaryScreen.css';
import { GameResult } from '../App';

interface SummaryScreenProps {
  results: GameResult[];
  onRestart: () => void;
  onQuickTest?: () => void;
  uppercaseOnly: boolean;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({ results, onRestart, onQuickTest, uppercaseOnly }) => {
  const formatTarget = (text: string) => uppercaseOnly ? text.toUpperCase() : text;

  const correctCount = results.filter(r => r.success).length;
  const incorrect = results.filter(r => !r.success);
  const itemsToPractice = results.filter(r => !r.success || r.attempts > 1);
  
  // Calculate star rating (1-3 stars)
  const percentage = (correctCount / results.length) * 100;
  const stars = percentage === 100 ? 3 : percentage >= 50 ? 2 : 1;

  return (
    <div className="summary-container">
      <h1>Konec psaní!</h1>
      
      <div className="stars">
        {[...Array(3)].map((_, i) => (
          <Star 
            key={i} 
            size={64} 
            fill={i < stars ? "#FFD700" : "none"} 
            color={i < stars ? "#FFD700" : "#555"}
            className="star-icon"
            aria-hidden="true"
          />
        ))}
      </div>

      <h2>Správně napsáno: {correctCount} z {results.length}</h2>

      <div className="table-container">
        <h3>Detailní přehled:</h3>
        <table className="results-table">
          <thead>
            <tr>
              <th>Slovo/Písmeno</th>
              <th style={{ textAlign: 'center' }}>Pokusy</th>
              <th style={{ textAlign: 'right' }}>Čas</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className={r.success ? 'correct' : 'incorrect'}>
                <td>{formatTarget(r.target)} {r.success ? '✅' : '❌'}</td>
                <td style={{ textAlign: 'center' }}>{r.attempts}</td>
                <td className="time-cell">{r.duration.toFixed(1)}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {incorrect.length === 0 && (
        <div className="perfect-score">
          <p>Fantastická práce! Všechno správně.</p>
        </div>
      )}

      <div className="actions">
        {itemsToPractice.length > 0 && onQuickTest && (
          <div className="tooltip-container">
            <button 
              className="action-btn secondary mc-button" 
              onClick={onQuickTest}
              aria-describedby="quick-test-desc"
            >
              <Zap size={24} />
              Rychlé procvičení
            </button>
            <div id="quick-test-desc" role="tooltip" className="tooltip">
              Procvičíš si to, co ti dělalo potíže.
            </div>
          </div>
        )}
        <button className="action-btn primary mc-button" onClick={onRestart}>
          <Home size={24} />
          Zpět na začátek
        </button>
      </div>
    </div>
  );
};
