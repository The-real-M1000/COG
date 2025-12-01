import React from 'react';

export default function GameCard({ title, platform, image }) {
  return (
    <div style={{ width: '200px', border: '1px solid #ccc', borderRadius: '10px', overflow: 'hidden', textAlign: 'center' }}>
      <img src={image} alt={title} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
      <h3>{title}</h3>
      <p>{platform}</p>
    </div>
  );
}
