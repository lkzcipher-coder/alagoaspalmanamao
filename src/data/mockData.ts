import { Partner, Coupon, Video } from '../types';

export const partners: Partner[] = [
  {
    id: '1',
    name: 'Praia do Gunga',
    category: 'Praias',
    location: 'Roteiro',
    description: 'Uma das praias mais bonitas do Brasil, famosa por seus coqueirais e falésias coloridas.',
    rating: 4.8,
    totalReviews: 125,
    image: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=800&q=80',
    whatsapp: '5582999999999',
    isPremium: false,
    images: [
      'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540202404-a2f29016bb5d?auto=format&fit=crop&w=800&q=80'
    ],
    reviews: []
  },
  {
    id: '2',
    name: 'Caminho de Moisés',
    category: 'Passeios',
    location: 'Maragogi',
    description: 'Um banco de areia que surge na maré baixa, permitindo caminhar centenas de metros mar adentro.',
    rating: 4.9,
    totalReviews: 88,
    image: 'https://images.unsplash.com/photo-1544123089-1856d3cb7a5b?auto=format&fit=crop&w=800&q=80',
    whatsapp: '5582988888888',
    isPremium: true,
    images: [
      'https://images.unsplash.com/photo-1544123089-1856d3cb7a5b?auto=format&fit=crop&w=800&q=80'
    ],
    reviews: []
  }
];

export const coupons: Coupon[] = [
  {
    id: '1',
    title: '10% de desconto no Gunga',
    discount: '10%',
    partnerId: '1',
    isPremium: false,
    validUntil: '2024-12-31'
  },
  {
    id: '2',
    title: '20% de desconto em Maragogi',
    discount: '20%',
    partnerId: '2',
    isPremium: true,
    validUntil: '2024-12-31'
  }
];

export const videos: Video[] = [
  {
    id: 'v1',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-beach-waves-on-the-sand-1188-large.mp4',
    title: 'Pôr do sol no Pontal',
    description: 'Um dos momentos mais mágicos de Alagoas.',
    partnerId: '1',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    category: 'Praias',
    isPremium: false,
    likesCount: 0,
    commentsCount: 0
  },
  {
    id: 'v2',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-diving-in-a-tropical-lagoon-3131-large.mp4',
    title: 'Piscinas Naturais de Maragogi',
    description: 'As águas mais cristalinas que você já viu.',
    partnerId: '2',
    thumbnail: 'https://images.unsplash.com/photo-1544123089-1856d3cb7a5b?auto=format&fit=crop&w=400&q=80',
    category: 'Passeios de lancha',
    isPremium: true,
    likesCount: 0,
    commentsCount: 0
  }
];