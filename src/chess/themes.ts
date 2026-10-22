import { BoardTheme } from './types';

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'tournament-wood',
    name: 'Tournament Walnut',
    lightSquare: '#ebd3a8',
    darkSquare: '#b2794c',
    highlightMove: 'rgba(247, 209, 84, 0.45)',
    highlightSelect: 'rgba(120, 190, 32, 0.55)',
    boardBorder: '#5c3a21',
  },
  {
    id: 'forest-emerald',
    name: 'Forest Emerald',
    lightSquare: '#eeeed2',
    darkSquare: '#769656',
    highlightMove: 'rgba(247, 235, 107, 0.5)',
    highlightSelect: 'rgba(186, 202, 68, 0.65)',
    boardBorder: '#354d24',
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Obsidian',
    lightSquare: '#d8dee9',
    darkSquare: '#4c566a',
    highlightMove: 'rgba(136, 192, 208, 0.45)',
    highlightSelect: 'rgba(129, 161, 193, 0.65)',
    boardBorder: '#2e3440',
  },
  {
    id: 'royal-sapphire',
    name: 'Royal Sapphire',
    lightSquare: '#e2e8f0',
    darkSquare: '#3b82f6',
    highlightMove: 'rgba(250, 204, 21, 0.45)',
    highlightSelect: 'rgba(96, 165, 250, 0.6)',
    boardBorder: '#1e3a8a',
  },
  {
    id: 'regal-espresso',
    name: 'Regal Travertine',
    lightSquare: '#f0ece1',
    darkSquare: '#9c8266',
    highlightMove: 'rgba(217, 119, 6, 0.4)',
    highlightSelect: 'rgba(180, 83, 9, 0.55)',
    boardBorder: '#4a3728',
  },
];
