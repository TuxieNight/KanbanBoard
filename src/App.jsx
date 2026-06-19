import { useState } from 'react'
import './App.css'
import Taskboard from './components/Taskboard.jsx'
import UserContext from './contexts/UserContext.js'

function App() {
  const [id, setId] = useState();

  return (
    <UserContext.Provider value={[id, setId]}>
      <Taskboard />
    </UserContext.Provider>
  );
}

export default App;
