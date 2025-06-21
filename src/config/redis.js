import { createClient } from 'redis';

const client = createClient({
    url: 'redis://default:3WQBgcvWyXAIeuiQJOIJcyNjTYfHihnR@redis-10752.c277.us-east-1-3.ec2.redns.redis-cloud.com:10752'
});

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();

export default client;