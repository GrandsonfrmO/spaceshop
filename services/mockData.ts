import { Poster } from '../types';

export const MOCK_POSTERS: Poster[] = [
  {
    id: 'p1',
    url: 'https://picsum.photos/600/800?random=10',
    position: [-4.9, 2, 0],
    rotation: [0, Math.PI / 2, 0],
    scale: [2, 3, 1]
  },
  {
    id: 'p2',
    url: 'https://picsum.photos/600/800?random=11',
    position: [4.9, 2, 0],
    rotation: [0, -Math.PI / 2, 0],
    scale: [2, 3, 1]
  },
  {
    id: 'p3',
    url: 'https://picsum.photos/800/400?random=12',
    position: [0, 3, -4.9],
    rotation: [0, 0, 0],
    scale: [4, 2, 1]
  }
];
