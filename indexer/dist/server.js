import http from 'node:http';
import cors from 'cors';
import express from 'express';
import { WebSocketServer } from 'ws';
import { OnChainIndexer } from './indexer.js';
import { serverConfig } from './config.js';
const app = express();
app.use(cors());
app.use(express.json());
const indexer = new OnChainIndexer();
app.get('/health', (_request, response) => {
    response.json({
        status: 'ok',
        service: 'tek5-indexer',
        ...indexer.getMeta(),
    });
});
app.get('/graphql', (_request, response) => {
    response.json({
        message: 'GraphQL endpoint is not implemented in this MVP indexer. Use /events and /events/stream.',
    });
});
app.get('/events', (request, response) => {
    const limit = Number(request.query.limit ?? '100');
    const events = indexer.getEvents({
        address: typeof request.query.address === 'string' ? request.query.address : undefined,
        contract: typeof request.query.contract === 'string' ? request.query.contract : undefined,
        type: typeof request.query.type === 'string' ? request.query.type : undefined,
        limit: Number.isFinite(limit) ? limit : 100,
    });
    response.json({
        events,
        meta: indexer.getMeta(),
    });
});
const server = http.createServer(app);
const wsServer = new WebSocketServer({ noServer: true });
server.on('upgrade', (request, socket, head) => {
    if (request.url !== '/events/stream') {
        socket.destroy();
        return;
    }
    wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request);
    });
});
wsServer.on('connection', (socket) => {
    socket.send(JSON.stringify({
        type: 'connected',
        message: 'Indexer event stream connected',
        timestamp: Date.now(),
    }));
});
indexer.onEvent((event) => {
    const payload = JSON.stringify(event);
    wsServer.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(payload);
        }
    });
});
const bootstrap = async () => {
    await indexer.start();
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${serverConfig.port} is already in use. Stop the other process or set another PORT in indexer/.env.`);
            process.exit(1);
        }
        console.error('Server error:', error);
        process.exit(1);
    });
    server.listen(serverConfig.port, () => {
        console.log(`Indexer REST API: http://localhost:${serverConfig.port}/events`);
        console.log(`Indexer WebSocket: ws://localhost:${serverConfig.port}/events/stream`);
    });
};
void bootstrap();
const shutdown = () => {
    indexer.stop();
    wsServer.close();
    server.close(() => {
        process.exit(0);
    });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
