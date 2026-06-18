import { useEffect, useRef, useCallback } from 'react';

export function useWebSocket(onMessage) {
  const stompRef = useRef(null);
  const connected = useRef(false);

  const connect = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || connected.current) return;

    // Lazy-load to avoid SSR issues
    import('@stomp/stompjs').then(({ Client }) => {
      import('sockjs-client').then(({ default: SockJS }) => {
        const client = new Client({
          webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
          connectHeaders: { Authorization: `Bearer ${token}` },
          reconnectDelay: 5000,
          onConnect: () => {
            connected.current = true;
            // Subscribe to user-specific notifications
            client.subscribe('/user/queue/notifications', frame => {
              try {
                const payload = JSON.parse(frame.body);
                onMessage?.(payload);
              } catch {}
            });
            // Subscribe to global meeting updates
            client.subscribe('/topic/meetings', frame => {
              try {
                const payload = JSON.parse(frame.body);
                onMessage?.(payload);
              } catch {}
            });
          },
          onDisconnect: () => { connected.current = false; },
          onStompError: frame => console.warn('WebSocket error:', frame),
        });

        stompRef.current = client;
        client.activate();
      });
    });
  }, [onMessage]);

  const disconnect = useCallback(() => {
    stompRef.current?.deactivate();
    connected.current = false;
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { disconnect };
}
