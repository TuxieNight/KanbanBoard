import { createContext } from 'react';

// Stores the current user ID and its setter as [id, setId].
const UserContext = createContext([]);

export default UserContext;