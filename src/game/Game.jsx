import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import config from './config';

function Game() {
  const gameRef = useRef(null);

  useEffect(() => {
    // Initialize the game
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(config);
    }

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div id="game-container" style={{
      width: '100%',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
      maxWidth: '100vw',
      maxHeight: '100vh'
    }}></div>
  );
}

export default Game;
