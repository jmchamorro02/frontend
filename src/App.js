import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './Dashboard';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';

const initialTeamRow = {
  rut: '',
  nombre: '',
  cargo: '',
  codigoEquipo: '',
  tipoAsist: '',
  tramo: ''
};

const initialActivityRow = {
  descripcion: '',
  horaInicio: '',
  horaFin: ''
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const App = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [reports, setReports] = useState([]);
  const [activitiesTable, setActivitiesTable] = useState([
    { ...initialActivityRow }
  ]);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState('');
  const [theme, setTheme] = useState('light');
  const [showRegister, setShowRegister] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('user');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Declaración de variables de estado faltantes para evitar errores de no definidas
  const [role, setRole] = useState('');
  const [team, setTeam] = useState([{ ...initialTeamRow }]);
  const [area, setArea] = useState('');
  const [jornada, setJornada] = useState('');
  const [supervisor, setSupervisor] = useState('');

  // NUEVO: Hooks para cargar catálogos
  const [catalogActivities, setCatalogActivities] = useState([]);
  const [catalogTramos, setCatalogTramos] = useState([]);
  const [catalogWorkers, setCatalogWorkers] = useState([]);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    if (savedToken && savedRole) {
      setToken(savedToken);
      setRole(savedRole);
    }
  }, []);

  useEffect(() => {
    if (token) {
      if (role === 'admin') {
        fetchAllReports(token);
      } else {
        fetchReports(token);
      }
    }
  }, [token, role]);

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
  }, [theme]);

  // NUEVO: Cargar catálogos al iniciar sesión
  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/catalog/activities`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCatalogActivities(res.data)).catch(() => {});
    axios.get(`${API_URL}/catalog/tramos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCatalogTramos(res.data)).catch(() => {});
    axios.get(`${API_URL}/catalog/workers`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCatalogWorkers(res.data)).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (token) {
      if (role === 'admin') {
        fetchAllReports(token);
      } else {
        fetchReports(token);
      }
    }
  }, [token, role]);

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = async () => {
    setLoading(true);
    setNetworkError('');
    setLoginError('');
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      setToken(response.data.token);
      setRole(response.data.role);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setNetworkError('No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté funcionando.');
      } else if (error.response && error.response.data && error.response.data.message) {
        setLoginError(error.response.data.message);
      } else {
        setLoginError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setRole('');
    setReports([]);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  const handleTeamChange = (idx, field, value) => {
    setTeam(prev => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };

  const handleAddTeamRow = () => {
    setTeam(prev => [...prev, { ...initialTeamRow }]);
  };

  const handleRemoveTeamRow = (idx) => {
    setTeam(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  };

  const handleActivityTableChange = (idx, field, value) => {
    setActivitiesTable(prev => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };

  const handleAddActivityRow = () => {
    setActivitiesTable(prev => [...prev, { ...initialActivityRow }]);
  };

  const handleRemoveActivityRow = (idx) => {
    setActivitiesTable(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  };

  const handleReportSubmit = async () => {
    // Validación básica
    if (!area.trim() || !jornada.trim() || !supervisor.trim()) {
      alert('Por favor, completa los datos de área, jornada y supervisor.');
      return;
    }
    if (team.length === 0 || team.every(row => Object.values(row).every(val => !val))) {
      alert('Debes ingresar al menos un integrante del equipo.');
      return;
    }
    // Filtrar filas vacías
    const filteredTeam = team.filter(row => Object.values(row).some(val => val));
    const filteredActivities = activitiesTable.filter(row => row.descripcion.trim() && row.horaInicio && row.horaFin);
    if (filteredActivities.length === 0) {
      alert('Debes ingresar al menos una actividad realizada por el equipo.');
      return;
    }
    setLoading(true);
    setNetworkError('');
    try {
      await axios.post(`${API_URL}/reports`, {
        area,
        jornada,
        supervisor,
        team: filteredTeam,
        actividades: filteredActivities
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArea('');
      setJornada('');
      setSupervisor('');
      setTeam([{ ...initialTeamRow }]);
      setActivitiesTable([{ ...initialActivityRow }]);
      if (role === 'admin') {
        fetchAllReports(token);
      } else {
        fetchReports(token);
      }
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setNetworkError('No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté funcionando.');
      } else {
        alert('Error al enviar el informe: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async (token) => {
    setLoading(true);
    setNetworkError('');
    try {
      const response = await axios.get(`${API_URL}/myreports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setNetworkError('No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté funcionando.');
      } else {
        alert('Error al obtener informes: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllReports = async (token) => {
    setLoading(true);
    setNetworkError('');
    try {
      const response = await axios.get(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setNetworkError('No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté funcionando.');
      } else {
        alert('Error al obtener informes de administrador: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Eliminar informe
  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este informe?')) return;
    setLoading(true);
    setNetworkError('');
    try {
      // Asegúrate de que el ID es correcto y de tipo número
      const id = typeof reportId === 'number' ? reportId : Number(reportId);
      await axios.delete(`${API_URL}/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refrescar la lista después de borrar
      if (role === 'admin') {
        await fetchAllReports(token);
      } else {
        await fetchReports(token);
      }
    } catch (error) {
      // Mostrar el mensaje de error del backend si existe
      if (error.response && error.response.data && error.response.data.message) {
        alert('Error al eliminar el informe: ' + error.response.data.message);
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setNetworkError('No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté funcionando.');
      } else {
        alert('Error al eliminar el informe: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regUsername.trim() || !regPassword.trim() || !regRole) {
      alert('Completa todos los campos de registro.');
      return;
    }
    setRegisterLoading(true);
    setNetworkError('');
    try {
      await axios.post(`${API_URL}/auth/register`, {
        username: regUsername,
        password: regPassword,
        role: regRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Usuario registrado correctamente');
      setRegUsername('');
      setRegPassword('');
      setRegRole('user');
      setShowRegister(false);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        alert('Error al registrar: ' + error.response.data.message);
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setNetworkError('No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté funcionando.');
      } else {
        alert('Error al registrar: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  // NUEVO: Cálculo de horas trabajadas
  function calcularHoras(inicio, fin) {
    if (!inicio || !fin) return '';
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return `${Math.floor(diff / 60)}:${(diff % 60).toString().padStart(2, '0')}`;
  }

  return (
    <Router>
      <div className={`main-container${theme === 'dark' ? ' dark' : ''}`}>
        <div className="theme-toggle-row">
          <button
            type="button"
            className="btn-theme-toggle"
            onClick={toggleTheme}
          >
            {theme === 'light' ? '🌙 Modo Noche' : '☀️ Modo Día'}
          </button>
          {token && role === 'admin' && (
            <Link to="/dashboard" className="btn-primary" style={{ marginLeft: 10 }}>
              Ver Dashboard
            </Link>
          )}
        </div>
        <Routes>
          <Route path="/dashboard" element={
            token && role === 'admin' ? <Dashboard /> : <div style={{padding:40, textAlign:'center'}}><h2>Acceso denegado</h2><p>Solo los administradores pueden ver el dashboard.</p></div>
          } />
          <Route path="/" element={
            <div>
              <div className="branding">
                <h1 className="main-title">ICAFAL</h1>
                <div className="subtitle">Minería y Montajes</div>
              </div>
              {networkError && <div className="error-box">{networkError}</div>}
              {loading && <div className="loading-box">Cargando...</div>}
              {!token ? (
                <div className="login-box">
                  {loginError && (
                    <div className="error-box">{loginError}</div>
                  )}
                  <input
                    type="text"
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                  />
                  <button
                    onClick={handleLogin}
                    className="btn-primary"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              ) : (
                <>
                  <div className="header-row">
                    <h2>Crear Informe</h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {role === 'admin' && (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => setShowRegister(v => !v)}
                          style={{ minWidth: 120 }}
                        >
                          {showRegister ? 'Cerrar Registro' : 'Registrar Usuario'}
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="btn-danger"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                  {role === 'admin' && showRegister && (
                    <form className="register-box" onSubmit={handleRegister}>
                      <h2>Registrar Usuario</h2>
                      <div className="row">
                        <div className="col">
                          <input
                            type="text"
                            placeholder="Usuario"
                            value={regUsername}
                            onChange={e => setRegUsername(e.target.value)}
                            className="input"
                          />
                        </div>
                        <div className="col">
                          <input
                            type="password"
                            placeholder="Contraseña"
                            value={regPassword}
                            onChange={e => setRegPassword(e.target.value)}
                            className="input"
                          />
                        </div>
                        <div className="col">
                          <select
                            value={regRole}
                            onChange={e => setRegRole(e.target.value)}
                            className="input"
                          >
                            <option value="user">Usuario</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>
                        <div className="col" style={{ display: 'flex', alignItems: 'center' }}>
                          <button
                            type="submit"
                            className="btn-success"
                            disabled={registerLoading}
                            style={{ minWidth: 120 }}
                          >
                            {registerLoading ? 'Registrando...' : 'Registrar'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                  <form
                    onSubmit={e => { e.preventDefault(); handleReportSubmit(); }}
                    className="form-section"
                  >
                    <h2>Equipo y Actividades</h2>
                    <div className="table-responsive">
                      <table>
                        <thead>
                          <tr>
                            <th>Trabajador</th>
                            <th>RUT</th>
                            <th>Cargo</th>
                            <th>Tramo</th>
                            <th>Actividad</th>
                            <th>Hora Inicio</th>
                            <th>Hora Fin</th>
                            <th>Horas Trabajadas</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {team.map((row, idx) => {
                            const worker = catalogWorkers.find(w => w.id === row.workerId) || {};
                            return (
                              <tr key={idx}>
                                <td>
                                  <select value={row.workerId || ''} onChange={e => handleTeamChange(idx, 'workerId', e.target.value)} className="input-table">
                                    <option value="">Selecciona</option>
                                    {catalogWorkers.map(w => (
                                      <option key={w.id} value={w.id}>{w.nombre}</option>
                                    ))}
                                  </select>
                                </td>
                                <td>{worker.rut || ''}</td>
                                <td>{worker.cargo || ''}</td>
                                <td>
                                  <select value={row.tramoId || ''} onChange={e => handleTeamChange(idx, 'tramoId', e.target.value)} className="input-table">
                                    <option value="">Selecciona</option>
                                    {catalogTramos.map(t => (
                                      <option key={t.id} value={t.id}>{t.nombre}</option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <select value={row.activityId || ''} onChange={e => handleTeamChange(idx, 'activityId', e.target.value)} className="input-table">
                                    <option value="">Selecciona</option>
                                    {catalogActivities.map(a => (
                                      <option key={a.id} value={a.id}>{a.nombre}</option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input type="time" value={row.horaInicio || ''} onChange={e => handleTeamChange(idx, 'horaInicio', e.target.value)} className="input-table" />
                                </td>
                                <td>
                                  <input type="time" value={row.horaFin || ''} onChange={e => handleTeamChange(idx, 'horaFin', e.target.value)} className="input-table" />
                                </td>
                                <td>{calcularHoras(row.horaInicio, row.horaFin)}</td>
                                <td>
                                  <button type="button" onClick={() => handleRemoveTeamRow(idx)} className="btn-table" title="Eliminar fila">✖</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="table-btn-row">
                        <button type="button" onClick={handleAddTeamRow} className="btn-primary">Agregar Fila</button>
                      </div>
                    </div>
                    <button type="submit" className="btn-success">Enviar Informe</button>
                  </form>
                  <h2>{role === 'admin' ? 'Todos los Informes' : 'Mis Informes'}</h2>
                  {reports.length === 0 ? (
                    <p>No hay informes para mostrar.</p>
                  ) : (
                    <ul>
                      {reports.map((report) => (
                        <li key={report.id}>
                          <p style={{ margin: 0 }}>
                            <strong>{role === 'admin' ? `${report.username}: ` : ''}</strong>
                          </p>
                          <div style={{ marginBottom: '8px', paddingLeft: '8px', borderLeft: '3px solid #3498db' }}>
                            <div><strong>Área:</strong> {report.area}</div>
                            <div><strong>Jornada:</strong> {report.jornada}</div>
                            <div><strong>Supervisor:</strong> {report.supervisor}</div>
                            <div>
                              <strong>Equipo:</strong>
                              <table>
                                <thead>
                                  <tr>
                                    <th>RUT</th>
                                    <th>NOMBRE</th>
                                    <th>CARGO</th>
                                    <th>CÓDIGO EQUIPO</th>
                                    <th>TIPO DE ASIST</th>
                                    <th>TRAMO</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(report.team || []).map((row, idx) => (
                                    <tr key={idx}>
                                      <td>{row.rut}</td>
                                      <td>{row.nombre}</td>
                                      <td>{row.cargo}</td>
                                      <td>{row.codigoEquipo}</td>
                                      <td>{row.tipoAsist}</td>
                                      <td>{row.tramo}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div>
                              <strong>Actividades Realizadas:</strong>
                              <table>
                                <thead>
                                  <tr>
                                    <th>Descripción</th>
                                    <th>Hora de Inicio</th>
                                    <th>Hora de Fin</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(report.actividades || []).map((row, idx) => (
                                    <tr key={idx}>
                                      <td>{row.descripcion}</td>
                                      <td>{row.horaInicio}</td>
                                      <td>{row.horaFin}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <small style={{ color: '#7f8c8d' }}>Enviado el: {new Date(report.dateSubmitted).toLocaleString()}</small>
                          <button
                            type="button"
                            onClick={() => handleDeleteReport(report.id)}
                            className="btn-danger btn-delete-report"
                            title="Eliminar informe"
                          >
                            Eliminar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* Panel de administración (solo admin) */}
                  {role === 'admin' && (
                    <div className="admin-panel">
                      <h2>Panel de Administración</h2>
                      <p>Aquí podrás editar actividades, tramos y trabajadores (implementación futura).</p>
                      {/* Aquí irán los formularios para CRUD de catálogos */}
                    </div>
                  )}
                </>
              )}
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
};

// Elimina o comenta las variables no usadas para evitar errores en build CI
// const [activities, setActivities] = useState([]);
// const [workerName, setWorkerName] = useState("");
// const [datetime, setDatetime] = useState("");
// const thStyle = {
//   border: '1px solid #bbb',
//   padding: '6px 4px',
//   background: '#f8f8f8',
//   fontWeight: 'bold',
//   fontSize: '15px'
// };
// const tdStyle = {
//   border: '1px solid #bbb',
//   padding: '4px'
// };
// const inputTdStyle = {
//   width: '100%',
//   border: 'none',
//   background: 'transparent',
//   fontSize: '15px',
//   outline: 'none'
// };

export default App;

