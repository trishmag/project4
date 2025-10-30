// App.js - Single-file React starter (place in src/App.js)
import React, { useState, useEffect, useRef } from 'react';
import solutionsData from './Boggle_Solutions_Endpoint-2.json';

// --- Simple styles ---
const containerStyle = { fontFamily: 'Arial, sans-serif', padding: 20, maxWidth: 900, margin: 'auto' };
const boardStyle = { display: 'grid', gap: 6, margin: '12px 0' };
const cellStyle = { width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#f3f3f3', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontSize: 20 };
const buttonStyle = { padding: '8px 12px', marginRight: 8 };

// --- Helpers ---
function flattenGrid(grid) {
  return grid.flat();
}

function pickBoardOfSize(size) {
  // pick the first board of this size from the solutions JSON
  const entry = solutionsData[String(size)];
  if (!entry) return null;
  return entry.grid;
}

function getSolutionSetForGrid(grid) {
  if (!grid) return new Set();
  // find an entry that matches the grid (best-effort) - fallback to using size list
  const size = grid.length;
  const entry = solutionsData[String(size)];
  if (!entry) return new Set();
  // We don't try to match exact grid; assume entry.solutions corresponds to this board file
  return new Set(entry.solutions.map(s => s.toLowerCase()));
}

// --- Components ---
function Board({ grid }) {
  if (!grid) return null;
  const n = grid.length;
  const style = { ...boardStyle, gridTemplateColumns: `repeat(${n}, 1fr)` };
  return (
    <div style={style}>
      {flattenGrid(grid).map((cell, i) => (
        <div key={i} style={cellStyle}>{cell}</div>
      ))}
    </div>
  );
}

function WordInput({ onSubmit, disabled }) {
  const [text, setText] = useState('');
  function submit(e) {
    e?.preventDefault();
    if (!text.trim()) return;
    onSubmit(text.trim().toLowerCase());
    setText('');
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <input value={text} onChange={e => setText(e.target.value)} disabled={disabled} placeholder="Type a word and press Enter" style={{ flex: 1, padding: 8 }} />
      <button type="submit" disabled={disabled} style={buttonStyle}>Submit</button>
    </form>
  );
}

function WordList({ words }) {
  return (
    <div style={{ marginTop: 12 }}>
      <h4>Words Found ({words.length})</h4>
      <ol>
        {words.map((w, i) => <li key={i}>{w}</li>)}
      </ol>
    </div>
  );
}

function Timer({ secondsLeft, running }) {
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  return (
    <div style={{ fontSize: 20 }}>
      <strong>{mm}:{ss}</strong> {running ? ' — Running' : ' — Stopped'}
    </div>
  );
}

// --- Main App ---
export default function App() {
  // configuration: choose a board size (4 is classic)
  const BOARD_SIZE = 4;
  const START_SECONDS = 120; // 2-minute game

  const [grid, setGrid] = useState(() => pickBoardOfSize(BOARD_SIZE));
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(START_SECONDS);
  const [foundWords, setFoundWords] = useState([]);
  const [message, setMessage] = useState('');
  const [showRemaining, setShowRemaining] = useState(false);

  const solutions = useRef(getSolutionSetForGrid(grid));

  // timer effect
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(id);
          setRunning(false);
          setShowRemaining(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  function handleStart() {
    // reset everything
    setGrid(pickBoardOfSize(BOARD_SIZE));
    solutions.current = getSolutionSetForGrid(grid);
    setFoundWords([]);
    setSecondsLeft(START_SECONDS);
    setMessage('');
    setShowRemaining(false);
    setRunning(true);
  }

  function handleStop() {
    setRunning(false);
    setShowRemaining(true);
  }

  function handleSubmitWord(word) {
    setMessage('');
    if (!running) {
      setMessage('Start a game first.');
      return;
    }
    if (foundWords.includes(word)) {
      setMessage(`You already found "${word}".`);
      return;
    }
    // Check validity with solution set
    if (solutions.current.has(word)) {
      setFoundWords(prev => [...prev, word]);
      setMessage(`Nice! "${word}" is valid.`);
    } else {
      setMessage(`"${word}" is not a valid solution for this board.`);
    }
  }

  // compute remaining words when stopped
  const remaining = showRemaining ? Array.from(solutions.current).filter(s => !foundWords.includes(s)) : [];

  return (
    <div style={containerStyle}>
      <h1>Boggle — Solitaire (Starter)</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button onClick={handleStart} style={buttonStyle}>Start</button>
          <button onClick={handleStop} style={buttonStyle}>Stop</button>
        </div>
        <Timer secondsLeft={secondsLeft} running={running} />
      </div>

      {/* Board hidden until Start is clicked */}
      {running ? (
        <div>
          <h3>Board</h3>
          <Board grid={grid} />
        </div>
      ) : (
        <div style={{ marginTop: 12, color: '#666' }}>Board hidden — press <strong>Start</strong> to reveal.</div>
      )}

      <WordInput onSubmit={handleSubmitWord} disabled={!running} />

      {message && <div style={{ marginTop: 8, color: '#333' }}>{message}</div>}

      <WordList words={foundWords} />

      {showRemaining && (
        <div style={{ marginTop: 16 }}>
          <h4>Remaining valid words ({remaining.length})</h4>
          <ol>
            {remaining.slice(0,200).map((w,i) => <li key={i}>{w}</li>)}
          </ol>
        </div>
      )}

      <div style={{ marginTop: 20, color: '#666' }}>
        <p><em>Notes:</em> This starter uses a precomputed solutions JSON (the file you uploaded). The app checks submitted words against that list. To make the game stricter (enforce adjacency rules), integrate a solver or adjacency check.</p>
      </div>
    </div>
  );
}
