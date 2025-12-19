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

  // Listbox Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent, char: string, index: number, allItems: string[]) => {
      switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
              e.preventDefault();
              const nextIndex = (index + 1) % allItems.length;
              const nextId = `option-${allItems[nextIndex]}`;
              document.getElementById(nextId)?.focus();
              break;
          case 'ArrowLeft':
          case 'ArrowUp':
              e.preventDefault();
              const prevIndex = (index - 1 + allItems.length) % allItems.length;
              const prevId = `option-${allItems[prevIndex]}`;
              document.getElementById(prevId)?.focus();
              break;
          case 'Home':
              e.preventDefault();
              document.getElementById(`option-${allItems[0]}`)?.focus();
              break;
          case 'End':
              e.preventDefault();
              document.getElementById(`option-${allItems[allItems.length - 1]}`)?.focus();
              break;
          case ' ':
          case 'Enter':
              e.preventDefault();
              toggleChar(char);
              break;
      }
  };

  return (
    <div className="setup-container">
      <h1>Nastavení psaní</h1>
      
      <div className="section">
        <h2>1. Co budeme psát?</h2>
        <fieldset className="mode-selector">
            <label className="mode-radio-wrapper">
                <input 
                    type="radio"
                    name="complexity"
                    className="mode-radio-input"
                    checked={complexity === 'letters'}
                    onChange={() => setComplexity('letters')}
                />
                <span className="mode-radio-visual">Písmena</span>
            </label>
            <label className="mode-radio-wrapper">
                <input 
                    type="radio"
                    name="complexity"
                    className="mode-radio-input"
                    checked={complexity === 'words'}
                    onChange={() => setComplexity('words')}
                />
                <span className="mode-radio-visual">Slova</span>
            </label>
            <label className="mode-radio-wrapper">
                <input 
                    type="radio"
                    name="complexity"
                    className="mode-radio-input"
                    checked={complexity === 'numbers'}
                    onChange={() => setComplexity('numbers')}
                />
                <span className="mode-radio-visual">Čísla</span>
            </label>
        </fieldset>

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
        
        <div 
            className="alphabet-grid" 
            ref={gridRef}
            role="listbox"
            aria-multiselectable="true"
            aria-label={complexity === 'numbers' ? 'Výběr čísel' : 'Výběr písmen'}
        >
          {getActivePool().map((char, index, all) => (
            <div
              key={char}
              id={`option-${char}`}
              role="option"
              aria-selected={getActiveSelection().includes(char)}
              aria-label={char}
              tabIndex={index === 0 ? 0 : -1} // Roving tabindex start, updated by focus
              className="letter-option"
              onClick={() => toggleChar(char)}
              onKeyDown={(e) => handleKeyDown(e, char, index, all)}
            >
              {char}
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>3. Styl psaní</h2>
        <fieldset className="mode-selector">
            <label className="mode-radio-wrapper">
                <input 
                    type="radio"
                    name="mode"
                    className="mode-radio-input"
                    checked={mode === 'trace'}
                    onChange={() => setMode('trace')}
                />
                <span className="mode-radio-visual">Trénink (šablona)</span>
            </label>
            <label className="mode-radio-wrapper">
                <input 
                    type="radio"
                    name="mode"
                    className="mode-radio-input"
                    checked={mode === 'blind'}
                    onChange={() => setMode('blind')}
                />
                <span className="mode-radio-visual">Zkouška (naslepo)</span>
            </label>
        </fieldset>
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
