import React from 'react';

const CompletedSection = ({ user }) => {
  const finishedGames = ["Mafia Remastered", "Detroit: Become Human"];
  
  return (
    <section>
      <h2>✅ Juegos Completados</h2>
      <ul>
        {finishedGames.map((game, i) => <li key={i}>{game}</li>)}
      </ul>
    </section>
  );
};

export default CompletedSection;
