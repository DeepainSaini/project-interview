const path = require('path');

const showDashboard = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'dashBoard.html'));
};

const showProject = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'project.html'));
};

module.exports = { showDashboard,showProject };
