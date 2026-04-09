type EnvVars = {
  NODE_ENV?: string;
  PORT?: string;
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
};

export type AppConfig = {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
};

export function validateEnv(config: EnvVars): AppConfig {
  const nodeEnv = config.NODE_ENV ?? 'development';
  const validNodeEnv = ['development', 'production', 'test'];

  if (!validNodeEnv.includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of development, production, test');
  }

  const port = Number(config.PORT ?? 4000);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error('PORT must be a valid positive number');
  }

  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  if (!config.JWT_SECRET || config.JWT_SECRET.length < 16) {
    throw new Error(
      'JWT_SECRET is required and should be at least 16 characters long',
    );
  }

  return {
    NODE_ENV: nodeEnv as AppConfig['NODE_ENV'],
    PORT: port,
    DATABASE_URL: config.DATABASE_URL,
    JWT_SECRET: config.JWT_SECRET,
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN ?? '1d',
  };
}
