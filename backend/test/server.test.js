const request = require('supertest');
const app = require('../server');

describe('Calculator API', () => {
  it('should return API info on root endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Calculator API is running!');
  });

  it('should calculate simple expression', async () => {
    const response = await request(app)
      .post('/calculate')
      .send({ expression: '2 + 2' });
    
    expect(response.status).toBe(200);
    expect(response.body.result).toBe('4');
  });

  it('should handle complex expressions', async () => {
    const response = await request(app)
      .post('/calculate')
      .send({ expression: '(2 + 3) * 4' });
    
    expect(response.status).toBe(200);
    expect(response.body.result).toBe('20');
  });

  it('should return error for invalid expression', async () => {
    const response = await request(app)
      .post('/calculate')
      .send({ expression: '2 + ' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBeDefined();
  });
});