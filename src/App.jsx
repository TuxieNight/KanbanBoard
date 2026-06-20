import { useState } from 'react';
import Taskboard from './components/Taskboard.jsx';
import UserContext from './contexts/UserContext.js';

// Root component: provides user ID context and renders the taskboard.
function App() {
  const [id, setId] = useState();

  return (
    <UserContext.Provider value={[id, setId]}>
      <Taskboard />
    </UserContext.Provider>
  );
}

export default App;