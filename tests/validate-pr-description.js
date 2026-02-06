const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'pull_request_template.md');
const template = fs.readFileSync(templatePath, 'utf-8');

const requiredSections = [
  '## Что изменилось',
  '## Почему это важно',
  '## Что стало возможным',
  '## Открытые вопросы'
];

const prDescription = process.env.PR_DESCRIPTION || '';

let isValid = true;
requiredSections.forEach((section) => {
  if (!prDescription.includes(section)) {
    console.error(`Описание PR должно содержать раздел: "${section}"`);
    isValid = false;
  }
});

if (!isValid) {
  console.error('Проверка описания PR не пройдена. Исправьте описание и повторите попытку.');
  process.exit(1);
} else {
  console.log('Описание PR соответствует требованиям.');
}