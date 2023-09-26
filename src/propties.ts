let wsUrl;
if (process.env.NODE_ENV === 'dev') {
    wsUrl = 'ws://127.0.0.1:8080';
} else if (process.env.NODE_ENV === 'prod') {
    wsUrl = 'ws://example.com';
}
export default {
    wsUrl
};