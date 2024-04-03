const { createConnection } = require("mysql2/promise");

async function connect78Database() {
  return await createConnection({
    host: "10.35.10.78",
    database: "quality_control",
    user: "root",
    password: "78mes@haier",
  });
}

async function connectMes9771Database() {
  return await createConnection({
    host: "10.35.10.77",
    database: "cosmo_im_9771",
    user: "mes_it",
    password: "Haier@2022",
  });
}

module.exports = {
  connect78Database: connect78Database,
  connectMes9771Database: connectMes9771Database
};
