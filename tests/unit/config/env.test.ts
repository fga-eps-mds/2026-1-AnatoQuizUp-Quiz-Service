jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('Configuração de Variáveis de Ambiente (env.ts)', () => {
  const envOriginal = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { NODE_ENV: 'test' };
  });

  afterAll(() => {
    process.env = envOriginal;
  });

  // 👇 Adicionamos o 'async' aqui
  it('deve carregar as variáveis de ambiente com sucesso aplicando defaults de teste', async () => {
    process.env.NODE_ENV = 'test';

    const { env } = await import('../../../src/config/env');

    expect(env.NODE_ENV).toBe('test');
    expect(env.JWT_SECRET_KEY).toBe('test-secret');
  });

  it('deve lançar erro se variáveis obrigatórias estiverem faltando no ambiente de produção', async () => {
    process.env.NODE_ENV = 'production';

    await expect(async () => {
      await import('../../../src/config/env');
    }).rejects.toThrow(/Invalid environment variables/);
  });
});