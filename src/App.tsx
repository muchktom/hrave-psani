import { useState } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { getAvailableWords } from './data/words';
import './App.css';

export type GameMode = 'trace' | 'trace_hints' | 'blind';
export type Complexity = 'letters' | 'words' | 'numbers';

export interface GameSettings {
  mode: GameMode;
  complexity: Complexity;
  allowedChars: string[]; // Letters or numbers
  wordCount: number;
  uppercaseOnly: boolean;
}

export interface GameResult {
  target: string; // The word or letter
  success: boolean;
  attempts: number;
  duration: number; // Time in seconds
}

function App() {
  const [screen, setScreen] = useState<'setup' | 'game' | 'summary'>('setup');
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [gameItems, setGameItems] = useState<string[]>([]);
  const [results, setResults] = useState<GameResult[]>([]);

  const handleStart = (newSettings: GameSettings) => {
    let items: string[] = [];

    if (newSettings.complexity === 'words') {
      // Get words composed of allowed letters
      const words = getAvailableWords(newSettings.allowedChars, ['noun', 'adjective', 'verb']);
      items = words;
    } else if (newSettings.complexity === 'letters') {
      // Just the selected letters
      items = [...newSettings.allowedChars];
    } else if (newSettings.complexity === 'numbers') {
       // Just the selected numbers (assuming allowedChars contains numbers if passed, or we default to 0-9)
       // For now, let's assume allowedChars handles both if the UI combines them, 
       // or if complexity is numbers, we expect numbers in allowedChars.
       items = newSettings.allowedChars.filter(c => /[0-9]/.test(c));
       if (items.length === 0) items = ['1', '2', '3']; // Fallback
    }

    // Shuffle and slice
    // If we don't have enough words, we might repeat? For now just slice.
    // If we have fewer items than wordCount, we should probably repeat them to meet the count.
    
    let selectedItems: string[] = [];
    if (items.length > 0) {
        while (selectedItems.length < newSettings.wordCount) {
            const pool = items.sort(() => 0.5 - Math.random());
            selectedItems = [...selectedItems, ...pool];
        }
        selectedItems = selectedItems.slice(0, newSettings.wordCount);
    }

    setSettings(newSettings);
    setGameItems(selectedItems);
    setResults([]);
    setScreen('game');
  };

  const handleGameEnd = (gameResults: GameResult[]) => {
    setResults(gameResults);
    setScreen('summary');
  };

  const handleRestart = () => {
    setScreen('setup');
  };

  const handleQuickTest = () => {
    if (!settings) return;

    // Items that were incorrect OR took more than 1 attempt
    const problemItems = results
      .filter(r => !r.success || r.attempts > 1)
      .map(r => r.target);

    const uniqueProblems = [...new Set(problemItems)];
    
    // Fill up to 5 items for quick test (or just the problems)
    let newGameItems = [...uniqueProblems];
    
    // If we need more, pick random ones from the original pool logic
    // (Simplified here: just reuse problems if enough, or repeat them)
    if (newGameItems.length < 3 && uniqueProblems.length > 0) {
        // Repeat problems to practice
        while(newGameItems.length < 3) {
            newGameItems = [...newGameItems, ...uniqueProblems];
        }
    }
    
    setGameItems(newGameItems.slice(0, 5)); // Cap at 5 for quick test
    setResults([]);
    setScreen('game');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <span className="app-title">Hravé Psaní</span>
      </header>
      <main>
        {screen === 'setup' && <SetupScreen onStart={handleStart} />}
        
        {screen === 'game' && settings && (
          <GameScreen 
            items={gameItems} 
            settings={settings}
            onComplete={handleGameEnd}
            onExit={handleRestart}
          />
        )}

        {screen === 'summary' && settings && (
          <SummaryScreen 
            results={results} 
            onRestart={handleRestart} 
            onQuickTest={handleQuickTest}
            uppercaseOnly={settings.uppercaseOnly}
          />
        )}
      </main>
    </div>
  );
}

export default App;
