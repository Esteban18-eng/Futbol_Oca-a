import React from 'react';
import { Jugador } from '../../../services/supabaseClient';

interface AdminPlayerItemProps {
  player: Jugador;
  onClick: (player: Jugador) => void;
}

const AdminPlayerItem: React.FC<AdminPlayerItemProps> = ({ 
  player, 
  onClick
}) => {
  return (
    <div 
      className="player-item"
      onClick={() => onClick(player)}
      style={{ cursor: 'pointer' }}
    >
      <div className="player-avatar">
        {player.foto_perfil_url ? (
          <img 
            src={player.foto_perfil_url} 
            alt={`${player.nombre} ${player.apellido}`}
            className="avatar-image"
          />
        ) : (
          <span>👤</span>
        )}
      </div>
      
      <div className="player-info">
        <div className="player-document">
          {player.documento}
        </div>
        <div className="player-name">
          {player.nombre} {player.apellido}
        </div>
        <div className="player-school">
          <small className="text-muted">
            {player.escuela?.nombre || 'Sin escuela'}
          </small>
        </div>
      </div>
      
      <div className="player-actions">
        <span className="badge bg-secondary">Ver</span>
      </div>
    </div>
  );
};

export default AdminPlayerItem;