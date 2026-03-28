const express = require('express');
const app = express();

function keepAlive() {
  app.get('/', (req, res) => {
    res.send('Perc Fermé Network Bot is alive and racing! 🏁');
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Keep-Alive server is running on port ${port}`);
  });
}

module.exports = keepAlive;
