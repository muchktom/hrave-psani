import React, { useRef, useState, useEffect } from 'react';
import { CZECH_ALPHABET, getAvailableWords } from '../data/words';
import { GameSettings, Complexity, GameMode } from '../App';
import './SetupScreen.css';

interface SetupScreenProps {
  onStart: (settings: GameSettings) => void;
}

const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  // Settings State
  const [complexity, setComplexity] = useState<Complexity>('letters');
  const [mode, setMode] = useState<GameMode>('trace');
  const [selectedChars, setSelectedChars] = useState<string[]>(['A', 'E', 'I', 'O', 'U', 'M', 'L', 'P', 'S']);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>(['1', '2', '3']);
  const [wordCount, setWordCount] = useState<number>(5);
  const [uppercaseOnly, setUppercaseOnly] = useState<boolean>(true);

  // Focus management
  const gridRef = useRef<HTMLDivElement>(null);

  // Reset selection when switching complexity to ensure defaults
  useEffect(() => {
    if (complexity === 'numbers') {
        // Ensure some numbers are selected
        if (selectedNumbers.length === 0) setSelectedNumbers(['1', '2', '3']);
    } else {
        // Ensure some letters
        if (selectedChars.length === 0) setSelectedChars(['A', 'M']);
    }
  }, [complexity]);

  const toggleChar = (char: string) => {
    if (complexity === 'numbers') {
       setSelectedNumbers(prev => prev.includes(char) ? prev.filter(c => c !== char) : [...prev, char]);
    } else {
       setSelectedChars(prev => prev.includes(char) ? prev.filter(c => c !== char) : [...prev, char]);
    }
  };

  const toggleAll = () => {
    if (complexity === 'numbers') {
        setSelectedNumbers(selectedNumbers.length === NUMBERS.length ? [] : NUMBERS);
    } else {
        setSelectedChars(selectedChars.length === CZECH_ALPHABET.length ? [] : CZECH_ALPHABET);
    }
  };

  const getActiveSelection = () => complexity === 'numbers' ? selectedNumbers : selectedChars;
  const getActivePool = () => complexity === 'numbers' ? NUMBERS : CZECH_ALPHABET;

  const handleStartGame = () => {
      const allowedChars = complexity === 'numbers' ? selectedNumbers : selectedChars;
      onStart({
          complexity,
          mode,
          allowedChars,
          wordCount,
          uppercaseOnly
      });
  };

  const availableItemsCount = () => {
      if (complexity === 'numbers') return selectedNumbers.length;
      if (complexity === 'letters') return selectedChars.length;
      // words
      return getAvailableWords(selectedChars, ['noun', 'adjective', 'verb', 'conjunction']).length;
  };

  return (
    <div className="setup-container">
      <h1>Nastavení psaní</h1>
      
      <div className="section">
        <h2>1. Co budeme psát?</h2>
        <div className="mode-selector">
            <button 
                className={`mode-btn ${complexity === 'letters' ? 'active' : ''}`}
                onClick={() => setComplexity('letters')}
            >
                Písmena
            </button>
            <button 
                className={`mode-btn ${complexity === 'words' ? 'active' : ''}`}
                onClick={() => setComplexity('words')}
            >
                Slova
            </button>
            <button 
                className={`mode-btn ${complexity === 'numbers' ? 'active' : ''}`}
                onClick={() => setComplexity('numbers')}
            >
                Čísla
            </button>
        </div>

        {complexity !== 'numbers' && (
            <div className="subsection">
              <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={uppercaseOnly}
                    onChange={(e) => setUppercaseOnly(e.target.checked)}
                  />
                  Pouze velká písmena
              </label>
            </div>
        )}
      </div>

      <div className="section">
        <h2>2. Vyber {complexity === 'numbers' ? 'čísla' : 'písmena'}</h2>
        <button onClick={toggleAll} className="secondary-btn mc-button small">
          {getActiveSelection().length === getActivePool().length ? 'Odznačit vše' : 'Vybrat vše'}
        </button>
        
        <div className="alphabet-grid" ref={gridRef}>
          {getActivePool().map((char, index) => (
            <button
              key={char}
              type="button"
              className={`letter-btn ${getActiveSelection().includes(char) ? 'selected' : ''}`}
              onClick={() => toggleChar(char)}
              aria-label={`Vybrat ${char}`}
              aria-pressed={getActiveSelection().includes(char)}
            >
              {char}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>3. Styl psaní</h2>
        <div className="mode-selector">
            <button 
                className={`mode-btn ${mode === 'trace' ? 'active' : ''}`}
                onClick={() => setMode('trace')}
            >
                Trénink (šablona)
            </button>
            <button 
                className={`mode-btn ${mode === 'blind' ? 'active' : ''}`}
                onClick={() => setMode('blind')}
            >
                Zkouška (naslepo)
            </button>
        </div>
      </div>

      <div className="section">
        <h2>4. Délka hry</h2>
        <fieldset className="count-selector">
          {[3, 5, 10, 15].map(count => (
            <label key={count} className="count-radio-wrapper">
              <input 
                type="radio" 
                name="wordCount"
                checked={wordCount === count}
                onChange={() => setWordCount(count)}
                className="count-radio-input"
              />
              <span className="count-radio-visual">{count}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <div className="footer">
        <p>Dostupných položek: {availableItemsCount()}</p>
        <button 
          className="start-btn mc-button"
          disabled={availableItemsCount() === 0}
          onClick={handleStartGame}
        >
          Spustit psaní
        </button>
      </div>
    </div>
  );
};
