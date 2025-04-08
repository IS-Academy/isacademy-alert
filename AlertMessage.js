// ✅ AlertMessage.js

const { getTemplate } = require('./MessageTemplates');

function generateAlertMessage(params) {
  return getTemplate(params);
}

module.exports = {
  generateAlertMessage
};
