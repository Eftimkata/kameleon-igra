import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
export const socket = io(URL);

const SOCKET_URL = import.meta.env.PROD 
  ? 'https://your-backend-url.herokuapp.com' // Replace with your deployed backend URL
  : 'http://localhost:3001';


export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    connected
  };
}