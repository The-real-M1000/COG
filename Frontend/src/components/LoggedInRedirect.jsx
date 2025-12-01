// LoggedInRedirect.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LoggedInRedirect({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setUser(data);
          navigate('/'); // va a tu app principal
        }
      });
  }, [setUser, navigate]);

  return <p>Iniciando sesión...</p>;
}

export default LoggedInRedirect;
