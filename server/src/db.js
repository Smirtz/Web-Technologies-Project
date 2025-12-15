import { Sequelize } from "sequelize";

const isProd = !!process.env.DATABASE_URL;

export const sequelize = isProd
  ? new Sequelize(process.env.DATABASE_URL, {
      logging: false
    })
  : new Sequelize({
      dialect: "sqlite",
      storage: process.env.SQLITE_PATH || "dev.sqlite",
      logging: false
    });

export async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync();
}