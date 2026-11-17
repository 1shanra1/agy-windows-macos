import { WallpaperId } from './types';

export interface WallpaperEntry {
  id: WallpaperId;
  label: string;
  kind: 'photo' | 'canvas';
  src?: string;
  thumbSrc?: string;
  objectPosition: string;
  placeholderColor: string;
  credit?: string;
}

export const WALLPAPER_REGISTRY: WallpaperEntry[] = [
  {
    id: 'meadow',
    label: 'Meadow',
    kind: 'photo',
    src: '/wallpapers/meadow.jpg',
    thumbSrc: '/wallpapers/thumbs/meadow.jpg',
    objectPosition: 'center 95%',
    placeholderColor: '#3F86E3',
    credit: '"Green and Blue Landscape, Henley-on-Thames" by Scott Wylie, CC BY 2.0',
  },
  {
    id: 'golden',
    label: 'Golden Hour',
    kind: 'photo',
    src: '/wallpapers/golden.jpg',
    thumbSrc: '/wallpapers/thumbs/golden.jpg',
    objectPosition: 'center 60%',
    placeholderColor: '#4A7BB8',
    credit: '"Palouse from Steptoe Butte" by Caleb Riston, CC0',
  },
  {
    id: 'dusk',
    label: 'Dusk',
    kind: 'photo',
    src: '/wallpapers/dusk.jpg',
    thumbSrc: '/wallpapers/thumbs/dusk.jpg',
    objectPosition: 'center 40%',
    placeholderColor: '#1E335C',
    credit: '"Milky Way over the Hooker Valley" by Paul Stewart, CC0',
  },
  {
    id: 'coast',
    label: 'Valley Fog',
    kind: 'photo',
    src: '/wallpapers/coast.jpg',
    thumbSrc: '/wallpapers/thumbs/coast.jpg',
    objectPosition: 'center 55%',
    placeholderColor: '#3A74B4',
    credit: '"Rolling Hills" © Jay Huang, CC BY 2.0',
  },
  {
    id: 'halcyon-live',
    label: 'Halcyon Live',
    kind: 'canvas',
    objectPosition: 'center center',
    placeholderColor: '#3F86E3',
    credit: 'Procedural Canvas',
  },
];

export function getWallpaperEntry(id: WallpaperId): WallpaperEntry {
  return WALLPAPER_REGISTRY.find((w) => w.id === id) ?? WALLPAPER_REGISTRY[0];
}
