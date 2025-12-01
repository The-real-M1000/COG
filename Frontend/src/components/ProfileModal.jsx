import React from 'react';

const ProfileModal = ({ user, onClose, avatars }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1b1b1b',
          padding: '20px',
          borderRadius: '8px',
          minWidth: '300px',
          color: '#fff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{user.displayName || "Usuario Steam"}</h2>
        <img 
          src={user.photos ? user.photos[0].value : avatars[0]} 
          alt="Avatar" 
          style={{ width: '100px', borderRadius: '50%' }} 
        />
        <p>ID Steam: {user._json.steamid}</p>
        <button onClick={onClose} style={{ marginTop: '10px', padding: '8px 12px', cursor: 'pointer' }}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;
